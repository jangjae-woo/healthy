#!/usr/bin/env node

import { runAllCases } from '../lib/youa/edge-cases.mjs';

const results = runAllCases();

console.log('========================================================================');
console.log(' Edge case QA');
console.log('========================================================================');

for (const result of results) {
  const status = result.overallPass ? 'PASS' : 'FAIL';
  console.log(`[${status}] ${result.case.name} (${result.passCount}/${result.totalCount})`);

  for (const check of result.checks) {
    const mark = check.pass ? '  ✓' : '  ✗';
    console.log(`${mark} ${check.name}: expected=${check.expected}, actual=${check.actual}`);
  }
}

const failed = results.filter(result => !result.overallPass);

console.log('------------------------------------------------------------------------');
console.log(`SUMMARY pass=${results.length - failed.length} fail=${failed.length} total=${results.length}`);

if (failed.length > 0) {
  process.exitCode = 1;
}
