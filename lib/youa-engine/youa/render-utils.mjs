// 렌더 헬퍼 — SVG 레이더 / 결 위치 바 / 아코디언 / 인자 카드 / 삼각구도
// 모두 facts JSON 받아 HTML 문자열 또는 DOM 생성
//
// 작성: 2026-05-16

// ─── 색상 매핑 ───
export const FACTOR_COLORS = {
  hwalgi:      { main: '#FF6B35', light: '#FFE5DA', text: '#c84d20', chapter: 'ch-hwalgi' },
  josim:       { main: '#95C540', light: '#E5F2D1', text: '#5d8225', chapter: 'ch-josim' },
  manjok:      { main: '#FFD93D', light: '#FFF6CC', text: '#b89400', chapter: 'ch-manjok' },
  heundeullim: { main: '#B589D6', light: '#EBDAF5', text: '#6e4099', chapter: 'ch-heundeullim' },
  eoullim:     { main: '#FF8FA3', light: '#FFE0E8', text: '#c44366', chapter: 'ch-eoullim' },
  kkeungi:     { main: '#5B9BD5', light: '#DBE9F5', text: '#2d5a8a', chapter: 'ch-kkeungi' },
};

export const FACTOR_ESSENCE = {
  hwalgi: '활동성',
  josim: '조심성',
  manjok: '긍정정서',
  heundeullim: '부정정서',
  eoullim: '사회적 민감성',
  kkeungi: '의도적 조절',
};

export const FACTOR_BIPOLAR_MINI = {
  hwalgi:      { low: '얌전한·차분한',   high: '열정·에너지' },
  josim:       { low: '도전·적극',       high: '조심·수줍어' },
  manjok:      { low: '표현 적음',       high: '낙관·유쾌' },
  heundeullim: { low: '안정·침착',       high: '예민·민감' },
  eoullim:     { low: '독립·개인',       high: '공감·사교' },
  kkeungi:     { low: '관심사 다양',     high: '인내·끈기' },
};

export const FACTOR_BIPOLAR_FULL = {
  hwalgi: {
    low:  '활동량이 적고 얌전하며 차분한 결입니다. 소근육 놀이(만지작거리기·그림 그리기 등)가 자연스럽고, 가만히 있는 시간이 편안한 결입니다.',
    high: '활동량이 많고 열정적인 결입니다. 대근육 놀이(뛰기·오르기·매달리기 등)를 즐기고, 에너지가 풍부한 결입니다.',
  },
  josim: {
    low:  '도전적이고 적극적인 결입니다. 새 자극 앞에서 겁이 적고 대담하게 먼저 한 걸음 내딛는 결이며, 낯선 환경에도 적응이 빠르고 주도적인 결입니다.',
    high: '조심성이 많고 수줍어 하는 결입니다. 새 사람·새 장소 앞에서 한 번 더 살피고 안전한 자리부터 찾는 결이며, 경계심이 높아 실수가 적은 결입니다.',
  },
  manjok: {
    low:  '긍정정서 표현이 적은 결입니다. 마음에 잘 들지 않으면 표정에 그대로 비치고 시큰둥하며 애정 표현이 적은 결이며, 쉽게 만족하기까지 시간이 걸리는 결입니다.',
    high: '낙관적이고 유쾌한 결입니다. 일상에서 좋은 결을 자주 발견하고, 작은 일에도 만족하며 행복을 자주 느끼는 결입니다.',
  },
  heundeullim: {
    low:  '마음이 안정되고 침착한 결입니다. 이완된 상태로 흔들리는 자리에서도 참을성 있게 빠르게 안정을 찾는 결입니다.',
    high: '예민하고 감정에 민감한 결입니다. 한 번 마음에 새겨진 감정이 오래 머물고, 기분 회복에 시간이 필요한 결입니다.',
  },
  eoullim: {
    low:  '독립적이고 개인적인 결입니다. 혼자의 시간이 편안하고 자기 페이스로 노는 결이며, 타인의 영향을 덜 받고 외로움도 덜 타는 결입니다.',
    high: '공감적이고 사교적인 결입니다. 타인의 감정에 민감하고 주변 분위기에 영향을 받는 결이며, 함께하는 놀이를 좋아하는 결입니다.',
  },
  kkeungi: {
    low:  '관심사가 다양하고 자신의 욕구에 충실한 결입니다. 한 자리에 오래 머무는 것보다 여러 자리를 가볍게 옮겨가며 자라고, 욕심을 부리기보다 현실과 가볍게 타협하는 결입니다.',
    high: '인내심이 강하고 끈기 있는 결입니다. 한 번 시작한 것을 끝까지 꾸준히 들고 가는 결이며, 주의집중력이 높고 부지런한 결입니다.',
  },
};

