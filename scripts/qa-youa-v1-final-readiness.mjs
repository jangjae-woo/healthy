import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const youaRoot = path.join(root, '아이기질브라덜');
const sampleRoot = path.join(youaRoot, 'claude-code-sample10-package', 'output-blocks');
const previewRoot = path.join(youaRoot, 'v1-block-preview');
const overrideRoot = path.join(youaRoot, 'overrides', 'v1');
const auditRoot = path.join(youaRoot, 'cache-schema');
const outPath = path.join(auditRoot, 'youa-v1-final-readiness-audit.v1.json');

const samples = ['sample-001', 'sample-002', 'sample-003', 'sample-004'];
const requiredSampleFiles = [
  'standalone-blocks.json',
  'pair-generation-input.json',
  'pair-generation-output.json',
  'block-manifest.json',
];

function exists(filePath) {
  return fs.existsSync(filePath);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function add(errors, warnings, level, code, message, filePath) {
  const item = { level, code, message, path: filePath };
  if (level === 'error') errors.push(item);
  else warnings.push(item);
}

const errors = [];
const warnings = [];
const sampleResults = [];

for (const sampleId of samples) {
  const sampleDir = path.join(sampleRoot, sampleId);
  const sampleResult = {
    sampleId,
    requiredFiles: [],
    previewHtml: path.join(previewRoot, `${sampleId}.html`),
    overrideTemplate: path.join(overrideRoot, sampleId, 'overrides.template.json'),
  };

  for (const fileName of requiredSampleFiles) {
    const filePath = path.join(sampleDir, fileName);
    const ok = exists(filePath);
    sampleResult.requiredFiles.push({ fileName, ok, path: filePath });
    if (!ok) add(errors, warnings, 'error', 'missing-sample-file', `${sampleId} missing ${fileName}`, filePath);
  }

  if (!exists(sampleResult.previewHtml)) {
    add(errors, warnings, 'error', 'missing-preview', `${sampleId} preview html missing`, sampleResult.previewHtml);
  }

  if (!exists(sampleResult.overrideTemplate)) {
    add(errors, warnings, 'error', 'missing-override-template', `${sampleId} override template missing`, sampleResult.overrideTemplate);
  } else {
    const template = readJson(sampleResult.overrideTemplate);
    const editableCount = template.editable && typeof template.editable === 'object' ? Object.keys(template.editable).length : 0;
    sampleResult.overrideEditableCount = editableCount;
    if (editableCount < 30) {
      add(warnings, warnings, 'warning', 'low-editable-count', `${sampleId} override editable count is ${editableCount}`, sampleResult.overrideTemplate);
    }
  }

  sampleResults.push(sampleResult);
}

const auditChecks = [
  {
    name: 'factor-reason-detail',
    path: path.join(auditRoot, 'youa-v1-factor-reason-detail-audit.v1.json'),
    check(data) {
      return data.ok === true && Array.isArray(data.samples) && data.samples.length === 4
        && data.samples.every((sample) => sample.ok === true && Array.isArray(sample.factors) && sample.factors.length === 6);
    },
    message: 'factor reason detail audit must cover four samples and six factors per sample',
  },
  {
    name: 'sample-blocks',
    path: path.join(auditRoot, 'youa-v1-sample-blocks-audit.v1.json'),
    check(data) {
      return data.summary?.ok === true && data.summary?.errors === 0 && data.summary?.productFallbacks === 0;
    },
    message: 'sample block QA must be ok with zero hard errors and zero product fallbacks',
  },
  {
    name: 'text-safety',
    path: path.join(auditRoot, 'youa-v1-text-safety-audit.v1.json'),
    check(data) {
      return data.summary?.ok === true && data.summary?.errors === 0;
    },
    message: 'text safety QA must be ok with zero hard errors',
  },
  {
    name: 'parent-palace-fill',
    path: path.join(auditRoot, 'youa-v1-parent-palace-fill-audit.v1.json'),
    check(data) {
      return data.summary?.ok === true && data.summary?.filled === 4 && data.summary?.errors === 0;
    },
    message: 'parent palace summary fill must cover four samples with zero errors',
  },
  {
    name: 'override-template',
    path: path.join(auditRoot, 'youa-v1-override-template-audit.v1.json'),
    check(data) {
      return Array.isArray(data.samples) && data.samples.length === 4 && data.samples.every((sample) => sample.editableCount >= 30);
    },
    message: 'override template audit must cover four samples with enough editable fields',
  },
  {
    name: 'override-apply',
    path: path.join(auditRoot, 'youa-v1-override-apply-audit.v1.json'),
    check(data) {
      return data.summary?.errors === 0;
    },
    message: 'override apply routine must run with zero errors',
  },
];

const auditResults = [];
for (const auditCheck of auditChecks) {
  const result = { name: auditCheck.name, path: auditCheck.path, ok: false };
  if (!exists(auditCheck.path)) {
    add(errors, warnings, 'error', 'missing-audit', `${auditCheck.name} audit missing`, auditCheck.path);
  } else {
    const data = readJson(auditCheck.path);
    result.ok = auditCheck.check(data);
    result.summary = {
      ok: data.ok ?? data.summary?.ok,
      totalErrors: data.totalErrors ?? data.summary?.errors,
      productFallbacks: data.productFallbacks ?? data.summary?.productFallbacks,
      filled: data.filled ?? data.summary?.filled,
      errors: data.errors ?? data.summary?.errors,
      applied: data.summary?.applied,
      samples: Array.isArray(data.samples) ? data.samples.length : undefined,
    };
    if (!result.ok) add(errors, warnings, 'error', 'audit-not-ready', auditCheck.message, auditCheck.path);
  }
  auditResults.push(result);
}

const previewIndex = path.join(previewRoot, 'index.html');
if (!exists(previewIndex)) {
  add(errors, warnings, 'error', 'missing-preview-index', 'preview index missing', previewIndex);
} else {
  const html = fs.readFileSync(previewIndex, 'utf8');
  for (const sampleId of samples) {
    if (!html.includes(`${sampleId}.html`)) {
      add(errors, warnings, 'error', 'preview-index-link-missing', `preview index missing link for ${sampleId}`, previewIndex);
    }
  }
}

const report = {
  version: 'youa-v1-final-readiness-audit-v1',
  generatedAt: new Date().toISOString(),
  ok: errors.length === 0,
  progress: errors.length === 0 ? 92 : 80,
  samples: sampleResults,
  audits: auditResults,
  errors,
  warnings,
};

fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');

for (const sample of sampleResults) {
  console.log(`OK ${sample.sampleId} editable=${sample.overrideEditableCount ?? 0}`);
}
console.log(`YOUA_FINAL_READINESS ok=${report.ok} progress=${report.progress} errors=${errors.length} warnings=${warnings.length}`);
console.log(path.relative(root, outPath));

if (!report.ok) process.exit(1);
