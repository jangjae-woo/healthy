const CAUSE_RULES = [
  { key: 'johu-imbalance', tokens: ['조후 불균형', '조후 극단', '조후 치우침', '조후'] },
  { key: 'johu-balance', tokens: ['조후 균형'] },
  { key: 'chilsal-sinyak', tokens: ['칠살', '관성 강 + 신약', '관성 강', '신약'] },
  { key: 'gwanin-sangsaeng', tokens: ['관인상생'] },
  { key: 'gwanseong', tokens: ['관성'] },
  { key: 'inseong', tokens: ['인성'] },
  { key: 'siksang', tokens: ['식상'] },
  { key: 'jaeseong', tokens: ['재성'] },
  { key: 'bigyeop', tokens: ['비겁'] },
  { key: 'yangin', tokens: ['양인'] },
  { key: 'munchang', tokens: ['문창'] },
  { key: 'cheoneul', tokens: ['천을'] },
  { key: 'unseong-strong', tokens: ['12운성 강세'] },
  { key: 'unseong-weak', tokens: ['12운성 약세'] },
  { key: 'singang', tokens: ['신강', '극강', '태강'] },
  { key: 'sinyak', tokens: ['신약', '극약', '태약'] },
  { key: 'neutral-strength', tokens: ['중화', '균형'] },
  { key: 'yang-daymaster', tokens: ['양일간'] },
  { key: 'eum-daymaster', tokens: ['음일간'] },
  { key: 'oheng-mok', tokens: ['목 오행', '木', '목'] },
  { key: 'oheng-hwa', tokens: ['화 오행', '火', '화'] },
  { key: 'oheng-to', tokens: ['토 오행', '土', '토'] },
  { key: 'oheng-geum', tokens: ['금 오행', '金', '금'] },
  { key: 'oheng-su', tokens: ['수 오행', '水', '수'] },
  { key: 'missing-gwan', tokens: ['관성 무존재', '관성 없음'] },
  { key: 'missing-inseong', tokens: ['인성 무존재', '인성 부족'] },
];

const CHILD_PRIORITY = [
  'johu-imbalance',
  'chilsal-sinyak',
  'gwanin-sangsaeng',
  'unseong-weak',
  'unseong-strong',
  'gwanseong',
  'inseong',
  'siksang',
  'jaeseong',
  'bigyeop',
  'munchang',
  'cheoneul',
  'johu-balance',
  'singang',
  'sinyak',
  'neutral-strength',
];

const PARENT_PRIORITY = [
  'gwanseong',
  'inseong',
  'siksang',
  'jaeseong',
  'bigyeop',
  'yangin',
  'munchang',
  'cheoneul',
  'gwanin-sangsaeng',
  'unseong-strong',
  'unseong-weak',
  'singang',
  'sinyak',
  'neutral-strength',
  'johu-balance',
  'johu-imbalance',
  'yang-daymaster',
  'eum-daymaster',
  'oheng-mok',
  'oheng-hwa',
  'oheng-to',
  'oheng-geum',
  'oheng-su',
];

function lineSign(line) {
  const trimmed = String(line ?? '').trim();
  if (trimmed.startsWith('-')) return -1;
  if (trimmed.startsWith('+')) return 1;
  return 0;
}

function lineWeight(line) {
  const m = String(line ?? '').match(/=\s*(-?\d+(?:\.\d+)?)/);
  if (!m) return 1;
  return Math.abs(Number(m[1])) || 1;
}

function causeKeyFromLine(line) {
  const text = String(line ?? '');
  const matched = CAUSE_RULES.find(rule => rule.tokens.some(token => text.includes(token)));
  return matched?.key ?? null;
}

function sortCauseEntries(entries, priority) {
  const priorityIndex = new Map(priority.map((key, index) => [key, index]));
  return [...entries].sort((a, b) => {
    const pa = priorityIndex.get(a.key) ?? 999;
    const pb = priorityIndex.get(b.key) ?? 999;
    if (pa !== pb) return pa - pb;
    if (a.sign !== b.sign) return b.sign - a.sign;
    return b.weight - a.weight;
  });
}

function extractCauseKeys(trace, { limit = 2, priority = CHILD_PRIORITY, preferPositive = false } = {}) {
  const best = new Map();
  for (const rawLine of trace ?? []) {
    const key = causeKeyFromLine(rawLine);
    if (!key) continue;
    const entry = {
      key,
      sign: lineSign(rawLine),
      weight: lineWeight(rawLine),
    };
    const prev = best.get(key);
    if (!prev || entry.weight > prev.weight || (preferPositive && entry.sign > prev.sign)) {
      best.set(key, entry);
    }
  }

  const entries = sortCauseEntries(best.values(), priority)
    .filter(entry => !preferPositive || entry.sign >= 0 || best.size <= limit);

  const keys = entries.map(entry => entry.key).slice(0, limit);
  while (keys.length < limit) keys.push('general');
  return keys;
}

function extractCauseKeysBySign(trace, sign, limit = 1) {
  const best = new Map();
  for (const rawLine of trace ?? []) {
    if (lineSign(rawLine) !== sign) continue;
    const key = causeKeyFromLine(rawLine);
    if (!key) continue;
    const entry = {
      key,
      sign,
      weight: lineWeight(rawLine),
    };
    const prev = best.get(key);
    if (!prev || entry.weight > prev.weight) best.set(key, entry);
  }

  const keys = sortCauseEntries(best.values(), CHILD_PRIORITY)
    .map(entry => entry.key)
    .slice(0, limit);
  while (keys.length < limit) keys.push('general');
  return keys;
}

export function childCauseKeys(factorResult, limit = 2) {
  return extractCauseKeys(factorResult?.trace, {
    limit,
    priority: CHILD_PRIORITY,
    preferPositive: false,
  });
}

export function factorCauseSignature(factorResult) {
  const makerCauses = extractCauseKeysBySign(factorResult?.trace, 1, 1);
  const suppressorCauses = extractCauseKeysBySign(factorResult?.trace, -1, 1);
  return {
    makerCauses,
    suppressorCauses,
    makerCauseKey: makerCauses.join('+'),
    suppressorCauseKey: suppressorCauses.join('+'),
  };
}

export function parentCauseKeys(axisResult, limit = 2) {
  return extractCauseKeys(axisResult?.trace, {
    limit,
    priority: PARENT_PRIORITY,
    preferPositive: true,
  });
}

export function matrixComboSignature({ facts, role, card }) {
  const parentAxes = role === 'mother' ? facts?.motherAxes : facts?.fatherAxes;
  const parentAxis = parentAxes?.[card?.axis];
  const childFactor = facts?.childFactors?.[card?.factor];
  const parentCauses = parentCauseKeys(parentAxis, 2);
  const childCauses = childCauseKeys(childFactor, 2);

  return {
    parentCauses,
    childCauses,
    parentCauseKey: parentCauses.join('+'),
    childCauseKey: childCauses.join('+'),
  };
}
