// ════════════════════════════════════════════════════════════════════
// 연애사주 V3 — 22 sub 공통 컨텍스트 빌더
// 만세력 + 자평진전 + 신살 + 자가답 통합 → LLM 주입 컨텍스트
// ════════════════════════════════════════════════════════════════════

import {
  STEM_HANJA, BRANCH_HANJA,
  type SajuAnalysis,
} from "../../saju-calculator";
import type {
  HongsilRequest,
  SoloDuration,
  LoveDesire,
  LoveStyle,
} from "../types";
import {
  SOLO_DURATION_LABEL,
  LOVE_DESIRE_LABEL,
  LOVE_STYLE_LABEL,
} from "../types";
import {
  matchCharacter,
  deriveIdealType,
  type CharacterMatch,
  type FemaleCharacter,
  type MaleCharacter,
} from "../character-match";
import { getPairLabel, type PairLabel } from "../character-pair";

// ─── 일간 자연 비유 ──────────────────────────────
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

// ─── 컨텍스트 인터페이스 ────────────────────────
export interface HongsilV3Context {
  // 기본
  name: string;
  age: number;
  gender: "남" | "여";

  // 사주 코어
  ilgan: string;              // 신
  ilganHanja: string;         // 辛
  ilganNature: string;        // 은은하게 빛나는 보석과 칼날
  ilju: string;               // 신묘(辛卯)
  iljuHanja: string;          // 辛卯
  pillars4Hanja: string;      // 천간4 한자 한 줄

  // 십성·오행
  sipseongLine: string;
  ohaengCount: string;
  ohaengTop: string;
  ohaengWeak: string;

  // 신강·신살·용신
  shinkang: string;
  sinsalLine: string;
  yongsin: string;
  huisin: string;
  gisin: string;

  // 시기
  birthYear: number;
  currentYear: number;
  daeunLine: string;          // 60세 컷
  daeunNow: string;           // 현재 대운
  seunNow: string;            // 2026 세운

  // 자가답
  duration: SoloDuration;
  desire: LoveDesire;
  style: LoveStyle;
  durationLabel: string;
  desireLabel: string;
  styleLabel: string;

  // 캐릭터 (룰 10·11)
  meCharacter: CharacterMatch;
  destinyCharacter: CharacterMatch;
  pairLabel: PairLabel;
}

// ─── 헬퍼 ─────────────────────────────────────
const GENERATES: Record<string, string> = { 목: "화", 화: "토", 토: "금", 금: "수", 수: "목" };
const CONTROLS: Record<string, string> = { 목: "토", 화: "금", 토: "수", 금: "목", 수: "화" };

function huisinOf(yongsin: string): string {
  const k = Object.keys(GENERATES).find((k) => GENERATES[k] === yongsin);
  return k ?? yongsin;
}
function gisinOf(yongsin: string): string {
  const k = Object.keys(CONTROLS).find((k) => CONTROLS[k] === yongsin);
  return k ?? "—";
}

function topElement(s: SajuAnalysis): string {
  return (Object.entries(s.elements) as [string, number][]).sort((a, b) => b[1] - a[1])[0][0];
}
function weakElement(s: SajuAnalysis): string {
  return (Object.entries(s.elements) as [string, number][]).sort((a, b) => a[1] - b[1])[0][0];
}

function pillars4Line(s: SajuAnalysis): string {
  const ph = (p: { stem: string; branch: string } | null) =>
    p ? `${STEM_HANJA[p.stem as keyof typeof STEM_HANJA] ?? p.stem}${BRANCH_HANJA[p.branch as keyof typeof BRANCH_HANJA] ?? p.branch}` : "—";
  return `${ph(s.pillars.year)} ${ph(s.pillars.month)} ${ph(s.pillars.day)} ${ph(s.pillars.hour)}`;
}

function sipseongLineOf(s: SajuAnalysis): string {
  const stems = [s.sipseong.year.stem, s.sipseong.month.stem, "일간", s.sipseong.hour?.stem ?? "—"];
  const branches = [s.sipseong.year.branch, s.sipseong.month.branch, s.sipseong.day.branch, s.sipseong.hour?.branch ?? "—"];
  return `${stems.join("·")} / ${branches.join("·")}`;
}

function ohaengCountOf(s: SajuAnalysis): string {
  const e = s.elements;
  return `목 ${e.목} / 화 ${e.화} / 토 ${e.토} / 금 ${e.금} / 수 ${e.수}`;
}

function daeunLineOf(s: SajuAnalysis, birthYear: number): string {
  return s.daeun.cycles
    .filter((c) => c.age <= 60)
    .slice(0, 7)
    .map((d) => `${d.age}세 ${d.ganji}운(${birthYear + d.age}년~)`)
    .join(" → ");
}

function daeunNowOf(s: SajuAnalysis, currentAge: number): string {
  const cycles = s.daeun.cycles.filter((c) => c.age <= 60);
  for (let i = cycles.length - 1; i >= 0; i--) {
    if (cycles[i].age <= currentAge) {
      return `${cycles[i].age}세 ${cycles[i].ganji}운`;
    }
  }
  return cycles[0] ? `${cycles[0].age}세 ${cycles[0].ganji}운` : "초년 대운";
}

