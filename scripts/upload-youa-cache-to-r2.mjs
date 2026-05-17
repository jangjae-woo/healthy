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
const LIMIT = process.env.UPLOAD_ALL === '1' ? Infinity : Number(process.env.UPLOAD_LIMIT ?? 20);

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
  const now = new Date();
  const date = dateStamp(now);
  const amz = amzDate(now);
  const region = 'auto';
  const service = 's3';
  const payloadHash = sha256(body ?? Buffer.alloc(0));
  const canonicalUri = url.pathname;
  const canonicalHeaders = [
    `content-type:${contentType}`,
    `host:${url.host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amz}`,
  ].join('\n') + '\n';
  const signedHeaderNames = 'content-type;host;x-amz-content-sha256;x-amz-date';
  const canonicalRequest = [
    method,
    canonicalUri,
    '',
    canonicalHeaders,
    signedHeaderNames,
    payloadHash,
  ].join('\n');
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
  if (!endpoint || !bucket || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
    throw new Error('Missing R2 env vars. Check .env.r2.local.');
  }
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

function childObjectKey(record) {
  const date = record.input.birthDate;
  const [year, month] = date.split('-');
  return `${PREFIX}/child/${year}/${month}/${encodeURIComponent(record.key)}.json`;
}

function parentObjectKey(record) {
  const date = record.input.birthDate;
  const [year, month] = date.split('-');
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
    .filter((name) => name.startsWith(prefix) && name.endsWith('.jsonl'))
    .sort()
    .map((name) => path.join(dir, name));
}

async function uploadFromFiles(files, kind, keyFn, remaining) {
  let count = 0;
  let bytes = 0;
  for (const file of files) {
    for await (const record of readJsonl(file)) {
      if (count >= remaining) return { count, bytes };
      bytes += await putObject(keyFn(record), record);
      count += 1;
      if (count % 100 === 0) console.log(`${kind}: uploaded ${count}`);
    }
  }
  return { count, bytes };
}

loadEnv(ENV_FILE);

const childFiles = listJsonl(CHILD_DIR, 'child-report-cache-');
const parentFiles = listJsonl(PARENT_DIR, 'parent-saju-cache-');
const childTarget = Number.isFinite(LIMIT) ? Math.ceil(LIMIT / 2) : Infinity;
const parentTarget = Number.isFinite(LIMIT) ? LIMIT - childTarget : Infinity;

const child = await uploadFromFiles(childFiles, 'child', childObjectKey, childTarget);
const parent = await uploadFromFiles(parentFiles, 'parent', parentObjectKey, parentTarget);

console.log(JSON.stringify({
  ok: true,
  prefix: PREFIX,
  uploaded: {
    child: child.count,
    parent: parent.count,
    total: child.count + parent.count,
  },
  bytes: child.bytes + parent.bytes,
  bucket: process.env.R2_BUCKET,
}, null, 2));
