import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sampleBaseDir = path.join(root, "아이기질브라덜", "claude-code-sample10-package", "output-blocks");
const cachePath = path.join(root, "lib", "youa-engine", "youa", "block-cache-data", "parent-palace-blocks.json");
const auditPath = path.join(root, "아이기질브라덜", "cache-schema", "youa-v1-parent-palace-fill-audit.v1.json");
const sampleIds = ["sample-001", "sample-002", "sample-003", "sample-004"];

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

function relationToPalaceGroup(relationType) {
  const text = String(relationType ?? "");
  if (/같은|동기|비슷|거울/.test(text)) return "same";
  if (/받쳐|정인|편인|생|더해|부드러운|기운을 주고받/.test(text)) return "support";
  if (/표현|말|드러|풀어|식상/.test(text)) return "expression";
  if (/결과|기대|재성|성과|확인/.test(text)) return "result";
  if (/절제|정관|편관|극|정리|일깨우|비추|기준|경계/.test(text)) return "standard";
  return "same";
}

function loadParentPalaceBlocks() {
  const cache = readJson(cachePath);
  return new Map((cache.blocks ?? []).map((block) => [block.key, block]));
}

function removeParentPalaceMissing(manifest) {
  const before = manifest.missingBlocks?.length ?? 0;
  manifest.missingBlocks = (manifest.missingBlocks ?? []).filter(
    (item) => item.path !== "compatibility.parentPalaceSummary",
  );
  const removed = before - manifest.missingBlocks.length;
  manifest.filledBlocks ??= [];
  if (!manifest.filledBlocks.some((item) => item.path === "compatibility.parentPalaceSummary")) {
    manifest.filledBlocks.push({
      path: "compatibility.parentPalaceSummary",
      source: "lib/youa-engine/youa/block-cache-data/parent-palace-blocks.json",
      rule: "relationType -> parentPalace group fallback",
    });
  }
  return removed;
}

const blockMap = loadParentPalaceBlocks();
const audit = {
  version: "youa-v1-parent-palace-fill-audit-v1",
  generatedAt: new Date().toISOString(),
  summary: {
    ok: true,
    samples: sampleIds.length,
    filled: 0,
    errors: 0,
  },
  samples: [],
};

for (const sampleId of sampleIds) {
  const sampleDir = path.join(sampleBaseDir, sampleId);
  const pairInputPath = path.join(sampleDir, "pair-generation-input.json");
  const pairOutputPath = path.join(sampleDir, "pair-generation-output.json");
  const manifestPath = path.join(sampleDir, "block-manifest.json");
  const sample = {
    sampleId,
    ok: true,
    motherGroup: null,
    fatherGroup: null,
    cacheKey: null,
    filled: false,
    files: {
      pairInput: rel(pairInputPath),
      pairOutput: rel(pairOutputPath),
      manifest: rel(manifestPath),
    },
    errors: [],
  };

  try {
    const pairInput = readJson(pairInputPath);
    const pairOutput = readJson(pairOutputPath);
    const manifest = readJson(manifestPath);

    sample.motherGroup = relationToPalaceGroup(pairInput.relations?.motherChild?.relationType);
    sample.fatherGroup = relationToPalaceGroup(pairInput.relations?.fatherChild?.relationType);
    sample.cacheKey = `parentPalace|${sample.motherGroup}|${sample.fatherGroup}`;

    const block = blockMap.get(sample.cacheKey);
    if (!block?.parentPalaceSummary?.length) {
      throw new Error(`parent-palace block not found: ${sample.cacheKey}`);
    }

    pairOutput.compatibility ??= {};
    pairOutput.compatibility.parentPalaceSummary = {
      source: "parent-palace-block-cache",
      cacheKey: sample.cacheKey,
      motherGroup: sample.motherGroup,
      fatherGroup: sample.fatherGroup,
      paragraphs: block.parentPalaceSummary,
    };

    removeParentPalaceMissing(manifest);
    writeJson(pairOutputPath, pairOutput);
    writeJson(manifestPath, manifest);

    sample.filled = true;
    audit.summary.filled += 1;
  } catch (error) {
    sample.ok = false;
    sample.errors.push(error instanceof Error ? error.message : String(error));
  }

  audit.samples.push(sample);
}

audit.summary.errors = audit.samples.reduce((sum, sample) => sum + sample.errors.length, 0);
audit.summary.ok = audit.summary.errors === 0 && audit.summary.filled === sampleIds.length;
writeJson(auditPath, audit);

for (const sample of audit.samples) {
  console.log(
    `${sample.ok ? "OK" : "FAIL"} ${sample.sampleId} key=${sample.cacheKey ?? "-"} filled=${sample.filled}`,
  );
}
console.log(`YOUA_PARENT_PALACE_FILL ok=${audit.summary.ok} filled=${audit.summary.filled} errors=${audit.summary.errors}`);
console.log(rel(auditPath));

if (!audit.summary.ok) {
  process.exitCode = 1;
}
