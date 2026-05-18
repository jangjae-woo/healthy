import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const cacheDir = path.join(root, 'cache');

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(cacheDir, name), 'utf8'));
}

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderList(items) {
  return (Array.isArray(items) ? items : [items]).filter(Boolean).map((item) => `<p>${esc(item)}</p>`).join('');
}

const index = readJson('index.json');
const factor = readJson('factor-blocks.json');
const factorCombo = readJson('factor-combo-blocks.json');
const parent = readJson('parent-saju-blocks.json');
const compat = readJson('compatibility-blocks.json');
const palace = readJson('parent-palace-blocks.json');
const matrix = readJson('matrix-card-blocks.json');

const factorSamples = factor.blocks.filter((b) => ['factor|활기|낮음', 'factor|조심|높음', 'factor|흔들림|매우높음', 'factor|끈기|중간'].includes(b.key));
const factorComboSamples = factorCombo.blocks.filter((b) => [
  'factorCombo|활기|높음|expression|standard',
  'factorCombo|활기|높음|climate|support',
  'factorCombo|조심|매우높음|standard|expression',
  'factorCombo|흔들림|낮음|support|climate',
  'factorCombo|어울림|높음|same|standard',
  'factorCombo|끈기|중간|result|same',
].includes(b.key));
const parentSamples = parent.blocks.filter((b) => ['parentSaju|mother|jeong', 'parentSaju|father|gyeong', 'parentSaju|mother|eul', 'parentSaju|father|im'].includes(b.key));
const compatSamples = compat.blocks.filter((b) => ['compatibility|mother|eul|jeong|parentGivesChild', 'compatibility|father|eul|gyeong|parentControlsChild', 'compatibility|mother|sin|gi|parentGivesChild'].includes(b.key)).slice(0, 4);
const palaceSamples = palace.blocks.slice(0, 4);
const matrixSamples = matrix.blocks.filter((b) => [
  'matrix|mother|support|흔들림|synergy|strong',
  'matrix|father|standard|조심|conflict|strong',
  'matrix|mother|expression|만족|synergy|middle',
  'matrix|father|result|흔들림|conflict|middle',
].includes(b.key));