export const FACTOR_SHORT = {
  hwalgi:      { low: '움직임이 적고 차분히 머무는 결',     high: '움직임이 많고 에너지가 풍부한 결' },
  josim:       { low: '새 자극 앞에서 망설임 없이 다가가는 결', high: '새 자극 앞에서 신중하고 안전한 자리부터 찾는 결' },
  manjok:      { low: '감정 표현이 차분하고 쉽게 만족하지 않는 결', high: '일상에서 좋은 결을 자주 발견하는 결' },
  heundeullim: { low: '마음의 진폭이 잔잔한 결',           high: '감정에 민감하고 기분 회복에 시간이 필요한 결' },
  eoullim:     { low: '혼자의 시간이 편안한 독립적인 결', high: '공감적이고 사교적이며 함께 노는 결을 좋아하는 결' },
  kkeungi:     { low: '관심이 자유롭게 흐르는 결',         high: '인내심이 강하고 한 자리에 꾸준히 들고 가는 결' },
};

const LEVEL_KO = { low: '낮음', mid: '중간', high: '높음' };

// ─── 6각 레이더 SVG ───
export function renderRadar(childFactors, size = 320) {
  const cx = 180, cy = 180;
  // 6축 (활기 위, 시계방향: 조심·만족·흔들림·어울림·끈기·활기)
  const factors = ['hwalgi', 'josim', 'manjok', 'heundeullim', 'eoullim', 'kkeungi'];
  const factorNames = { hwalgi: '활기', josim: '조심', manjok: '만족', heundeullim: '흔들림', eoullim: '어울림', kkeungi: '끈기' };

  // 6각형 좌표 (위에서 시계 방향)
  const angles = [-90, -30, 30, 90, 150, 210];  // degree
  const radius = 140;

  function pt(angle, r) {
    const rad = (angle * Math.PI) / 180;
    return [cx + Math.cos(rad) * r, cy + Math.sin(rad) * r];
  }

  // 격자 (4단)
  let grid = '';
  for (const r of [radius, radius * 0.75, radius * 0.5, radius * 0.25]) {
    const points = angles.map(a => pt(a, r).join(',')).join(' ');
    grid += `<polygon points="${points}" />`;
  }

  // 결 위치 폴리곤
  const scorePoints = angles.map((a, i) => {
    const score = childFactors[factors[i]].score;
    const r = (score / 100) * radius;
    return pt(a, r).join(',');
  }).join(' ');

  // 결 위치 점
  let circles = '';
  for (let i = 0; i < 6; i++) {
    const score = childFactors[factors[i]].score;
    const r = (score / 100) * radius;
    const [x, y] = pt(angles[i], r);
    circles += `<circle cx="${x}" cy="${y}" r="4" fill="#d97757" />`;
  }

  // 라벨
  let labels = '';
  for (let i = 0; i < 6; i++) {
    const [lx, ly] = pt(angles[i], radius + 22);
    const score = childFactors[factors[i]].score;
    const levelText = LEVEL_KO[childFactors[factors[i]].level];
    labels += `<text x="${lx}" y="${ly}" text-anchor="middle" class="radar-label">${factorNames[factors[i]]}</text>`;
    labels += `<text x="${lx}" y="${ly + 14}" text-anchor="middle" class="radar-score">${score}</text>`;
  }

  return `
    <svg class="radar" viewBox="0 0 360 360">
      <g stroke="#eee" stroke-width="1" fill="none">${grid}</g>
      <polygon points="${scorePoints}" fill="rgba(217,119,87,0.25)" stroke="#d97757" stroke-width="2" />
      ${circles}
      ${labels}
    </svg>
  `;
}

// ─── 6요인 결 위치 바 ───
export function renderScoreBars(childFactors) {
  const order = ['hwalgi', 'josim', 'manjok', 'heundeullim', 'eoullim', 'kkeungi'];
  const names = { hwalgi: '활기', josim: '조심', manjok: '만족', heundeullim: '흔들림', eoullim: '어울림', kkeungi: '끈기' };
  let h = '';
  for (const k of order) {
    const f = childFactors[k];
    const c = FACTOR_COLORS[k];
    h += `
      <div class="bar-row">
        <div class="bar-name">${names[k]}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${f.score}%;background:${c.main}"></div></div>
        <div class="bar-score">${f.score}</div>
        <div class="bar-label level-${f.level}">${LEVEL_KO[f.level]}</div>
      </div>
    `;
  }
  return h;
}

