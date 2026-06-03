#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const publicRoot = path.join(repoRoot, 'projects', 'crewportglobal', 'public');
const i18nRoot = path.join(repoRoot, 'projects', 'crewportglobal', 'i18n');
const sharedRuntimePath = path.join(publicRoot, 'assets', 'crewportglobal-public-i18n.js');
const outputPath = path.join(i18nRoot, 'en.json');
const AUTO_TEXT_KEY_PREFIX = 'auto.text.';
const AUTO_ATTRIBUTE_KEY_PREFIX = 'auto.attr.';
const TRANSLATABLE_ATTRIBUTES = ['placeholder', 'title', 'aria-label', 'alt'];

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function extractObjectLiteral(source, marker) {
  const markerIndex = source.indexOf(marker);
  if (markerIndex === -1) {
    throw new Error(`Marker not found: ${marker}`);
  }

  const startIndex = source.indexOf('{', markerIndex);
  if (startIndex === -1) {
    throw new Error(`Object start not found for marker: ${marker}`);
  }

  let depth = 0;
  let quote = null;
  let escaped = false;

  for (let index = startIndex; index < source.length; index += 1) {
    const char = source[index];

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === '\'' || char === '"' || char === '`') {
      quote = char;
      continue;
    }

    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(startIndex, index + 1);
      }
    }
  }

  throw new Error(`Object end not found for marker: ${marker}`);
}

function evaluateObjectLiteral(literal) {
  return vm.runInNewContext(`(${literal})`, {}, { timeout: 1000 });
}

function collectHtmlFiles(rootDir) {
  const htmlFiles = [];
  const queue = [rootDir];

  while (queue.length > 0) {
    const currentDir = queue.pop();
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        queue.push(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.html')) {
        htmlFiles.push(fullPath);
      }
    }
  }

  return htmlFiles.sort();
}

function mergeEnglish(target, source) {
  const english = source && source.en;
  if (!english || typeof english !== 'object' || Array.isArray(english)) {
    return;
  }

  for (const [key, value] of Object.entries(english)) {
    target[key] = String(value);
  }
}

function normalizeAutoText(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isTranslatableAutoText(value) {
  const normalized = normalizeAutoText(value);
  if (normalized.length < 2) {
    return false;
  }

  if (/^[\d\s.,:;+\-/%()[\]#]+$/.test(normalized)) {
    return false;
  }

  if (/^(https?:|mailto:|tel:|\/assets\/|data:)/i.test(normalized)) {
    return false;
  }

  return /[A-Za-z]/.test(normalized);
}

function stableHash(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function stripNonVisibleBlocks(htmlText) {
  return htmlText
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<template[\s\S]*?<\/template>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<pre[\s\S]*?<\/pre>/gi, ' ')
    .replace(/<code[\s\S]*?<\/code>/gi, ' ');
}

function decodeHtmlEntities(value) {
  return String(value || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function addAutoTextSource(target, prefix, value) {
  const normalized = normalizeAutoText(decodeHtmlEntities(value));
  if (!isTranslatableAutoText(normalized)) {
    return;
  }
  target[`${prefix}${stableHash(normalized)}`] = normalized;
}

function collectAutomaticHtmlSources(target, htmlText) {
  const visibleHtml = stripNonVisibleBlocks(htmlText);
  const textMatches = visibleHtml.matchAll(/>([^<>]+)</g);

  for (const match of textMatches) {
    addAutoTextSource(target, AUTO_TEXT_KEY_PREFIX, match[1]);
  }

  for (const attribute of TRANSLATABLE_ATTRIBUTES) {
    const pattern = new RegExp(`\\s${attribute}=(["'])([\\s\\S]*?)\\1`, 'gi');
    for (const match of visibleHtml.matchAll(pattern)) {
      addAutoTextSource(target, AUTO_ATTRIBUTE_KEY_PREFIX, match[2]);
    }
  }
}

const sourceCatalog = {};
const sharedRuntime = readText(sharedRuntimePath);
mergeEnglish(
  sourceCatalog,
  evaluateObjectLiteral(extractObjectLiteral(sharedRuntime, 'const CHROME_TRANSLATIONS =')),
);

for (const htmlFile of collectHtmlFiles(publicRoot)) {
  const htmlText = readText(htmlFile);
  collectAutomaticHtmlSources(sourceCatalog, htmlText);
  if (!htmlText.includes('window.CREWPORTGLOBAL_PAGE_TRANSLATIONS =')) {
    continue;
  }
  mergeEnglish(
    sourceCatalog,
    evaluateObjectLiteral(extractObjectLiteral(htmlText, 'window.CREWPORTGLOBAL_PAGE_TRANSLATIONS =')),
  );
}

if (fs.existsSync(outputPath)) {
  const existing = JSON.parse(readText(outputPath));
  for (const [key, value] of Object.entries(existing)) {
    if (!Object.prototype.hasOwnProperty.call(sourceCatalog, key)) {
      sourceCatalog[key] = String(value);
    }
  }
}

const ordered = Object.fromEntries(Object.keys(sourceCatalog).sort().map((key) => [key, sourceCatalog[key]]));
fs.mkdirSync(i18nRoot, { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(ordered, null, 2)}\n`, 'utf8');
console.log(`Synchronized ${Object.keys(ordered).length} English source translation key(s) to ${path.relative(repoRoot, outputPath)}`);
