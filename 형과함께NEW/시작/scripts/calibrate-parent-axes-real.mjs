// 부모 6축 percentile 기준표 산출

import { computeFullSajuCore } from '../lib/saju-core/saju-core.ts';
import { sajuCoreToFixture } from '../lib/youa/core-to-fixture.mjs';
import { calcAll6Axes } from '../lib/youa/parent-axes.mjs';

const N = parseInt(process.argv[2] ?? '1000', 10);
const AXES = ['ongi', 'jungsim', 'ilgwan', 'jayul', 'pyohyeon', 'baram'];
const AXIS_KO = { ongi: '온기', jungsim: '중심', ilgwan: '일관', jayul: '자율', pyohyeon: '표현', baram: '바람' };
const HOUR_OPTIONS = [
  '자시 (23:30~01:29)', '축시 (01:30~03:29)', '인시 (03:30~05:29)',
  '묘시 (05:30~07:29)', '진시 (07:30~09:29)', '사시 (09:30~11:29)',
  '오시 (11:30~13:29)', '미시 (13:30~15:29)', '신시 (15:30~17:29)',
  '유시 (17:30~19:29)', '술시 (19:30~21:29)', '해시 (21:30~23:29)',
];

function randDateInRange(startY, endY) {
  const y = startY + Math.floor(Math.random() * (endY - startY + 1));
  const m = 1 + Math.floor(Math.random() * 12);
  const dMax = new Date(y, m, 0).getDate();
  const d = 1 + Math.floor(Math.random() * dMax);
  return { y, m, d };
}

function randHour() {
  return HOUR_OPTIONS[Math.floor(Math.random() * HOUR_OPTIONS.length)];
}

function makeParent(index) {
  const { y, m, d } = randDateInRange(1978, 1995);
  const gender = Math.random() < 0.5 ? '여' : '남';
  const core = computeFullSajuCore({ year: y, month: m, day: d, hour: randHour(), calendar: '양력', gender });
  if (!core) throw new Error('saju core failed');
  return sajuCoreToFixture(core, {
    name: `부모${index}`,
    gender: gender === '여' ? 'female' : 'male',
    birthDate: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    role: gender === '여' ? 'mother' : 'father',
    testDate: '2026-05-17',
  });
}

function pctLine(sorted, p) {
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((p / 100) * (sorted.length - 1))));
  return sorted[idx];
}

const values = Object.fromEntries(AXES.map(k => [k, []]));
let failures = 0;

for (let i = 0; i < N; i++) {
  try {
    const axes = calcAll6Axes(makeParent(i));
    for (const k of AXES) values[k].push(axes[k].score);
  } catch {
    failures++;
  }
}

console.log('='.repeat(75));
console.log(` 부모 6축 percentile 기준표 (${N}명)`);
console.log('='.repeat(75));
console.log(`성공 ${N - failures}/${N}, 실패 ${failures}\n`);

console.log('export const PARENT_AXIS_PERCENTILE_PROFILE = {');
for (const k of AXES) {
  const sorted = values[k].sort((a, b) => a - b);
  const points = [0, 10, 25, 50, 75, 90, 100].map(p => ({ p, raw: pctLine(sorted, p) }));
  console.log(`  ${k}: [`);
  console.log(`    ${points.map(x => `{ p: ${x.p}, raw: ${x.raw} }`).join(', ')},`);
  console.log('  ],');
}
console.log('};\n');

console.log('분포 요약');
console.log('-'.repeat(75));
for (const k of AXES) {
  const sorted = values[k].sort((a, b) => a - b);
  console.log(`  ${AXIS_KO[k]} p10=${pctLine(sorted, 10)}, p25=${pctLine(sorted, 25)}, p50=${pctLine(sorted, 50)}, p75=${pctLine(sorted, 75)}, p90=${pctLine(sorted, 90)}`);
}
console.log('='.repeat(75));