// ─── 단일 요인 결 위치 바 (챕터 페이지용) ───
export function renderSingleScoreBar(factorResult) {
  const c = FACTOR_COLORS[factorResult.factor];
  const names = { hwalgi: '활기', josim: '조심', manjok: '만족', heundeullim: '흔들림', eoullim: '어울림', kkeungi: '끈기' };
  return `
    <div class="bar-row">
      <div class="bar-name">${names[factorResult.factor]}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${factorResult.score}%;background:${c.main}"></div></div>
      <div class="bar-score">${factorResult.score}</div>
      <div class="bar-label level-${factorResult.level}">${LEVEL_KO[factorResult.level]}</div>
    </div>
  `;
}

// ─── 양극 행동 아코디언 ───
export function renderBipolarAccordion() {
  const order = ['hwalgi', 'josim', 'manjok', 'heundeullim', 'eoullim', 'kkeungi'];
  const names = { hwalgi: '활기', josim: '조심', manjok: '만족', heundeullim: '흔들림', eoullim: '어울림', kkeungi: '끈기' };
  let h = '<div class="bipolar-list">';
  for (const k of order) {
    const mini = FACTOR_BIPOLAR_MINI[k];
    const full = FACTOR_BIPOLAR_FULL[k];
    h += `
      <div class="bipolar-item" onclick="toggleBipolarItem(this)">
        <div class="bipolar-row">
          <div class="bp-low-mini">${mini.low}</div>
          <div class="bipolar-label bp-${k}">${names[k]}</div>
          <div class="bp-high-mini">${mini.high}</div>
          <div class="bp-toggle" aria-hidden="true">▾</div>
        </div>
        <div class="bipolar-detail">
          <div class="bp-full bp-low-full">${full.low}</div>
          <div class="bp-full bp-high-full">${full.high}</div>
        </div>
      </div>
    `;
  }
  h += '</div>';
  h += `
    <script>
      window.toggleBipolarItem = window.toggleBipolarItem || function(el) {
        el.classList.toggle('expanded');
        var t = el.querySelector('.bp-toggle');
        if (t) t.textContent = el.classList.contains('expanded') ? '▴' : '▾';
      };
    </script>
  `;
  return h;
}

// ─── 사주 8자 박스 ───
const STEM_LABEL = {
  '갑': '갑목(甲)', '을': '을목(乙)', '병': '병화(丙)', '정': '정화(丁)', '무': '무토(戊)',
  '기': '기토(己)', '경': '경금(庚)', '신': '신금(辛)', '임': '임수(壬)', '계': '계수(癸)',
};

const BRANCH_HAN = {
  '자': '子', '축': '丑', '인': '寅', '묘': '卯', '진': '辰', '사': '巳',
  '오': '午', '미': '未', '신': '申', '유': '酉', '술': '戌', '해': '亥',
};

const STEM_HAN = {
  '갑': '甲', '을': '乙', '병': '丙', '정': '丁', '무': '戊',
  '기': '己', '경': '庚', '신': '辛', '임': '壬', '계': '癸',
};

const STEM_NATURE = {
  '갑': '큰 나무', '을': '작은 나무', '병': '큰 불', '정': '작은 불', '무': '큰 흙',
  '기': '작은 흙', '경': '큰 쇠', '신': '작은 쇠', '임': '큰 물', '계': '작은 물',
};

function stemLabel(stem) {
  return STEM_LABEL[stem] ?? stem;
}

function stemHan(stem) {
  return STEM_HAN[stem] ?? stem;
}

function stemNature(stem) {
  return STEM_NATURE[stem] ?? stem;
}

function iljuLabel(ilju) {
  if (!ilju || ilju.length < 2) return ilju ?? '';
  const stem = ilju.slice(0, 1);
  const branch = ilju.slice(1, 2);
  const stemHan = stemLabel(stem).match(/\((.+)\)/)?.[1] ?? stem;
  return `${stem}${branch}(${stemHan}${BRANCH_HAN[branch] ?? branch})`;
}

