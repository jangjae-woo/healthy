// Convert generated JSONL cache files to one SQLite database.
//
// Default input:
//   ../../아이기질브라덜/아이기질과부모양육_2026-05-17/cache
//
// Output:
//   ../../아이기질브라덜/아이기질과부모양육_2026-05-17/cache/sqlite/youa-cache.sqlite

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { spawn } from 'node:child_process';
import { performance } from 'node:perf_hooks';

const PROJECT_ROOT = path.resolve(process.cwd(), '..', '..');
const DEFAULT_CACHE_ROOT = path.join(PROJECT_ROOT, '아이기질브라덜', '아이기질과부모양육_2026-05-17', 'cache');
const CACHE_ROOT = process.env.CACHE_ROOT ?? DEFAULT_CACHE_ROOT;
const CHILD_DIR = process.env.CHILD_CACHE_DIR ?? path.join(CACHE_ROOT, 'youa-child-report-cache-full');
const PARENT_DIR = process.env.PARENT_CACHE_DIR ?? path.join(CACHE_ROOT, 'youa-parent-saju-cache-full');
const OUT_DIR = process.env.SQLITE_OUT_DIR ?? path.join(CACHE_ROOT, 'sqlite');
const OUT_DB = process.env.SQLITE_OUT_DB ?? path.join(OUT_DIR, 'youa-cache.sqlite');
const SQLITE_BIN = process.env.SQLITE_BIN ?? 'sqlite3';
const COMMIT_EVERY = Number(process.env.SQLITE_COMMIT_EVERY ?? 500);

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function sql(value) {
  if (value === null || value === undefined) return 'NULL';
  return `'${String(value).replaceAll("'", "''")}'`;
}

function sqlJson(value) {
  return sql(JSON.stringify(value ?? null));
}

function dateYear(date) {
  return Number(String(date).slice(0, 4));
}

function mb(bytes) {
  return Number((bytes / 1024 / 1024).toFixed(2));
}

async function* jsonlRecords(filePath) {
  const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line.trim()) continue;
    yield JSON.parse(line);
  }
}

function listJsonl(dir, prefix) {
  return fs.readdirSync(dir)
    .filter((name) => name.startsWith(prefix) && name.endsWith('.jsonl'))
    .sort()
    .map((name) => path.join(dir, name));
}

function writeProc(proc, text) {
  return new Promise((resolve, reject) => {
    proc.stdin.write(text, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

function createSqlite(dbPath) {
  const proc = spawn(SQLITE_BIN, [dbPath], { stdio: ['pipe', 'pipe', 'pipe'] });
  let stdout = '';
  let stderr = '';
  proc.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
  proc.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
  const done = new Promise((resolve, reject) => {
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`sqlite3 exited ${code}\n${stderr}`));
    });
  });
  return { proc, done };
}

async function insertChild(proc, record) {
  const input = record.input ?? {};
  const summary = record.summary ?? {};
  const stmt = `INSERT INTO child_reports (
    cache_key, birth_date, birth_year, gender, hour, ilgan, animal,
    animal_case, animal_confidence, page_count, valid, summary_json, record_json
  ) VALUES (
    ${sql(record.key)}, ${sql(input.birthDate)}, ${dateYear(input.birthDate)},
    ${sql(input.gender)}, ${sql(input.hour)}, ${sql(summary.ilgan)},
    ${sql(summary.animal)}, ${sql(summary.animalCase)}, ${sql(summary.animalConfidence)},
    ${Number(summary.pageCount ?? 0)}, ${summary.valid ? 1 : 0},
    ${sqlJson(summary)}, ${sql(JSON.stringify(record))}
  );\n`;
  await writeProc(proc, stmt);
}

async function insertParent(proc, record) {
  const input = record.input ?? {};
  const summary = record.summary ?? {};
  const stmt = `INSERT INTO parent_saju (
    cache_key, role, birth_date, birth_year, hour, ilgan, ilju,
    is_hour_unknown, top_axes_json, summary_json, record_json
  ) VALUES (
    ${sql(record.key)}, ${sql(input.role)}, ${sql(input.birthDate)}, ${dateYear(input.birthDate)},
    ${sql(input.hour)}, ${sql(summary.ilgan)}, ${sql(summary.ilju)},
    ${summary.isHourUnknown ? 1 : 0}, ${sqlJson(summary.topAxes)},
    ${sqlJson(summary)}, ${sql(JSON.stringify(record))}
  );\n`;
  await writeProc(proc, stmt);
}

