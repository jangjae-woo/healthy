import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const blockRoot = path.join(root, "아이기질브라덜", "claude-code-sample10-package", "output-blocks");
const auditPath = path.join(root, "아이기질브라덜", "cache-schema", "youa-v1-text-safety-audit.v1.json");
const sampleIds = ["sample-001", "sample-002", "sample-003", "sample-004"];

const errorPatterns = [
  { id: "undefined", re: /\bundefined\b/i },
  { id: "null-text", re: /\bnull\b/i },
  { id: "nan", re: /\bNaN\b/ },
  { id: "object-object", re: /\[object Object\]/ },
  { id: "child-placeholder", re: /\bchild\d*\b/i },
  { id: "diagnosis", re: /장애|ADHD|자폐|우울증|불안장애|치료해야|진단/ },
  { id: "parent-blame", re: /부모 탓|엄마 탓|아빠 탓|잘못 키웠|양육 실패|문제 부모/ },
  { id: "child-label", re: /문제아|나쁜 아이|고집불통|못 고친|원래 안 되는/ },
  { id: "fatalistic", re: /반드시 그렇게 된다|절대 못 바꾼다|궁합이 나쁘다|사주상 안 좋다/ },
];

const warningPatterns = [
  { id: "strong-command", re: /무조건|반드시|절대로/ },
  { id: "too-short", test: (text) => text.trim().length > 0 && text.trim().length < 18 },
  { id: "possible-raw-role", re: /\bmother\b|\bfather\b/i },
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function collectTexts(value, pathParts = [], out = []) {
  if (typeof value === "string") {
    out.push({ path: pathParts.join("."), text: value });
  } else if (Array.isArray(value)) {
    value.forEach((item, index) => collectTexts(item, [...pathParts, String(index)], out));
  } else if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, item]) => collectTexts(item, [...pathParts, key], out));
  }
  return out;
}

function isUserFacingTextPath(pathName) {
  return [
    ".whyIntro",
    ".whyMakerItems.",
    ".whySuppressorItems.",
    ".whyDetailBody.",
    ".dailyBody",
    ".parentingTipTime.title",
    ".parentingTipTime.body",
    ".parentingTipCommunication.title",
    ".parentingTipCommunication.body",
    ".parentingTipEnvironment.title",
    ".parentingTipEnvironment.body",
    ".parentSajuBody",
    ".parentSajuBridge",
    ".paragraphs.",
    ".daily",
    ".parentPalaceSummary.paragraphs.",
    "SynergyBody.",
    "SynergyDaily.",
    "ConflictBody.",
    "ConflictDaily.",
    "ConflictResolution",
  ].some((token) => pathName.includes(token));
}

function checkText(text) {
  const errors = errorPatterns.filter((item) => item.re.test(text)).map((item) => item.id);
  const warnings = warningPatterns
    .filter((item) => (item.test ? item.test(text) : item.re.test(text)))
    .map((item) => item.id);
  return { errors, warnings };
}

const audit = {
  version: "youa-v1-text-safety-audit-v1",
  generatedAt: new Date().toISOString(),
  summary: {
    ok: true,
    samples: sampleIds.length,
    textCount: 0,
    errors: 0,
    warnings: 0,
  },
  samples: [],
};

for (const sampleId of sampleIds) {
  const sampleDir = path.join(blockRoot, sampleId);
  const files = ["standalone-blocks.json", "pair-generation-input.json", "pair-generation-output.json"];
  const sample = { sampleId, ok: true, textCount: 0, errors: [], warnings: [] };

  for (const file of files) {
    const json = readJson(path.join(sampleDir, file));
    for (const item of collectTexts(json, [file])) {
      if (!isUserFacingTextPath(item.path)) continue;
      sample.textCount += 1;
      const result = checkText(item.text);
      for (const error of result.errors) sample.errors.push({ file, path: item.path, error, text: item.text.slice(0, 120) });
      for (const warning of result.warnings) sample.warnings.push({ file, path: item.path, warning, text: item.text.slice(0, 120) });
    }
  }

  sample.ok = sample.errors.length === 0;
  audit.summary.textCount += sample.textCount;
  audit.samples.push(sample);
}

audit.summary.errors = audit.samples.reduce((sum, sample) => sum + sample.errors.length, 0);
audit.summary.warnings = audit.samples.reduce((sum, sample) => sum + sample.warnings.length, 0);
audit.summary.ok = audit.summary.errors === 0;
writeJson(auditPath, audit);

for (const sample of audit.samples) {
  console.log(`${sample.ok ? "OK" : "FAIL"} ${sample.sampleId} texts=${sample.textCount} errors=${sample.errors.length} warnings=${sample.warnings.length}`);
}
console.log(`YOUA_TEXT_SAFETY ok=${audit.summary.ok} errors=${audit.summary.errors} warnings=${audit.summary.warnings}`);
console.log(path.relative(root, auditPath));

if (!audit.summary.ok) process.exitCode = 1;
