import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { factorCauseSignature, matrixComboSignature, parentCauseKeys } from './combo-signature.mjs';
import { getCompatibilityJudgmentTypes, getFactorJudgmentTypes, getMatrixJudgmentTypes, getParentJudgmentTypes } from './judgment-types.mjs';

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));

const CACHE_DIRS = [
  path.join(MODULE_DIR, 'block-cache-data'),
  path.join(process.cwd(), 'lib', 'youa-engine', 'youa', 'block-cache-data'),
  path.join(process.cwd(), '아이기질브라덜', 'block-cache-v1', 'cache'),
];

const GROUP_RULES = [
  ['support', ['인성', '정인', '편인', '천을', '받쳐', '보호', '안정']],
  ['expression', ['식상', '식신', '상관', '문창', '표현', '생산', '움직']],
  ['standard', ['관성', '정관', '편관', '칠살', '기준', '절제', '규칙']],
  ['result', ['재성', '정재', '편재', '결과', '성취', '보상']],
  ['same', ['비겁', '비견', '겁재', '신강', '자기', '같은 결']],
  ['climate', ['조후', '목', '화', '토', '금', '수', '양인', '도화', '역마', '화개', '12운성', '충']],
];

let loadedCache = null;

function readJsonIfExists(dir, fileName) {
  const filePath = path.join(dir, fileName);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function toBlockMap(json) {
  const map = new Map();
  const blocks = json?.blocks;
  if (!blocks) return map;
  const values = Array.isArray(blocks) ? blocks : Object.values(blocks);
  for (const block of values) {
    if (block?.key) map.set(block.key, block);
  }
  return map;
}

function loadBlockCache() {
  if (loadedCache) return loadedCache;

  for (const dir of CACHE_DIRS) {
    const factorBlocks = readJsonIfExists(dir, 'factor-blocks.json');
    const factorComboBlocks = readJsonIfExists(dir, 'factor-combo-blocks.json');
    const factorCauseBlocks = readJsonIfExists(dir, 'factor-cause-blocks.json');
    const parentSajuBlocks = readJsonIfExists(dir, 'parent-saju-blocks.json');
    const parentCauseBlocks = readJsonIfExists(dir, 'parent-cause-blocks.json');
    const compatibilityBlocks = readJsonIfExists(dir, 'compatibility-blocks.json');
    const compatibilityCauseBlocks = readJsonIfExists(dir, 'compatibility-cause-blocks.json');
    const parentPalaceBlocks = readJsonIfExists(dir, 'parent-palace-blocks.json');
    const matrixCardBlocks = readJsonIfExists(dir, 'matrix-card-blocks.json');
    const matrixComboBlocks = readJsonIfExists(dir, 'matrix-combo-blocks.json');
    if (factorBlocks && factorComboBlocks) {
      loadedCache = {
        factor: toBlockMap(factorBlocks),
        factorCombo: toBlockMap(factorComboBlocks),
        factorCause: toBlockMap(factorCauseBlocks),
        parentSaju: toBlockMap(parentSajuBlocks),
        parentCause: toBlockMap(parentCauseBlocks),
        compatibility: toBlockMap(compatibilityBlocks),
        compatibilityCause: toBlockMap(compatibilityCauseBlocks),
        parentPalace: toBlockMap(parentPalaceBlocks),
        matrixCard: toBlockMap(matrixCardBlocks),
        matrixCombo: toBlockMap(matrixComboBlocks),
      };
      return loadedCache;
    }
  }

  loadedCache = {
    factor: new Map(),
    factorCombo: new Map(),
    factorCause: new Map(),
    parentSaju: new Map(),
    parentCause: new Map(),
    compatibility: new Map(),
    compatibilityCause: new Map(),
    parentPalace: new Map(),
    matrixCard: new Map(),
    matrixCombo: new Map(),
  };
  return loadedCache;
}

const STEM_KEY = {
  갑: 'gap',
  을: 'eul',
  병: 'byeong',
  정: 'jeong',
  무: 'mu',
  기: 'gi',
  경: 'gyeong',
  신: 'sin',
  임: 'im',
  계: 'gye',
};

export function fiveLevelFromScore(score) {
  const n = Number(score);
  if (!Number.isFinite(n)) return '중간';
  if (n <= 20) return '매우낮음';
  if (n <= 40) return '낮음';
  if (n <= 60) return '중간';
  if (n <= 80) return '높음';
  return '매우높음';
}

function groupFromTitles(titles, fallback) {
  const text = (titles ?? []).join(' ');
  for (const [group, tokens] of GROUP_RULES) {
    if (tokens.some(token => text.includes(token))) return group;
  }
  return fallback;
}

function normalizeKoreanParticles(text) {
  return text
    .replace(/([가-힣]+ 양)를/g, '$1을')
    .replace(/([가-힣]+ 군)를/g, '$1을')
    .replace(/([가-힣]+ 양)는/g, '$1은')
    .replace(/([가-힣]+ 군)는/g, '$1은')
    .replace(/어머님가/g, '어머님이')
    .replace(/아버님가/g, '아버님이')
    .replace(/([가-힣]+ 양)가/g, '$1이')
    .replace(/([가-힣]+ 군)가/g, '$1이')
    .replace(/활기은/g, '활기는')
    .replace(/활기이/g, '활기가')
    .replace(/활기을/g, '활기를')
    .replace(/활기과/g, '활기와')
    .replace(/끈기은/g, '끈기는')
    .replace(/끈기이/g, '끈기가')
    .replace(/끈기을/g, '끈기를')
    .replace(/끈기과/g, '끈기와')
    .replace(/조심는/g, '조심은')
    .replace(/조심가/g, '조심이')
    .replace(/조심를/g, '조심을')
    .replace(/조심와/g, '조심과')
    .replace(/만족는/g, '만족은')
    .replace(/만족가/g, '만족이')
    .replace(/만족를/g, '만족을')
    .replace(/만족와/g, '만족과')
    .replace(/흔들림는/g, '흔들림은')
    .replace(/흔들림가/g, '흔들림이')
    .replace(/흔들림를/g, '흔들림을')
    .replace(/흔들림와/g, '흔들림과')
    .replace(/어울림는/g, '어울림은')
    .replace(/어울림가/g, '어울림이')
    .replace(/어울림를/g, '어울림을')
    .replace(/어울림와/g, '어울림과');
}

export function applyBlockVars(value, vars) {
  if (Array.isArray(value)) return value.map(item => applyBlockVars(item, vars));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, applyBlockVars(item, vars)]));
  }
  if (typeof value !== 'string') return value;
  return normalizeKoreanParticles(value.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? '')));
}

