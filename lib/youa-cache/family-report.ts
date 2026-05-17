import crypto from "node:crypto";
import { buildFacts } from "../youa-engine/youa/facts-builder.mjs";
import { mockLLMResponse } from "../youa-engine/youa/mock-llm.mjs";
import { parseLLMOutput, attachLLMTextToFacts } from "../youa-engine/youa/output-parser.mjs";
import { validateLLMOutput } from "../youa-engine/youa/output-validator.mjs";
import { renderReport } from "../youa-engine/youa/render.mjs";

type Gender = "female" | "male";
type ParentRole = "mother" | "father";

export type YouaChildInput = {
  name?: string;
  birthDate: string;
  gender: Gender;
  hour: string;
};

export type YouaParentInput = {
  name?: string;
  birthDate: string;
  hour: string;
};

export type YouaFamilyReportInput = {
  child: YouaChildInput;
  mother: YouaParentInput;
  father: YouaParentInput;
};

const CACHE_SOURCE = process.env.YOUA_CACHE_SOURCE ?? "local";
const R2_PREFIX = process.env.R2_PREFIX ?? "youa-cache/v1";

function normalizeHour(hour: string) {
  return hour.trim();
}

function hourKey(hour: string) {
  const normalized = normalizeHour(hour);
  if (normalized === "시간 모름") return "unknown-hour";
  return normalized.replace(/\s+/g, "").replace(/[():~]/g, "-");
}

function childCacheKey(input: YouaChildInput) {
  return `${input.birthDate}_${input.gender}_${hourKey(input.hour)}`;
}

function parentCacheKey(role: ParentRole, input: YouaParentInput) {
  return `${role}_${input.birthDate}_${hourKey(input.hour)}`;
}

function hmac(key: crypto.BinaryLike | crypto.KeyObject, value: string): Buffer;
function hmac(key: crypto.BinaryLike | crypto.KeyObject, value: string, encoding: crypto.BinaryToTextEncoding): string;
function hmac(key: crypto.BinaryLike | crypto.KeyObject, value: string, encoding?: crypto.BinaryToTextEncoding): Buffer | string {
  const digest = crypto.createHmac("sha256", key).update(value);
  return encoding ? digest.digest(encoding) : digest.digest();
}

function sha256(value: crypto.BinaryLike, encoding: crypto.BinaryToTextEncoding = "hex") {
  return crypto.createHash("sha256").update(value).digest(encoding);
}

function amzDate(date: Date) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

function dateStamp(date: Date) {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

function signingKey(secret: string, date: string, region: string, service: string) {
  const kDate = hmac(`AWS4${secret}`, date);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, "aws4_request");
}

function r2SignedHeaders(method: string, url: URL, body = Buffer.alloc(0)) {
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) {
    throw new Error("Missing R2 credentials");
  }
  const now = new Date();
  const date = dateStamp(now);
  const amz = amzDate(now);
  const region = "auto";
  const service = "s3";
  const payloadHash = sha256(body);
  const canonicalHeaders = [
    `host:${url.host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amz}`,
  ].join("\n") + "\n";
  const signedHeaderNames = "host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = [
    method,
    url.pathname,
    "",
    canonicalHeaders,
    signedHeaderNames,
    payloadHash,
  ].join("\n");
  const scope = `${date}/${region}/${service}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amz,
    scope,
    sha256(canonicalRequest),
  ].join("\n");
  const signature = hmac(signingKey(secretAccessKey, date, region, service), stringToSign, "hex");
  return {
    authorization: `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${scope}, SignedHeaders=${signedHeaderNames}, Signature=${signature}`,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amz,
  };
}

function childR2ObjectKey(key: string, birthDate: string) {
  const [year, month] = birthDate.split("-");
  return `${R2_PREFIX}/child/${year}/${month}/${encodeURIComponent(key)}.json`;
}

function parentR2ObjectKey(role: ParentRole, key: string, birthDate: string) {
  const [year, month] = birthDate.split("-");
  return `${R2_PREFIX}/parent/${role}/${year}/${month}/${encodeURIComponent(key)}.json`;
}

async function readR2Json(objectKey: string) {
  const endpoint = process.env.R2_ENDPOINT;
  const bucket = process.env.R2_BUCKET;
  if (!endpoint || !bucket) throw new Error("Missing R2 endpoint or bucket");
  const url = new URL(`${endpoint.replace(/\/$/, "")}/${bucket}/${objectKey}`);
  const res = await fetch(url, {
    method: "GET",
    headers: r2SignedHeaders("GET", url),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`R2 read failed: ${objectKey}: ${res.status} ${res.statusText} ${text.slice(0, 300)}`);
  }
  return JSON.parse(text);
}

async function readChild(input: YouaChildInput) {
  const key = childCacheKey(input);
  if (CACHE_SOURCE === "r2") {
    const record = await readR2Json(childR2ObjectKey(key, input.birthDate));
    if (!record.childSaju) throw new Error(`child R2 record has no childSaju: ${key}`);
    record.childSaju.child.name = input.name || "child";
    record.childSaju.child.gender = input.gender;
    return { key, record, childSaju: record.childSaju };
  }

  throw new Error("YOUA_CACHE_SOURCE must be r2 in the deployed API");
}

async function readParent(role: ParentRole, input: YouaParentInput) {
  const key = parentCacheKey(role, input);
  if (CACHE_SOURCE === "r2") {
    const record = await readR2Json(parentR2ObjectKey(role, key, input.birthDate));
    if (!record.parentSaju) throw new Error(`parent R2 record has no parentSaju: ${key}`);
    record.parentSaju.parent.name = input.name || role;
    record.parentSaju.parent.role = role;
    return { key, record, parentSaju: record.parentSaju };
  }

  throw new Error("YOUA_CACHE_SOURCE must be r2 in the deployed API");
}

export async function assembleYouaFamilyReport(input: YouaFamilyReportInput) {
  const [child, mother, father] = await Promise.all([
    readChild(input.child),
    readParent("mother", input.mother),
    readParent("father", input.father),
  ]);

  const facts = buildFacts({
    childSaju: child.childSaju,
    motherSaju: mother.parentSaju,
    fatherSaju: father.parentSaju,
    testDate: new Date().toISOString().slice(0, 10),
  });
  const parsed = parseLLMOutput(mockLLMResponse(facts));
  const validation = validateLLMOutput(parsed, facts);
  const finalFacts = attachLLMTextToFacts(facts, parsed);
  const html = renderReport(finalFacts);

  return {
    ok: validation.valid,
    validation,
    cacheKeys: {
      child: child.key,
      mother: mother.key,
      father: father.key,
    },
    summary: {
      child: {
        ilgan: child.childSaju.ilgan,
        animal: facts.animal?.name,
        animalCase: facts.animal?.case,
      },
      pageCount: facts.meta?.reportPageCount,
    },
    facts: finalFacts,
    html,
  };
}
