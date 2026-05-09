import { NextRequest, NextResponse } from "next/server";
import { calculateFourPillars } from "manseryeok";
import {
  getSipseong, calcDaeun, calcSinsal, calcElements, getYongsin,
  calcMonthPillar, calcYearPillar, calcCompatibility,
  type SajuAnalysis,
} from "@/lib/saju-calculator";
import { computeInyeonScores, scoreLabelFor, estimateAssetCurve, estimateTogetherCurve } from "@/lib/inyeon/scoring";
import { matchCharacter } from "@/lib/inyeon/character-match";
import { getPairLabelFor } from "@/lib/inyeon/character-pair";

export const maxDuration = 60;

const HOUR_MAP: Record<string, number> = {
  "시간 모름": 12, "모름": 12,
  "자시 (23:30~01:29)": 0,  "축시 (01:30~03:29)": 2,  "인시 (03:30~05:29)": 4,
  "묘시 (05:30~07:29)": 6,  "진시 (07:30~09:29)": 8,  "사시 (09:30~11:29)": 10,
  "오시 (11:30~13:29)": 12, "미시 (13:30~15:29)": 14, "신시 (15:30~17:29)": 16,
  "유시 (17:30~19:29)": 18, "술시 (19:30~21:29)": 20, "해시 (21:30~23:29)": 22,
};

interface PersonInput {
  name: string;
  year: number; month: number; day: number;
  hour: string;
  isLunar: boolean;
  gender: string;
}

function computeFullSaju(p: PersonInput): SajuAnalysis | null {
  try {
    const hour = HOUR_MAP[p.hour] ?? 12;
    const isHourUnknown = p.hour === "모름" || p.hour === "시간 모름";
    const fp = calculateFourPillars({ year: p.year, month: p.month, day: p.day, hour, minute: 0, isLunar: p.isLunar });

    const correctedYear = calcYearPillar(p.year, p.month, p.day);
    const correctedMonth = calcMonthPillar(p.year, p.month, p.day);
    const pillars: SajuAnalysis["pillars"] = {
      year: correctedYear,
      month: correctedMonth,
      day: { stem: fp.day.heavenlyStem, branch: fp.day.earthlyBranch },
      hour: isHourUnknown ? null : { stem: fp.hour.heavenlyStem, branch: fp.hour.earthlyBranch },
    };
    const ilgan = pillars.day.stem;
    const ss = (stem: string, branch: string) => ({
      stem: getSipseong(ilgan, stem, false),
      branch: getSipseong(ilgan, branch, true),
    });
    const sipseong: SajuAnalysis["sipseong"] = {
      year: ss(pillars.year.stem, pillars.year.branch),
      month: ss(pillars.month.stem, pillars.month.branch),
      day: ss(pillars.day.stem, pillars.day.branch),
      hour: isHourUnknown || !pillars.hour ? null : ss(pillars.hour.stem, pillars.hour.branch),
    };
    const allStems = [pillars.year.stem, pillars.month.stem, pillars.day.stem, ...(pillars.hour ? [pillars.hour.stem] : [])];
    const allBranches = [pillars.year.branch, pillars.month.branch, pillars.day.branch, ...(pillars.hour ? [pillars.hour.branch] : [])];
    const elements = calcElements(allStems, allBranches);
    const yongsin = getYongsin(ilgan, elements);
    const daeun = calcDaeun(p.year, p.month, p.day, pillars.year.stem, pillars.month, p.gender);
    const sinsal = calcSinsal(
      pillars.year.branch, pillars.day.branch, ilgan,
      allBranches, allStems, pillars.month.branch, pillars.day.stem,
    );

    return { pillars, ilgan, sipseong, elements, yongsin, daeun, sinsal, isHourUnknown };
  } catch (e) {
    console.error("inyeon-compute saju error:", e);
    return null;
  }
}

const STEM_ELEM: Record<string, string> = {
  갑: "목", 을: "목", 병: "화", 정: "화", 무: "토", 기: "토",
  경: "금", 신: "금", 임: "수", 계: "수",
};

