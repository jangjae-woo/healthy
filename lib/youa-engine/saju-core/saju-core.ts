import { calculateFourPillars, lunarToSolar } from "manseryeok";
import {
  calcDaeun,
  calcElements,
  calcMonthPillar,
  calcSinsal,
  calcYearPillar,
  getDayMasterStrength,
  getSipseong,
  getYongsin,
  type DayMasterStrengthLevel,
  type Elements,
  type SajuAnalysis,
} from "./saju-calculator";

export interface SajuCoreInput {
  year: number | string;
  month: number | string;
  day: number | string;
  hour?: string;
  calendar?: string;
  isLunar?: boolean;
  isLeapMonth?: boolean;
  gender?: string;
}

export interface SolarDate {
  year: number;
  month: number;
  day: number;
}

export type SajuAnalysisCore = SajuAnalysis & {
  shinkang: DayMasterStrengthLevel;
  solarDate: SolarDate;
  inputCalendar: "양력" | "음력";
  supportElement: string;
  yongsinModel: "service-support-element";
};

interface HourSelection {
  hour: number;
  minute: number;
  isHourUnknown: boolean;
}

const HOUR_SELECTIONS: Record<string, HourSelection> = {
  "시간 모름": { hour: 12, minute: 0, isHourUnknown: true },
  "모름": { hour: 12, minute: 0, isHourUnknown: true },
  "야자시 (23:30~23:59)": { hour: 23, minute: 30, isHourUnknown: false },
  "자시 (00:00~01:29)": { hour: 0, minute: 30, isHourUnknown: false },
  "자시 (23:30~01:29)": { hour: 0, minute: 30, isHourUnknown: false },
  "자시(23-01)": { hour: 0, minute: 30, isHourUnknown: false },
  "축시 (01:30~03:29)": { hour: 2, minute: 30, isHourUnknown: false },
  "축시(01-03)": { hour: 2, minute: 30, isHourUnknown: false },
  "인시 (03:30~05:29)": { hour: 4, minute: 30, isHourUnknown: false },
  "인시(03-05)": { hour: 4, minute: 30, isHourUnknown: false },
  "묘시 (05:30~07:29)": { hour: 6, minute: 30, isHourUnknown: false },
  "묘시(05-07)": { hour: 6, minute: 30, isHourUnknown: false },
  "진시 (07:30~09:29)": { hour: 8, minute: 30, isHourUnknown: false },
  "진시(07-09)": { hour: 8, minute: 30, isHourUnknown: false },
  "사시 (09:30~11:29)": { hour: 10, minute: 30, isHourUnknown: false },
  "사시(09-11)": { hour: 10, minute: 30, isHourUnknown: false },
  "오시 (11:30~13:29)": { hour: 12, minute: 30, isHourUnknown: false },
  "오시(11-13)": { hour: 12, minute: 30, isHourUnknown: false },
  "미시 (13:30~15:29)": { hour: 14, minute: 30, isHourUnknown: false },
  "미시(13-15)": { hour: 14, minute: 30, isHourUnknown: false },
  "신시 (15:30~17:29)": { hour: 16, minute: 30, isHourUnknown: false },
  "신시(15-17)": { hour: 16, minute: 30, isHourUnknown: false },
  "유시 (17:30~19:29)": { hour: 18, minute: 30, isHourUnknown: false },
  "유시(17-19)": { hour: 18, minute: 30, isHourUnknown: false },
  "술시 (19:30~21:29)": { hour: 20, minute: 30, isHourUnknown: false },
  "술시(19-21)": { hour: 20, minute: 30, isHourUnknown: false },
  "해시 (21:30~23:29)": { hour: 22, minute: 30, isHourUnknown: false },
  "해시(21-23)": { hour: 22, minute: 30, isHourUnknown: false },
};

function toNumber(value: number | string): number {
  const n = typeof value === "number" ? value : parseInt(value, 10);
  if (!Number.isFinite(n)) throw new Error(`invalid date value: ${value}`);
  return n;
}

export function parseHourSelection(hour?: string): HourSelection {
  return HOUR_SELECTIONS[hour ?? ""] ?? { hour: 12, minute: 0, isHourUnknown: true };
}

export function normalizeCalendar(input: SajuCoreInput): "양력" | "음력" {
  return input.isLunar || input.calendar === "음력" ? "음력" : "양력";
}

