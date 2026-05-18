import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const blockRoot = path.join(root, "아이기질브라덜", "claude-code-sample10-package", "output-blocks");
const overrideRoot = path.join(root, "아이기질브라덜", "overrides", "v1");
const auditPath = path.join(root, "아이기질브라덜", "cache-schema", "youa-v1-override-template-audit.v1.json");
const sampleIds = ["sample-001", "sample-002", "sample-003", "sample-004"];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function textOf(value) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.join("\n");
  if (typeof value === "object" && Array.isArray(value.paragraphs)) return value.paragraphs.join("\n");
  return JSON.stringify(value);
}

function editableText(title, pathName, currentText) {
  return {
    title,
    path: pathName,
    currentText,
    text: "",
    memo: "형 검수 후 바꿀 문장만 text에 입력. 비워두면 기존 문장 유지.",
  };
}

const audit = {
  version: "youa-v1-override-template-audit-v1",
  generatedAt: new Date().toISOString(),
  samples: [],
};

for (const sampleId of sampleIds) {
  const sampleDir = path.join(blockRoot, sampleId);
  const standalone = readJson(path.join(sampleDir, "standalone-blocks.json"));
  const pairOutput = readJson(path.join(sampleDir, "pair-generation-output.json"));
  const editable = {};

  for (const [factorName, factor] of Object.entries(standalone.factors ?? {})) {
    editable[`standalone.factors.${factorName}.whyIntro`] = editableText(`${factorName} 왜 이런 결인가`, `standalone.factors.${factorName}.whyIntro`, textOf(factor.whyIntro));
    editable[`standalone.factors.${factorName}.whyDetailBody`] = editableText(`${factorName} 사주 근거 상세문`, `standalone.factors.${factorName}.whyDetailBody`, textOf(factor.whyDetailBody));
    editable[`standalone.factors.${factorName}.dailyBody`] = editableText(`${factorName} 일상 본문`, `standalone.factors.${factorName}.dailyBody`, textOf(factor.dailyBody));
    editable[`standalone.factors.${factorName}.parentingTipTime.body`] = editableText(`${factorName} 시간 Tip`, `standalone.factors.${factorName}.parentingTipTime.body`, textOf(factor.parentingTipTime?.body));
    editable[`standalone.factors.${factorName}.parentingTipCommunication.body`] = editableText(`${factorName} 소통 Tip`, `standalone.factors.${factorName}.parentingTipCommunication.body`, textOf(factor.parentingTipCommunication?.body));
    editable[`standalone.factors.${factorName}.parentingTipEnvironment.body`] = editableText(`${factorName} 환경 Tip`, `standalone.factors.${factorName}.parentingTipEnvironment.body`, textOf(factor.parentingTipEnvironment?.body));
  }

  for (const role of ["mother", "father"]) {
    editable[`standalone.parents.${role}.parentSajuBody`] = editableText(`${role} 부모 사주 본문`, `standalone.parents.${role}.parentSajuBody`, textOf(standalone.parents?.[role]?.parentSajuBody));
    editable[`standalone.parents.${role}.parentSajuBridge`] = editableText(`${role} 부모 사주 연결`, `standalone.parents.${role}.parentSajuBridge`, textOf(standalone.parents?.[role]?.parentSajuBridge));
  }

  for (const key of ["motherChildCompatibility", "fatherChildCompatibility", "parentPalaceSummary"]) {
    const current = pairOutput.compatibility?.[key];
    editable[`pair.compatibility.${key}`] = editableText(`궁합 ${key}`, `pair.compatibility.${key}`, textOf(current?.paragraphs ?? current));
  }

  for (const role of ["mother", "father"]) {
    const matrix = pairOutput.togetherMatrix?.[role] ?? {};
    for (const key of [`${role}SynergyBody`, `${role}SynergyDaily`, `${role}ConflictBody`, `${role}ConflictDaily`, `${role}ConflictResolution`]) {
      if (matrix[key] == null) continue;
      editable[`pair.togetherMatrix.${role}.${key}`] = editableText(`함께 살펴줄 결 ${key}`, `pair.togetherMatrix.${role}.${key}`, textOf(matrix[key]));
    }
  }

  const template = {
    version: "youa-v1-overrides-template-v1",
    sampleId,
    note: "이 파일을 overrides.json으로 복사한 뒤 text만 수정한다. 점수/등급/관계판정/시너지-충돌 판정은 수정하지 않는다.",
    editable,
  };
  const templatePath = path.join(overrideRoot, sampleId, "overrides.template.json");
  writeJson(templatePath, template);
  audit.samples.push({ sampleId, editableCount: Object.keys(editable).length, templatePath: path.relative(root, templatePath) });
}

writeJson(auditPath, audit);
for (const item of audit.samples) console.log(`OK ${item.sampleId} editable=${item.editableCount}`);
console.log(path.relative(root, auditPath));