function factorCardDetail(c) {
  if (!c.present) {
    return `${c.label}은 사주 천간·지지에 직접 자리하지 않아 다른 인자의 영향으로 작게 표시됩니다. 그래도 완전히 없는 기운이 아니라, 주변 흐름 속에서 약하게 드러나는 결로 보면 됩니다.`;
  }
  return `${c.label}이 ${c.primaryPosition}에 자리하고 ${c.tongMyeong}으로 작용합니다. ${c.strengthLabel} ${c.strength} 수준으로 표시되어, 부모 사주의 가운데 자리에서 비교적 분명하게 드러나는 흐름입니다.`;
}

export function formatSajuInfo(parent, topFactors, johuText) {
  return `일간 ${stemLabel(parent.ilgan)} · 일주 ${iljuLabel(parent.ilju)}<br/>사주에서 가장 강한 기운: ${topFactors || '—'}<br/>사주 안 따뜻함과 차가움: ${johuText}`;
}

export function renderSaju8Box(title, pillars, info) {
  const order = ['hour', 'day', 'month', 'year'];
  const labels = { hour: '時', day: '日', month: '月', year: '年' };
  const han = {
    '갑': '甲', '을': '乙', '병': '丙', '정': '丁', '무': '戊',
    '기': '己', '경': '庚', '신': '辛', '임': '壬', '계': '癸',
    '자': '子', '축': '丑', '인': '寅', '묘': '卯', '진': '辰', '사': '巳',
    '오': '午', '미': '未', '신': '申', '유': '酉', '술': '戌', '해': '亥',
  };
  // 천간/지지 한자 변환
  const STEMS = new Set(['갑','을','병','정','무','기','경','신','임','계']);
  const stemHan = { '갑':'甲','을':'乙','병':'丙','정':'丁','무':'戊','기':'己','경':'庚','신':'辛','임':'壬','계':'癸' };
  const branchHan = { '자':'子','축':'丑','인':'寅','묘':'卯','진':'辰','사':'巳','오':'午','미':'未','신':'申','유':'酉','술':'戌','해':'亥' };
  const cellText = (value) => {
    if (value === undefined || value === null || value === '' || value === 'undefined') return '모름';
    return value;
  };

  let h = `<div class="saju8-box"><div class="saju8-title">${title}</div><div class="saju8-grid">`;
  for (const k of order) {
    const isDay = k === 'day';
    const stem = pillars?.[k]?.stem;
    h += `<div class="saju8-cell${isDay ? ' day' : ''}"><div class="pos">${labels[k]}</div><div class="char">${cellText(stemHan[stem] ?? stem)}</div></div>`;
  }
  for (const k of order) {
    const isDay = k === 'day';
    const branch = pillars?.[k]?.branch;
    h += `<div class="saju8-cell${isDay ? ' day' : ''}"><div class="pos"></div><div class="char">${cellText(branchHan[branch] ?? branch)}</div></div>`;
  }
  h += `</div>`;
  if (info) h += `<div class="saju8-info">${info}</div>`;
  h += `</div>`;
  return h;
}

// ─── 인자 카드 6셋 (8-a, 8-b) ───
export function renderFactorCards(cards) {
  let h = '<div class="factor-grid">';
  for (const c of cards) {
    const fillWidth = Math.min(100, c.strength);
    h += `
      <div class="factor-card" style="background:${c.color}1a;border-left:3px solid ${c.color};" onclick="toggleFactorCard(this)">
        <div class="icon">${c.icon}</div>
        <div class="name">${c.label}</div>
        <div class="kind">${c.tongMyeong}</div>
        <div class="strength-bar"><div class="strength-fill" style="width:${fillWidth}%;background:${c.color};"></div></div>
        <div class="strength-label" style="color:${c.color};">${c.strengthLabel} ${c.strength}</div>
        <div class="position">
          <span class="pin">📍 ${c.primaryPosition}</span>
          <span class="card-toggle" aria-hidden="true">▾</span>
        </div>
        ${!c.present ? '<div class="note">ⓘ 직접 없음 — 다른 인자 영향으로 작게 표시</div>' : ''}
        <div class="card-detail">${factorCardDetail(c)}</div>
      </div>
    `;
  }
  h += '</div>';
  h += `
    <script>
      window.toggleFactorCard = window.toggleFactorCard || function(el) {
        el.classList.toggle('expanded');
        var t = el.querySelector('.card-toggle');
        if (t) t.textContent = el.classList.contains('expanded') ? '▴' : '▾';
      };
    </script>
  `;
  return h;
}

