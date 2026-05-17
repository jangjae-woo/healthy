import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const ENV_FILE = process.env.R2_ENV_FILE ?? path.resolve('.env.r2.local');

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
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

function signedHeaders({ method, url, body, accessKeyId, secretAccessKey }) {
  const now = new Date();
  const date = dateStamp(now);
  const amz = amzDate(now);
  const region = 'auto';
  const service = 's3';
  const payloadHash = sha256(body ?? Buffer.alloc(0));
  const host = url.host;
  const canonicalUri = encodeURI(url.pathname).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
  const canonicalQuery = [...url.searchParams.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  const canonicalHeaders = [
    `host:${host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amz}`,
  ].join('\n') + '\n';
  const signedHeaderNames = 'host;x-amz-content-sha256;x-amz-date';
  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQuery,
    canonicalHeaders,
    signedHeaderNames,
    payloadHash,
  ].join('\n');
  const scope = `${date}/${region}/${service}/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amz,
    scope,
    sha256(canonicalRequest),
  ].join('\n');
  const signature = hmac(signingKey(secretAccessKey, date, region, service), stringToSign, 'hex');
  return {
    authorization: `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${scope}, SignedHeaders=${signedHeaderNames}, Signature=${signature}`,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amz,
  };
}

async function r2Request({ method, key, body }) {
  const endpoint = process.env.R2_ENDPOINT;
  const bucket = process.env.R2_BUCKET;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
    throw new Error('Missing R2 env vars. Check .env.r2.local.');
  }
  const url = new URL(`${endpoint.replace(/\/$/, '')}/${bucket}/${key}`);
  const headers = signedHeaders({ method, url, body, accessKeyId, secretAccessKey });
  const res = await fetch(url, { method, headers, body });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${method} ${key} failed: ${res.status} ${res.statusText}\n${text.slice(0, 1000)}`);
  }
  return text;
}

loadEnv(ENV_FILE);

const key = `smoke-tests/${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
const body = Buffer.from(JSON.stringify({
  ok: true,
  createdAt: new Date().toISOString(),
  source: 'paljawon-r2-smoke-test',
}, null, 2));

await r2Request({ method: 'PUT', key, body });
const downloaded = await r2Request({ method: 'GET', key });
const parsed = JSON.parse(downloaded);

console.log(JSON.stringify({
  ok: parsed.ok === true,
  key,
  bytes: body.length,
  bucket: process.env.R2_BUCKET,
}, null, 2));
