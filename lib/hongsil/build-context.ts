// 나의 홍실 V3 — 1인 솔로 본인 풀이 build-context
// 인연궁합과 격리. lib/hongsil 전용.

import {
  STEM_HANJA, BRANCH_HANJA,
  type SajuAnalysis,
} from "../saju-calculator";
import type { HongsilRequest } from "./types";
import { buildHongsilChapter1Prompt } from "./prompts/ch1-charm";
import { buildHongsilChapter2Prompt } from "./prompts/ch2-timing";
import { buildHongsilChapter3Prompt } from "./prompts/ch3-destiny";
import { buildHongsilChapter4Prompt } from "./prompts/ch4-pattern";
import { buildHongsilChapter5Prompt } from "./prompts/ch5-instinct";
import { buildHongsilChapter6Prompt } from "./prompts/ch6-letter";
import { matchCharacter, deriveIdealType, type CharacterMatch } from "./character-match";
import { deriveHongsilTraits, hongsilTraitsToPromptBlock, type HongsilChapterScope } from "./traits-block";
import { derivePatternTags } from "./pattern-tags";
import { hongsilSubDistribution } from "./sub-distribution";

const GENERATES: Record<string, string> = { 목: "화", 화: "토", 토: "금", 금: "수", 수: "목" };
const CONTROLS: Record<string, string> = { 목: "토", 화: "금", 토: "수", 금: "목", 수: "화" };

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

function topElement(s: SajuAnalysis): string {
  return (Object.entries(s.elements) as [string, number][]).sort((a, b) => b[1] - a[1])[0][0];
}
function weakElement(s: SajuAnalysis): string {
  return (Object.entries(s.elements) as [string, number][]).sort((a, b) => a[1] - b[1])[0][0];
}

function huisinOf(yongsin: string): string {
  const k = Object.keys(GENERATES).find((k) => GENERATES[k] === yongsin);
  return k ?? yongsin;
}
function gisinOf(yongsin: string): string {
  const k = Object.keys(CONTROLS).find((k) => CONTROLS[k] === yongsin);
  return k ?? "—";
}

export interface HongsilAllPrompts {
  ch1: string; ch2: string; ch3: string; ch4: string; ch5: string; ch6: string;
}

export interface HongsilCharacterResult {
  meMatch: CharacterMatch;
  destinyMatch: CharacterMatch;
}

export function buildHongsilCharacter(
  req: HongsilRequest,
  saju: SajuAnalysis,
): HongsilCharacterResult {
  const meMatch = matchCharacter(saju, req.me.gender);
  const destinyMatch = deriveIdealType(saju, req.me.gender);
  return { meMatch, destinyMatch };
}

