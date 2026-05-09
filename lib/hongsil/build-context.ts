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

  return { ch1, ch2, ch3, ch4, ch5, ch6 };
}

export { ILGAN_NATURE, huisinOf, gisinOf };

// ─── 호환 (인연궁합 V2 코드 잔존) — 더 이상 사용 X. 유지보수 전 placeholder ───
export const buildAllInyeonPrompts = buildAllHongsilPrompts as unknown as never;
export const buildCharacterMatch = buildHongsilCharacter as unknown as never;
