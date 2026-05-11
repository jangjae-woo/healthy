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
import { deriveHongsilTraits, hongsilTraitsToPromptBlock, type HongsilChapterScope } from "../hongsil/traits-block";
import { inyeonSubDistribution } from "./sub-distribution";
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
  const f = (n: number) => total > 0 ? String(Math.round((n / total) * 100)) : "0";
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

// ─── 대운 정통화 helper — 천간 십성·지지 충·원진·기신 결합 ────────
const BRANCH_ELEM_LOCAL: Record<string, string> = {
  자: "수", 축: "토", 인: "목", 묘: "목",
  진: "토", 사: "화", 오: "화", 미: "토",
  신: "금", 유: "금", 술: "토", 해: "수",
};
const YANG_STEMS = new Set(["갑", "병", "무", "경", "임"]);
const BRANCH_CHUNG: Record<string, string> = {
  자: "오", 오: "자", 축: "미", 미: "축",
  인: "신", 신: "인", 묘: "유", 유: "묘",
  진: "술", 술: "진", 사: "해", 해: "사",
};
const BRANCH_WONJIN: Record<string, string> = {
  자: "미", 미: "자", 축: "오", 오: "축",
  인: "유", 유: "인", 묘: "신", 신: "묘",
  진: "해", 해: "진", 사: "술", 술: "사",
};
const BRANCH_YUKHAP: Record<string, string> = {
  자: "축", 축: "자", 인: "해", 해: "인",
  묘: "술", 술: "묘", 진: "유", 유: "진",
  사: "신", 신: "사", 오: "미", 미: "오",
};

function sipseongOfStem(ilgan: string, otherStem: string): string {
  const ilElem = STEM_ELEM[ilgan];
  const otherElem = STEM_ELEM[otherStem];
  if (!ilElem || !otherElem) return "비견";
  const sameYinYang = YANG_STEMS.has(ilgan) === YANG_STEMS.has(otherStem);
  if (otherElem === ilElem) return sameYinYang ? "비견" : "겁재";
  if (GENERATES[ilElem] === otherElem) return sameYinYang ? "식신" : "상관";
  if (CONTROLS[ilElem] === otherElem) return sameYinYang ? "편재" : "정재";
  if (CONTROLS[otherElem] === ilElem) return sameYinYang ? "편관" : "정관";
  return sameYinYang ? "편인" : "정인";
}

function marriageScoreOfCycle(
  ilgan: string,
  dayBranch: string,
  gisinElem: string | null,
  c: { stem: string; branch: string },
): number {
  const sip = sipseongOfStem(ilgan, c.stem);
  let score = 0;
  if (["정관", "편관", "정재", "편재"].includes(sip)) score += 2;
  else if (["식신", "상관"].includes(sip)) score += 1;
  if (BRANCH_YUKHAP[dayBranch] === c.branch) score += 2;
  if (BRANCH_CHUNG[dayBranch] === c.branch) score -= 3;
  if (BRANCH_WONJIN[dayBranch] === c.branch) score -= 2;
  if (gisinElem && BRANCH_ELEM_LOCAL[c.branch] === gisinElem) score -= 1;
  return score;
}

function childScoreOfCycle(
  ilgan: string,
  dayBranch: string,
  c: { stem: string; branch: string },
): number {
  const sip = sipseongOfStem(ilgan, c.stem);
  let score = 0;
  if (["식신", "상관"].includes(sip)) score += 2;
  else if (["정관", "편관"].includes(sip)) score += 1;
  if (BRANCH_YUKHAP[dayBranch] === c.branch) score += 1;
  if (BRANCH_CHUNG[dayBranch] === c.branch) score -= 2;
  return score;
}