function shinkangLevel(s: SajuAnalysis): "극약" | "태약" | "신약" | "중화" | "신강" | "태강" | "극왕" {
  const ilganElem = STEM_ELEM[s.ilgan] as keyof typeof s.elements;
  const same = s.elements[ilganElem];
  const total = s.elements.목 + s.elements.화 + s.elements.토 + s.elements.금 + s.elements.수;
  const ratio = total > 0 ? same / total : 0;
  if (ratio < 0.1) return "극약";
  if (ratio < 0.18) return "태약";
  if (ratio < 0.25) return "신약";
  if (ratio < 0.32) return "중화";
  if (ratio < 0.4) return "신강";
  if (ratio < 0.5) return "태강";
  return "극왕";
}

function topElement(s: SajuAnalysis): string {
  const arr = Object.entries(s.elements) as Array<[string, number]>;
  arr.sort((a, b) => b[1] - a[1]);
  return arr[0][0];
}
function weakElement(s: SajuAnalysis): string {
  const arr = Object.entries(s.elements) as Array<[string, number]>;
  arr.sort((a, b) => a[1] - b[1]);
  return arr[0][0];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const a = computeFullSaju(body.a);
    const b = computeFullSaju(body.b);
    if (!a || !b) {
      return NextResponse.json({ error: "saju compute failed" }, { status: 400 });
    }
    const compat = calcCompatibility(a, b);
    const scores = computeInyeonScores(a, b, compat);
    const aCurve = estimateAssetCurve(a);
    const bCurve = estimateAssetCurve(b);
    const togetherCurve = estimateTogetherCurve(aCurve, bCurve, scores.finance);

    // ─── 결정론 캐릭터 매칭 — "나는 솔로" 컨셉 ───
    const aGender: "남" | "여" = body.a.gender === "여" ? "여" : "남";
    const bGender: "남" | "여" = body.b.gender === "여" ? "여" : "남";
    const aMatch = matchCharacter(a, aGender);
    const bMatch = matchCharacter(b, bGender);
    const pairLabel = getPairLabelFor(aGender, aMatch.name, bGender, bMatch.name);

    return NextResponse.json({
      a: {
        pillars: a.pillars,
        ilgan: a.ilgan,
        sipseong: a.sipseong,
        elements: a.elements,
        yongsin: a.yongsin,
        sinsal: a.sinsal,
        shinkang: shinkangLevel(a),
        ohaengTop: topElement(a),
        ohaengWeak: weakElement(a),
      },
      b: {
        pillars: b.pillars,
        ilgan: b.ilgan,
        sipseong: b.sipseong,
        elements: b.elements,
        yongsin: b.yongsin,
        sinsal: b.sinsal,
        shinkang: shinkangLevel(b),
        ohaengTop: topElement(b),
        ohaengWeak: weakElement(b),
      },
      compat: {
        score: compat.score,
        scoreLabel: compat.scoreLabel,
        ilganRelation: compat.ilganRelation,
        ilganDetail: compat.ilganDetail,
        elementBalance: compat.elementBalance,
        branchRelations: compat.branchRelations,
        sharedSinsal: compat.sharedSinsal,
        strengths: compat.strengths,
        weaknesses: compat.weaknesses,
      },
      scores: {
        ...scores,
        labels: {
          inyeon: scoreLabelFor(scores.inyeon),
          seonggyeok: scoreLabelFor(scores.seonggyeok),
          emotion: scoreLabelFor(scores.emotion),
          physical: scoreLabelFor(scores.physical),
          finance: scoreLabelFor(scores.finance),
          marriage: scoreLabelFor(scores.marriage),
        },
      },
      curves: { a: aCurve, b: bCurve, together: togetherCurve },
      character: {
        a: aMatch,
        b: bMatch,
        pair: pairLabel,
      },
    });
  } catch (e) {
    console.error("inyeon-compute error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
