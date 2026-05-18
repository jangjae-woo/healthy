// 운영용 아이별 완성 보고서 캐시 100% 생성.
// 범위: 2020-01-01~2023-12-31, 성별 2종, 12지시 + 시간 모름.
// 출력: 연도별 JSONL + index + README.md

import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { computeFullSajuCore } from '../lib/saju-core/saju-core.ts';
import { sajuCoreToFixture } from '../lib/youa/core-to-fixture.mjs';
import { buildFacts } from '../lib/youa/facts-builder.mjs';
import { mockLLMResponse } from '../lib/youa/mock-llm.mjs';
import { parseLLMOutput, attachLLMTextToFacts } from '../lib/youa/output-parser.mjs';
import { validateLLMOutput } from '../lib/youa/output-validator.mjs';
import { renderReport } from '../lib/youa/render.mjs';
import { HOUR_OPTIONS } from '../lib/youa/input-validator.mjs';

const START_DATE = process.env.START_DATE ?? '2020-01-01';
const END_DATE = process.env.END_DATE ?? '2023-12-31';
const OUT_DIR = process.env.OUT_DIR ?? 'C:\\tmp\\youa-child-report-cache-full';
const TEST_DATE = process.env.TEST_DATE ?? '2026-05-17';

const GENDERS = [
  { form: '여', fixture: 'female', label: '여자아이' },
  { form: '남', fixture: 'male', label: '남자아이' },
];
const HOURS = HOUR_OPTIONS.map((h) => h.value);

function* datesBetween(start, end) {
  const [startY, startM, startD] = start.split('-').map(Number);
  const [endY, endM, endD] = end.split('-').map(Number);
  const d = new Date(startY, startM - 1, startD);
  const last = new Date(endY, endM - 1, endD);
  while (d.getTime() <= last.getTime()) {
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const day = d.getDate();
    yield {
      y,
      m,
      day,
      iso: `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    };
    d.setDate(d.getDate() + 1);
  }
}

function countDays(start, end) {
  return [...datesBetween(start, end)].length;
}

function hourKey(hour) {
  if (hour === '시간 모름') return 'unknown-hour';
  return hour.replace(/\s+/g, '').replace(/[():~]/g, '-');
}

function cacheKey({ iso, gender, hour }) {
  return `${iso}_${gender.fixture}_${hourKey(hour)}`;
}

function makeFixture({ role, name, gender, birthDate, hour }) {
  const [year, month, day] = birthDate.split('-').map(Number);
  const core = computeFullSajuCore({
    year,
    month,
    day,
    hour,
    calendar: '양력',
    gender: gender.form,
  });
  if (!core) throw new Error(`${birthDate} ${gender.fixture} ${hour}: saju core failed`);
  return sajuCoreToFixture(core, {
    name,
    gender: gender.fixture,
    birthDate,
    role,
    testDate: TEST_DATE,
  });
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function mb(bytes) {
  return Number((bytes / 1024 / 1024).toFixed(2));
}

function writeReadme(summary) {
  const readme = `# 아이기질과부모양육 아이별 완성 보고서 캐시

생성일: ${new Date().toISOString()}

## 목적

LLM 호출을 최소화하기 위해 아이의 생년월일, 성별, 출생시간 조합별 완성 보고서를 미리 생성해 둔 캐시입니다.

## 입력 범위

- 자녀 생년월일: ${summary.range.start} ~ ${summary.range.end}
- 성별: 여자아이, 남자아이
- 시간: 12지시 + 시간 모름
- 전체 조합: ${summary.totalCombinations.toLocaleString()}개

## 출력 파일

- \`index.json\`: 캐시 key별 연도 파일/라인 위치
- \`summary.json\`: 생성 통계 원본 JSON
${summary.files.map((f) => `- \`${path.basename(f.path)}\`: ${f.count.toLocaleString()}건, ${f.mb}MB`).join('\n')}

## 캐시 key 형식

\`\`\`
YYYY-MM-DD_gender_hour
\`\`\`

예:

\`\`\`
2021-08-17_female_unknown-hour
2021-08-17_female_인시-03-30-05-29-
\`\`\`

## 레코드 구조

각 JSONL 줄은 하나의 완성 보고서입니다.

\`\`\`json
{
  "key": "...",
  "input": {
    "birthDate": "2021-08-17",
    "gender": "female",
    "hour": "시간 모름",
    "calendar": "solar"
  },
  "summary": {
    "ilgan": "정",
    "animal": "용",
    "animalCase": "C",
    "animalConfidence": "date-only",
    "pageCount": 14,
    "valid": true
  },
  "facts": {},
  "html": "<div class=...>"
}
\`\`\`

## 생성 결과

- 생성 성공: ${summary.generated.toLocaleString()}건
- 실패: ${summary.failed.toLocaleString()}건
- validator 실패: ${summary.validationFailed.toLocaleString()}건
- 소요 시간: ${summary.elapsedSec}초
- 평균 속도: ${summary.reportsPerSec}건/초
- 총 용량: ${summary.totalMb}MB

## 주의

- 현재 파일은 전체 HTML까지 포함하므로 용량이 큽니다.
- 운영 연결 시에는 index로 key를 찾고, 해당 연도 JSONL의 line을 읽어 사용하는 방식이 좋습니다.
- 부모 정보까지 완성본으로 전부 저장하면 조합 수가 크게 늘어나므로, 아이 기본 보고서 캐시와 부모/궁합 조합 캐시는 분리하는 편이 안전합니다.
`;
  fs.writeFileSync(path.join(OUT_DIR, 'README.md'), readme, 'utf8');
}

