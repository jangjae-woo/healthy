// 인연 — inyeon-compute 결과를 ch1~ch8 프롬프트 ctx로 변환
// 격리: 평생사주·엄마와아이 모듈 import 금지
import {
  STEM_HANJA, BRANCH_HANJA, getDayMasterStrength,
  type SajuAnalysis, type CompatibilityResult,
} from "../saju-calculator";
import type { InyeonScores } from "./scoring";
import { scoreLabelFor } from "./scoring";
import type { InyeonRequest } from "./types";
import { buildInyeonChapter1Prompt } from "./prompts/ch1-basic";
import { buildInyeonChapter2Prompt } from "./prompts/ch2-inyeon";
import { buildInyeonChapter3Prompt } from "./prompts/ch3-seonggyeok";
import { buildInyeonChapter4Prompt } from "./prompts/ch4-emotion";
import { buildInyeonChapter5Prompt } from "./prompts/ch5-physical";
import { buildInyeonChapter6Prompt } from "./prompts/ch6-finance";
import { buildInyeonChapter7Prompt } from "./prompts/ch7-marriage";
import { buildInyeonChapter8Prompt } from "./prompts/ch8-final-letter";
import { deriveInyeonTraits, inyeonTraitsToPromptBlock } from "../inyeon-traits-block-v2";
import { matchCharacter, deriveIdealType, type CharacterMatch } from "./character-match";
import { getPairLabelFor, type PairLabel } from "./character-pair";

const STEM_ELEM: Record<string, string> = {
  갑: "목", 을: "목", 병: "화", 정: "화", 무: "토", 기: "토",
  경: "금", 신: "금", 임: "수", 계: "수",
};
const GENERATES: Record<string, string> = {
  목: "화", 화: "토", 토: "금", 금: "수", 수: "목",
};
const CONTROLS: Record<string, string> = {
  목: "토", 화: "금", 토: "수", 금: "목", 수: "화",
};

const ILGAN_NATURE: Record<string, string> = {
  갑: "넓은 대지에 우뚝 솟은 큰 나무",
  을: "유연하게 휘어지는 풀과 덩굴",
  병: "온 세상을 비추는 한낮의 태양",
  정: "어둠을 밝히는 따뜻한 등불",
  무: "광활하게 펼쳐진 너른 대지",
  기: "곡식을 품은 옥토(沃土)",
  경: "단단하게 벼려진 강철",
  신: "은은하게 빛나는 보석과 칼날",
  임: "끝없이 흐르는 큰 강과 바다",
  계: "조용히 스미는 이슬과 비",
};

function pillarLine(s: SajuAnalysis): string {
  const ph = (p: { stem: string; branch: string } | null) =>
    p ? `${STEM_HANJA[p.stem as keyof typeof STEM_HANJA] ?? p.stem}${BRANCH_HANJA[p.branch as keyof typeof BRANCH_HANJA] ?? p.branch}` : "—";
  return `${ph(s.pillars.year)} ${ph(s.pillars.month)} ${ph(s.pillars.day)} ${ph(s.pillars.hour)}`;
}

function sipseongLine(s: SajuAnalysis): string {
  const stems = [s.sipseong.year.stem, s.sipseong.month.stem, "일간", s.sipseong.hour?.stem ?? "—"];
  const branches = [s.sipseong.year.branch, s.sipseong.month.branch, s.sipseong.day.branch, s.sipseong.hour?.branch ?? "—"];
  return `${stems.join("·")} / ${branches.join("·")}`;
}

function ohaengCount(s: SajuAnalysis): string {
  const e = s.elements;
  return `목 ${e.목} / 화 ${e.화} / 토 ${e.토} / 금 ${e.금} / 수 ${e.수}`;
}
function ohaengRatio(s: SajuAnalysis): string {
  const e = s.elements;
  const total = e.목 + e.화 + e.토 + e.금 + e.수;
  const f = (n: number) => total > 0 ? ((n / total) * 100).toFixed(1) : "0";
  return `목 ${f(e.목)}% 화 ${f(e.화)}% 토 ${f(e.토)}% 금 ${f(e.금)}% 수 ${f(e.수)}%`;
}

function topElement(s: SajuAnalysis): string {
  return (Object.entries(s.elements) as Array<[string, number]>)
    .sort((a, b) => b[1] - a[1])[0][0];
}
function weakElement(s: SajuAnalysis): string {
  return (Object.entries(s.elements) as Array<[string, number]>)
    .sort((a, b) => a[1] - b[1])[0][0];
}

