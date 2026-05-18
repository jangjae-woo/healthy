// 1번 방식 파일럿: 아이 생년월일/성별/시간 조합의 완성 보고서를 미리 생성한다.
// 기본값은 2020-01-01~2023-12-31 전체 조합의 5%.

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
const SAMPLE_RATIO = Number(process.env.SAMPLE_RATIO ?? '0.05');
const OUT_DIR = process.env.OUT_DIR ?? 'C:\\tmp\\youa-precompute-pilot';
const INCLUDE_UNKNOWN_HOUR = process.env.INCLUDE_UNKNOWN_HOUR === '1';
const OUT_FILE = path.join(OUT_DIR, `child-report-cache-${Math.round(SAMPLE_RATIO * 100)}pct.jsonl`);
const SUMMARY_FILE = path.join(OUT_DIR, `child-report-cache-${Math.round(SAMPLE_RATIO * 100)}pct-summary.json`);

const GENDERS = [
  { form: '여', fixture: 'female', label: '양' },
  { form: '남', fixture: 'male', label: '군' },
];
const HOURS = HOUR_OPTIONS
  .map((h) => h.value)
  .filter((hour) => INCLUDE_UNKNOWN_HOUR || hour !== '시간 모름');

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

function cacheKey({ iso, gender, hour }) {
  const hourKey = hour.replace(/\s+/g, '').replace(/[():~]/g, '-');
  return `${iso}_${gender.fixture}_${hourKey}`;
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const total = countDays(START_DATE, END_DATE) * GENDERS.length * HOURS.length;
const target = Math.max(1, Math.round(total * SAMPLE_RATIO));
const startedAt = performance.now();
const stream = fs.createWriteStream(OUT_FILE, { encoding: 'utf8' });

let generated = 0;
let failed = 0;
let bytes = 0;
let validationFailed = 0;
const animalCounts = {};
const errors = [];

outer:
for (const date of datesBetween(START_DATE, END_DATE)) {
  for (const gender of GENDERS) {
    for (const hour of HOURS) {
      if (generated >= target) break outer;
      try {
        const core = computeFullSajuCore({
          year: date.y,
          month: date.m,
          day: date.day,
          hour,
          calendar: '양력',
          gender: gender.form,
        });
        if (!core) throw new Error('saju core failed');

        const childSaju = sajuCoreToFixture(core, {
          name: 'child',
          gender: gender.fixture,
          birthDate: date.iso,
          role: 'child',
          testDate: '2026-05-17',
        });
        const facts = buildFacts({
          childSaju,
          motherSaju: null,
          fatherSaju: null,
          testDate: '2026-05-17',
        });
        const parsed = parseLLMOutput(mockLLMResponse(facts));
        const validation = validateLLMOutput(parsed, facts);
        if (!validation.valid) validationFailed += 1;

        const finalFacts = attachLLMTextToFacts(facts, parsed);
        const html = renderReport(finalFacts);
        const record = {
          key: cacheKey({ iso: date.iso, gender, hour }),
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
            pageCount: facts.meta.reportPageCount,
            valid: validation.valid,
          },
          facts: finalFacts,
          html,
        };
        const line = `${JSON.stringify(record)}\n`;
        bytes += Buffer.byteLength(line, 'utf8');
        stream.write(line);
        animalCounts[facts.animal.name] = (animalCounts[facts.animal.name] ?? 0) + 1;
        generated += 1;
      } catch (error) {
        failed += 1;
        if (errors.length < 20) {
          errors.push({
            birthDate: date.iso,
            gender: gender.fixture,
            hour,
            error: error?.message ?? String(error),
          });
        }
      }
    }
  }
}

await new Promise((resolve) => stream.end(resolve));

const elapsedSec = (performance.now() - startedAt) / 1000;
const summary = {
  range: { start: START_DATE, end: END_DATE },
  sampleRatio: SAMPLE_RATIO,
  includeUnknownHour: INCLUDE_UNKNOWN_HOUR,
  totalCombinations: total,
  target,
  generated,
  failed,
  validationFailed,
  elapsedSec: Number(elapsedSec.toFixed(3)),
  reportsPerSec: Number((generated / elapsedSec).toFixed(2)),
  bytes,
  mb: Number((bytes / 1024 / 1024).toFixed(2)),
  estimatedFullMb: Number((bytes / SAMPLE_RATIO / 1024 / 1024).toFixed(2)),
  outputFile: OUT_FILE,
  animalCounts,
  errors,
};

fs.writeFileSync(SUMMARY_FILE, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(summary, null, 2));