// 2026 = 병오(丙午)
function seunNowOf(currentYear: number): string {
  if (currentYear === 2026) return "병오(丙午)년";
  if (currentYear === 2027) return "정미(丁未)년";
  if (currentYear === 2028) return "무신(戊申)년";
  return `${currentYear}년`;
}

// ─── 메인 빌더 ──────────────────────────────────
export function buildHongsilV3Context(
  req: HongsilRequest,
  saju: SajuAnalysis,
): HongsilV3Context {
  const me = req.me;
  const choice = req.choice;
  const ilganHanja = STEM_HANJA[saju.ilgan as keyof typeof STEM_HANJA] ?? saju.ilgan;
  const dayBranchHanja = BRANCH_HANJA[saju.pillars.day.branch as keyof typeof BRANCH_HANJA] ?? saju.pillars.day.branch;
  const ilju = `${saju.ilgan}${saju.pillars.day.branch}`;
  const iljuHanja = `${ilganHanja}${dayBranchHanja}`;
  const nature = ILGAN_NATURE[saju.ilgan] ?? "고유한 결의 사람";

  const birthYear = parseInt(me.year, 10);
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;
  const shinkang = (saju as SajuAnalysis & { shinkang?: string }).shinkang ?? "중화";

  // 캐릭터 매칭
  const meCharacter = matchCharacter(saju, me.gender);
  const destinyCharacter = deriveIdealType(saju, me.gender);

  // 매트릭스 페어 라벨 (룰 11) — 본인이 여자면 (본인, 짝꿍), 남자면 (짝꿍, 본인)
  const pairLabel: PairLabel = me.gender === "여"
    ? getPairLabel(meCharacter.name as FemaleCharacter, destinyCharacter.name as MaleCharacter)
    : getPairLabel(destinyCharacter.name as FemaleCharacter, meCharacter.name as MaleCharacter);

  return {
    name: me.name,
    age,
    gender: me.gender,

    ilgan: saju.ilgan,
    ilganHanja,
    ilganNature: nature,
    ilju,
    iljuHanja,
    pillars4Hanja: pillars4Line(saju),

    sipseongLine: sipseongLineOf(saju),
    ohaengCount: ohaengCountOf(saju),
    ohaengTop: topElement(saju),
    ohaengWeak: weakElement(saju),

    shinkang,
    sinsalLine: saju.sinsal.join(" · ") || "특별한 신살 없음",
    yongsin: saju.yongsin,
    huisin: huisinOf(saju.yongsin),
    gisin: gisinOf(saju.yongsin),

    birthYear,
    currentYear,
    daeunLine: daeunLineOf(saju, birthYear),
    daeunNow: daeunNowOf(saju, age),
    seunNow: seunNowOf(currentYear),

    duration: choice.duration,
    desire: choice.desire,
    style: choice.style,
    durationLabel: SOLO_DURATION_LABEL[choice.duration],
    desireLabel: LOVE_DESIRE_LABEL[choice.desire],
    styleLabel: LOVE_STYLE_LABEL[choice.style],

    meCharacter,
    destinyCharacter,
    pairLabel,
  };
}

// ─── 컨텍스트 → 프롬프트 블록 (모든 sub 공통 시작부) ─────
export function buildSajuContextBlock(ctx: HongsilV3Context): string {
  return `
━━━ ${ctx.name}님 사주 ━━━
일간: ${ctx.ilgan}(${ctx.ilganHanja}) — ${ctx.ilganNature}
일주: ${ctx.ilju}(${ctx.iljuHanja})
사주팔자: ${ctx.pillars4Hanja}
십성: ${ctx.sipseongLine}
오행: ${ctx.ohaengCount} (강 ${ctx.ohaengTop} · 약 ${ctx.ohaengWeak})
신강신약: ${ctx.shinkang}
용신: ${ctx.yongsin} (희신 ${ctx.huisin} · 기신 ${ctx.gisin})
신살: ${ctx.sinsalLine}

[대운 흐름 — 60세 이하만]
${ctx.daeunLine}
현재 (${ctx.age}세) 대운: ${ctx.daeunNow}
올해 (${ctx.currentYear}) 세운: ${ctx.seunNow}

[${ctx.name}님 자가답 — 본문 풀이에 자연 인용]
Q1 솔로 기간: ${ctx.durationLabel}
Q2 어떤 사랑: ${ctx.desireLabel}
Q3 사랑 스타일: ${ctx.styleLabel}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}

// ─── 캐릭터 블록 (룰 10·11 sub에만 노출) ─────
export function buildCharacterBlock(ctx: HongsilV3Context, includeMatrix: boolean): string {
  let block = `
[캐릭터 결정론 — 룰 10]
본인 캐릭터: ${ctx.meCharacter.name} (${ctx.meCharacter.innerImage})
  · 결정 신호: ${ctx.meCharacter.signal}
운명 짝꿍: ${ctx.destinyCharacter.name} (${ctx.destinyCharacter.innerImage})
  · 끌림 신호: ${ctx.destinyCharacter.signal}
`;
  if (includeMatrix) {
    block += `
[매트릭스 페어 톤 — 룰 11 백그라운드]
페어 라벨: ${ctx.pairLabel.label}
페어 톤: ${ctx.pairLabel.tone}
※ 캐릭터 이름 본문 노출 X. 위 톤만 풀이 결의 방향으로 작용.
`;
  }
  return block;
}
