import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const youaRoot = path.join(root, "아이기질브라덜");
const cacheRoot = path.join(youaRoot, "block-cache-v1", "cache");
const outDir = path.join(youaRoot, "v1-combo-index");

const comboFiles = [
  {
    file: "factor-combo-blocks.json",
    label: "아이 6요소 기본 조합",
    description: "요인 x 점수구간 x 만드는 기운 그룹 x 누르는 기운 그룹",
    dimensions: ["factor", "level", "dominantSide", "makerGroup.label", "suppressorGroup.label"],
  },
  {
    file: "factor-cause-blocks.json",
    label: "아이 6요소 원인 조합",
    description: "요인 x 점수구간 x 만드는 원인 x 누르는 원인",
    dimensions: ["factor", "level", "makerCause", "suppressorCause"],
  },
  {
    file: "parent-cause-blocks.json",
    label: "부모 단독 사주 원인 조합",
    description: "엄마/아빠 x 일간 x 부모축 x 원인",
    dimensions: ["role", "dayMaster", "axis", "cause"],
  },
  {
    file: "compatibility-cause-blocks.json",
    label: "아이-부모 궁합 원인 조합",
    description: "엄마/아빠 x 아이 일간 x 부모 일간 x 관계패턴 x 케어/위험/아이기질 패턴",
    dimensions: ["role", "childIlgan", "parentIlgan", "relationType", "relationPattern", "relationCarePattern", "relationRiskPattern", "childTemperamentPattern"],
  },
  {
    file: "matrix-combo-blocks.json",
    label: "함께 살펴볼 결 매트릭스 조합",
    description: "엄마/아빠 x 부모축 x 아이요인 x 시너지/충돌 x 부모원인 x 아이원인",
    dimensions: ["role", "parentAxis", "childFactor", "type", "parentCause", "childCause"],
  },
  {
    file: "parent-palace-blocks.json",
    label: "부모궁 요약 조합",
    description: "어머니축 x 아버지축",
    dimensions: ["motherAxis", "fatherAxis"],
  },
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
}

function getValue(row, dotted) {
  return dotted.split(".").reduce((value, key) => value?.[key], row) ?? "";
}

function countsBy(rows, dimension) {
  const counts = new Map();
  for (const row of rows) {
    const value = String(getValue(row, dimension) || "(empty)");
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko"))
    .map(([value, count]) => ({ value, count }));
}

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function blockTextSample(row) {
  const candidates = [
    row.whyIntro,
    row.compatibilityTitle,
    row.header,
    row.parentSajuBody,
    row.parentPalaceSummary?.[0],
    row.whyMechanism?.[0],
    row.body?.[0],
  ];
  return String(candidates.find(Boolean) ?? "").slice(0, 180);
}

const report = {
  version: "youa-v1-combo-index-v1",
  generatedAt: new Date().toISOString(),
  files: [],
};

for (const config of comboFiles) {
  const filePath = path.join(cacheRoot, config.file);
  const payload = readJson(filePath);
  const rows = Array.isArray(payload) ? payload : payload.blocks ?? [];
  report.files.push({
    ...config,
    count: rows.length,
    keyExamples: rows.slice(0, 20).map((row) => row.key),
    dimensions: Object.fromEntries(config.dimensions.map((dimension) => [dimension, countsBy(rows, dimension)])),
    samples: rows.slice(0, 80).map((row) => ({
      key: row.key,
      text: blockTextSample(row),
    })),
  });
}

writeFile(path.join(outDir, "combo-index.json"), `${JSON.stringify(report, null, 2)}\n`);

const total = report.files.reduce((sum, file) => sum + file.count, 0);
const html = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>아이기질+부모양육 v1 조합 인덱스</title>
  <style>
    body{margin:0;background:#f5f1ea;color:#302820;font-family:Arial,'Noto Sans KR',sans-serif}
    .wrap{max-width:1180px;margin:0 auto;padding:24px 14px 60px}
    .top,.section{background:#fffdf9;border:1px solid #e3d7c8;border-radius:8px;padding:18px;margin-bottom:14px}
    h1{font-size:28px;margin:4px 0 10px} h2{font-size:20px;margin:0 0 8px;color:#b84e24} h3{font-size:15px;margin:14px 0 8px;color:#6d5b4a}
    p{line-height:1.7} code{background:#f1e8dd;border-radius:4px;padding:2px 5px}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}
    .stat{background:#f8f4ee;border-left:4px solid #8fab3d;border-radius:7px;padding:10px}
    .count{font-size:24px;font-weight:700}
    table{width:100%;border-collapse:collapse;font-size:13px}
    th,td{border-top:1px solid #eadfd2;padding:8px;text-align:left;vertical-align:top}
    th{background:#f8f4ee;color:#6d5b4a}
    .dim{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px}
    .dimbox{background:#fbf7f1;border:1px solid #eadfd2;border-radius:7px;padding:10px}
    .chips{display:flex;flex-wrap:wrap;gap:5px}
    .chip{background:#efe4d8;border-radius:999px;padding:4px 8px;font-size:12px}
    .sample-key{font-family:Consolas,monospace;font-size:12px;word-break:break-all}
  </style>
</head>
<body>
  <main class="wrap">
    <section class="top">
      <h1>아이기질+부모양육 v1 조합 인덱스</h1>
      <p>현재 캐시에 세팅된 조합 버튼/키를 종류별로 압축해서 보는 화면입니다. 전체 원본 목록은 <code>combo-index.json</code>에 있습니다.</p>
      <div class="grid">
        <div class="stat"><div>전체 조합 블록</div><div class="count">${total.toLocaleString("ko-KR")}</div></div>
        ${report.files.map((file) => `<div class="stat"><div>${esc(file.label)}</div><div class="count">${file.count.toLocaleString("ko-KR")}</div><div>${esc(file.file)}</div></div>`).join("")}
      </div>
    </section>
    ${report.files.map((file) => `
      <section class="section">
        <h2>${esc(file.label)}</h2>
        <p>${esc(file.description)}</p>
        <p><code>${esc(file.file)}</code> / ${file.count.toLocaleString("ko-KR")}개</p>
        <h3>축별 세팅</h3>
        <div class="dim">
          ${Object.entries(file.dimensions).map(([dimension, rows]) => `
            <div class="dimbox">
              <b>${esc(dimension)}</b>
              <div class="chips">
                ${rows.slice(0, 30).map((row) => `<span class="chip">${esc(row.value)} ${row.count}</span>`).join("")}
              </div>
            </div>
          `).join("")}
        </div>
        <h3>키 예시</h3>
        <table>
          <thead><tr><th style="width:45%">key</th><th>본문 예시</th></tr></thead>
          <tbody>
            ${file.samples.slice(0, 30).map((sample) => `<tr><td class="sample-key">${esc(sample.key)}</td><td>${esc(sample.text)}</td></tr>`).join("")}
          </tbody>
        </table>
      </section>
    `).join("")}
  </main>
</body>
</html>`;

writeFile(path.join(outDir, "index.html"), html);

console.log(`YOUA_COMBO_INDEX files=${report.files.length} total=${total}`);
console.log(path.relative(root, path.join(outDir, "index.html")));
console.log(path.relative(root, path.join(outDir, "combo-index.json")));