const html = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>아이기질 문장 블록 캐시 v1</title>
  <style>
    body { margin:0; background:#f5eee7; color:#322820; font-family: Georgia, 'Times New Roman', 'Noto Serif KR', serif; }
    header { position:sticky; top:0; z-index:2; background:#2f2924; color:#fff; padding:14px 18px; }
    header h1 { margin:0; font-size:18px; }
    header p { margin:6px 0 0; font:13px Arial, sans-serif; color:#e6d8cb; }
    main { max-width:880px; margin:0 auto; padding:18px 12px 48px; }
    section { background:#fffdf9; border:1px solid #e7d7c8; border-radius:10px; margin:0 0 16px; padding:18px; box-shadow:0 2px 10px rgba(45,32,22,.06); }
    h2 { margin:0 0 12px; color:#c84d20; font-size:18px; border-bottom:1px solid #ead8c8; padding-bottom:8px; }
    h3 { margin:0 0 8px; color:#7d5a32; font-size:15px; }
    p, li { font-size:14px; line-height:1.75; }
    code { font-family: Consolas, monospace; background:#f3e7dc; padding:2px 5px; border-radius:4px; }
    .grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:12px; }
    .card { border-left:4px solid #d97757; background:#fef8f2; border-radius:8px; padding:12px 14px; }
    .card.matrix { border-left-color:#95c540; background:#f6faed; }
    .card.conflict { border-left-color:#8a8a9e; background:#f4f4f7; }
    .meta { font:12px Arial, sans-serif; color:#7d6d61; margin-bottom:10px; word-break:break-all; }
    .count { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:10px; }
    .count div { background:#fff7ed; border:1px solid #efd9c8; border-radius:8px; padding:10px; font:13px Arial, sans-serif; }
    .count b { display:block; color:#c84d20; font-size:20px; margin-top:4px; }
  </style>
</head>
<body>
  <header>
    <h1>아이기질 문장 블록 캐시 v1</h1>
    <p>LLM 없이 계산 key로 조회해서 변수 치환하는 블록 캐시 미리보기</p>
  </header>
  <main>
    <section>
      <h2>총량</h2>
      <div class="count">
        ${index.files.map((file) => `<div>${esc(file.name)}<b>${esc(file.count)}</b></div>`).join('')}
        <div>totalBlocks<b>${esc(index.totalBlocks)}</b></div>
      </div>
    </section>

    <section>
      <h2>4~9페이지 요인 블록 예시</h2>
      <div class="grid">
        ${factorSamples.map((b) => `<div class="card">
          <div class="meta">${esc(b.key)}</div>
          <h3>${esc(b.factor)} · ${esc(b.level)}</h3>
          <p><b>whyIntro</b><br>${esc(b.whyIntro)}</p>
          ${renderList(b.dailyBody)}
          <p><b>${esc(b.parentingTipTime.title)}</b><br>${esc(b.parentingTipTime.body)}</p>
        </div>`).join('')}
      </div>
    </section>

    <section>
      <h2>4~9페이지 요인 × 사주 인자 조합 블록 예시</h2>
      <p>사주 엔진이 만드는 기운과 누르는 기운의 대표 그룹을 계산해서 아래 key로 조회합니다.</p>
      <div class="grid">
        ${factorComboSamples.map((b) => `<div class="card">
          <div class="meta">${esc(b.key)}</div>
          <h3>${esc(b.factor)} · ${esc(b.level)} · ${esc(b.makerGroup.label)} / ${esc(b.suppressorGroup.label)}</h3>
          <p><b>whyIntro</b><br>${esc(b.whyIntro)}</p>
          <p><b>whyMechanism</b></p>
          ${renderList(b.whyMechanism)}
          <p><b>dailyBody</b></p>
          ${renderList(b.dailyBody)}
          <p><b>${esc(b.parentingTipTime.title)}</b><br>${esc(b.parentingTipTime.body)}</p>
        </div>`).join('')}
      </div>
    </section>

    <section>
      <h2>13~14페이지 부모 사주 블록 예시</h2>
      <div class="grid">
        ${parentSamples.map((b) => `<div class="card">
          <div class="meta">${esc(b.key)}</div>
          <h3>${esc(b.roleTitle)} · ${esc(b.dayMaster)}</h3>
          <p>${esc(b.parentSajuBody)}</p>
          <p>${esc(b.parentSajuBridge)}</p>
        </div>`).join('')}
      </div>
    </section>

    <section>
      <h2>15페이지 궁합 블록 예시</h2>
      <div class="grid">
        ${compatSamples.map((b) => `<div class="card">
          <div class="meta">${esc(b.key)}</div>
          <h3>${esc(b.relationLabel)}</h3>
          ${renderList(b.compatibilityBody)}
          <p><b>일상에서는</b><br>${esc(b.compatibilityDaily)}</p>
        </div>`).join('')}
      </div>
    </section>

    <section>
      <h2>15페이지 부모궁 요약 블록 예시</h2>
      <div class="grid">
        ${palaceSamples.map((b) => `<div class="card">
          <div class="meta">${esc(b.key)}</div>
          <h3>${esc(b.motherAxis)} × ${esc(b.fatherAxis)}</h3>
          ${renderList(b.parentPalaceSummary)}
        </div>`).join('')}
      </div>
    </section>

    <section>
      <h2>16페이지 매트릭스 카드 블록 예시</h2>
      <div class="grid">
        ${matrixSamples.map((b) => `<div class="card matrix ${b.type === 'conflict' ? 'conflict' : ''}">
          <div class="meta">${esc(b.key)}</div>
          <h3>${esc(b.header)}</h3>
          <p><code>${esc(b.subTemplate)}</code></p>
          ${renderList(b.body)}
          <p><b>일상에서는</b></p>
          ${renderList(b.daily)}
          ${b.resolution ? `<p><b>이렇게 풀어보세요</b><br>${esc(b.resolution)}</p>` : ''}
        </div>`).join('')}
      </div>
    </section>
  </main>
</body>
</html>`;

fs.writeFileSync(path.join(root, 'preview.html'), html, 'utf8');
console.log(`Wrote ${path.join(root, 'preview.html')}`);