async function convert() {
  ensureDir(OUT_DIR);
  if (fs.existsSync(OUT_DB)) fs.unlinkSync(OUT_DB);

  const childFiles = listJsonl(CHILD_DIR, 'child-report-cache-');
  const parentFiles = listJsonl(PARENT_DIR, 'parent-saju-cache-');
  const startedAt = performance.now();
  const { proc, done } = createSqlite(OUT_DB);

  await writeProc(proc, `PRAGMA journal_mode = OFF;
PRAGMA synchronous = OFF;
PRAGMA temp_store = FILE;
PRAGMA locking_mode = EXCLUSIVE;

CREATE TABLE child_reports (
  cache_key TEXT PRIMARY KEY,
  birth_date TEXT NOT NULL,
  birth_year INTEGER NOT NULL,
  gender TEXT NOT NULL,
  hour TEXT NOT NULL,
  ilgan TEXT,
  animal TEXT,
  animal_case TEXT,
  animal_confidence TEXT,
  page_count INTEGER,
  valid INTEGER,
  summary_json TEXT NOT NULL,
  record_json TEXT NOT NULL
);

CREATE TABLE parent_saju (
  cache_key TEXT PRIMARY KEY,
  role TEXT NOT NULL,
  birth_date TEXT NOT NULL,
  birth_year INTEGER NOT NULL,
  hour TEXT NOT NULL,
  ilgan TEXT,
  ilju TEXT,
  is_hour_unknown INTEGER,
  top_axes_json TEXT,
  summary_json TEXT NOT NULL,
  record_json TEXT NOT NULL
);

BEGIN TRANSACTION;
`);

  let childCount = 0;
  let parentCount = 0;
  let pending = 0;

  async function maybeCommit() {
    pending += 1;
    if (pending < COMMIT_EVERY) return;
    await writeProc(proc, 'COMMIT;\nBEGIN TRANSACTION;\n');
    pending = 0;
  }

  for (const file of childFiles) {
    for await (const record of jsonlRecords(file)) {
      await insertChild(proc, record);
      childCount += 1;
      await maybeCommit();
    }
  }

  for (const file of parentFiles) {
    for await (const record of jsonlRecords(file)) {
      await insertParent(proc, record);
      parentCount += 1;
      await maybeCommit();
    }
  }

  await writeProc(proc, `COMMIT;
CREATE INDEX idx_child_lookup ON child_reports (birth_date, gender, hour);
CREATE INDEX idx_parent_lookup ON parent_saju (role, birth_date, hour);
CREATE INDEX idx_child_animal ON child_reports (animal);
CREATE INDEX idx_parent_ilgan ON parent_saju (ilgan);
`);
  proc.stdin.end();
  const sqliteResult = await done;

  const elapsedSec = (performance.now() - startedAt) / 1000;
  const dbBytes = fs.statSync(OUT_DB).size;
  const summary = {
    createdAt: new Date().toISOString(),
    cacheRoot: CACHE_ROOT,
    sqlite: OUT_DB,
    childRows: childCount,
    parentRows: parentCount,
    totalRows: childCount + parentCount,
    elapsedSec: Number(elapsedSec.toFixed(3)),
    dbBytes,
    dbMb: mb(dbBytes),
    sqliteStdout: sqliteResult.stdout.trim(),
    sqliteStderr: sqliteResult.stderr.trim(),
  };

  fs.writeFileSync(path.join(OUT_DIR, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(OUT_DIR, 'README.md'), `# 아이기질과부모양육 SQLite 캐시

생성일: ${summary.createdAt}

## 파일

- DB: \`${OUT_DB}\`
- 요약: \`${path.join(OUT_DIR, 'summary.json')}\`

## 테이블

- \`child_reports\`: 아이 기본 보고서 캐시
- \`parent_saju\`: 어머님/아버님 사주 결 캐시

## 행 수

- 아이: ${childCount.toLocaleString()}건
- 부모: ${parentCount.toLocaleString()}건
- 합계: ${(childCount + parentCount).toLocaleString()}건

## 조회 key

- 아이: \`YYYY-MM-DD_gender_hour\`
- 부모: \`role_YYYY-MM-DD_hour\`

## 운영 조회

각 테이블의 \`cache_key\`는 PRIMARY KEY입니다.
최종 가족 보고서 조립 시에는 아이 1건, 어머님 1건, 아버님 1건을 조회한 뒤 \`record_json\`을 파싱해서 사용하면 됩니다.
`, 'utf8');

  console.log(JSON.stringify(summary, null, 2));
}

await convert();