// 결혼운 시기 추정 (정통화) — 향후 50년 대운 중 결혼운 점수 최고 1개
function estimateMarriageYear(s: SajuAnalysis, currentYear: number, birthYear: number): string {
  const age = currentYear - birthYear;
  const ilgan = s.ilgan;
  const dayBranch = s.pillars.day.branch;
  const gisinElem = gisinOf(s.yongsin);
  const upcoming = s.daeun.cycles
    .filter(c => c.age >= age - 1 && c.age <= age + 50)
    .map(c => ({ ...c, score: marriageScoreOfCycle(ilgan, dayBranch, gisinElem, c) }))
    .sort((a, b) => b.score - a.score);
  if (upcoming.length === 0 || upcoming[0].score <= 0) {
    const fb = s.daeun.cycles.find(c => c.age >= age && c.age <= age + 20);
    if (!fb) return "앞으로 10년 안";
    return `${birthYear + fb.age}년(${fb.ganji}년) 무렵`;
  }
  const best = upcoming[0];
  return `${birthYear + best.age}년(${best.ganji}년 대운, 결혼운 점수 ${best.score}) 무렵`;
}

// 흔들리는 시기 추정 (정통화) — 충·원진·기신 들어오는 가장 점수 낮은 1개
function estimateCrisisRange(s: SajuAnalysis, currentYear: number, birthYear: number): string {
  const age = currentYear - birthYear;
  const ilgan = s.ilgan;
  const dayBranch = s.pillars.day.branch;
  const gisinElem = gisinOf(s.yongsin);
  const upcoming = s.daeun.cycles
    .filter(c => c.age >= age && c.age <= age + 50)
    .map(c => ({ ...c, score: marriageScoreOfCycle(ilgan, dayBranch, gisinElem, c) }))
    .sort((a, b) => a.score - b.score);
  if (upcoming.length === 0) return "특별히 흔들릴 시기 없음";
  const worst = upcoming[0];
  if (worst.score >= 0) return "결정적 위험 시기 약함 — 일상의 작은 자극만 살피기";
  const start = birthYear + worst.age;
  const end = start + 4;
  return `${start}년~${end}년 무렵(${worst.ganji}년 대운, 충·원진·기신 자극)`;
}

// 자녀 계획 시기 추정 (정통화) — 식상·정관 들어오는 가장 가까운 대운
function estimateChildPlanRange(s: SajuAnalysis, currentYear: number, birthYear: number): string {
  const age = currentYear - birthYear;
  const ilgan = s.ilgan;
  const dayBranch = s.pillars.day.branch;
  const upcoming = s.daeun.cycles
    .filter(c => c.age >= age - 1 && c.age <= age + 30)
    .map(c => ({ ...c, score: childScoreOfCycle(ilgan, dayBranch, c) }))
    .sort((a, b) => b.score - a.score);
  if (upcoming.length === 0 || upcoming[0].score <= 0) return "혼인 후 1~3년 안";
  const best = upcoming[0];
  const start = birthYear + best.age;
  const end = start + 2;
  return `${start}년~${end}년 무렵(${best.ganji}년 대운, 식상·관성 활성기)`;
}

