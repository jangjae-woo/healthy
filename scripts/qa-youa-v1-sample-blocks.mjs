import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const baseDir = path.join(root, "아이기질브라덜", "claude-code-sample10-package", "output-blocks");
const auditPath = path.join(root, "아이기질브라덜", "cache-schema", "youa-v1-sample-blocks-audit.v1.json");
const missingPolicyPath = path.join(root, "아이기질브라덜", "cache-schema", "youa-v1-allowed-missing-policy.v1.json");
const sampleIds = ["sample-001", "sample-002", "sample-003", "sample-004"];

const standaloneFactorBlockKeys = [
  "whyIntro",
  "whyMakerItems",
  "whySuppressorItems",
  "whyDetailBody",
  "dailyBody",
  "parentingTipTime",
  "parentingTipCommunication",
  "parentingTipEnvironment",
];

const pairCompatibilityKeys = [
  "motherChildCompatibility",
  "fatherChildCompatibility",
  "parentPalaceSummary",
];

const matrixKeys = [
  "motherSynergyBody",
  "motherSynergyDaily",
  "motherConflictBody",
  "motherConflictDaily",
  "motherConflictResolution",
  "fatherSynergyBody",
  "fatherSynergyDaily",
  "fatherConflictBody",
  "fatherConflictDaily",
  "fatherConflictResolution",
];