export function getFactorTextBlock({ facts, factorKey, makers, suppressors }) {
  const f = facts?.childFactors?.[factorKey];
  if (!f) return null;

  const cache = loadBlockCache();
  const factor = f.factorKorean;
  const level = fiveLevelFromScore(f.score);
  const makerGroup = groupFromTitles(makers, 'climate');
  const suppressorGroup = groupFromTitles(suppressors, 'support');
  const signature = factorCauseSignature(f);
  const judgment = getFactorJudgmentTypes(facts, factorKey);
  const judgmentKeys = [
    `youa.factor|factor=${factorKey}|factorBand=${judgment.factorBand}|childTemperamentPattern=${judgment.childTemperamentPattern}|factorExpressionPattern=${judgment.factorExpressionPattern}|factorCausePattern=${judgment.factorCausePattern}|dailyCarePattern=${judgment.dailyCarePattern}|tone=brother-index`,
    `youa.factor|factor=${factorKey}|factorBand=${judgment.factorBand}|factorCausePattern=${judgment.factorCausePattern}|tone=brother-index`,
  ];
  const causeKey = `factorCause|slot1_4_5_6|${factorKey}|${level}|maker=${signature.makerCauseKey}|suppressor=${signature.suppressorCauseKey}`;
  const comboKey = `factorCombo|${factor}|${level}|${makerGroup}|${suppressorGroup}`;
  const baseKey = `factor|${factor}|${level}`;
  const cause = judgmentKeys.map(key => cache.factorCause.get(key)).find(Boolean)
    ?? cache.factorCause.get(causeKey)
    ?? cache.factorCause.get(`factorCause|slot1_4_5_6|${factorKey}|${level}|maker=${signature.makerCauses[0]}|suppressor=general`)
    ?? cache.factorCause.get(`factorCause|slot1_4_5_6|${factorKey}|${level}|maker=general|suppressor=${signature.suppressorCauses[0]}`);
  const combo = cache.factorCombo.get(comboKey);
  const base = cache.factor.get(baseKey);

  if (!cause && !combo && !base) return null;

  return applyBlockVars({
    ...(base ?? {}),
    ...(combo ?? {}),
    ...(cause ?? {}),
    summary: base?.summary,
    level,
    makerGroup,
    suppressorGroup,
    judgment,
  }, {
    childName: facts.child?.fullTitle ?? facts.child?.name ?? '아이',
    factor,
    score: Math.round(Number(f.score) || 0),
    level,
  });
}

