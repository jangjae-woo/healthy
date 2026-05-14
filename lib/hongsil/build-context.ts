// 나의 홍실 V3 — 1인 솔로 본인 풀이 build-context
// 인연궁합과 격리. lib/hongsil 전용.

import {
  STEM_HANJA, BRANCH_HANJA,
  type SajuAnalysis,
} from "../saju-calculator";
import type { HongsilRequest } from "./types";
import {
  buildHongsilChapter1PromptV5 as buildHongsilChapter1Prompt,
  buildHongsilChapter2PromptV5 as buildHongsilChapter2Prompt,
  buildHongsilChapter3PromptV5 as buildHongsilChapter3Prompt,
  buildHongsilChapter4PromptV5 as buildHongsilChapter4Prompt,
  buildHongsilChapter5PromptV5 as buildHongsilChapter5Prompt,
  buildHongsilChapter6PromptV5 as buildHongsilChapter6Prompt,
} from "./prompts/v5-report";
import { matchCharacter, deriveIdealType, type CharacterMatch } from "./character-match";
import { getPairLabelFor } from "./character-pair";
import { deriveHongsilTraits, hongsilTraitsToPromptBlock, type HongsilChapterScope } from "./traits-block";
import { derivePatternTags } from "./pattern-tags";
import { hongsilSubDistribution } from "./sub-distribution";
import { deriveHongsilInterpretationPlan, hongsilInterpretationPlanBlock, type HongsilPlanScope } from "./interpretation-plan";

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

// ────────────────────────────────────────────────────────────────
// Fix #2: 십성 표준 정의 통일
// 완성본 검수에서 같은 사주의 재성을 4가지 다른 정의로 묘사하는 모순 발견.
// (1장 "내가 극하고 다스리는 기운" / 3장 "세상과 만나는 방식·결단" /
//  5장 "결단과 추진" / 5장 후반부 "안정적이고 현실적인 관계 추구")
// LLM 자유에 맡기지 말고 한 풀이 안에선 한 정의로 통일.
// 강·약 표현은 traits-block.ts의 가중 카운트 수치를 기준점으로 둔다.
// ────────────────────────────────────────────────────────────────
const SIPSEONG_STANDARD_DEFINITIONS = `
[★★★★★ 십성 표준 정의 — 본문 어디에서든 같은 정의로 통일. 챕터마다 정의를 다르게 쓰지 말 것]
- 비겁(比劫: 비견·겁재) = 나와 같은 오행. 키워드는 자기 리듬·자기 기준·또래 감각·독립성.
- 식상(食傷: 식신·상관) = 내가 생하는 기운. 키워드는 표현·발산·창의·전달.
- 재성(財星: 정재·편재) = 내가 극하는 기운. 키워드는 현실감·관계 운영·결단·실행.
- 관성(官星: 정관·편관) = 나를 극하는 기운. 키워드는 약속·기준·책임·규율.
- 인성(印星: 정인·편인) = 나를 생하는 기운. 키워드는 받아들임·사색·배움·내적 지지.

[★ 강·약 표현 룰]
- 강·약 판정은 traits-block의 "가중 십성 카운트(위치·충합·합화 반영)" 수치를 기준점으로만 사용한다.
- 한 풀이 안에서 같은 십성을 "강하게"와 "부족"·"약함"으로 모순되게 묘사하지 말 것.
- 정관과 편관, 정재와 편재처럼 같은 묶음 안의 두 십성이 다르게 작동할 때만 그 차이를 명시한다.
`;

