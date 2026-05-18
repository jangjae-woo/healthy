import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE_DIR = path.join(ROOT, 'lib', 'youa-engine', 'youa', 'block-cache-data');

const TARGETS = [
  'factor-cause-blocks.json',
  'parent-cause-blocks.json',
  'compatibility-cause-blocks.json',
  'matrix-combo-blocks.json',
];

const FORBIDDEN_TEXT = [
  /\bundefined\b/i,
  /\bnull\b/i,
  /LLM/i,
  /프롬프트/,
  /계산표/,
  /점수\s*[:=]/,
  /\{\s*score\s*\}\s*점/,
  /\{\s*parentAxisScore\s*\}/,
  /\{\s*childFactorScore\s*\}/,
];

function flattenStrings(value, out = []) {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach(item => flattenStrings(item, out));
  else if (value && typeof value === 'object') Object.values(value).forEach(item => flattenStrings(item, out));
  return out;
}

function validateBlock(fileName, block, index) {
  const errors = [];
  if (!block.key) errors.push('missing key');
  if (!block.slot) errors.push('missing slot');

  for (const text of flattenStrings(block)) {
    for (const pattern of FORBIDDEN_TEXT) {
      if (pattern.test(text)) errors.push(`forbidden text ${pattern}: ${text.slice(0, 120)}`);
    }
  }

  if (fileName === 'matrix-combo-blocks.json') {
    if (block.type !== 'conflict' && block.resolution) {
      errors.push('non-conflict block has resolution');
    }
    if (block.type === 'conflict' && !block.resolution) {
      errors.push('conflict block has no resolution');
    }
    if (!Array.isArray(block.body) || block.body.length !== 3) {
      errors.push(`matrix body paragraph count must be 3, got ${block.body?.length ?? 'none'}`);
    }
  }

  if (fileName === 'factor-cause-blocks.json') {
    if (!Array.isArray(block.whyMechanism) || block.whyMechanism.length !== 3) {
      errors.push(`factor whyMechanism paragraph count must be 3, got ${block.whyMechanism?.length ?? 'none'}`);
    }
    if (!Array.isArray(block.dailyBody) || block.dailyBody.length !== 2) {
      errors.push(`factor dailyBody paragraph count must be 2, got ${block.dailyBody?.length ?? 'none'}`);
    }
  }

  if (fileName === 'compatibility-cause-blocks.json') {
    if (!Array.isArray(block.compatibilityBody) || block.compatibilityBody.length !== 3) {
      errors.push(`compatibility body paragraph count must be 3, got ${block.compatibilityBody?.length ?? 'none'}`);
    }
    if (!block.compatibilityDaily) {
      errors.push('compatibilityDaily is required');
    }
  }

  return errors.map(message => ({ fileName, index, key: block.key, message }));
}

const allErrors = [];
for (const fileName of TARGETS) {
  const filePath = path.join(CACHE_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    allErrors.push({ fileName, index: -1, key: '', message: 'file not found' });
    continue;
  }
  const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const blocks = Array.isArray(json.blocks) ? json.blocks : Object.values(json.blocks ?? {});
  blocks.forEach((block, index) => allErrors.push(...validateBlock(fileName, block, index)));
  console.log(`${fileName}: checked ${blocks.length} blocks`);
}

if (allErrors.length) {
  console.error(`youa block cache validation failed: ${allErrors.length} error(s)`);
  for (const error of allErrors.slice(0, 50)) {
    console.error(`- ${error.fileName} #${error.index} ${error.key}: ${error.message}`);
  }
  if (allErrors.length > 50) console.error(`...and ${allErrors.length - 50} more`);
  process.exit(1);
}

console.log('youa block cache validation passed');
