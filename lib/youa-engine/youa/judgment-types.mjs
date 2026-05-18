import { childCauseKeys, factorCauseSignature, matrixComboSignature, parentCauseKeys } from './combo-signature.mjs';

const FACTOR_ORDER = ['hwalgi', 'josim', 'manjok', 'heundeullim', 'eoullim', 'kkeungi'];

const PARENT_CARE_BY_AXIS = {
  ongi: 'warm_support',
  jungsim: 'stable_boundary',
  ilgwan: 'consistent_routine',
  jayul: 'autonomy_space',
  pyohyeon: 'expressive_feedback',
  baram: 'result_guidance',
};

const LEARNING_BY_AXIS = {
  ongi: 'learns_by_modeling',
  jungsim: 'learns_by_boundary',
  ilgwan: 'learns_by_routine',
  jayul: 'learns_by_choice',
  pyohyeon: 'learns_by_expression',
  baram: 'learns_by_result',
};

function scoreBand(score) {
  const n = Number(score);
  if (!Number.isFinite(n)) return '중간';
  if (n <= 20) return '매우낮음';
  if (n <= 40) return '낮음';
  if (n <= 60) return '중간';
  if (n <= 80) return '높음';
  return '매우높음';
}

function expressionPattern(score) {
  const band = scoreBand(score);
  if (band === '매우높음') return 'factor_very_high_overflow';
  if (band === '높음') return 'factor_high_direct';
  if (band === '중간') return 'factor_mid_contextual';
  if (band === '낮음') return 'factor_low_inner';
  return 'factor_very_low_reserved';
}

function topFactorEntries(childFactors, count = 2) {
  return Object.entries(childFactors ?? {})
    .filter(([, value]) => Number.isFinite(Number(value?.score)))
    .sort((a, b) => Number(b[1].score) - Number(a[1].score))
    .slice(0, count);
}

function childTemperamentPatternFromTop(topKey, secondKey) {
  if (topKey === 'hwalgi') return 'active_expression';
  if (topKey === 'josim') return 'cautious_stability';
  if (topKey === 'heundeullim') return 'sensitive_recovery';
  if (topKey === 'eoullim') return secondKey === 'hwalgi' ? 'social_open' : 'social_attachment';
  if (topKey === 'kkeungi') return 'persistent_rhythm';
  if (topKey === 'manjok') return 'contentment_stability';
  return 'balanced_moderate';
}

function dailyCarePattern(factorKey, factorResult) {
  const causes = childCauseKeys(factorResult, 2);
  if (factorKey === 'heundeullim' || causes.includes('johu-imbalance')) return 'needs_recovery_rhythm';
  if (factorKey === 'josim' || causes.includes('chilsal-sinyak')) return 'needs_preview_and_boundary';
  if (factorKey === 'hwalgi' || factorKey === 'eoullim' || causes.includes('siksang')) return 'needs_expression_channel';
  if (factorKey === 'kkeungi') return 'needs_repeatable_routine';
  return 'needs_safe_observation';
}

function emotionRegulationPattern(facts) {
  const heundeullim = facts?.childFactors?.heundeullim;
  const hwalgi = facts?.childFactors?.hwalgi;
  const kkeungi = facts?.childFactors?.kkeungi;
  if (Number(heundeullim?.score ?? 0) >= 66) return 'needs_co_regulation';
  if (Number(hwalgi?.score ?? 0) >= 66 && Number(heundeullim?.score ?? 0) >= 56) return 'quick_reactive';
  if (Number(kkeungi?.score ?? 0) >= 66) return 'stable_with_routine';
  return 'slow_recovery';
}

function attachmentPattern(facts) {
  const eoullim = Number(facts?.childFactors?.eoullim?.score ?? 0);
  const josim = Number(facts?.childFactors?.josim?.score ?? 0);
  if (eoullim >= 66 && josim <= 55) return 'social_open';
  if (eoullim >= 66) return 'warm_close';
  if (josim >= 66) return 'selective_slow';
  return 'independent_space';
}

function topAxisEntry(facts, role) {
  const axes = role === 'mother' ? facts?.motherAxes : facts?.fatherAxes;
  return Object.entries(axes ?? {})
    .filter(([, value]) => Number.isFinite(Number(value?.score)))
    .sort((a, b) => Number(b[1].score) - Number(a[1].score))[0] ?? null;
}

function parentCausePattern(axisKey, axisResult) {
  const cause = parentCauseKeys(axisResult, 1)[0] ?? 'general';
  return `axis_${axisKey ?? 'general'}__cause_${cause}`;
}

function synergyPattern(card) {
  const axis = card?.axis;
  const factor = card?.factor;
  if (axis === 'jungsim' && factor === 'heundeullim') return 'structure_supports_emotion';
  if (axis === 'ongi' && factor === 'josim') return 'warmth_supports_caution';
  if (axis === 'ilggwan' || axis === 'ilgwan') return factor === 'kkeungi' ? 'routine_supports_persistence' : 'routine_supports_factor';
  if (axis === 'jayul') return 'autonomy_supports_self_pace';
  if (axis === 'pyohyeon') return 'expression_supports_response';
  if (axis === 'baram') return 'result_guidance_supports_growth';
  return 'general_support';
}

function conflictPattern(card) {
  const axis = card?.axis;
  const factor = card?.factor;
  if (!card?.isConflict) return 'low_conflict';
  if (axis === 'baram' && ['heundeullim', 'josim', 'eoullim'].includes(factor)) return 'expectation_pressures_sensitivity';
  if (axis === 'pyohyeon' && ['josim', 'heundeullim'].includes(factor)) return 'expression_overruns_caution';
  if (axis === 'jungsim' && ['hwalgi', 'eoullim'].includes(factor)) return 'boundary_presses_spontaneity';
  return 'speed_mismatch';
}

