import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(root, 'output');
const files = fs.readdirSync(outDir).filter((name) => /^sample-\d+\.json$/.test(name)).sort();
const samples = files.map((name) => {
  const full = path.join(outDir, name);
  return { file: name, data: JSON.parse(fs.readFileSync(full, 'utf8')) };
});

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function arr(value) {
  return Array.isArray(value) ? value : value ? [value] : [];
}

function paragraphs(items) {
  return arr(items).map((text) => `<p>${esc(text)}</p>`).join('\n');
}

function renderScoreRows(scores) {
  return arr(scores).map((s) => `
    <div class="score-row">
      <div class="score-name">${esc(s.factor)}</div>
      <div class="score-track"><div class="score-fill" style="width:${Number(s.score) || 0}%"></div></div>
      <div class="score-num">${esc(s.score)} <span>${esc(s.level)}</span></div>
    </div>
  `).join('\n');
}

function renderEvidence(items) {
  if (!arr(items).length) return '<li>근거 인자가 약하게 자리합니다.</li>';
  return arr(items).map((item) => `<li>${esc(item.label)} <span>(${esc(item.raw)} ${esc(item.position)})</span></li>`).join('\n');
}

function renderTips(tips) {
  return arr(tips).map((tip) => `
    <div class="tip">
      <b>${esc(tip.axis)} · ${esc(tip.title)}</b>
      <p>${esc(tip.body)}</p>
    </div>
  `).join('\n');
}

function renderFactor(name, section) {
  return `
    <section class="page">
      <div class="chapter">${esc(name)}</div>
      <div class="score-box">
        <strong>${esc(section?.summaryBox?.line1)}</strong>
        <p>${esc(section?.summaryBox?.line2)}</p>
      </div>
      <h3>왜 이런 결인가</h3>
      <p>${esc(section?.why?.intro)}</p>
      <div class="factor-table">
        <div>
          <h4>만드는 기운</h4>
          <ul>${renderEvidence(section?.why?.makerItems)}</ul>
        </div>
        <div>
          <h4>누르는 기운</h4>
          <ul>${renderEvidence(section?.why?.suppressorItems)}</ul>
        </div>
      </div>
      ${paragraphs(section?.why?.body)}
      <h3>일상에서는</h3>
      ${paragraphs(section?.daily?.paragraphs)}
      <h3>양육 Tip</h3>
      <div class="tips">${renderTips(section?.parentingTips)}</div>
    </section>
  `;
}

function renderParent(label, parent) {
  return `
    <section class="page">
      <div class="chapter">${esc(label)}</div>
      ${paragraphs(parent?.paragraphs)}
    </section>
  `;
}

function renderCompatibility(title, section) {
  return `
    <section class="page">
      <div class="chapter">${esc(title)}</div>
      <div class="mini">${esc(section?.relationType)}</div>
      ${paragraphs(section?.paragraphs)}
      <div class="daily"><strong>일상에서는</strong><p>${esc(section?.daily)}</p></div>
    </section>
  `;
}

function renderMatrix(cards) {
  return `
    <section class="page">
      <div class="chapter">함께 살펴줄 결</div>
      ${arr(cards).map((card) => `
        <div class="matrix ${card.type === 'conflict' ? 'conflict' : 'synergy'}">
          <h3>${esc(card.header)}</h3>
          <div class="mini">${esc(card.sub)}</div>
          ${paragraphs(card.body)}
          <div class="daily"><strong>일상에서는</strong>${arr(card.daily).map((d) => `<p>${esc(d)}</p>`).join('')}</div>
          ${card.resolution ? `<div class="resolve">${esc(card.resolution)}</div>` : ''}
        </div>
      `).join('\n')}
    </section>
  `;
}

function renderSample(sample, idx) {
  const data = sample.data;
  const sections = data.sections || {};
  const facts = data.facts || {};
  const factors = sections.factors || {};
  return `
    <article class="sample ${idx === 0 ? 'active' : ''}" id="sample-${idx}">
      <section class="cover">
        <div class="sample-file">${esc(sample.file)}</div>
        <h1>사주로 풀어보는 우리 아이 마음</h1>
        <p>${esc(facts.child?.name || '아이')} · ${esc(facts.child?.ageText || '')}</p>
        <p>${esc(facts.parents?.mother?.name || '어머님')} · ${esc(facts.parents?.father?.name || '아버님')}</p>
      </section>
      <section class="page">
        <div class="chapter">아이기질 한눈에 보기</div>
        <p>${esc(sections.overview?.summary)}</p>
        <div class="scores">${renderScoreRows(sections.overview?.scores)}</div>
      </section>
      ${Object.entries(factors).map(([name, section]) => renderFactor(name, section)).join('\n')}
      <section class="page">
        <div class="chapter">${esc(sections.animal?.animalName)} 유형 자세히 살펴보기</div>
        <p>${esc(sections.animal?.summary)}</p>
        <h3>이런 결이 강점입니다</h3>
        <ul>${arr(sections.animal?.strengths).map((v) => `<li>${esc(v)}</li>`).join('')}</ul>
        <h3>이런 점은 살펴주세요</h3>
        <ul>${arr(sections.animal?.watchouts).map((v) => `<li>${esc(v)}</li>`).join('')}</ul>
        <h3>양육 코칭</h3>
        <div class="tips">${renderTips(sections.animal?.coaching)}</div>
      </section>
      ${renderParent('어머님 사주', sections.parents?.mother)}
      ${renderParent('아버님 사주', sections.parents?.father)}
      ${renderCompatibility('어머님과 아이의 궁합', sections.compatibility?.motherChild)}
      ${renderCompatibility('아버님과 아이의 궁합', sections.compatibility?.fatherChild)}
      ${renderMatrix(sections.matrix)}
      <section class="page">
        <div class="chapter">마지막 당부</div>
        ${paragraphs(sections.outro?.paragraphs)}
      </section>
    </article>
  `;
}

