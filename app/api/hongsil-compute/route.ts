// 나의 홍실 V3 — 1인 사주 + V3 캐릭터 매칭
import { NextRequest, NextResponse } from "next/server";
import { calculateFourPillars } from "manseryeok";
import {
  getSipseong, calcDaeun, calcSinsal, calcElements, getYongsin,
  calcMonthPillar, calcYearPillar, getDayMasterStrength,
  type SajuAnalysis,
} from "@/lib/saju-calculator";
import { matchCharacter, deriveIdealType } from "@/lib/hongsil/character-match";

export const maxDuration = 60;

const HOUR_MAP: Record<string, number> = {
  "시간 모름": 12, "모름": 12,
  "자시 (23:30~01:29)": 0, "축시 (01:30~03:29)": 2, "인시 (03:30~05:29)": 4,
  "묘시 (05:30~07:29)": 6, "진시 (07:30~09:29)": 8, "사시 (09:30~11:29)": 10,
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
    console.error("hongsil-compute saju error:", e);
    return null;
  }
}

function shinkangLevel(s: SajuAnalysis): string {
  const allBranches = [s.pillars.year.branch, s.pillars.month.branch, s.pillars.day.branch, ...(s.pillars.hour ? [s.pillars.hour.branch] : [])];
  const otherStems = [s.pillars.year.stem, s.pillars.month.stem, ...(s.pillars.hour ? [s.pillars.hour.stem] : [])];
  try {
    return getDayMasterStrength(s.ilgan, s.pillars.month.branch, allBranches, otherStems).level;
  } catch {
    return "중화";
  }
}
function topElement(s: SajuAnalysis): string {
  return (Object.entries(s.elements) as [string, number][]).sort((a, b) => b[1] - a[1])[0][0];
}
function weakElement(s: SajuAnalysis): string {
  return (Object.entries(s.elements) as [string, number][]).sort((a, b) => a[1] - b[1])[0][0];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const me = computeFullSaju(body.me);
    if (!me) return NextResponse.json({ error: "saju compute failed" }, { status: 400 });
    const meGender: "남" | "여" = body.me.gender === "여" ? "여" : "남";
    const meMatch = matchCharacter(me, meGender);
    const destinyMatch = deriveIdealType(me, meGender);

    return NextResponse.json({
      me: {
        pillars: me.pillars,
        ilgan: me.ilgan,
        sipseong: me.sipseong,
        elements: me.elements,
        yongsin: me.yongsin,
        sinsal: me.sinsal,
        daeun: me.daeun,
        shinkang: shinkangLevel(me),
        ohaengTop: topElement(me),
        ohaengWeak: weakElement(me),
      },
      character: { me: meMatch, destiny: destinyMatch },
    });
  } catch (e) {
    console.error("hongsil-compute error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