export function buildAllHongsilPrompts(
  req: HongsilRequest,
  saju: SajuAnalysis,
): HongsilAllPrompts {
  const me = req.me;
  const choice = req.choice;
  const ilganHanja = STEM_HANJA[saju.ilgan as keyof typeof STEM_HANJA] ?? saju.ilgan;
  const nature = ILGAN_NATURE[saju.ilgan] ?? "고유한 결의 사람";
  const shinkang = (saju as SajuAnalysis & { shinkang?: string }).shinkang ?? "중화";

  const { meMatch, destinyMatch } = buildHongsilCharacter(req, saju);

  const ch1 = buildHongsilChapter1Prompt(choice, {
    name: me.name,
    ilgan: `${saju.ilgan}(${ilganHanja})`,
    ilganNature: nature,
    pillarsLine: pillarLine(saju),
    sipseongLine: sipseongLine(saju),
    ohaengCount: ohaengCount(saju),
    shinkang,
    sinsalLine: saju.sinsal.join(" · ") || "특별한 신살 없음",
    meCharacter: meMatch.name,
    meCharacterImage: meMatch.innerImage,
  });

  const daeunLine = saju.daeun.cycles.slice(0, 6)
    .map((d) => `${d.age}세 ${d.ganji}운(${parseInt(me.year) + d.age}년~)`)
    .join(" → ");

  const ch2 = buildHongsilChapter2Prompt(choice, {
    name: me.name,
    ilgan: `${saju.ilgan}(${ilganHanja})`,
    daeunLine,
    birthYear: parseInt(me.year, 10),
    currentYear: new Date().getFullYear(),
    ohaengTop: topElement(saju),
    shinkang,
  });

  const ch3 = buildHongsilChapter3Prompt(choice, {
    name: me.name,
    gender: me.gender,
    ilgan: `${saju.ilgan}(${ilganHanja})`,
    dayBranch: saju.pillars.day.branch,
    ohaengWeak: weakElement(saju),
    sinsalLine: saju.sinsal.join(" · ") || "특별한 신살 없음",
    yongsin: saju.yongsin,
    destinyCharacter: destinyMatch.name,
    destinyCharacterImage: destinyMatch.innerImage,
  });

  const ch4 = buildHongsilChapter4Prompt(choice, {
    name: me.name,
    gender: me.gender,
    ilgan: `${saju.ilgan}(${ilganHanja})`,
    ohaengWeak: weakElement(saju),
    gisin: gisinOf(saju.yongsin),
    dayBranch: saju.pillars.day.branch,
    shinkang,
  });

  const ch5 = buildHongsilChapter5Prompt(choice, {
    name: me.name,
    ilgan: `${saju.ilgan}(${ilganHanja})`,
    dayBranch: saju.pillars.day.branch,
    sinsalLine: saju.sinsal.join(" · ") || "특별한 신살 없음",
    shinkang,
  });

  const ch6 = buildHongsilChapter6Prompt(choice, {
    name: me.name,
    ilgan: `${saju.ilgan}(${ilganHanja})`,
    meCharacter: meMatch.name,
    destinyCharacter: destinyMatch.name,
  });

  // ─── V2 결정론 매핑 풀 주입 — 챕터별 부분 주입으로 LLM 임의 통설 차단 ───
  const _hongsilTraits = (() => {
    try { return deriveHongsilTraits(saju); } catch { return null; }
  })();
  const _block = (scope: HongsilChapterScope): string =>
    _hongsilTraits ? hongsilTraitsToPromptBlock(_hongsilTraits, me.name, scope) : "";

  // ─── 차트 사실 강제 — 시각 카드 5종과 본문 일치성 보장 ───

  // 2장 DaeunTimeline — 60세 이하 대운만 (사랑·결혼 풀이에서 노년 대운 인용 차단)
  const _daeunCycles = saju.daeun.cycles.filter(c => c.age <= 60).slice(0, 7);
  const _currentAge = new Date().getFullYear() - parseInt(me.year, 10);
  const _ch2ChartFacts = `
[★★★ 2장 시각 카드 사실 — DaeunTimeline에 표시되는 60세 이하 대운만 본문 인용 강제]
- ${_daeunCycles.map(c => `${c.age}세 ${c.ganji}운(${parseInt(me.year, 10) + c.age}년~)`).join(" / ")}
- 본문 풀이는 위 대운 중에서만 시기 인용. 다른 대운 만들 절대 X.
- 현재 나이(${_currentAge}세) 기준 가까운 대운부터 풀이.
★ 사랑·결혼·솔로 탈출 시기 인용 시 절대 룰:
   - 60대 이후 대운 시기는 본문에 인용 절대 X (사용자 정서 보호 — 너무 늦은 시기 단정 금지)
   - 결혼·연애·만남 시기는 30~50대 사이 대운에서만 도출
   - 현재 나이가 50대 이상이면 "지금 이 결의 흐름에서 다가올 인연" 어조로 (구체 연도 시기 명시 X)
   - "60대 무렵·70대 무렵 사랑이 옵니다" 같은 표현 절대 X
`;

  // 3장 DestinyHero — 운명 짝꿍 캐릭터
  const _ch3ChartFacts = destinyMatch ? `
[★★★ 3장 시각 카드 사실 — DestinyHeroCard에 표시되는 운명 짝꿍 결정론]
- 짝꿍 캐릭터: ${destinyMatch.name}
- 내적 이미지: ${destinyMatch.innerImage}
- 결의 신호: ${destinyMatch.signal}
- 본문에 위 캐릭터 이름·signal 그대로 인용. 다른 짝꿍 캐릭터 만들 절대 X.
` : "";

  // 4장 PatternTags
  const _patternTags = (() => {
    try { return derivePatternTags(saju, choice.duration); } catch { return ["#일상의 결"]; }
  })();
  const _ch4ChartFacts = `
[★★★ 4장 시각 카드 사실 — PatternTagsCard에 표시되는 결정론 태그만 본문 인용 강제]
- 반복 패턴 태그: ${_patternTags.join(" / ")}
- 본문 풀이는 위 태그와 일치하는 결로 단정. 다른 패턴 만들 절대 X.
- 태그 # 형태 본문 인용 X — 결의 의미만 산문으로 풀이.
`;

  // 5장 DesireBar — Q2 자가답
  const _desireLabels: Record<string, string> = {
    stable: "단단한 사랑 (정관·정재 본능)",
    intense: "짜릿한 사랑 (편관·편재 본능)",
    natural: "자연스러운 사랑 (식상·재성 본능)",
    marriage: "결혼·약속 사랑 (정관·정재 안정)",
  };
  const _ch5ChartFacts = `
[★★★ 5장 시각 카드 사실 — DesireBar에 표시되는 Q2 자가답]
- ${me.name}님 선택: ${_desireLabels[choice.desire] ?? choice.desire}
- 본문 풀이는 위 욕구로 단정 인용. 다른 욕구 만들 절대 X.
- 사주 결 vs 자가답 갭 분석 시 위 욕구를 기준점으로.
`;

  // 6장 LetterQuote — 캐릭터 + 짝꿍
  const _ch6ChartFacts = (meMatch && destinyMatch) ? `
[★★★ 6장 시각 카드 사실 — LetterQuoteCard에 표시되는 캐릭터 결정론]
- ${me.name}님 캐릭터: ${meMatch.name} (${meMatch.innerImage})
- 운명 짝꿍 캐릭터: ${destinyMatch.name} (${destinyMatch.innerImage})
- 편지 본문에 위 두 캐릭터 결을 자연 회상. 다른 캐릭터 만들 X.
` : "";

  // ─── sub 분배표 prepend (PRIMARY 인자 sub간 중복 차단 + 자연 비유 1회 룰) ───
  type HS = "ch1"|"ch2"|"ch3"|"ch4"|"ch5"|"ch6";
  const _dist = (s: HS) => hongsilSubDistribution(s);

  return {
    ch1: _dist("ch1") + _block("ch1") + ch1,
    ch2: _dist("ch2") + _block("ch2") + _ch2ChartFacts + ch2,
    ch3: _dist("ch3") + _block("ch3") + _ch3ChartFacts + ch3,
    ch4: _dist("ch4") + _block("ch4") + _ch4ChartFacts + ch4,
    ch5: _dist("ch5") + _block("ch5") + _ch5ChartFacts + ch5,
    ch6: _dist("ch6") + _block("ch6") + _ch6ChartFacts + ch6,
  };
}

export { ILGAN_NATURE, huisinOf, gisinOf };

// ─── 호환 (인연궁합 V2 코드 잔존) — 더 이상 사용 X. 유지보수 전 placeholder ───
export const buildAllInyeonPrompts = buildAllHongsilPrompts as unknown as never;
export const buildCharacterMatch = buildHongsilCharacter as unknown as never;