// 부모궁 정통화 — 年柱(부모궁) 천간·지지 십성 + 인성·관성 분포 결합
// 정통: 年柱 = 조부·부모 자리. 인성·관성·식상 분포가 부모 영향력 결정.
function parentPalace(s: SajuAnalysis): string {
  const yearStem = s.pillars.year.stem;
  const yearBranch = s.pillars.year.branch;
  const yearStemSip = sipseongOfStem(s.ilgan, yearStem);
  const yearBranchElem = BRANCH_ELEM_LOCAL[yearBranch] ?? "토";
  const ilElem = STEM_ELEM[s.ilgan];

  // 인성·관성·식상 카운트
  const sip = s.sipseong as Record<string, { stem: string; branch: string } | null>;
  const all = [
    sip.year?.stem, sip.year?.branch,
    sip.month?.stem, sip.month?.branch,
    sip.day?.branch,
    sip.hour?.stem, sip.hour?.branch,
  ].filter(Boolean) as string[];
  const insongCount = all.filter(s => s.includes("정인") || s.includes("편인") || s.includes("효신")).length;
  const gwanCount = all.filter(s => s.includes("정관") || s.includes("편관") || s.includes("칠살")).length;
  const sikCount = all.filter(s => s.includes("식신") || s.includes("상관")).length;

  // 부모궁 결 결정
  const traits: string[] = [];
  // 年柱 천간 십성 → 부모와의 결
  if (["정인", "편인"].includes(yearStemSip)) traits.push("받쳐주고 품어주는 결의 부모");
  else if (["정관", "편관"].includes(yearStemSip)) traits.push("규율·기대가 분명한 결의 부모");
  else if (["정재", "편재"].includes(yearStemSip)) traits.push("현실 감각·실용 중심 결의 부모");
  else if (["식신", "상관"].includes(yearStemSip)) traits.push("자녀 표현·자유를 받아주는 결의 부모");
  else traits.push("자기 결이 단단한 부모");

  // 年支 오행 → 가정 분위기
  const branchTone: Record<string, string> = {
    목: "활발·성장 분위기 가정",
    화: "표현·열정 풍부한 가정",
    토: "신뢰·책임감 깊은 가정",
    금: "절제·기준 분명한 가정",
    수: "사색·지혜로운 가정",
  };
  traits.push(branchTone[yearBranchElem]);

  // 인성 강도로 부모 영향
  if (insongCount >= 3) traits.push("부모 영향력 강함 (인성 ${insongCount})");
  else if (insongCount === 0) traits.push("부모 의지 옅음 — 자수성가형");

  // 관성 강도로 부모 기대
  if (gwanCount >= 3) traits.push("부모 기대 부담 큼");

  return traits.join(" / ");
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

  // ─── 홍실 캐릭터 결정론 분류 ───
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

  // ─── V2 두 사람 각자 본인 결정론 매핑 풀 (자도인 M1~M7 cell) — LLM 임의 통설 차단 ───
  // 인연 챕터 → 홍실 scope 매핑 (홍실 6 챕터의 scope 키 재활용)
  // 매핑 — 자연 비유는 ch1(사주 펼치기)에서만 등장. ch2~ch8은 비유 인용 X (명사만).
  const INYEON_TO_HONGSIL_SCOPE: Record<"ch1"|"ch2"|"ch3"|"ch4"|"ch5"|"ch6"|"ch7"|"ch8", HongsilChapterScope> = {
    ch1: "ch1",  // 사주 펼치기 → 매력 풀 (자연 비유 OK 1-1·1-4)
    ch2: "ch3",  // 인연 결 → 짝꿍 결 (자연 비유 X)
    ch3: "ch3",  // 성격궁합 → 짝꿍 결 (자연 비유 X)
    ch4: "ch4",  // 감정궁합 → 패턴 (비유 X)
    ch5: "ch5",  // 체질·시기·본능 → 본능 (비유 X)
    ch6: "ch3",  // 지금 필요한 것 → 짝꿍 (비유 X)
    ch7: "ch3",  // 결혼·미래 → 짝꿍 (비유 X)
    ch8: "ch6",  // 편지 → 편지 (회상 1회 OK)
  };
  const _aTraits = (() => { try { return deriveHongsilTraits(a); } catch { return null; } })();
  const _bTraits = (() => { try { return deriveHongsilTraits(b); } catch { return null; } })();
  const _personPair = (scope: "ch1"|"ch2"|"ch3"|"ch4"|"ch5"|"ch6"|"ch7"|"ch8"): string => {
    const hScope = INYEON_TO_HONGSIL_SCOPE[scope];
    const aBlock = _aTraits ? hongsilTraitsToPromptBlock(_aTraits, aName, hScope) : "";
    const bBlock = _bTraits ? hongsilTraitsToPromptBlock(_bTraits, bName, hScope) : "";
    return aBlock + bBlock;
  };

  // ─── 홍실 캐릭터 톤 가이드 — 모든 챕터 공통 prepend (톤 일관성) ───
  const _characterBlock = `
【홍실 결정론 캐릭터 톤 가이드 — 풀이 본문 전체에 톤 일관 유지】
▸ ${aName}님: ${aMatch.name} (${aMatch.innerImage})
▸ ${bName}님: ${bMatch.name} (${bMatch.innerImage})
${pairLabelObj ? `▸ 짝꿍 라벨: "${pairLabel}" — ${pairTone}` : ""}
▸ 적용 룰: 본문 어조·연애 묘사·갈등 묘사·미래 묘사 모두 위 두 캐릭터 결을 의식하고 전개.
   - ${aMatch.name} 캐릭터의 결로 ${aName}님 행동·심리 묘사 (예: 옥순=직진, 현숙=시크, 정숙=강단, 순자=애교, 영숙=다정, 영자=일상)
   - ${bMatch.name} 캐릭터의 결로 ${bName}님 행동·심리 묘사 (예: 영철=자신감, 영식=정성·바른생활, 영호=인싸, 광수=진중, 영수=중후, 상철=편안)
   - 캐릭터 이름 본문 직접 명시는 ch1·ch3 지정 sub에서만. 다른 챕터는 톤만 반영하고 이름 직접 호출 X.

【20~30 여성 친화 콘텐츠 룰 — 9챕터 전체 강제】
1. **타깃**: 20~30대 여성 사용자가 결과를 캡처해 친구·인스타에 공유하고 싶도록 풀이.
2. **한 단락에 1개 이상 "캡처할 한 줄"**: 비유·시적 표현·구체 일상 장면이 들어간 짧은 명문 한 줄을 단락 안에 자연 배치. (예: "그 사람 답장이 늦은 건 무관심이 아니라, 신중하게 마음 여는 결의 시간이에요.")
3. **그 사람 행동을 사주 결로 통역**: 무관심·이기심·바람기 같은 부정 해석 절대 X. 사주 인자 결로 자연스럽게 풀이 ("일간 ${a.ilgan} 결이라 ~한 식으로 다가가요").
4. **자기 매력 환원**: "식상이 강하시네요" 같은 학술 톤 X → "함께 있으면 분위기가 환해지는 매력 — 그 사람이 처음 흔들린 게 바로 이 결이에요" 같은 매력 환원.
5. **외모 평가·체형 평가 절대 금지**. 결·매력·기운·온도·리듬 비유로.
6. **단정 미래 X · 가능성 어조**: "결혼할 거예요" X → "결혼까지 갈 결이 보여요" / "~할 가능성이 흘러요". "~에요" 어미 유지.
7. **연애 칼럼 톤**: 진지하지만 가볍고 따뜻. 교과서 X·미신 X. 친한 언니가 사주 봐주는 톤.
8. **MBTI 식 정체성 부여**: "당신은 ${aMatch.name} 결의 사람" 같이 자기 정체성 박는 한 줄 자연 삽입. (1·3장만 명시, 다른 챕터는 톤만)
9. **자녀운·결혼·본능 챕터(8·5장)는 직접적 호기심 자리** — 우회·추상 X. 구체적·따뜻하게 답해줌.
10. **권태기·갈등 풀이**는 위협 X·해결책 중심. "이렇게 풀면 돼요" 톤.
`;

  // ─── sub 분배표 prepend (PRIMARY 인자 sub간 중복 차단 + 자연 비유 1회 룰) ───
  type IS = "ch1"|"ch2"|"ch3"|"ch4"|"ch5"|"ch6"|"ch7"|"ch8";
  const _dist = (s: IS) => inyeonSubDistribution(s);

  return {
    ch1: _characterBlock + _dist("ch1") + _personPair("ch1") + _block("ch1") + ch1,
    ch2: _characterBlock + _dist("ch2") + _personPair("ch2") + _block("ch2") + ch2,
    ch3: _characterBlock + _dist("ch3") + _personPair("ch3") + _block("ch3") + ch3,
    ch4: _characterBlock + _dist("ch4") + _personPair("ch4") + _block("ch4") + ch4,
    ch5: _characterBlock + _dist("ch5") + _personPair("ch5") + _block("ch5") + ch5,
    ch6: _characterBlock + _dist("ch6") + _personPair("ch6") + _block("ch6") + ch6,
    ch7: _characterBlock + _dist("ch7") + _personPair("ch7") + _block("ch7") + ch7,
    ch8: _characterBlock + _dist("ch8") + _personPair("ch8") + _block("ch8") + ch8,
  };
}
