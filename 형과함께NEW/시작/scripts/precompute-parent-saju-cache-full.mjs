// Parent saju feature cache for the child temperament product.
// This does not multiply every child x mother x father combination.
// It stores reusable parent-side saju facts so family reports can be assembled
// from child cache + parent cache + deterministic relationship rules.

import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { computeFullSajuCore } from '../lib/saju-core/saju-core.ts';
import { sajuCoreToFixture } from '../lib/youa/core-to-fixture.mjs';
import { calcAll6Axes } from '../lib/youa/parent-axes.mjs';
import { HOUR_OPTIONS } from '../lib/youa/input-validator.mjs';

const START_DATE = process.env.PARENT_START_DATE ?? '1950-01-01';
const END_DATE = process.env.PARENT_END_DATE ?? '2010-12-31';
const OUT_DIR = process.env.OUT_DIR ?? 'C:\\tmp\\youa-parent-saju-cache-full';
const TEST_DATE = process.env.TEST_DATE ?? '2026-05-17';

const ROLES = [
  { role: 'mother', name: 'mother', genderFixture: 'female', genderForm: '여' },
  { role: 'father', name: 'father', genderFixture: 'male', genderForm: '남' },
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
  let count = 0;
  for (const _date of datesBetween(start, end)) count += 1;
  return count;
}

function hourKey(hour) {
  if (hour === '시간 모름') return 'unknown-hour';
  return hour.replace(/\s+/g, '').replace(/[():~]/g, '-');
}

function cacheKey({ iso, role, hour }) {
  return `${role}_${iso}_${hourKey(hour)}`;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function mb(bytes) {
  return Number((bytes / 1024 / 1024).toFixed(2));
}

function makeParentFixture({ roleInfo, birthDate, hour }) {
  const [year, month, day] = birthDate.split('-').map(Number);
  const core = computeFullSajuCore({
    year,
    month,
    day,
    hour,
    calendar: '양력',
    gender: roleInfo.genderForm,
  });
  if (!core) throw new Error(`${birthDate} ${roleInfo.role} ${hour}: saju core failed`);
  return sajuCoreToFixture(core, {
    name: roleInfo.name,
    gender: roleInfo.genderFixture,
    birthDate,
    role: roleInfo.role,
    testDate: TEST_DATE,
  });
}

function simplifyAxes(axes) {
  return Object.fromEntries(Object.entries(axes).map(([key, axis]) => [
    key,
    {
      score: axis.score,
      level: axis.level,
      axisKorean: axis.axisKorean,
      label: axis.label,
      trace: axis.trace,
    },
  ]));
}

function writeReadme(summary) {
  const readme = `# 아이기질과부모양육 부모 사주 결 캐시

생성일: ${new Date().toISOString()}

## 목적

아이 기본 보고서 캐시와 결합하기 위한 부모 쪽 사주 결 백데이터입니다.
어머님/아버님 생년월일과 출생시간별로 사주 기둥, 일간, 부모 6축 결을 미리 저장합니다.

중요: 이 파일은 아이 x 어머님 x 아버님 전체 완성 HTML을 모두 곱한 캐시가 아닙니다.
전체 가족 조합은 경우의 수가 너무 커지므로, 운영에서는 아래 3단계로 조립하는 방식이 맞습니다.

1. 아이 기본 보고서 캐시에서 아이 결과를 찾기
2. 부모 사주 결 캐시에서 어머님/아버님 결과를 찾기
3. 부모-자녀 관계/궁합 부분만 결정론 규칙으로 즉시 조립하기

## 입력 범위

- 부모 생년월일: ${summary.range.start} ~ ${summary.range.end}
- 역할: 어머님, 아버님
- 시간: 12지시 + 시간 모름
- 전체 조합: ${summary.totalCombinations.toLocaleString()}건

## 출력 파일

- \`index.json\`: key별 연도 파일/라인 위치
- \`summary.json\`: 생성 통계
${summary.files.map((f) => `- \`${path.basename(f.path)}\`: ${f.count.toLocaleString()}건, ${f.mb}MB`).join('\n')}