const buttons = samples.map((sample, idx) => `<button class="${idx === 0 ? 'active' : ''}" data-sample="${idx}">${esc(sample.file.replace('.json', ''))}</button>`).join('\n');
const body = samples.map(renderSample).join('\n');

const html = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>아이기질 샘플 미리보기</title>
  <style>
    body { margin:0; background:#eee8df; color:#342b25; font-family: Georgia, 'Times New Roman', 'Noto Serif KR', serif; }
    .toolbar { position:sticky; top:0; z-index:10; display:flex; gap:8px; overflow:auto; padding:10px; background:#2f2924; }
    button { border:0; border-radius:7px; padding:9px 12px; background:#6d6259; color:white; font-size:13px; cursor:pointer; white-space:nowrap; }
    button.active { background:#d97757; }
    .wrap { max-width:760px; margin:0 auto; padding:16px 12px 40px; }
    .sample { display:none; }
    .sample.active { display:block; }
    .cover, .page { background:#fffdf9; border:1px solid #e7d8c9; border-radius:10px; margin:0 0 14px; padding:22px 20px; box-shadow:0 2px 10px rgba(45,32,22,.06); }
    .cover { min-height:260px; display:flex; flex-direction:column; justify-content:center; text-align:center; background:linear-gradient(135deg,#fff7ed,#fffdf9); }
    .sample-file { color:#a36a4c; font-size:12px; margin-bottom:16px; font-family:Arial,sans-serif; }
    h1 { margin:0 0 18px; font-size:28px; line-height:1.25; }
    h3 { margin:20px 0 8px; font-size:16px; color:#8a6332; }
    p, li { font-size:14px; line-height:1.85; }
    ul { padding-left:20px; }
    .chapter { font-size:18px; font-weight:700; color:#c84d20; border-bottom:1px solid #ead8c8; padding-bottom:8px; margin-bottom:14px; }
    .score-box { background:#fef9f6; border-left:4px solid #d97757; padding:14px 16px; border-radius:8px; margin:14px 0; }
    .scores { display:grid; gap:10px; margin-top:16px; }
    .score-row { display:grid; grid-template-columns:56px 1fr 88px; align-items:center; gap:10px; font-family:Arial,'Noto Sans KR',sans-serif; }
    .score-name { font-weight:700; font-size:13px; }
    .score-track { height:9px; border-radius:999px; background:#eee1d5; overflow:hidden; }
    .score-fill { height:100%; border-radius:999px; background:#d97757; }
    .score-num { text-align:right; font-size:13px; font-weight:700; }
    .score-num span { color:#7a6a5d; font-weight:500; }
    .factor-table { display:grid; grid-template-columns:1fr 1fr; gap:10px; background:#fef9f6; border-radius:8px; padding:12px; border:1px solid #f0e0d2; }
    .factor-table h4 { margin:0 0 8px; font-size:13px; color:#7a6a5d; }
    .factor-table li { font-size:13px; line-height:1.55; margin-bottom:6px; }
    .factor-table span, .mini { color:#857568; font-size:12px; font-family:Arial,'Noto Sans KR',sans-serif; }
    .tips { display:grid; gap:10px; }
    .tip { background:#f5f8e8; border-left:3px solid #95c540; border-radius:8px; padding:12px 14px; }
    .tip b { color:#5d8225; font-size:13px; }
    .tip p { margin:6px 0 0; font-size:13px; }
    .daily { background:#f7f1ea; border-left:3px solid #c8a47f; border-radius:8px; padding:10px 12px; margin:12px 0; }
    .matrix { border-radius:10px; padding:14px 16px; margin:12px 0; border-left:4px solid #d7ad32; background:linear-gradient(135deg,#fff8e1,#fffdf8); }
    .matrix.conflict { border-left-color:#8a8a9e; background:linear-gradient(135deg,#f5f5f7,#fbfbfd); }
    .matrix h3 { margin-top:0; }
    .resolve { margin-top:10px; background:#edf6dd; color:#55752a; border-left:3px solid #95c540; border-radius:7px; padding:10px 12px; font-size:13px; line-height:1.7; }
    @media (max-width:560px) { .wrap { padding:10px 8px 28px; } .cover,.page { padding:18px 15px; } .factor-table { grid-template-columns:1fr; } h1 { font-size:24px; } }
  </style>
</head>
<body>
  <nav class="toolbar">${buttons}</nav>
  <main class="wrap">${body}</main>
  <script>
    const buttons = Array.from(document.querySelectorAll('button[data-sample]'));
    const samples = Array.from(document.querySelectorAll('.sample'));
    buttons.forEach((button) => button.addEventListener('click', () => {
      buttons.forEach((b) => b.classList.remove('active'));
      samples.forEach((s) => s.classList.remove('active'));
      button.classList.add('active');
      document.getElementById('sample-' + button.dataset.sample).classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }));
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(outDir, 'preview.html'), html, 'utf8');
console.log(`Wrote ${path.join(outDir, 'preview.html')} with ${samples.length} samples`);
