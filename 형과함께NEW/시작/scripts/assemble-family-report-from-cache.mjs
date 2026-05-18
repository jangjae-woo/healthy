// Assemble one full family report from cached parent saju facts.
//
// The child base report cache stores final facts/html, but not the original
// child fixture shape required by buildFacts. For assembly we recreate the
// child fixture deterministically from the input and read mother/father
// fixtures from the parent cache.

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { buildFacts } from '../lib/youa/facts-builder.mjs';
import { mockLLMResponse } from '../lib/youa/mock-llm.mjs';
import { parseLLMOutput, attachLLMTextToFacts } from '../lib/youa/output-parser.mjs';
import { validateLLMOutput } from '../lib/youa/output-validator.mjs';
import { renderReport } from '../lib/youa/render.mjs';
import { HOUR_OPTIONS } from '../lib/youa/input-validator.mjs';

const PROJECT_ROOT = path.resolve(process.cwd(), '..', '..');
const DEFAULT_CACHE_ROOT = path.join(PROJECT_ROOT, '아이기질브라덜', '아이기질과부모양육_2026-05-17', 'cache');
const CHILD_CACHE_DIR = process.env.CHILD_CACHE_DIR ?? path.join(DEFAULT_CACHE_ROOT, 'youa-child-report-cache-full');
const PARENT_CACHE_DIR = process.env.PARENT_CACHE_DIR ?? path.join(DEFAULT_CACHE_ROOT, 'youa-parent-saju-cache-full');
const OUT_DIR = process.env.OUT_DIR ?? path.join(DEFAULT_CACHE_ROOT, 'youa-family-report-assembled');
const OUT_FILE = process.env.OUT_FILE ?? path.join(OUT_DIR, 'family-report-sample.html');
const TEST_DATE = process.env.TEST_DATE ?? '2026-05-17';

const INPUT = {
  child: {
    name: process.env.CHILD_NAME ?? 'child',
    birthDate: process.env.CHILD_DATE ?? '2021-08-17',
    genderFixture: process.env.CHILD_GENDER ?? 'female',
    genderForm: process.env.CHILD_GENDER_FORM ?? '여',
    hour: process.env.CHILD_HOUR ?? '시간 모름',
  },
  mother: {
    name: process.env.MOTHER_NAME ?? 'mother',
    birthDate: process.env.MOTHER_DATE ?? '1988-01-01',
    hour: process.env.MOTHER_HOUR ?? '시간 모름',
  },
  father: {
    name: process.env.FATHER_NAME ?? 'father',
    birthDate: process.env.FATHER_DATE ?? '1985-10-03',
    hour: process.env.FATHER_HOUR ?? '시간 모름',
  },
};

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function normalizeHour(hour) {
  const matched = HOUR_OPTIONS.find((h) => h.value === hour || h.label === hour);
  return matched?.value ?? hour;
}

function hourKey(hour) {
  const normalized = normalizeHour(hour);
  if (normalized === '시간 모름') return 'unknown-hour';
  return normalized.replace(/\s+/g, '').replace(/[():~]/g, '-');
}

function parentCacheKey(role, birthDate, hour) {
  return `${role}_${birthDate}_${hourKey(hour)}`;
}

function childCacheKey(input) {
  return `${input.birthDate}_${input.genderFixture}_${hourKey(input.hour)}`;
}

async function readJsonLine(filePath, lineNumber) {
  const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
  let current = 0;
  for await (const line of rl) {
    current += 1;
    if (current === lineNumber) {
      rl.close();
      stream.destroy();
      return JSON.parse(line);
    }
  }
  throw new Error(`line ${lineNumber} not found in ${filePath}`);
}

async function readParentFromCache(role, input) {
  const key = parentCacheKey(role, input.birthDate, input.hour);
  const indexPath = path.join(PARENT_CACHE_DIR, 'index.json');
  const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  const hit = index[key];
  if (!hit) throw new Error(`parent cache miss: ${key}`);
  const record = await readJsonLine(path.join(PARENT_CACHE_DIR, hit.file), hit.line);
  const parentSaju = record.parentSaju;
  parentSaju.parent.name = input.name;
  parentSaju.parent.role = role;
  return { key, record, parentSaju };
}