// ────────────────────────────────────────────────────────────────
// Fix #4: 단독 풀이 환각 방지
// 본인 한 명의 사주만 입력받은 풀이인데 LLM이 "상대의 비겁 기운이
// 강하여…" 식으로 상대 사주를 단정하는 환각을 사전 차단.
// ────────────────────────────────────────────────────────────────
const SOLO_MODE_GUARD = `
[★★★★★ 단독 풀이 규칙 — 본인 한 명의 사주만 입력받았습니다]
- 상대방의 사주(상대의 비겁·식상·재성·관성·인성·일간·일지·신강·신약·용신)를 단정하는 표현 절대 금지.
- "상대의 ○○ 기운이 강하여", "상대의 일간이…" 같은 표현 금지.
- 상대를 언급할 때는 사주 인자가 아니라 행동·말투·태도·태도 차이로만 묘사한다.
- 예: "상대가 자기주장이 강한 편이라" (OK) / "상대의 비겁 기운이 강하여" (X)
`;
// ────────────────────────────────────────────────────────────────

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
  const pair = getPairLabelFor(
    me.gender,
    meMatch.name,
    me.gender === "여" ? "남" : "여",
    destinyMatch.name,
  );

  const ch1 = buildHongsilChapter1Prompt(choice, {
    name: me.name,
    ilgan: `${saju.ilgan}(${ilganHanja})`,
    ilganNature: nature,
    pillarsLine: pillarLine(saju),
    sipseongLine: sipseongLine(saju),
    ohaengCount: ohaengCount(saju),
    shinkang,
    sinsalLine: saju.sinsal.join(" · ") || "특별한 신살 없음",
    yongsin: saju.yongsin,
    huisin: huisinOf(saju.yongsin),
    gisin: gisinOf(saju.yongsin),
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
    yongsin: saju.yongsin,
    huisin: huisinOf(saju.yongsin),
    gisin: gisinOf(saju.yongsin),
  });

  const ch3 = buildHongsilChapter3Prompt(choice, {
    name: me.name,
    gender: me.gender,
    ilgan: `${saju.ilgan}(${ilganHanja})`,
    dayBranch: saju.pillars.day.branch,
    ohaengWeak: weakElement(saju),
    sinsalLine: saju.sinsal.join(" · ") || "특별한 신살 없음",
    yongsin: saju.yongsin,
    huisin: huisinOf(saju.yongsin),
    gisin: gisinOf(saju.yongsin),
    destinyCharacter: destinyMatch.name,
    destinyCharacterImage: destinyMatch.innerImage,
  });

  const ch4 = buildHongsilChapter4Prompt(choice, {
    name: me.name,
    gender: me.gender,
    ilgan: `${saju.ilgan}(${ilganHanja})`,
    ohaengWeak: weakElement(saju),
    yongsin: saju.yongsin,
    huisin: huisinOf(saju.yongsin),
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
  const _interpretationPlan = deriveHongsilInterpretationPlan(saju, me.name);
  const _planBlock = (scope: HongsilPlanScope): string =>
    hongsilInterpretationPlanBlock(_interpretationPlan, scope);

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
- 내부 분류 근거(본문 직접 인용 금지): ${destinyMatch.signal}
- 위 내부 분류 근거는 해석 방향만 잡는 용도다. "정관 부족", "인성 부족"처럼 원국 신호명을 그대로 출력하지 말 것.
- 캐릭터 이름 직접 노출은 "내 짝꿍 미리 보기"에서만 허용. 나머지 3장 sub에서는 캐릭터 단어 X.
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
- 두 캐릭터 종합 결: ${pair ? `${pair.label} — ${pair.tone}` : "두 사람만의 고유한 결"}
- 편지 본문에 위 두 캐릭터 결을 한 줄로 자연 회상. 다른 캐릭터 만들 X.
` : "";

  // ─── sub 분배표 prepend (PRIMARY 인자 sub간 중복 차단 + 자연 비유 1회 룰) ───
  type HS = "ch1"|"ch2"|"ch3"|"ch4"|"ch5"|"ch6";
  const _dist = (s: HS) => hongsilSubDistribution(s);

  // 모든 챕터에 십성 표준 정의 + 단독 풀이 환각 방지 블록 prepend
  const _common = SIPSEONG_STANDARD_DEFINITIONS + SOLO_MODE_GUARD;

  // ch6 "마지막 편지"는 본문에서 "사주 전문용어와 한자 금지" 강제 룰을 따른다.
  // _common 블록 안엔 십성 한자 정의(`비겁(比劫: 비견·겁재)…`)가 박혀있어
  // ch6 prompt와 모순된 지시가 되면 Gemini가 빈 응답을 반환하는 사례 발견.
  // ch6는 캐릭터 회상 위주라 정의 통일 룰이 사실상 불필요 — 단독 풀이 환각 방지만 유지.
  const _ch6Common = SOLO_MODE_GUARD;

  return {
    ch1: _common + _planBlock("ch1") + _dist("ch1") + _block("ch1") + ch1,
    ch2: _common + _planBlock("ch2") + _dist("ch2") + _block("ch2") + _ch2ChartFacts + ch2,
    ch3: _common + _planBlock("ch3") + _dist("ch3") + _block("ch3") + _ch3ChartFacts + ch3,
    ch4: _common + _planBlock("ch4") + _dist("ch4") + _block("ch4") + _ch4ChartFacts + ch4,
    ch5: _common + _planBlock("ch5") + _dist("ch5") + _block("ch5") + _ch5ChartFacts + ch5,
    ch6: _ch6Common + _planBlock("ch6") + _dist("ch6") + _block("ch6") + _ch6ChartFacts + ch6,
  };
}

export { ILGAN_NATURE, huisinOf, gisinOf };

// ─── 호환 (인연궁합 V2 코드 잔존) — 더 이상 사용 X. 유지보수 전 placeholder ───
export const buildAllInyeonPrompts = buildAllHongsilPrompts as unknown as never;
export const buildCharacterMatch = buildHongsilCharacter as unknown as never;