export function getParentSajuTextBlock({ facts, role, parentMainTrait }) {
  const parent = facts?.[role];
  if (!parent) return null;

  const cache = loadBlockCache();
  const stemKey = STEM_KEY[parent.ilgan];
  const axes = role === 'mother' ? facts?.motherAxes : facts?.fatherAxes;
  const topAxisEntry = Object.entries(axes ?? {}).sort((a, b) => Number(b[1]?.score ?? 0) - Number(a[1]?.score ?? 0))[0];
  const topAxisKey = topAxisEntry?.[0] ?? 'general';
  const topCause = parentCauseKeys(topAxisEntry?.[1], 1)[0] ?? 'general';
  const judgment = getParentJudgmentTypes(facts, role);
  const causeBlock = cache.parentCause.get(`youa.parent|role=${role}|ilgan=${stemKey}|parentCarePattern=${judgment.parentCarePattern}|parentCausePattern=${judgment.parentCausePattern}|tone=brother-index`)
    ?? cache.parentCause.get(`parentCause|slot7_8|${role}|${stemKey}|axis=${topAxisKey}|cause=${topCause}`);
  const block = causeBlock ?? cache.parentSaju.get(`parentSaju|${role}|${stemKey}`);
  if (!block) return null;

  return applyBlockVars(block, {
    parentName: `${parent.name} ${parent.label}`,
    parentTitle: parent.label,
    childName: facts.child?.fullTitle ?? '아이',
    parentMainTrait: parentMainTrait || '생활의 중심을 잡아주는',
  });
}

export function getCompatibilityTextBlock({ facts, role }) {
  const rel = facts?.ilganRelations?.[role];
  const parent = facts?.[role];
  if (!rel || !parent) return null;

  const relationType = rel.type === 'donggi' ? 'same' : rel.type;
  const childStemKey = STEM_KEY[rel.childIlgan ?? facts.child?.ilgan];
  const parentStemKey = STEM_KEY[rel.parentIlgan ?? parent.ilgan];
  if (!childStemKey || !parentStemKey || relationType === 'hap') return null;

  const cache = loadBlockCache();
  const judgment = getCompatibilityJudgmentTypes(facts, role);
  const block = cache.compatibilityCause.get(`youa.compatibility|role=${role}|childIlgan=${childStemKey}|parentIlgan=${parentStemKey}|relationPattern=${judgment.relationPattern}|relationCarePattern=${judgment.relationCarePattern}|relationRiskPattern=${judgment.relationRiskPattern}|childTemperamentPattern=${judgment.childTemperamentPattern}|tone=brother-index`)
    ?? cache.compatibilityCause.get(`compatibilityCause|slot09_10|${role}|${childStemKey}|${parentStemKey}|${relationType}|care=${judgment.relationCarePattern}|risk=${judgment.relationRiskPattern}`)
    ?? cache.compatibility.get(`compatibility|${role}|${childStemKey}|${parentStemKey}|${relationType}`);
  if (!block) return null;

  return applyBlockVars(block, {
    parentTitle: parent.label,
    parentName: `${parent.name} ${parent.label}`,
    childName: facts.child?.fullTitle ?? '아이',
  });
}