function triangleRelationLabel(rel) {
  if (!rel) return '';
  if (rel.type === 'hap') return '합(合)';
  if (rel.type === 'donggi') return '동(同)';
  if (rel.type === 'parentGivesChild' || rel.type === 'childGivesParent') return '생(生)';
  if (rel.type === 'parentControlsChild' || rel.type === 'childControlsParent') return '극(剋)';
  return rel.typeLabel?.split('(')[0].trim() ?? '';
}

function triangleSipseongFlow(rel) {
  const tong = rel?.sipseongTong ?? '';
  return {
    인성: '받쳐주는 흐름',
    재성: '결과를 만드는 흐름',
    관성: '기준을 주는 흐름',
    비겁: '함께 닮은 흐름',
    식상: '표현을 열어주는 흐름',
  }[tong] ?? (tong ? `${tong} 흐름` : '');
}

// ─── 삼각구도 SVG (8-c) ───
export function renderTriangleSVG(facts) {
  if (!facts.mother || !facts.father) return '<div>—</div>';

  const motherIlgan = facts.mother.ilgan;
  const fatherIlgan = facts.father.ilgan;
  const childIlgan = facts.child.ilgan;
  const motherRel = facts.ilganRelations.mother;
  const fatherRel = facts.ilganRelations.father;

  const motherLabelRel = triangleRelationLabel(motherRel);
  const fatherLabelRel = triangleRelationLabel(fatherRel);
  const motherFlow = triangleSipseongFlow(motherRel);
  const fatherFlow = triangleSipseongFlow(fatherRel);

  // 어머님 화살표 방향 결정 (자녀→부모 생이면 자녀에서 어머님으로 화살표)
  const motherArrowDir = motherRel?.type === 'parentGivesChild' ? '→' :
                         motherRel?.type === 'childGivesParent' ? '←' :
                         motherRel?.type === 'parentControlsChild' ? '⇒' :
                         motherRel?.type === 'childControlsParent' ? '⇐' :
                         motherRel?.type === 'hap' ? '↔' : '—';

  return `
    <div class="gunghap">
      <svg viewBox="0 0 360 270" style="max-width:360px;display:block;margin:0 auto;">
        <defs>
          <marker id="arr-mom" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <polygon points="0 0, 6 3, 0 6" fill="#c4a578"/>
          </marker>
          <marker id="arr-dad" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <polygon points="0 0, 6 3, 0 6" fill="#5b7ba8"/>
          </marker>
        </defs>
        <line x1="102" y1="180" x2="150" y2="92" stroke="#c4a578" stroke-width="2.2" marker-end="url(#arr-mom)"/>
        <rect x="84" y="119" width="70" height="18" rx="9" fill="#faf6f1"/>
        <text x="119" y="132" text-anchor="middle" font-size="10" fill="#8a6332" font-weight="700">${motherLabelRel}</text>
        <line x1="258" y1="180" x2="210" y2="92" stroke="#5b7ba8" stroke-width="2.2" stroke-dasharray="4,4" marker-end="url(#arr-dad)"/>
        <rect x="206" y="119" width="70" height="18" rx="9" fill="#faf6f1"/>
        <text x="241" y="132" text-anchor="middle" font-size="10" fill="#2d5a8a" font-weight="700">${fatherLabelRel}</text>
        <line x1="110" y1="205" x2="250" y2="205" stroke="#bbb" stroke-width="1" stroke-dasharray="3,5"/>
        <rect x="164" y="195" width="32" height="18" rx="9" fill="#faf6f1"/>
        <text x="180" y="208" text-anchor="middle" font-size="9" fill="#999">부부</text>

        <circle cx="180" cy="54" r="40" fill="white" stroke="#d97757" stroke-width="3"/>
    <text x="180" y="39" text-anchor="middle" font-size="10" fill="#888">${facts.child.fullTitle}</text>
    <text x="180" y="70" text-anchor="middle" font-size="26" font-weight="700" fill="#c84d20">${stemHan(childIlgan)}</text>
    <text x="180" y="108" text-anchor="middle" font-size="10" fill="#999">(${stemNature(childIlgan)})</text>

        <circle cx="72" cy="205" r="40" fill="white" stroke="#c4a578" stroke-width="3"/>
    <text x="72" y="190" text-anchor="middle" font-size="10" fill="#888">어머님</text>
    <text x="72" y="223" text-anchor="middle" font-size="26" font-weight="700" fill="#8a6332">${stemHan(motherIlgan)}</text>
    <text x="72" y="260" text-anchor="middle" font-size="10" fill="#999">(${stemNature(motherIlgan)})</text>

        <circle cx="288" cy="205" r="40" fill="white" stroke="#5b7ba8" stroke-width="3"/>
    <text x="288" y="190" text-anchor="middle" font-size="10" fill="#888">아버님</text>
    <text x="288" y="223" text-anchor="middle" font-size="26" font-weight="700" fill="#2d5a8a">${stemHan(fatherIlgan)}</text>
    <text x="288" y="260" text-anchor="middle" font-size="10" fill="#999">(${stemNature(fatherIlgan)})</text>
      </svg>
      <div class="gunghap-summary">
        어머님은 자녀를 <strong style="color:#8a6332;">${motherFlow}</strong>으로,<br/>
        아버님은 자녀에게 <strong style="color:#2d5a8a;">${fatherFlow}</strong>으로 자리합니다.
      </div>
    </div>
  `;
}

