import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

const ENV_FILE = process.env.R2_ENV_FILE ?? path.resolve('.env.r2.local');
const CACHE_ROOT = process.env.CACHE_ROOT ?? path.join(
  process.cwd(),
  '아이기질브라덜',
  '아이기질과부모양육_2026-05-17',
  'cache',
);
const CHILD_DIR = process.env.CHILD_CACHE_DIR ?? path.join(CACHE_ROOT, 'youa-child-report-cache-full');
const PARENT_DIR = process.env.PARENT_CACHE_DIR ?? path.join(CACHE_ROOT, 'youa-parent-saju-cache-full');
const PREFIX = process.env.R2_PREFIX ?? 'youa-cache/v1';
const CONCURRENCY = Math.max(1, Number(process.env.R2_UPLOAD_CONCURRENCY ?? 24));
const LOG_EVERY = Math.max(1, Number(process.env.R2_UPLOAD_LOG_EVERY ?? 1000));
const START_KIND = process.env.R2_UPLOAD_START_KIND ?? 'child';
const START_YEAR = Number(process.env.R2_UPLOAD_START_YEAR ?? 0);
const MAX_RETRIES = Math.max(0, Number(process.env.R2_UPLOAD_RETRIES ?? 5));

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

function hmac(key, value, encoding) {
  return crypto.createHmac('sha256', key).update(value).digest(encoding);
}

function sha256(value, encoding = 'hex') {
  return crypto.createHash('sha256').update(value).digest(encoding);
}

function amzDate(date) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, '');
}

function dateStamp(date) {
  return date.toISOString().slice(0, 10).replace(/-/g, '');
}

function signingKey(secret, date, region, service) {
  const kDate = hmac(`AWS4${secret}`, date);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, 'aws4_request');
}

function signedHeaders({ method, url, body, contentType }) {
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) throw new Error('Missing R2 credentials');
  const now = new Date();
  const date = dateStamp(now);
  const amz = amzDate(now);
  const region = 'auto';
  const service = 's3';
  const payloadHash = sha256(body ?? Buffer.alloc(0));
  const canonicalHeaders = [
    `content-type:${contentType}`,
    `host:${url.host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amz}`,
  ].join('\n') + '\n';
  const signedHeaderNames = 'content-type;host;x-amz-content-sha256;x-amz-date';
  const canonicalRequest = [method, url.pathname, '', canonicalHeaders, signedHeaderNames, payloadHash].join('\n');
  const scope = `${date}/${region}/${service}/aws4_request`;
  const stringToSign = ['AWS4-HMAC-SHA256', amz, scope, sha256(canonicalRequest)].join('\n');
  const signature = hmac(signingKey(secretAccessKey, date, region, service), stringToSign, 'hex');
  return {
    authorization: `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${scope}, SignedHeaders=${signedHeaderNames}, Signature=${signature}`,
    'content-type': contentType,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amz,
  };
}

async function putObject(key, record) {
  const endpoint = process.env.R2_ENDPOINT;
  const bucket = process.env.R2_BUCKET;
  if (!endpoint || !bucket) throw new Error('Missing R2 endpoint or bucket');
  const body = Buffer.from(JSON.stringify(record));
  const url = new URL(`${endpoint.replace(/\/$/, '')}/${bucket}/${key}`);
  const headers = signedHeaders({ method: 'PUT', url, body, contentType: 'application/json; charset=utf-8' });
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const res = await fetch(url, { method: 'PUT', headers, body });
    if (res.ok) return body.length;
    const text = await res.text();
    const retryable = res.status === 429 || res.status >= 500;
    if (!retryable || attempt === MAX_RETRIES) {
      throw new Error(`PUT ${key} failed: ${res.status} ${res.statusText}\n${text.slice(0, 1000)}`);
    }
    const delay = Math.min(30000, 500 * 2 ** attempt) + Math.floor(Math.random() * 250);
    console.error(`retry ${attempt + 1}/${MAX_RETRIES} after ${res.status} for ${key}`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  return body.length;
}

function childObjectKey(record) {
  const [year, month] = record.input.birthDate.split('-');
  return `${PREFIX}/child/${year}/${month}/${encodeURIComponent(record.key)}.json`;
}

function parentObjectKey(record) {
  const [year, month] = record.input.birthDate.split('-');
  return `${PREFIX}/parent/${record.input.role}/${year}/${month}/${encodeURIComponent(record.key)}.json`;
}

async function* readJsonl(filePath) {
  const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
  for await (const line of rl) {
    if (line.trim()) yield JSON.parse(line);
  }
}

function listJsonl(dir, prefix) {
  return fs.readdirSync(dir)
    .filter(name => name.startsWith(prefix) && name.endsWith('.jsonl'))
    .sort()
    .map(name => path.join(dir, name));
}

function filterStart(files, startYear) {
  if (!startYear) return files;
  return files.filter(file => {
    const match = path.basename(file).match(/(\d{4})/);
    return match ? Number(match[1]) >= startYear : true;
  });
}

async function uploadFiles(files, kind, keyFn, state) {
  const pending = new Set();
  async function enqueue(record) {
    const task = putObject(keyFn(record), record)
      .then(bytes => {
        state.count += 1;
        state.bytes += bytes;
        if (state.count % LOG_EVERY === 0) {
          const elapsed = (Date.now() - state.startedAt) / 1000;
          const rate = state.count / Math.max(elapsed, 1);
          console.log(`${kind}: uploaded ${state.count} total, ${rate.toFixed(1)}/sec`);
        }
      })
      .finally(() => pending.delete(task));
    pending.add(task);
    if (pending.size >= CONCURRENCY) await Promise.race(pending);
  }

  for (const file of files) {
    console.log(`${kind}: reading ${path.basename(file)}`);
    for await (const record of readJsonl(file)) await enqueue(record);
  }
  await Promise.all(pending);
}

loadEnv(ENV_FILE);

const state = { count: 0, bytes: 0, startedAt: Date.now() };
console.log(JSON.stringify({
  ok: true,
  mode: 'parallel-upload-start',
  prefix: PREFIX,
  concurrency: CONCURRENCY,
  maxRetries: MAX_RETRIES,
  startKind: START_KIND,
  startYear: START_YEAR || null,
  childDir: CHILD_DIR,
  parentDir: PARENT_DIR,
}, null, 2));

if (START_KIND === 'child') {
  await uploadFiles(filterStart(listJsonl(CHILD_DIR, 'child-report-cache-'), START_YEAR), 'child', childObjectKey, state);
  await uploadFiles(listJsonl(PARENT_DIR, 'parent-saju-cache-'), 'parent', parentObjectKey, state);
} else {
  await uploadFiles(filterStart(listJsonl(PARENT_DIR, 'parent-saju-cache-'), START_YEAR), 'parent', parentObjectKey, state);
}

console.log(JSON.stringify({
  ok: true,
  uploaded: state.count,
  bytes: state.bytes,
  elapsedSec: Number(((Date.now() - state.startedAt) / 1000).toFixed(1)),
}, null, 2));
