import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const blockRoot = path.join(root, "아이기질브라덜", "claude-code-sample10-package", "output-blocks");
const previewDir = path.join(root, "아이기질브라덜", "v1-block-preview");
const sampleIds = ["sample-001", "sample-002", "sample-003", "sample-004"];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
}

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function arr(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function textBlock(value) {
  if (value == null) return "";
  if (typeof value === "string") return `<p>${esc(value)}</p>`;
  if (Array.isArray(value)) return value.map((item) => `<p>${esc(item)}</p>`).join("");
  if (typeof value === "object" && Array.isArray(value.paragraphs)) {
    return value.paragraphs.map((item) => `<p>${esc(item)}</p>`).join("");
  }
  if (typeof value === "object" && typeof value.text === "string") return `<p>${esc(value.text)}</p>`;
  return `<pre>${esc(JSON.stringify(value, null, 2))}</pre>`;
}

function renderTip(tip) {
  return `
    <div class="tip">
      <b>${esc(tip?.title)}</b>
      <p>${esc(tip?.body)}</p>
    </div>
  `;
}

function renderInfluenceList(title, items, kind) {
  const values = arr(items).filter((item) => String(item ?? "").trim().length > 0);
  if (values.length === 0) return "";
  return `
    <div class="influence ${kind}">
      <b>${esc(title)}</b>
      <ul>
        ${values.map((item) => `<li>${esc(item)}</li>`).join("")}
      </ul>
    </div>
  `;
}

function renderFactorReason(factor) {
  const maker = renderInfluenceList("만드는 기운", factor?.whyMakerItems, "maker");
  const suppressor = renderInfluenceList("누르는 기운", factor?.whySuppressorItems, "suppressor");
  const detail = textBlock(factor?.whyDetailBody);
  if (!maker && !suppressor && !detail) return "";
  return `
    <div class="reason-box">
      ${(maker || suppressor) ? `<div class="influence-grid">${maker}${suppressor}</div>` : ""}
      ${detail ? `<div class="reason-detail">${detail}</div>` : ""}
    </div>
  `;
}

function renderFactor(name, factor) {
  return `
    <section class="page">
      <div class="eyebrow">아이 6요인</div>
      <h2>${esc(name)}</h2>
      <h3>왜 이런 결인가</h3>
      ${textBlock(factor?.whyIntro)}
      ${renderFactorReason(factor)}
      <h3>일상에서 보이는 모습</h3>
      ${textBlock(factor?.dailyBody)}
      <h3>양육 Tip</h3>
      <div class="tips">
        ${renderTip(factor?.parentingTipTime)}
        ${renderTip(factor?.parentingTipCommunication)}
        ${renderTip(factor?.parentingTipEnvironment)}
      </div>
    </section>
  `;
}

function renderParent(title, parent) {
  return `
    <section class="page">
      <div class="eyebrow">부모 단독 사주</div>
      <h2>${esc(title)}</h2>
      ${textBlock(parent?.parentSajuBody)}
      <div class="bridge">${textBlock(parent?.parentSajuBridge)}</div>
    </section>
  `;
}

function renderCompatibility(title, value) {
  return `
    <section class="page">
      <div class="eyebrow">부모-아이 궁합</div>
      <h2>${esc(title)}</h2>
      <div class="mini">${esc(value?.relationType ?? "")}</div>
      ${textBlock(value?.paragraphs)}
      ${value?.daily ? `<div class="daily"><b>일상에서</b>${textBlock(value.daily)}</div>` : ""}
    </section>
  `;
}

function renderParentPalace(value) {
  return `
    <section class="page important">
      <div class="eyebrow">아이 사주 안의 부모 자리</div>
      <h2>부모의 결이 아이에게 닿는 방식</h2>
      <div class="mini">${esc(value?.cacheKey ?? "")}</div>
      ${textBlock(value)}
    </section>
  `;
}

function renderMatrix(roleTitle, role, value) {
  const items = [
    { kind: "synergy", title: `${roleTitle} 시너지`, body: value?.[`${role}SynergyBody`], daily: value?.[`${role}SynergyDaily`] },
    { kind: "conflict", title: `${roleTitle} 충돌`, body: value?.[`${role}ConflictBody`], daily: value?.[`${role}ConflictDaily`], resolution: value?.[`${role}ConflictResolution`] },
  ].filter((item) => arr(item.body).length > 0);

  return `
    <section class="page">
      <div class="eyebrow">함께 살펴줄 결</div>
      <h2>${esc(roleTitle)}</h2>
      ${items.map((item) => `
        <div class="matrix ${item.kind}">
          <h3>${esc(item.title)}</h3>
          ${textBlock(item.body)}
          ${arr(item.daily).length ? `<div class="daily"><b>일상 예시</b>${textBlock(item.daily)}</div>` : ""}
          ${item.resolution ? `<div class="resolve">${esc(item.resolution)}</div>` : ""}
        </div>
      `).join("")}
    </section>
  `;
}

function renderSample(sampleId) {
  const sampleDir = path.join(blockRoot, sampleId);
  const manifest = readJson(path.join(sampleDir, "block-manifest.json"));
  const standalone = readJson(path.join(sampleDir, "standalone-blocks.json"));
  const pairInput = readJson(path.join(sampleDir, "pair-generation-input.json"));
  const pairOutput = readJson(path.join(sampleDir, "pair-generation-output.json"));

  const html = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(sampleId)} 아이기질+부모양육 v1</title>
  <link rel="stylesheet" href="./style.css" />
</head>
<body>
  <main class="wrap">
    <section class="cover">
      <a href="./index.html">← 목록</a>
      <div class="sample">${esc(sampleId)}</div>
      <h1>아이기질+부모양육 v1</h1>
      <p>${esc(manifest.child?.name)} · ${esc(pairInput.child?.ageText ?? "")}</p>
      <p>${esc(manifest.mother?.name)} / ${esc(manifest.father?.name)}</p>
    </section>
    <section class="page compact">
      <div class="eyebrow">QA 상태</div>
      <h2>블록 상태</h2>
      <p>missingBlocks: ${esc(manifest.missingBlocks?.length ?? 0)}</p>
      <p>filledBlocks: ${esc(manifest.filledBlocks?.length ?? 0)}</p>
      ${arr(manifest.warnings).map((warning) => `<p class="warn">${esc(warning)}</p>`).join("")}
    </section>
    ${Object.entries(standalone.factors ?? {}).map(([name, factor]) => renderFactor(name, factor)).join("")}
    ${renderParent("어머님", standalone.parents?.mother)}
    ${renderParent("아버님", standalone.parents?.father)}
    ${renderCompatibility("어머님과 아이", pairOutput.compatibility?.motherChildCompatibility)}
    ${renderCompatibility("아버님과 아이", pairOutput.compatibility?.fatherChildCompatibility)}
    ${renderParentPalace(pairOutput.compatibility?.parentPalaceSummary)}
    ${renderMatrix("어머님", "mother", pairOutput.togetherMatrix?.mother)}
    ${renderMatrix("아버님", "father", pairOutput.togetherMatrix?.father)}
  </main>
</body>
</html>`;

  writeFile(path.join(previewDir, `${sampleId}.html`), html);
}

const index = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>아이기질+부모양육 v1 블록 미리보기</title>
  <link rel="stylesheet" href="./style.css" />
</head>
<body>
  <main class="wrap">
    <section class="cover">
      <div class="sample">진행률 72%</div>
      <h1>아이기질+부모양육 v1 블록 미리보기</h1>
      <p>형 검수 전 내부 확인용. parentPalaceSummary 보완 반영본.</p>
      <div class="links">
        ${sampleIds.map((sampleId) => `<a href="./${sampleId}.html">${sampleId}</a>`).join("")}
      </div>
    </section>
  </main>
</body>
</html>`;

const css = `
body{margin:0;background:#eee8df;color:#342b25;font-family:Georgia,'Times New Roman','Noto Serif KR',serif}
.wrap{max-width:820px;margin:0 auto;padding:18px 12px 48px}
.cover,.page{background:#fffdf9;border:1px solid #e7d8c9;border-radius:8px;margin:0 0 14px;padding:22px 20px;box-shadow:0 2px 10px rgba(45,32,22,.06)}
.cover{min-height:240px;display:flex;flex-direction:column;justify-content:center;text-align:center;background:#fff7ed}
.cover a{color:#8a6332;text-decoration:none}
.sample,.eyebrow,.mini{font-family:Arial,'Noto Sans KR',sans-serif;color:#8a7565;font-size:12px}
h1{margin:12px 0 16px;font-size:30px;line-height:1.25}
h2{margin:6px 0 14px;font-size:21px;color:#c84d20}
h3{margin:18px 0 8px;font-size:15px;color:#8a6332}
p,li{font-size:14px;line-height:1.85}
pre{white-space:pre-wrap;background:#f7f1ea;border-radius:8px;padding:12px;font-size:12px}
.tips{display:grid;gap:10px}
.tip,.daily,.bridge{background:#f7f1ea;border-left:3px solid #c8a47f;border-radius:8px;padding:10px 12px;margin:10px 0}
.tip{background:#f5f8e8;border-left-color:#95c540}
.reason-box{background:#fffaf5;border:1px solid #ead8c8;border-radius:8px;margin:12px 0 16px;padding:12px}
.influence-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px}
.influence{border-radius:8px;padding:10px 12px;background:#f8f5ef;border-left:3px solid #a8bf4a}
.influence.suppressor{border-left-color:#dc704c;background:#fff3ee}
.influence ul{margin:8px 0 0 18px;padding:0}
.influence li{font-size:13px;line-height:1.6}
.reason-detail{border-top:1px solid #ead8c8;margin-top:10px;padding-top:8px}
.important{border-color:#d8b98f;background:#fffaf2}
.matrix{border-left:4px solid #d7ad32;background:#fff8e1;border-radius:8px;padding:12px 14px;margin:10px 0}
.matrix.conflict{border-left-color:#8a8a9e;background:#f5f5f7}
.resolve{margin-top:10px;background:#edf6dd;color:#55752a;border-left:3px solid #95c540;border-radius:7px;padding:10px 12px;font-size:13px;line-height:1.7}
.links{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-top:20px}
.links a{display:block;background:#6d6259;color:white;text-decoration:none;border-radius:7px;padding:10px 12px;font-family:Arial,'Noto Sans KR',sans-serif}
.warn{color:#9a5b23}
@media(max-width:560px){.wrap{padding:10px 8px 32px}.cover,.page{padding:18px 15px}h1{font-size:25px}.influence-grid{grid-template-columns:1fr}}
`;

fs.rmSync(previewDir, { recursive: true, force: true });
writeFile(path.join(previewDir, "style.css"), css);
writeFile(path.join(previewDir, "index.html"), index);
for (const sampleId of sampleIds) renderSample(sampleId);

writeFile(path.join(previewDir, "preview-report.json"), `${JSON.stringify({
  version: "youa-v1-block-preview-report-v1",
  generatedAt: new Date().toISOString(),
  sampleCount: sampleIds.length,
  indexPath: path.join(previewDir, "index.html"),
  samples: sampleIds.map((sampleId) => ({ sampleId, path: path.join(previewDir, `${sampleId}.html`) })),
}, null, 2)}\n`);

console.log(`Wrote ${path.join(previewDir, "index.html")} with ${sampleIds.length} samples`);