ensureDir(OUT_DIR);

const totalCombinations = countDays(START_DATE, END_DATE) * GENDERS.length * HOURS.length;
const startedAt = performance.now();
const streams = new Map();
const files = new Map();
const index = {};
const animalCounts = {};
const errors = [];

let generated = 0;
let failed = 0;
let validationFailed = 0;

function getStream(year) {
  if (streams.has(year)) return streams.get(year);
  const filePath = path.join(OUT_DIR, `child-report-cache-${year}.jsonl`);
  const stream = fs.createWriteStream(filePath, { encoding: 'utf8' });
  streams.set(year, stream);
  files.set(year, { path: filePath, count: 0, bytes: 0 });
  return stream;
}

for (const date of datesBetween(START_DATE, END_DATE)) {
  for (const gender of GENDERS) {
    for (const hour of HOURS) {
      const key = cacheKey({ iso: date.iso, gender, hour });
      try {
        const childSaju = makeFixture({
          role: 'child',
          name: 'child',
          gender,
          birthDate: date.iso,
          hour,
        });
        const facts = buildFacts({
          childSaju,
          motherSaju: null,
          fatherSaju: null,
          testDate: TEST_DATE,
        });
        const parsed = parseLLMOutput(mockLLMResponse(facts));
        const validation = validateLLMOutput(parsed, facts);
        if (!validation.valid) validationFailed += 1;

        const finalFacts = attachLLMTextToFacts(facts, parsed);
        const html = renderReport(finalFacts);
        const record = {
          key,
          input: {
            birthDate: date.iso,
            gender: gender.fixture,
            hour,
            calendar: 'solar',
          },
          summary: {
            ilgan: childSaju.ilgan,
            animal: facts.animal.name,
            animalCase: facts.animal.case,
            animalConfidence: facts.animal.confidence,
            pageCount: facts.meta.reportPageCount,
            valid: validation.valid,
          },
          childSaju,
          facts: finalFacts,
          html,
        };

        const year = String(date.y);
        const file = files.get(year) ?? { path: path.join(OUT_DIR, `child-report-cache-${year}.jsonl`), count: 0, bytes: 0 };
        const line = `${JSON.stringify(record)}\n`;
        const bytes = Buffer.byteLength(line, 'utf8');
        getStream(year).write(line);
        index[key] = { file: path.basename(file.path), line: file.count + 1 };
        file.count += 1;
        file.bytes += bytes;
        files.set(year, file);
        animalCounts[facts.animal.name] = (animalCounts[facts.animal.name] ?? 0) + 1;
        generated += 1;
      } catch (error) {
        failed += 1;
        if (errors.length < 50) {
          errors.push({ key, error: error?.message ?? String(error) });
        }
      }
    }
  }
}

await Promise.all([...streams.values()].map((stream) => new Promise((resolve) => stream.end(resolve))));

const elapsedSec = (performance.now() - startedAt) / 1000;
const fileList = [...files.values()]
  .sort((a, b) => a.path.localeCompare(b.path))
  .map((f) => ({ ...f, mb: mb(f.bytes) }));
const totalBytes = fileList.reduce((acc, f) => acc + f.bytes, 0);
const summary = {
  range: { start: START_DATE, end: END_DATE },
  totalCombinations,
  generated,
  failed,
  validationFailed,
  elapsedSec: Number(elapsedSec.toFixed(3)),
  reportsPerSec: Number((generated / elapsedSec).toFixed(2)),
  totalBytes,
  totalMb: mb(totalBytes),
  outDir: OUT_DIR,
  files: fileList,
  animalCounts,
  errors,
};

fs.writeFileSync(path.join(OUT_DIR, 'index.json'), `${JSON.stringify(index)}\n`, 'utf8');
fs.writeFileSync(path.join(OUT_DIR, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
writeReadme(summary);
console.log(JSON.stringify(summary, null, 2));
