#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const publicRoot = path.join(repoRoot, 'projects', 'crewportglobal', 'public');
const sharedRuntimePath = path.join(publicRoot, 'assets', 'crewportglobal-public-i18n.js');
const homepagePath = path.join(publicRoot, 'index.html');

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
        continue;
      }
      if (entry.isFile() && entry.name.endsWith('.html')) {
        htmlFiles.push(fullPath);
      }
    }
  }

  return htmlFiles.sort();
}

function collectI18nKeys(htmlText) {
  const keys = new Set();
  const regex = /data-i18n="([^"]+)"/g;
  let match;
  while ((match = regex.exec(htmlText)) !== null) {
    keys.add(match[1]);
  }
  return [...keys].sort();
}

function toRelative(filePath) {
  return path.relative(repoRoot, filePath).split(path.sep).join('/');
}

const sharedRuntime = readText(sharedRuntimePath);
const homepageSource = readText(homepagePath);

const chromeTranslations = evaluateObjectLiteral(extractObjectLiteral(sharedRuntime, 'const CHROME_TRANSLATIONS ='));
const pageTranslations = evaluateObjectLiteral(extractObjectLiteral(homepageSource, 'window.CREWPORTGLOBAL_PAGE_TRANSLATIONS ='));

const englishCanonical = new Map();

for (const [key, value] of Object.entries(chromeTranslations.en || {})) {
  englishCanonical.set(key, value);
}

for (const [key, value] of Object.entries(pageTranslations.en || {})) {
  englishCanonical.set(key, value);
}

const htmlFiles = collectHtmlFiles(publicRoot);
const missingEnglish = [];
const usage = new Map();

for (const filePath of htmlFiles) {
  const htmlText = readText(filePath);
  for (const key of collectI18nKeys(htmlText)) {
    if (!usage.has(key)) {
      usage.set(key, []);
    }
    usage.get(key).push(toRelative(filePath));
    if (!englishCanonical.has(key)) {
      missingEnglish.push({ key, file: toRelative(filePath) });
    }
  }
}

const languageCodes = new Set([
  ...Object.keys(chromeTranslations),
  ...Object.keys(pageTranslations),
]);
languageCodes.delete('en');

const warnings = [];

for (const code of [...languageCodes].sort()) {
  const missingKeys = [];
  for (const key of usage.keys()) {
    const hasTranslation = (pageTranslations[code] && Object.prototype.hasOwnProperty.call(pageTranslations[code], key))
      || (chromeTranslations[code] && Object.prototype.hasOwnProperty.call(chromeTranslations[code], key));
    if (!hasTranslation && englishCanonical.has(key)) {
      missingKeys.push(key);
    }
  }
  if (missingKeys.length > 0) {
    warnings.push({ code, missingKeys });
  }
}

const reviewRequired = [
  'projects/crewportglobal/public/legal/**/*.md',
  'projects/crewportglobal/public/for-seafarers/index.md',
  'projects/crewportglobal/public/onboarding/seafarer-registration/index.html',
];

console.log(`Checked ${htmlFiles.length} public HTML files and ${usage.size} unique i18n keys.`);

if (missingEnglish.length > 0) {
  console.error('Missing English canonical translations:');
  for (const item of missingEnglish) {
    console.error(`- ${item.key} in ${item.file}`);
  }
  process.exit(1);
}

console.log('English canonical coverage is complete for all referenced i18n keys.');

if (warnings.length > 0) {
  console.log('Non-English keys missing and currently falling back to English:');
  for (const warning of warnings) {
    console.log(`- ${warning.code}: ${warning.missingKeys.length} key(s)`);
  }
} else {
  console.log('All referenced keys currently have non-English entries for every configured language.');
}

console.log('Human review required before publication for:');
for (const pattern of reviewRequired) {
  console.log(`- ${pattern}`);
}