// ─── 매트릭스 카드 ───
export function renderMatrixCard(card) {
  const pat = card.pattern;
  const isSyn = card.isSynergy;
  const isCon = card.isConflict;
  const isAmb = card.isAmbivalent;
  const cls = isSyn ? 'syn-card' : isCon ? 'con-card' : isAmb ? 'amb-card' : 'syn-card';
  const icon = isSyn ? '✨' : isCon ? '⚠' : isAmb ? '◑' : '✨';
  const patternLabel = {
    strong_synergy: '강한 시너지',
    synergy: '시너지',
    complement: '보완',
    ambivalent: '양면',
    conflict_risk: '충돌 위험',
    strong_conflict: '강한 충돌',
  }[pat] ?? pat;

  return `
    <div class="matrix-card ${cls}">
      <div class="header">${icon} ${card.header}</div>
      <div class="sub">${patternLabel} — ${card.axisKorean}의 기운 × 자녀 ${card.factorKorean}</div>
      <div class="body">
        <p style="margin:0 0 8px 0;color:#666;font-style:italic;">[LLM 본문 3단: 부모 결 → 자녀 결 → 결합 결과]</p>
        <p style="margin:0;color:#444;">${card.tone}</p>
        <div style="margin-top:10px;padding:10px 12px;background:rgba(255,143,163,0.1);border-radius:6px;border-left:3px solid #FF8FA3;font-size:12px;color:#666;">
          <strong>일상에서는… [LLM]</strong>
        </div>
        ${isCon ? `<div style="margin-top:8px;padding:10px 12px;background:rgba(149,197,64,0.1);border-radius:6px;border-left:3px solid #95C540;font-size:12px;color:#5d8225;"><strong>🌿 이렇게 풀어보세요</strong> [LLM]</div>` : ''}
      </div>
    </div>
  `;
}

// ─── LLM placeholder ───
export function llmPlaceholder(text) {
  return `<div class="llm-placeholder">[LLM: ${text}]</div>`;
}