// 자도인·인연 두 사이트 일관성 확보 — saju-calculator.getDayMasterStrength 통일 사용
// 월령(±3~4) + 통근(±1.5~2) + 천간(±1~1.5) 자평명리 정통 가중치
function shinkangLevel(s: SajuAnalysis): string {
  const allBranches = [
    s.pillars.year.branch, s.pillars.month.branch, s.pillars.day.branch,
    ...(s.pillars.hour ? [s.pillars.hour.branch] : []),
  ];
  const otherStems = [
    s.pillars.year.stem, s.pillars.month.stem,
    ...(s.pillars.hour ? [s.pillars.hour.stem] : []),
  ];
  try {
    return getDayMasterStrength(s.ilgan, s.pillars.month.branch, allBranches, otherStems).level;
  } catch {
    return "중화";
  }
}

// 희신·기신 — 용신을 생하는 오행 / 용신을 극하는 오행
function huisinOf(yongsin: string): string {
  const k = Object.keys(GENERATES).find(k => GENERATES[k] === yongsin);
  return k ?? yongsin;
}
function gisinOf(yongsin: string): string {
  const k = Object.keys(CONTROLS).find(k => CONTROLS[k] === yongsin);
  return k ?? "—";
}

function sipseongTopForEmotion(s: SajuAnalysis): string {
  const all = [s.sipseong.year.stem, s.sipseong.month.stem, s.sipseong.hour?.stem]
    .filter(Boolean) as string[];
  const counts = new Map<string, number>();
  for (const v of all) counts.set(v, (counts.get(v) ?? 0) + 1);
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  return top ? top[0] : "비견";
}

function jaeseongStrength(s: SajuAnalysis): string {
  const ie = STEM_ELEM[s.ilgan] as keyof typeof s.elements;
  const jae = CONTROLS[ie] as keyof typeof s.elements;
  const total = s.elements.목 + s.elements.화 + s.elements.토 + s.elements.금 + s.elements.수;
  const ratio = total > 0 ? s.elements[jae] / total : 0;
  if (ratio >= 0.25) return "강함";
  if (ratio >= 0.12) return "보통";
  return "약함";
}
function siksinStrength(s: SajuAnalysis): string {
  const ie = STEM_ELEM[s.ilgan] as keyof typeof s.elements;
  const sik = GENERATES[ie] as keyof typeof s.elements;
  const total = s.elements.목 + s.elements.화 + s.elements.토 + s.elements.금 + s.elements.수;
  const ratio = total > 0 ? s.elements[sik] / total : 0;
  if (ratio >= 0.25) return "강함";
  if (ratio >= 0.12) return "보통";
  return "약함";
}

function curveLine(curve: { phase: string; value: number }[]): string {
  return curve.map(p => `${p.phase} ${p.value}억`).join(" → ");
}

// 결혼운 시기 추정 — 가장 가까운 정재·정관·식상 대운 1개
function estimateMarriageYear(s: SajuAnalysis, currentYear: number, birthYear: number): string {
  const age = currentYear - birthYear;
  const upcoming = s.daeun.cycles.find(c => c.age >= age && c.age <= age + 20);
  if (!upcoming) return "앞으로 10년 안";
  const year = birthYear + upcoming.age;
  return `${year}년(${upcoming.ganji}년) 무렵`;
}
function estimateCrisisRange(s: SajuAnalysis, currentYear: number, birthYear: number): string {
  const age = currentYear - birthYear;
  // 결혼 추정 시점 + 3~5년 무렵
  const m = s.daeun.cycles.find(c => c.age >= age && c.age <= age + 20);
  if (!m) return "결혼 후 3~5년차 무렵";
  const start = birthYear + m.age + 3;
  const end = start + 2;
  return `${start}년~${end}년 무렵`;
}
function estimateChildPlanRange(s: SajuAnalysis, currentYear: number, birthYear: number): string {
  const age = currentYear - birthYear;
  const m = s.daeun.cycles.find(c => c.age >= age && c.age <= age + 20);
  if (!m) return "혼인 직후 1~2년";
  const start = birthYear + m.age + 1;
  const end = start + 1;
  return `${start}년 하반기~${end}년 상반기`;
}

function parentPalace(s: SajuAnalysis): string {
  const top = topElement(s);
  const tone: Record<string, string> = {
    목: "목 기운이 강한 활발하고 진취적인 가정",
    화: "화 기운이 강한 표현이 풍부한 가정",
    토: "토 기운이 강한 책임감 있는 가정",
    금: "금 기운이 강한 규율과 절제의 가정",
    수: "수 기운이 강한 지혜롭고 깊은 가정",
  };
  return tone[top] ?? "균형있는 가정";
}