const MATRIX_AXIS_KEY = {
  ongi: 'support',
  jungsim: 'standard',
  ilgwan: 'consistent',
  jayul: 'same',
  pyohyeon: 'expression',
  baram: 'result',
};

function matrixStrengthKey(card) {
  if (String(card.pattern ?? '').includes('strong')) return 'strong';
  const n = Number(card.cellStrength ?? 0);
  if (n >= 80) return 'strong';
  if (n >= 60) return 'middle';
  return 'soft';
}

function matrixPatternType(card) {
  return card?.isConflict ? 'conflict' : 'synergy';
}

export function getMatrixComboTextBlock({ facts, role, card }) {
  if (!card) return null;
  const parent = facts?.[role];
  const axisKey = MATRIX_AXIS_KEY[card.axis];
  if (!parent || !axisKey) return null;

  const cache = loadBlockCache();
  if (!cache.matrixCombo?.size) return null;

  const signature = matrixComboSignature({ facts, role, card });
  const judgment = getMatrixJudgmentTypes({ facts, role, card });
  const patternType = matrixPatternType(card);
  const strengthKey = matrixStrengthKey(card);
  const keys = [
    `youa.matrix|parentRole=${role}|parentCarePattern=${judgment.parentCarePattern}|parentChildSynergyPattern=${judgment.parentChildSynergyPattern}|parentChildConflictPattern=${judgment.parentChildConflictPattern}|disciplineRiskPattern=${judgment.disciplineRiskPattern}|parentAxis=${card.axis}|childFactor=${card.factor}|tone=brother-index`,
    `youa.matrix|parentRole=${role}|parentAxis=${card.axis}|childFactor=${card.factor}|matrixCausePattern=${judgment.matrixCausePattern}|patternType=${judgment.patternType}|tone=brother-index`,
    `matrixCombo|slot11_21|${role}|${axisKey}|${card.factor}|${patternType}|${strengthKey}|p=${signature.parentCauseKey}|c=${signature.childCauseKey}`,
    `matrixCombo|slot11_21|${role}|${axisKey}|${card.factor}|${patternType}|p=${signature.parentCauseKey}|c=${signature.childCauseKey}`,
    `matrixCombo|slot11_21|${role}|${axisKey}|${card.factor}|${patternType}|p=${signature.parentCauses[0]}|c=${signature.childCauses[0]}`,
    `matrixCombo|slot11_21|${role}|${axisKey}|${card.factor}|${patternType}`,
  ];
  const block = keys.map(key => cache.matrixCombo.get(key)).find(Boolean);
  if (!block) return null;

  return applyBlockVars({
    ...block,
    parentCauses: signature.parentCauses,
    childCauses: signature.childCauses,
    judgment,
  }, {
    parentTitle: parent.label,
    parentName: `${parent.name} ${parent.label}`,
    childName: facts.child?.fullTitle ?? '?꾩씠',
    parentAxisScore: Math.round(Number(card.axisScore) || 0),
    childFactorScore: Math.round(Number(card.factorScore) || 0),
  });
}

export function getMatrixCardTextBlock({ facts, role, card }) {
  if (!card) return null;
  const parent = facts?.[role];
  const axisKey = MATRIX_AXIS_KEY[card.axis];
  const typeKey = card.isConflict ? 'conflict' : 'synergy';
  const strengthKey = matrixStrengthKey(card);
  if (!parent || !axisKey) return null;

  const cache = loadBlockCache();
  const block = cache.matrixCard.get(`matrix|${role}|${axisKey}|${card.factorKorean}|${typeKey}|${strengthKey}`);
  if (!block) return null;

  return applyBlockVars(block, {
    parentTitle: parent.label,
    parentName: `${parent.name} ${parent.label}`,
    childName: facts.child?.fullTitle ?? '아이',
    parentAxisScore: Math.round(Number(card.axisScore) || 0),
    childFactorScore: Math.round(Number(card.factorScore) || 0),
  });
}