function disciplineRiskPattern(card) {
  if (!card?.isConflict) {
    if (card?.axis === 'jungsim' || card?.axis === 'ilgwan') return 'boundary_helps';
    return 'low_discipline_risk';
  }
  if (card?.axis === 'jungsim' || card?.axis === 'baram') return 'boundary_overpressure';
  if (card?.axis === 'pyohyeon') return 'speed_mismatch';
  return 'careful_adjustment_needed';
}

function relationPattern(rel) {
  if (!rel) return 'unknown_relation';
  if (rel.type === 'hap') return 'stem_combination_blend';
  if (rel.type === 'donggi') return 'same_element_mirroring';
  if (rel.type === 'parentGivesChild') return 'parent_supports_child';
  if (rel.type === 'parentControlsChild') return 'parent_sets_boundary';
  if (rel.type === 'childGivesParent') return 'child_expresses_to_parent';
  if (rel.type === 'childControlsParent') return 'child_activates_parent_result';
  return 'general_relation';
}

function relationCarePattern(rel) {
  if (!rel) return 'relation_context';
  const tong = rel.sipseongTong;
  if (rel.type === 'parentControlsChild' || tong === '관성') return 'boundary_and_direction';
  if (rel.type === 'parentGivesChild' || tong === '인성') return 'support_and_acceptance';
  if (rel.type === 'childGivesParent' || tong === '식상') return 'expression_and_response';
  if (rel.type === 'childControlsParent' || tong === '재성') return 'result_and_confirmation';
  if (rel.type === 'donggi' || tong === '비겁') return 'mirroring_and_space';
  return 'relation_context';
}

function relationRiskPattern(rel, childTypes) {
  if (!rel) return 'unknown_risk';
  if (rel.type === 'parentControlsChild' && childTypes.childTemperamentPattern === 'sensitive_recovery') {
    return 'boundary_may_pressure_sensitive_child';
  }
  if (rel.type === 'childControlsParent') return 'expectation_feedback_loop';
  if (rel.type === 'donggi') return 'similarity_can_amplify_stubbornness';
  if (rel.type === 'hap') return 'blend_can_blur_boundary';
  return 'low_relation_risk';
}

export function getCompatibilityJudgmentTypes(facts, role) {
  const rel = facts?.ilganRelations?.[role];
  const childTypes = getChildJudgmentTypes(facts);
  const parentTypes = getParentJudgmentTypes(facts, role);
  return {
    ...childTypes,
    ...parentTypes,
    relationType: rel?.type === 'donggi' ? 'same' : rel?.type ?? 'unknown',
    relationPattern: relationPattern(rel),
    relationCarePattern: relationCarePattern(rel),
    relationRiskPattern: relationRiskPattern(rel, childTypes),
    sipseongTong: rel?.sipseongTong ?? 'unknown',
    childIlgan: rel?.childIlgan ?? facts?.child?.ilgan ?? 'unknown',
    parentIlgan: rel?.parentIlgan ?? facts?.[role]?.ilgan ?? 'unknown',
  };
}

export function getChildJudgmentTypes(facts) {
  const [top, second] = topFactorEntries(facts?.childFactors, 2);
  return {
    childTemperamentPattern: childTemperamentPatternFromTop(top?.[0], second?.[0]),
    topFactor: top?.[0] ?? 'general',
    secondFactor: second?.[0] ?? 'general',
    emotionRegulationPattern: emotionRegulationPattern(facts),
    attachmentPattern: attachmentPattern(facts),
  };
}

export function getFactorJudgmentTypes(facts, factorKey) {
  const factorResult = facts?.childFactors?.[factorKey];
  const signature = factorCauseSignature(factorResult);
  return {
    ...getChildJudgmentTypes(facts),
    factor: factorKey,
    factorBand: scoreBand(factorResult?.score),
    factorExpressionPattern: expressionPattern(factorResult?.score),
    factorCausePattern: `maker_${signature.makerCauseKey}__suppressor_${signature.suppressorCauseKey}`,
    dailyCarePattern: dailyCarePattern(factorKey, factorResult),
  };
}

export function getParentJudgmentTypes(facts, role) {
  const entry = topAxisEntry(facts, role);
  const axisKey = entry?.[0] ?? 'general';
  const axisResult = entry?.[1];
  return {
    parentRole: role,
    parentCarePattern: PARENT_CARE_BY_AXIS[axisKey] ?? 'general_care',
    parentCausePattern: parentCausePattern(axisKey, axisResult),
    parentTopAxis: axisKey,
    learningStylePattern: LEARNING_BY_AXIS[axisKey] ?? 'learns_by_context',
  };
}

export function getMatrixJudgmentTypes({ facts, role, card }) {
  const signature = matrixComboSignature({ facts, role, card });
  return {
    ...getChildJudgmentTypes(facts),
    ...getParentJudgmentTypes(facts, role),
    parentAxis: card?.axis ?? 'general',
    childFactor: card?.factor ?? 'general',
    matrixCausePattern: `parent_${signature.parentCauseKey}__child_${signature.childCauseKey}`,
    parentChildSynergyPattern: synergyPattern(card),
    parentChildConflictPattern: conflictPattern(card),
    disciplineRiskPattern: disciplineRiskPattern(card),
    patternType: card?.isConflict ? 'conflict' : 'synergy',
  };
}

export function getYouaJudgmentTypes(facts) {
  return {
    child: getChildJudgmentTypes(facts),
    factors: Object.fromEntries(FACTOR_ORDER.map(key => [key, getFactorJudgmentTypes(facts, key)])),
    mother: getParentJudgmentTypes(facts, 'mother'),
    father: getParentJudgmentTypes(facts, 'father'),
  };
}