function topStrength(compat: CompatibilityResult): string {
  return compat.strengths[0] ?? "서로의 결을 부드럽게 다듬어주는 사이";
}
function topWarning(compat: CompatibilityResult): string {
  return compat.weaknesses[0] ?? "익숙함 속의 무관심";
}

export interface InyeonAllPrompts {
  ch1: string; ch2: string; ch3: string; ch4: string;
  ch5: string; ch6: string; ch7: string; ch8: string;
}

export interface InyeonCharacterMatch {
  aMatch: CharacterMatch;
  bMatch: CharacterMatch;
  aIdeal: CharacterMatch;       // A가 끌리는 이상형 캐릭터
  bIdeal: CharacterMatch;       // B가 끌리는 이상형 캐릭터
  pairLabel: PairLabel | null;
}

// 캐릭터 결정론 분류 — 만세력 단계에서 호출. 인연 전용.
export function buildCharacterMatch(
  req: InyeonRequest,
  a: SajuAnalysis,
  b: SajuAnalysis,
): InyeonCharacterMatch {
  const aMatch = matchCharacter(a, req.a.gender);
  const bMatch = matchCharacter(b, req.b.gender);
  const aIdeal = deriveIdealType(a, req.a.gender);
  const bIdeal = deriveIdealType(b, req.b.gender);
  const pairLabel = getPairLabelFor(req.a.gender, aMatch.name, req.b.gender, bMatch.name);
  return { aMatch, bMatch, aIdeal, bIdeal, pairLabel };
}