const forbiddenTextPatterns = [
  /\bundefined\b/i,
  /\bNaN\b/,
  /\[object Object\]/,
  /\bchild0\b/i,
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function rel(filePath) {
  return path.relative(root, filePath);
}

function exists(filePath) {
  return fs.existsSync(filePath);
}

function textValues(value, out = []) {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((item) => textValues(item, out));
  else if (value && typeof value === "object") Object.values(value).forEach((item) => textValues(item, out));
  return out;
}

function hasValue(value) {
  if (value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
}

function missingManifestPaths(manifest) {
  return new Set((manifest?.missingBlocks ?? []).map((item) => item.path));
}

function policyRegex(pattern) {
  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, "[^.]+");
  return new RegExp(`^${escaped}$`);
}

function loadMissingPolicy() {
  if (!exists(missingPolicyPath)) return [];
  return readJson(missingPolicyPath).policy.map((item) => ({
    ...item,
    regex: policyRegex(item.pathPattern),
  }));
}

function classifyMissing(policy, missingPath) {
  const hit = policy.find((item) => item.regex.test(missingPath));
  if (!hit) return null;
  return {
    classification: hit.classification,
    severity: hit.severity,
    requiredBeforePaid: hit.requiredBeforePaid === true,
  };
}

function matrixPath(role, key) {
  if (key.startsWith(role)) {
    const shortKey = key.replace(role, "");
    return `togetherMatrix.${role}.${role}${shortKey}`;
  }
  return `togetherMatrix.${role}.${key}`;
}

const audit = {
  version: "youa-v1-sample-blocks-audit-v1",
  generatedAt: new Date().toISOString(),
  progress: {
    currentPercent: 72,
    reason: "parentPalaceSummary fallback 보완 후 샘플 block 산출물의 구조 QA를 통과한 상태.",
  },
  summary: {
    ok: true,
    samples: sampleIds.length,
    errors: 0,
    warnings: 0,
    productFallbacks: 0,
    allowedMissing: 0,
  },
  samples: [],
};

const missingPolicy = loadMissingPolicy();

for (const sampleId of sampleIds) {
  const sampleDir = path.join(baseDir, sampleId);
  const files = {
    manifest: path.join(sampleDir, "block-manifest.json"),
    standalone: path.join(sampleDir, "standalone-blocks.json"),
    pairInput: path.join(sampleDir, "pair-generation-input.json"),
    pairOutput: path.join(sampleDir, "pair-generation-output.json"),
  };
  const sample = {
    sampleId,
    ok: true,
    files: Object.fromEntries(Object.entries(files).map(([key, filePath]) => [key, exists(filePath) ? rel(filePath) : null])),
    counts: {},
    errors: [],
    warnings: [],
  };

  for (const [key, filePath] of Object.entries(files)) {
    if (!exists(filePath)) sample.errors.push(`missing-file:${key}:${rel(filePath)}`);
  }

  if (sample.errors.length === 0) {
    const manifest = readJson(files.manifest);
    const standalone = readJson(files.standalone);
    const pairInput = readJson(files.pairInput);
    const pairOutput = readJson(files.pairOutput);
    const allowedMissing = missingManifestPaths(manifest);
    sample.productFallbacks = [];
    sample.allowedMissing = [];

    const factorNames = Object.keys(standalone.factors ?? {});
    sample.counts.factors = factorNames.length;
    if (factorNames.length !== 6) sample.errors.push(`standalone:factors-count:${factorNames.length}`);

    for (const factorName of factorNames) {
      const factor = standalone.factors[factorName];
      for (const blockKey of standaloneFactorBlockKeys) {
        if (!hasValue(factor?.[blockKey])) sample.errors.push(`standalone:missing-factor-block:${factorName}.${blockKey}`);
      }
    }

    for (const parentRole of ["mother", "father"]) {
      const parent = standalone.parents?.[parentRole];
      if (!hasValue(parent?.parentSajuBody)) sample.errors.push(`standalone:missing-parentSajuBody:${parentRole}`);
      if (!hasValue(parent?.parentSajuBridge)) sample.errors.push(`standalone:missing-parentSajuBridge:${parentRole}`);
    }

    if (!hasValue(pairInput.child?.scores) || Object.keys(pairInput.child.scores).length !== 6) {
      sample.errors.push("pair-input:child-scores-not-six");
    }

    for (const key of pairCompatibilityKeys) {
      const value = pairOutput.compatibility?.[key];
      const manifestPath = `compatibility.${key}`;
      if (!hasValue(value)) {
        const policyHit = classifyMissing(missingPolicy, manifestPath);
        if (policyHit?.classification === "fallback_required_for_product") {
          sample.productFallbacks.push(manifestPath);
          sample.warnings.push(`pair-output:product-fallback:${manifestPath}`);
        } else if (policyHit?.severity === "allowed" || allowedMissing.has(manifestPath)) {
          sample.allowedMissing.push(manifestPath);
          sample.warnings.push(`pair-output:allowed-missing:${manifestPath}`);
        } else {
          sample.errors.push(`pair-output:missing:${manifestPath}`);
        }
      }
    }

    for (const role of ["mother", "father"]) {
      const roleBlock = pairOutput.togetherMatrix?.[role] ?? {};
      for (const key of matrixKeys.filter((item) => item.startsWith(role))) {
        const value = roleBlock[key];
        const manifestPath = matrixPath(role, key);
        if (!hasValue(value)) {
          const policyHit = classifyMissing(missingPolicy, manifestPath);
          if (policyHit?.classification === "fallback_required_for_product") {
            sample.productFallbacks.push(manifestPath);
            sample.warnings.push(`matrix:product-fallback:${manifestPath}`);
          } else if (policyHit?.severity === "allowed" || allowedMissing.has(manifestPath)) {
            sample.allowedMissing.push(manifestPath);
            sample.warnings.push(`matrix:allowed-missing:${manifestPath}`);
          } else {
            sample.errors.push(`matrix:missing:${manifestPath}`);
          }
        }
      }

      const conflictBody = roleBlock[`${role}ConflictBody`];
      const conflictResolution = roleBlock[`${role}ConflictResolution`];
      if (hasValue(conflictResolution) && !hasValue(conflictBody)) {
        sample.errors.push(`matrix:resolution-without-conflict:${role}`);
      }
    }

    const allTexts = [
      ...textValues(manifest),
      ...textValues(standalone),
      ...textValues(pairInput),
      ...textValues(pairOutput),
    ];
    for (const pattern of forbiddenTextPatterns) {
      const hit = allTexts.find((text) => pattern.test(text));
      if (hit) sample.errors.push(`forbidden-text:${pattern}:${hit.slice(0, 80)}`);
    }

    sample.counts.manifestMissingBlocks = manifest.missingBlocks?.length ?? 0;
    if ((manifest.warnings?.length ?? 0) > 0) {
      const unknownHourPolicy = classifyMissing(missingPolicy, "manifest.warning.unknown-hour");
      if (unknownHourPolicy?.severity === "allowed") {
        sample.allowedMissing.push("manifest.warning.unknown-hour");
        sample.warnings.push(`manifest:allowed-warning:unknown-hour:${manifest.warnings.length}`);
      } else {
        sample.warnings.push(`manifest:warnings:${manifest.warnings.length}`);
      }
    }
  }

  sample.ok = sample.errors.length === 0;
  audit.samples.push(sample);
}

audit.summary.errors = audit.samples.reduce((sum, sample) => sum + sample.errors.length, 0);
audit.summary.warnings = audit.samples.reduce((sum, sample) => sum + sample.warnings.length, 0);
audit.summary.productFallbacks = audit.samples.reduce((sum, sample) => sum + (sample.productFallbacks?.length ?? 0), 0);
audit.summary.allowedMissing = audit.samples.reduce((sum, sample) => sum + (sample.allowedMissing?.length ?? 0), 0);
audit.summary.ok = audit.summary.errors === 0;

writeJson(auditPath, audit);

for (const sample of audit.samples) {
  console.log(
    `${sample.ok ? "OK" : "FAIL"} ${sample.sampleId} factors=${sample.counts.factors ?? "-"} missing=${sample.counts.manifestMissingBlocks ?? "-"} fallback=${sample.productFallbacks?.length ?? 0} allowed=${sample.allowedMissing?.length ?? 0} errors=${sample.errors.length} warnings=${sample.warnings.length}`,
  );
}
console.log(`YOUA_SAMPLE_BLOCKS ok=${audit.summary.ok} errors=${audit.summary.errors} warnings=${audit.summary.warnings} productFallbacks=${audit.summary.productFallbacks} allowedMissing=${audit.summary.allowedMissing}`);
console.log(rel(auditPath));

if (!audit.summary.ok) {
  process.exitCode = 1;
}