async function readChildFromCache(input) {
  const key = childCacheKey(input);
  const indexPath = path.join(CHILD_CACHE_DIR, 'index.json');
  const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  const hit = index[key];
  if (!hit) throw new Error(`child cache miss: ${key}`);
  const record = await readJsonLine(path.join(CHILD_CACHE_DIR, hit.file), hit.line);
  const childSaju = record.childSaju;
  if (!childSaju) throw new Error(`child cache record has no childSaju: ${key}`);
  childSaju.child.name = input.name;
  childSaju.child.gender = input.genderFixture;
  return { key, record, childSaju };
}

function wrapHtml({ body, validation, cacheKeys, input }) {
  const status = validation.valid ? '통과' : `실패 ${validation.violations.length}건`;
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>아이기질과부모양육 조립 샘플</title>
  <style>
    body { margin:0; background:#f4efe9; color:#333; font-family:Pretendard,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
    .assembly-top { max-width:920px; margin:0 auto 18px; padding:16px; background:#fff; border:1px solid #e4d4c6; border-radius:10px; line-height:1.7; }
    .assembly-top h1 { margin:0 0 8px; font-size:18px; color:#9a4b2c; }
    .assembly-top code { background:#f7eadf; padding:2px 5px; border-radius:4px; }
    .assembly-top .ok { color:#277a4b; font-weight:700; }
    .assembly-wrap { padding:18px 8px 40px; }
  </style>
</head>
<body>
  <div class="assembly-wrap">
    <div class="assembly-top">
      <h1>아이기질과부모양육 캐시 조립 샘플</h1>
      <div>validator: <span class="ok">${status}</span></div>
      <div>child cache: <code>${cacheKeys.child}</code></div>
      <div>mother cache: <code>${cacheKeys.mother}</code></div>
      <div>father cache: <code>${cacheKeys.father}</code></div>
    </div>
    ${body}
  </div>
</body>
</html>`;
}

function writeReadme({ cacheKeys, validation }) {
  const readme = `# 아이기질과부모양육 가족 보고서 조립 샘플

생성일: ${new Date().toISOString()}

## 목적

아이 입력값과 부모 사주 결 캐시를 이용해서 최종 가족 보고서 HTML 1개를 조립한 결과입니다.
이 단계가 팔자원 운영에서 사용할 조회/조립 방식의 원형입니다.

## 출력

- HTML: \`${OUT_FILE}\`
- validator: ${validation.valid ? '통과' : `실패 ${validation.violations.length}건`}

## 사용한 부모 캐시 key

- 어머님: \`${cacheKeys.mother}\`
- 아버님: \`${cacheKeys.father}\`
- 아이: \`${cacheKeys.child}\`

## 현재 구조

1. 아이는 \`${CHILD_CACHE_DIR}\`의 캐시에서 읽습니다.
2. 어머님/아버님은 \`${PARENT_CACHE_DIR}\`의 캐시에서 읽습니다.
3. \`buildFacts\`, \`mockLLMResponse\`, \`renderReport\`로 최종 HTML을 조립합니다.
`;
  fs.writeFileSync(path.join(OUT_DIR, 'README.md'), readme, 'utf8');
}

ensureDir(OUT_DIR);

const child = await readChildFromCache(INPUT.child);
const mother = await readParentFromCache('mother', INPUT.mother);
const father = await readParentFromCache('father', INPUT.father);

const facts = buildFacts({
  childSaju: child.childSaju,
  motherSaju: mother.parentSaju,
  fatherSaju: father.parentSaju,
  testDate: TEST_DATE,
});
const parsed = parseLLMOutput(mockLLMResponse(facts));
const validation = validateLLMOutput(parsed, facts);
const finalFacts = attachLLMTextToFacts(facts, parsed);
const html = wrapHtml({
  body: renderReport(finalFacts),
  validation,
  cacheKeys: { child: child.key, mother: mother.key, father: father.key },
  input: INPUT,
});

fs.writeFileSync(OUT_FILE, html, 'utf8');
writeReadme({ cacheKeys: { child: child.key, mother: mother.key, father: father.key }, validation });

console.log(JSON.stringify({
  ok: validation.valid,
  violations: validation.violations ?? [],
  outFile: OUT_FILE,
  readme: path.join(OUT_DIR, 'README.md'),
  cacheKeys: {
    child: child.key,
    mother: mother.key,
    father: father.key,
  },
}, null, 2));