export function renderMatrixCardRich(card) {
  const isSyn = card.isSynergy;
  const isCon = card.isConflict;
  const isAmb = card.isAmbivalent;
  const cls = isSyn ? 'syn-card' : isCon ? 'con-card' : isAmb ? 'amb-card' : 'syn-card';
  const icon = isSyn ? '✨' : isCon ? '⚠️' : isAmb ? '🔄' : '✨';
  const patternLabel = {
    strong_synergy: '강한 시너지',
    synergy: '시너지',
    complement: '보완',
    ambivalent: '양면',
    conflict_risk: '충돌 위험',
    strong_conflict: '강한 충돌',
  }[card.pattern] ?? card.pattern;
  const titleNames = card.header.match(/(어머님|아버님).*?(child\d+\s[군양]|김수민\s양)/) || card.header.match(/(child\d+\s[군양]|김수민\s양).*?(어머님|아버님)/);
  const parentName = titleNames?.[1]?.startsWith('child') || titleNames?.[1]?.includes('김수민') ? titleNames?.[2] : titleNames?.[1];
  const childName = titleNames?.[1]?.startsWith('child') || titleNames?.[1]?.includes('김수민') ? titleNames?.[1] : titleNames?.[2];
  const parent = parentName || '부모님';
  const child = childName || '아이';
  const childTone = {
    hwalgi: `${child}은 활기로운 결이 강한 아이입니다. 몸과 행동으로 먼저 표현하고, 에너지가 올라오면 바로 움직이며 배웁니다. 충분히 움직일 자리가 열리면 표정이 밝아지고 다음 활동으로 넘어가는 힘도 좋아집니다.`,
    josim: `${child}은 신중한 결이 강한 아이입니다. 새 자극 앞에서 한 박자 멈춰 살피고, 충분히 본 뒤에야 다가가는 결입니다. 재촉보다 안전 신호를 먼저 받으면 자기 속도로 훨씬 편안하게 움직입니다.`,
    manjok: `${child}은 밝게 느끼는 결이 강한 아이입니다. 좋은 감정과 즐거운 반응을 통해 마음이 열리고 안정됩니다. 작은 칭찬이나 즐거운 경험을 오래 기억하며, 그 기억이 다음 시도의 힘이 됩니다.`,
    heundeullim: `${child}은 깊이 느끼는 결이 강한 아이입니다. 작은 변화에도 마음이 흔들리고, 한 번 받은 감정이 오래 머무는 결입니다. 감정이 내려갈 시간을 충분히 받으면 다시 부드럽게 회복됩니다.`,
    eoullim: `${child}은 관계를 깊이 느끼는 결이 강한 아이입니다. 주변 사람의 표정과 분위기를 빨리 읽고 함께 맞추려는 결입니다. 따뜻한 관계 안에서는 마음을 크게 열지만, 너무 많은 감정을 받으면 혼자 정리할 시간도 필요합니다.`,
    kkeungi: `${child}은 끈기 있는 결이 강한 아이입니다. 한 번 시작한 일을 오래 붙잡고 자기 페이스로 끝까지 해내려는 결입니다. 중간에 흐름이 끊기지 않으면 작은 과제도 끝까지 붙잡으며 성취감을 쌓습니다.`,
  }[card.factor] ?? `${card.factorKorean} 결이 강한 아이입니다.`;
  const parentTone = {
    ongi: `${parent}의 받쳐주는 흐름은 아이의 감정을 따뜻하게 받아주고, 흔들린 마음을 안정시키는 자리입니다. 아이가 실수하거나 멈칫할 때도 먼저 품어주는 반응이 들어오면, 아이는 자기 결을 숨기지 않고 다시 꺼낼 수 있습니다.`,
    jungsim: `${parent}의 중심 흐름은 기준과 방향을 보여주며, 아이가 어디까지 해도 되는지 알게 해주는 자리입니다. 단단한 기준은 아이를 누르기 위한 틀이 아니라, 아이가 안심하고 자기 힘을 써볼 수 있게 해주는 울타리에 가깝습니다.`,
    ilgwan: `${parent}의 일관 흐름은 같은 시간과 같은 약속을 지켜주며, 아이에게 예측 가능한 일상을 만들어주는 자리입니다. 반복되는 순서와 말투가 쌓이면 아이는 다음 일을 미리 알고 마음을 준비할 수 있습니다.`,
    jayul: `${parent}의 자율 흐름은 아이가 자기 속도로 움직일 수 있게 기다려주고, 스스로 해보는 자리를 열어줍니다. 선택권이 조금씩 주어질 때 아이는 지시를 따르는 것보다 자기 힘으로 해냈다는 감각을 더 깊게 배웁니다.`,
    pyohyeon: `${parent}의 표현 흐름은 말과 표정으로 마음을 크게 전하고, 아이에게 반응과 격려를 주는 자리입니다. 아이는 부모님의 표정과 말투를 통해 자기 행동이 어떻게 받아들여지는지 빠르게 확인합니다.`,
    baram: `${parent}의 바람 흐름은 결과와 성취를 기대하며, 아이에게 더 나아가기를 바라는 자리입니다. 기대가 따뜻하게 전달되면 아이에게 추진력이 되지만, 너무 빠르게 전달되면 부담으로 느껴질 수 있습니다.`,
  }[card.axis] ?? `부모님의 ${card.axisKorean} 흐름이 아이의 결과 만나는 자리입니다.`;
  const resultTone = isCon
    ? `이 두 결이 만나면 ${card.tone}. 아이에게는 부모님의 말과 기대가 빠르거나 크게 느껴질 수 있으므로, 속도와 기대치를 한 번 낮춰주는 것이 중요합니다. 부모님의 의도는 사랑이어도 아이에게는 압력처럼 들어올 수 있는 자리라, 먼저 안심을 주고 그다음에 방향을 제시하는 순서가 잘 맞습니다.`
    : `이 두 결이 만나면 ${card.tone}. 부모님의 흐름이 아이의 결을 밀어붙이기보다 단단하게 받쳐주면서, 아이가 자기 속도로 자라도록 돕는 자리입니다. ${child}이 ${parent}과 함께 무언가를 이어갈 때 가장 깊이 자라는 결합으로 볼 수 있습니다.`;
  const dailyByFactor = {
    hwalgi: `${parent}과 함께 밖에 나가거나 몸을 쓰는 놀이를 할 때, ${child}이 평소보다 더 빨리 반응하고 에너지를 크게 드러낼 수 있습니다.`,
    josim: `${parent}이 새 장소나 새 놀이를 먼저 설명해주면, ${child}이 한 박자 살핀 뒤 조금씩 다가가는 모습이 자주 보입니다.`,
    manjok: `${parent}이 작은 칭찬이나 즐거운 반응을 보여주면, ${child}이 그 순간을 오래 기억하고 다시 해보려는 마음을 냅니다.`,
    heundeullim: `${parent}의 표정이나 말투가 조금만 달라져도 ${child}이 깊게 받아들일 수 있어, 감정이 올라온 뒤에는 조용히 가라앉을 시간이 필요합니다.`,
    eoullim: `${parent}과 함께 사람을 만나거나 가족 분위기를 나눌 때, ${child}이 표정과 분위기를 빨리 읽고 맞추려는 모습이 보입니다.`,
    kkeungi: `${parent}과 함께 퍼즐을 맞추거나 자전거 타기를 배울 때, ${child}이 평소보다 더 오래 집중하고 끝까지 해내려는 모습이 나타납니다.`,
  }[card.factor] ?? `${parent}과 함께 있을 때 ${child}의 ${card.factorKorean} 결이 드러납니다.`;
  const dailySecond = isCon
    ? `${parent}이 좋은 뜻으로 재촉하거나 기대를 크게 표현하면 ${child}이 한 발 물러서거나 표정이 굳을 수 있습니다. 이때는 바로 더 설명하기보다 "천천히 해도 돼", "여기까지만 해보자"처럼 부담을 낮추는 말이 먼저 필요합니다.`
    : `${parent}이 분명한 말과 반복되는 약속을 함께 주면 ${child}은 그 흐름을 기억하고 따라갑니다. 작은 성공을 끝까지 경험하게 해주면 아이의 결이 더 안정적으로 자리 잡습니다.`;
  const guide = isCon
    ? `${parent}의 ${card.axisKorean} 흐름을 바로 밀어붙이기보다 한 단계 낮춘 말투로 전해 주세요. 기대를 줄이라는 뜻이 아니라, 아이가 받아들일 수 있는 크기로 나누어 주면 ${child}의 ${card.factorKorean} 결이 훨씬 자연스럽게 자랍니다.`
    : `${parent}의 ${card.axisKorean} 흐름을 아이가 알아볼 수 있는 작은 약속으로 바꾸어 주세요. "이것까지 하고 쉬자", "한 번만 더 해보자"처럼 끝이 보이는 기준을 주면 ${child}의 ${card.factorKorean} 결이 안정적으로 이어집니다.`;

  return `
    <div class="matrix-card ${cls}">
      <div class="header">${icon} ${card.header}</div>
      <div class="sub">${patternLabel} — 부모님의 ${card.axisKorean} 흐름 × 자녀 ${card.factorKorean} 결</div>
      <div class="body">
        <p style="margin:0 0 12px 0;">${parentTone}</p>
        <p style="margin:0 0 12px 0;">${childTone}</p>
        <p style="margin:0 0 12px 0;">${resultTone}</p>
        <div style="margin-top:10px;padding:10px 12px;background:rgba(255,143,163,0.1);border-radius:6px;border-left:3px solid #FF8FA3;font-size:12px;color:#666;">
          <strong>🌸 일상에서는…</strong>
          <p style="margin:6px 0 0 0;">${dailyByFactor}</p>
          <p style="margin:6px 0 0 0;">${dailySecond}</p>
        </div>
        ${isCon ? `<div style="margin-top:8px;padding:10px 12px;background:rgba(149,197,64,0.1);border-radius:6px;border-left:3px solid #95C540;font-size:12px;color:#5d8225;"><strong>🌿 이렇게 풀어보세요:</strong> ${guide}</div>` : ''}
      </div>
    </div>
  `;
}