export function resolveSolarDate(input: SajuCoreInput): SolarDate {
  const year = toNumber(input.year);
  const month = toNumber(input.month);
  const day = toNumber(input.day);
  if (normalizeCalendar(input) === "음력") {
    return lunarToSolar(year, month, day, Boolean(input.isLeapMonth));
  }
  return { year, month, day };
}

export function getShinkangLevel(saju: SajuAnalysis): DayMasterStrengthLevel {
  const allBranches = [
    saju.pillars.year.branch,
    saju.pillars.month.branch,
    saju.pillars.day.branch,
    ...(saju.pillars.hour ? [saju.pillars.hour.branch] : []),
  ];
  const otherStems = [
    saju.pillars.year.stem,
    saju.pillars.month.stem,
    ...(saju.pillars.hour ? [saju.pillars.hour.stem] : []),
  ];
  return getDayMasterStrength(saju.ilgan, saju.pillars.month.branch, allBranches, otherStems).level;
}

export function topElement(saju: SajuAnalysis): keyof Elements {
  return (Object.entries(saju.elements) as Array<[keyof Elements, number]>).sort((a, b) => b[1] - a[1])[0][0];
}

export function weakElement(saju: SajuAnalysis): keyof Elements {
  return (Object.entries(saju.elements) as Array<[keyof Elements, number]>).sort((a, b) => a[1] - b[1])[0][0];
}

export function computeFullSajuCore(input: SajuCoreInput): SajuAnalysisCore | null {
  try {
    const solarDate = resolveSolarDate(input);
    const time = parseHourSelection(input.hour);
    const fp = calculateFourPillars({
      year: solarDate.year,
      month: solarDate.month,
      day: solarDate.day,
      hour: time.hour,
      minute: time.minute,
      isLunar: false,
    });

    const correctedYear = calcYearPillar(solarDate.year, solarDate.month, solarDate.day);
    const correctedMonth = calcMonthPillar(solarDate.year, solarDate.month, solarDate.day);
    const pillars: SajuAnalysis["pillars"] = {
      year: correctedYear,
      month: correctedMonth,
      day: { stem: fp.day.heavenlyStem, branch: fp.day.earthlyBranch },
      hour: time.isHourUnknown ? null : { stem: fp.hour.heavenlyStem, branch: fp.hour.earthlyBranch },
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
      hour: time.isHourUnknown || !pillars.hour ? null : ss(pillars.hour.stem, pillars.hour.branch),
    };

    const allStems = [
      pillars.year.stem,
      pillars.month.stem,
      pillars.day.stem,
      ...(pillars.hour ? [pillars.hour.stem] : []),
    ];
    const allBranches = [
      pillars.year.branch,
      pillars.month.branch,
      pillars.day.branch,
      ...(pillars.hour ? [pillars.hour.branch] : []),
    ];
    const elements = calcElements(allStems, allBranches);
    // ⭐ 2026-05-14: shinkang을 yongsin 결정 전에 미리 계산 (정통 명리 통설 적용)
    // 옛 getYongsin은 신강신약 무시 → 신강에 인성 박는 잘못. 새 로직은 shinkang 기반 분기.
    const otherStems = [
      pillars.year.stem,
      pillars.month.stem,
      ...(pillars.hour ? [pillars.hour.stem] : []),
    ];
    const shinkangResult = getDayMasterStrength(ilgan, pillars.month.branch, allBranches, otherStems);
    const supportElement = getYongsin(ilgan, elements, shinkangResult.level);
    const daeun = calcDaeun(
      solarDate.year,
      solarDate.month,
      solarDate.day,
      pillars.year.stem,
      pillars.month,
      input.gender ?? "",
    );
    const sinsal = calcSinsal(
      pillars.year.branch,
      pillars.day.branch,
      ilgan,
      allBranches,
      allStems,
      pillars.month.branch,
      pillars.day.stem,
    );

    const base: SajuAnalysis = {
      pillars,
      ilgan,
      sipseong,
      elements,
      yongsin: supportElement,
      daeun,
      sinsal,
      isHourUnknown: time.isHourUnknown,
    };

    return {
      ...base,
      shinkang: shinkangResult.level, // 이중 계산 회피 — 위에서 이미 계산된 값 재사용
      solarDate,
      inputCalendar: normalizeCalendar(input),
      supportElement,
      yongsinModel: "service-support-element",
    };
  } catch (e) {
    console.error("saju-core compute error:", e);
    return null;
  }
}