## 캐시 key 형식

\`\`\`
role_YYYY-MM-DD_hour
\`\`\`

예:

\`\`\`
mother_1988-04-12_unknown-hour
father_1985-10-03_인시-03-30-05-29-
\`\`\`

## 레코드 구조

\`\`\`json
{
  "key": "...",
  "input": {
    "role": "mother",
    "birthDate": "1988-04-12",
    "hour": "시간 모름",
    "calendar": "solar"
  },
  "summary": {
    "ilgan": "정",
    "ilju": "정축",
    "topAxes": ["온기", "중심", "일관"]
  },
  "parentSaju": {},
  "axes": {}
}
\`\`\`

## 생성 결과

- 생성 성공: ${summary.generated.toLocaleString()}건
- 실패: ${summary.failed.toLocaleString()}건
- 소요 시간: ${summary.elapsedSec}초
- 평균 속도: ${summary.recordsPerSec}건/초
- 총 용량: ${summary.totalMb}MB
`;
  fs.writeFileSync(path.join(OUT_DIR, 'README.md'), readme, 'utf8');
}

ensureDir(OUT_DIR);

const totalCombinations = countDays(START_DATE, END_DATE) * ROLES.length * HOURS.length;
const startedAt = performance.now();
const streams = new Map();
const files = new Map();
const index = {};
const errors = [];
const ilganCounts = {};

let generated = 0;
let failed = 0;

function getStream(year) {
  if (streams.has(year)) return streams.get(year);
  const filePath = path.join(OUT_DIR, `parent-saju-cache-${year}.jsonl`);
  const stream = fs.createWriteStream(filePath, { encoding: 'utf8' });
  streams.set(year, stream);
  files.set(year, { path: filePath, count: 0, bytes: 0 });
  return stream;
}

for (const date of datesBetween(START_DATE, END_DATE)) {
  for (const roleInfo of ROLES) {
    for (const hour of HOURS) {
      const key = cacheKey({ iso: date.iso, role: roleInfo.role, hour });
      try {
        const parentSaju = makeParentFixture({ roleInfo, birthDate: date.iso, hour });
        const axes = simplifyAxes(calcAll6Axes(parentSaju));
        const topAxes = Object.values(axes)
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)
          .map((axis) => axis.axisKorean);
        const record = {
          key,
          input: {
            role: roleInfo.role,
            birthDate: date.iso,
            hour,
            calendar: 'solar',
          },
          summary: {
            ilgan: parentSaju.ilgan,
            ilju: parentSaju.ilju,
            isHourUnknown: parentSaju.isHourUnknown,
            topAxes,
          },
          parentSaju,
          axes,
        };

        const year = String(date.y);
        const file = files.get(year) ?? { path: path.join(OUT_DIR, `parent-saju-cache-${year}.jsonl`), count: 0, bytes: 0 };
        const line = `${JSON.stringify(record)}\n`;
        const bytes = Buffer.byteLength(line, 'utf8');
        getStream(year).write(line);
        index[key] = { file: path.basename(file.path), line: file.count + 1 };
        file.count += 1;
        file.bytes += bytes;
        files.set(year, file);
        ilganCounts[parentSaju.ilgan] = (ilganCounts[parentSaju.ilgan] ?? 0) + 1;
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
  elapsedSec: Number(elapsedSec.toFixed(3)),
  recordsPerSec: Number((generated / Math.max(elapsedSec, 0.001)).toFixed(2)),
  totalBytes,
  totalMb: mb(totalBytes),
  outDir: OUT_DIR,
  files: fileList,
  ilganCounts,
  errors,
};

fs.writeFileSync(path.join(OUT_DIR, 'index.json'), JSON.stringify(index), 'utf8');
fs.writeFileSync(path.join(OUT_DIR, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
writeReadme(summary);

console.log(JSON.stringify(summary, null, 2));
