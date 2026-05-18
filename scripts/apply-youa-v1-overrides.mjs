import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const blockRoot = path.join(root, "아이기질브라덜", "claude-code-sample10-package", "output-blocks");
const overrideRoot = path.join(root, "아이기질브라덜", "overrides", "v1");
const auditPath = path.join(root, "아이기질브라덜", "cache-schema", "youa-v1-override-apply-audit.v1.json");
const sampleIds = ["sample-001", "sample-002", "sample-003", "sample-004"];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function setPath(target, pathName, text) {
  const parts = pathName.split(".");
  const rootKey = parts.shift();
  if (rootKey !== "standalone" && rootKey !== "pair") throw new Error(`unsupported override root: ${pathName}`);
  let current = target[rootKey];
  for (let i = 0; i < parts.length - 1; i += 1) {
    current = current?.[parts[i]];
    if (current == null) throw new Error(`override path not found: ${pathName}`);
  }
  const key = parts.at(-1);
  const existing = current?.[key];
  if (Array.isArray(existing)) current[key] = text.split(/\n+/).map((item) => item.trim()).filter(Boolean);
  else if (existing && typeof existing === "object" && Array.isArray(existing.paragraphs)) current[key] = { ...existing, paragraphs: text.split(/\n+/).map((item) => item.trim()).filter(Boolean) };
  else current[key] = text;
}

const audit = {
  version: "youa-v1-override-apply-audit-v1",
  generatedAt: new Date().toISOString(),
  summary: { samples: sampleIds.length, applied: 0, errors: 0 },
  samples: [],
};

for (const sampleId of sampleIds) {
  const sample = { sampleId, overridesPath: null, applied: 0, errors: [] };
  const overridesPath = path.join(overrideRoot, sampleId, "overrides.json");
  sample.overridesPath = path.relative(root, overridesPath);
  if (!fs.existsSync(overridesPath)) {
    audit.samples.push(sample);
    continue;
  }

  try {
    const standalonePath = path.join(blockRoot, sampleId, "standalone-blocks.json");
    const pairPath = path.join(blockRoot, sampleId, "pair-generation-output.json");
    const standalone = readJson(standalonePath);
    const pair = readJson(pairPath);
    const overrides = readJson(overridesPath);
    const target = { standalone, pair };

    for (const [key, item] of Object.entries(overrides.editable ?? {})) {
      const text = String(item?.text ?? "").trim();
      if (!text) continue;
      setPath(target, item.path ?? key, text);
      sample.applied += 1;
    }

    writeJson(standalonePath, standalone);
    writeJson(pairPath, pair);
  } catch (error) {
    sample.errors.push(error instanceof Error ? error.message : String(error));
  }

  audit.summary.applied += sample.applied;
  audit.samples.push(sample);
}

audit.summary.errors = audit.samples.reduce((sum, sample) => sum + sample.errors.length, 0);
writeJson(auditPath, audit);
for (const sample of audit.samples) console.log(`${sample.errors.length ? "FAIL" : "OK"} ${sample.sampleId} applied=${sample.applied}`);
console.log(`YOUA_OVERRIDES applied=${audit.summary.applied} errors=${audit.summary.errors}`);
console.log(path.relative(root, auditPath));
if (audit.summary.errors > 0) process.exitCode = 1;
