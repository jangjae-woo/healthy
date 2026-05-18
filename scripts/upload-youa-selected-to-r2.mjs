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

function normalizeHour(hour) {
  return String(hour ?? '').trim();
}

function hourKey(hour) {
  const normalized = normalizeHour(hour);
  if (normalized === '시간 모름') return 'unknown-hour';
  if (normalized === '시간모름') return 'unknown-hour';
  return normalized.replace(/\s+/g, '').replace(/[():~]/g, '-');
}

function childKey(input) {
  return `${input.birthDate}_${input.gender}_${hourKey(input.hour)}`;
}

function parentKey(role, input) {
  return `${role}_${input.birthDate}_${hourKey(input.hour)}`;
}

function parseInputFromUrl(rawUrl) {
  const url = new URL(rawUrl);
  return {
    child: {
      birthDate: url.searchParams.get('childBirthDate'),
      gender: url.searchParams.get('childGender') === 'male' ? 'male' : 'female',
      hour: url.searchParams.get('childHour'),
    },
    mother: {
      birthDate: url.searchParams.get('motherBirthDate'),
      hour: url.searchParams.get('motherHour'),
    },
    father: {
      birthDate: url.searchParams.get('fatherBirthDate'),
      hour: url.searchParams.get('fatherHour'),
    },
  };
}

async function findRecord(filePath, key) {
  const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line.includes(`"key":"${key}"`) && !line.includes(`"key": "${key}"`)) continue;
    const record = JSON.parse(line);
    if (record.key === key) return record;
  }
  return null;
}

function childFileForDate(birthDate) {
  const year = birthDate.slice(0, 4);
  return path.join(CHILD_DIR, `child-report-cache-${year}.jsonl`);
}

function parentFileForDate(birthDate) {
  const year = birthDate.slice(0, 4);
  return path.join(PARENT_DIR, `parent-saju-cache-${year}.jsonl`);
}

function childObjectKey(record) {
  const [year, month] = record.input.birthDate.split('-');
  return `${PREFIX}/child/${year}/${month}/${encodeURIComponent(record.key)}.json`;
}

function parentObjectKey(record) {
  const [year, month] = record.input.birthDate.split('-');
  return `${PREFIX}/parent/${record.input.role}/${year}/${month}/${encodeURIComponent(record.key)}.json`;
}

async function putObject(key, record) {
  const endpoint = process.env.R2_ENDPOINT;
  const bucket = process.env.R2_BUCKET;
  if (!endpoint || !bucket) throw new Error('Missing R2 endpoint or bucket');
  const body = Buffer.from(JSON.stringify(record));
  const url = new URL(`${endpoint.replace(/\/$/, '')}/${bucket}/${key}`);
  const headers = signedHeaders({ method: 'PUT', url, body, contentType: 'application/json; charset=utf-8' });
  const res = await fetch(url, { method: 'PUT', headers, body });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PUT ${key} failed: ${res.status} ${res.statusText}\n${text.slice(0, 1000)}`);
  }
  return body.length;
}

loadEnv(ENV_FILE);

const rawUrl = process.env.YOUA_RESULT_URL;
if (!rawUrl) throw new Error('Set YOUA_RESULT_URL to the full /love/youa/result URL');

const input = parseInputFromUrl(rawUrl);
const targets = [
  { kind: 'child', key: childKey(input.child), file: childFileForDate(input.child.birthDate), objectKey: childObjectKey },
  { kind: 'mother', key: parentKey('mother', input.mother), file: parentFileForDate(input.mother.birthDate), objectKey: parentObjectKey },
  { kind: 'father', key: parentKey('father', input.father), file: parentFileForDate(input.father.birthDate), objectKey: parentObjectKey },
];

const uploaded = [];
for (const target of targets) {
  if (!fs.existsSync(target.file)) throw new Error(`${target.kind} cache file not found: ${target.file}`);
  const record = await findRecord(target.file, target.key);
  if (!record) throw new Error(`${target.kind} record not found: ${target.key}`);
  const objectKey = target.objectKey(record);
  const bytes = await putObject(objectKey, record);
  uploaded.push({ kind: target.kind, key: target.key, objectKey, bytes });
}

console.log(JSON.stringify({ ok: true, uploaded }, null, 2));
