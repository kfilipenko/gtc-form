#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const publicRoot = path.join(projectRoot, 'public');
const failures = [];

function walk(dir, predicate, output = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, predicate, output);
    } else if (entry.isFile() && predicate(fullPath)) {
      output.push(fullPath);
    }
  }
  return output;
}

function rel(filePath) {
  return path.relative(projectRoot, filePath);
}

function checkFile(filePath, checks) {
  const content = fs.readFileSync(filePath, 'utf8');
  for (const check of checks) {
    if (check.pattern.test(content)) {
      failures.push(`${rel(filePath)}: ${check.message}`);
    }
  }
}

const htmlFiles = walk(publicRoot, (filePath) => filePath.endsWith('.html'));
for (const filePath of htmlFiles) {
  checkFile(filePath, [
    {
      pattern: /Canonical Markdown|doc\.canonicalMarkdown|\/index\.md/,
      message: 'public UI must not expose raw markdown document links',
    },
    {
      pattern: /\/docs\/crewportglobal|window\.location\.replace\('\/docs/,
      message: 'public UI must not link to internal docs/crewportglobal sources',
    },
    {
      pattern: /data-markdown-document|crewportglobal-markdown-document|full-contract-panel[^>]+data-src=/,
      message: 'public documents must not be rendered from secondary markdown publication URLs',
    },
  ]);
}

const agentTextPage = path.join(publicRoot, 'legal', 'agent-agreement', 'text', 'index.html');
if (fs.existsSync(agentTextPage)) {
  const content = fs.readFileSync(agentTextPage, 'utf8');
  if (!content.includes('window.location.replace') || !content.includes('/legal/agent-agreement/')) {
    failures.push(`${rel(agentTextPage)}: legacy /text/ route must only redirect to /legal/agent-agreement/`);
  }
}

const agentTextMarkdown = path.join(publicRoot, 'legal', 'agent-agreement', 'text', 'index.md');
if (fs.existsSync(agentTextMarkdown)) {
  failures.push(`${rel(agentTextMarkdown)}: duplicate public markdown publication is not allowed`);
}

const publicMarkdownFiles = walk(publicRoot, (filePath) => filePath.endsWith('/index.md'));
for (const filePath of publicMarkdownFiles) {
  failures.push(`${rel(filePath)}: public index.md source files must not be published from public/`);
}

const routerPath = path.join(publicRoot, 'router.php');
if (fs.existsSync(routerPath)) {
  const router = fs.readFileSync(routerPath, 'utf8');
  if (/indexMarkdown|text\/markdown/.test(router)) {
    failures.push(`${rel(routerPath)}: router must not publish index.md fallback pages`);
  }
}

if (failures.length > 0) {
  console.error('Public document publication check failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Public document publication check passed.');