export function buildAllInyeonPrompts(
  req: InyeonRequest,
  a: SajuAnalysis,
  b: SajuAnalysis,
  compat: CompatibilityResult,
  scores: InyeonScores,
  curves: {
    a: { phase: "초년기" | "청년기" | "중년기" | "말년기"; value: number }[];
    b: { phase: "초년기" | "청년기" | "중년기" | "말년기"; value: number }[];
    together: { phase: "초년기" | "청년기" | "중년기" | "말년기"; value: number }[];
  },
): InyeonAllPrompts {
  const aName = req.a.name;
  const bName = req.b.name;
  const aIlganHanja = STEM_HANJA[a.ilgan as keyof typeof STEM_HANJA] ?? a.ilgan;
  const bIlganHanja = STEM_HANJA[b.ilgan as keyof typeof STEM_HANJA] ?? b.ilgan;
  const aNature = ILGAN_NATURE[a.ilgan] ?? "고유한 결의 사람";
  const bNature = ILGAN_NATURE[b.ilgan] ?? "고유한 결의 사람";

  // ─── "나는 솔로" 캐릭터 결정론 분류 ───
  const aMatch = matchCharacter(a, req.a.gender);
  const bMatch = matchCharacter(b, req.b.gender);
  const aIdeal = deriveIdealType(a, req.a.gender);
  const bIdeal = deriveIdealType(b, req.b.gender);
  const pairLabelObj = getPairLabelFor(req.a.gender, aMatch.name, req.b.gender, bMatch.name);
  const pairLabel = pairLabelObj?.label ?? "두 사람만의 결";
  const pairTone = pairLabelObj?.tone ?? "";

  const aPersonCtx = {
    name: aName,
    ilgan: `${a.ilgan}(${aIlganHanja})`,
    ilganNature: aNature,
    pillarsLine: pillarLine(a),
    sipseongLine: sipseongLine(a),
    ohaengCount: ohaengCount(a),
    ohaengRatio: ohaengRatio(a),
    yongsin: a.yongsin,
    huisin: huisinOf(a.yongsin),
    gisin: gisinOf(a.yongsin),
    shinkang: shinkangLevel(a),
    sinsalLine: a.sinsal.join(" · ") || "특별한 신살 없음",
    character: aMatch.name,
    characterImage: aMatch.innerImage,
    characterColor: aMatch.color,
    characterEnLabel: aMatch.enLabel,
    idealType: aIdeal.name,
    idealTypeImage: aIdeal.innerImage,
    idealTypeSignal: aIdeal.signal,
  };
  const bPersonCtx = {
    name: bName,
    ilgan: `${b.ilgan}(${bIlganHanja})`,
    ilganNature: bNature,
    pillarsLine: pillarLine(b),
    sipseongLine: sipseongLine(b),
    ohaengCount: ohaengCount(b),
    ohaengRatio: ohaengRatio(b),
    yongsin: b.yongsin,
    huisin: huisinOf(b.yongsin),
    gisin: gisinOf(b.yongsin),
    shinkang: shinkangLevel(b),
    sinsalLine: b.sinsal.join(" · ") || "특별한 신살 없음",
    character: bMatch.name,
    characterImage: bMatch.innerImage,
    characterColor: bMatch.color,
    characterEnLabel: bMatch.enLabel,
    idealType: bIdeal.name,
    idealTypeImage: bIdeal.innerImage,
    idealTypeSignal: bIdeal.signal,
  };

  const ch1 = buildInyeonChapter1Prompt(req, aPersonCtx, bPersonCtx);

  const pairCtx = {
    aName, bName,
    aIlgan: `${a.ilgan}(${aIlganHanja})`,
    bIlgan: `${b.ilgan}(${bIlganHanja})`,
    iljiRelation: compat.branchRelations.ilji,
    ilganRelation: `${compat.ilganRelation} — ${compat.ilganDetail}`,
    samhap: compat.branchRelations.samhap.join(", "),
    yukhap: compat.branchRelations.yukhap.join(", "),
    chung: compat.branchRelations.chung.join(", "),
    wonjin: "",
    sharedSinsal: compat.sharedSinsal.join(" · "),
    aSinsal: a.sinsal.join(" · ") || "특별한 신살 없음",
    bSinsal: b.sinsal.join(" · ") || "특별한 신살 없음",
    aHelpsB: compat.elementBalance.aHelpsB.join("·"),
    bHelpsA: compat.elementBalance.bHelpsA.join("·"),
    inyeonScore: scores.inyeon,
    scoreLabel: scoreLabelFor(scores.inyeon),
  };
  const ch2 = buildInyeonChapter2Prompt(req, pairCtx);

  const seongCtx = {
    aName, bName,
    aIlgan: `${a.ilgan}(${aIlganHanja})`,
    bIlgan: `${b.ilgan}(${bIlganHanja})`,
    ilganRelation: `${compat.ilganRelation} — ${compat.ilganDetail}`,
    aOhaengTop: topElement(a), bOhaengTop: topElement(b),
    aOhaengWeak: weakElement(a), bOhaengWeak: weakElement(b),
    seonggyeokScore: scores.seonggyeok,
    scoreLabel: scoreLabelFor(scores.seonggyeok),
    aCharacter: aMatch.name,
    bCharacter: bMatch.name,
    pairLabel,
    pairTone,
  };
  const ch3 = buildInyeonChapter3Prompt(req, seongCtx);

  const emotionCtx = {
    aName, bName,
    aSipseongTop: sipseongTopForEmotion(a),
    bSipseongTop: sipseongTopForEmotion(b),
    aIlganNature: aNature,
    bIlganNature: bNature,
    emotionScore: scores.emotion,
    scoreLabel: scoreLabelFor(scores.emotion),
  };
  const ch4 = buildInyeonChapter4Prompt(req, emotionCtx);

  const _aBirthYearForCh5 = parseInt(req.a.year, 10);
  const _bBirthYearForCh5 = parseInt(req.b.year, 10);
  const _curYearForCh5 = new Date().getFullYear();
  const daeunLineFor = (s: SajuAnalysis, birthYear: number) =>
    s.daeun.cycles.slice(0, 6)
      .map(d => `${d.age}세 ${d.ganji}운(${birthYear + d.age}년~)`)
      .join(" → ");
  const physicalCtx = {
    aName, bName,
    aOhaengTop: topElement(a), bOhaengTop: topElement(b),
    aOhaengWeak: weakElement(a), bOhaengWeak: weakElement(b),
    aShinKang: shinkangLevel(a),
    bShinKang: shinkangLevel(b),
    aSinsalLine: a.sinsal.join(" · ") || "특별한 신살 없음",
    bSinsalLine: b.sinsal.join(" · ") || "특별한 신살 없음",
    aDaeunLine: daeunLineFor(a, _aBirthYearForCh5),
    bDaeunLine: daeunLineFor(b, _bBirthYearForCh5),
    aBirthYear: _aBirthYearForCh5,
    bBirthYear: _bBirthYearForCh5,
    currentYear: _curYearForCh5,
    physicalScore: scores.physical,
    scoreLabel: scoreLabelFor(scores.physical),
  };
  const ch5 = buildInyeonChapter5Prompt(req, physicalCtx);

  const ch6Ctx = {
    aName, bName,
    aIlgan: `${a.ilgan}(${aIlganHanja})`,
    bIlgan: `${b.ilgan}(${bIlganHanja})`,
    ilganRelation: `${compat.ilganRelation} — ${compat.ilganDetail}`,
    iljiRelation: compat.branchRelations.ilji,
    samhap: compat.branchRelations.samhap.join(", "),
    yukhap: compat.branchRelations.yukhap.join(", "),
    chung: compat.branchRelations.chung.join(", "),
    wonjin: "",
    aOhaengTop: topElement(a), bOhaengTop: topElement(b),
    aOhaengWeak: weakElement(a), bOhaengWeak: weakElement(b),
    aShinKang: shinkangLevel(a),
    bShinKang: shinkangLevel(b),
    aSinsalLine: a.sinsal.join(" · ") || "특별한 신살 없음",
    bSinsalLine: b.sinsal.join(" · ") || "특별한 신살 없음",
    aDaeunLine: daeunLineFor(a, _aBirthYearForCh5),
    bDaeunLine: daeunLineFor(b, _bBirthYearForCh5),
    aBirthYear: _aBirthYearForCh5,
    bBirthYear: _bBirthYearForCh5,
    currentYear: _curYearForCh5,
  };
  const ch6 = buildInyeonChapter6Prompt(req, ch6Ctx);

  const currentYear = new Date().getFullYear();
  const aBirthYear = parseInt(req.a.year, 10);
  const bBirthYear = parseInt(req.b.year, 10);
  // 두 분 중 더 늦게 도래하는 결혼운 시기를 기준으로
  const marriageYear = estimateMarriageYear(a, currentYear, aBirthYear);
  const crisisYearRange = estimateCrisisRange(a, currentYear, aBirthYear);
  const childPlanYearRange = estimateChildPlanRange(b, currentYear, bBirthYear);

  const ch7Ctx = {
    aName, bName,
    aIlgan: `${a.ilgan}(${aIlganHanja})`,
    bIlgan: `${b.ilgan}(${bIlganHanja})`,
    ilganRelation: `${compat.ilganRelation} — ${compat.ilganDetail}`,
    iljiRelation: compat.branchRelations.ilji,
    samhap: compat.branchRelations.samhap.join(", "),
    yukhap: compat.branchRelations.yukhap.join(", "),
    chung: compat.branchRelations.chung.join(", "),
    wonjin: "",
    aOhaengTop: topElement(a), bOhaengTop: topElement(b),
    aOhaengWeak: weakElement(a), bOhaengWeak: weakElement(b),
    aShinKang: shinkangLevel(a),
    bShinKang: shinkangLevel(b),
    aSinsalLine: a.sinsal.join(" · ") || "특별한 신살 없음",
    bSinsalLine: b.sinsal.join(" · ") || "특별한 신살 없음",
    aDaeunLine: daeunLineFor(a, _aBirthYearForCh5),
    bDaeunLine: daeunLineFor(b, _bBirthYearForCh5),
    aBirthYear: _aBirthYearForCh5,
    bBirthYear: _bBirthYearForCh5,
    currentYear: _curYearForCh5,
    marriageYear, crisisYearRange, childPlanYearRange,
    aParentPalace: parentPalace(a),
    bParentPalace: parentPalace(b),
  };
  const ch7 = buildInyeonChapter7Prompt(req, ch7Ctx);

  const finalCtx = {
    aName, bName,
    inyeonScore: scores.inyeon,
    seonggyeokScore: scores.seonggyeok,
    emotionScore: scores.emotion,
    physicalScore: scores.physical,
    financeScore: scores.finance,
    marriageScore: scores.marriage,
    marriageYear,
    crisisYearRange,
    topStrength: topStrength(compat),
    topWarning: topWarning(compat),
  };
  const ch8 = buildInyeonChapter8Prompt(req, finalCtx);

  // ─── V2 traits-block 주입 — 두 사람 결합 키워드 풀 챕터별 prepend ───
  const _inyeonTraits = (() => {
    try { return deriveInyeonTraits(a, b, req.choice.relationship); } catch { return null; }
  })();
  const _block = (scope: "ch1" | "ch2" | "ch3" | "ch4" | "ch5" | "ch6" | "ch7" | "ch8"): string =>
    _inyeonTraits ? inyeonTraitsToPromptBlock(_inyeonTraits, aName, bName, scope) : "";

  return {
    ch1: _block("ch1") + ch1,
    ch2: _block("ch2") + ch2,
    ch3: _block("ch3") + ch3,
    ch4: _block("ch4") + ch4,
    ch5: _block("ch5") + ch5,
    ch6: _block("ch6") + ch6,
    ch7: _block("ch7") + ch7,
    ch8: _block("ch8") + ch8,
  };
}
