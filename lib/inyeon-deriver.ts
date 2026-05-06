// V1 인연 시각화용 결정론 derive 함수들.
// V2 lib/inyeon/* 와 별개 (V2는 두 사람 궁합용, 이건 V1 솔로용).
import type { SajuAnalysis } from "@/lib/saju-calculator";

const STEM_ELEMENT: Record<string, string> = {
  갑: "목", 을: "목",
  병: "화", 정: "화",
  무: "토", 기: "토",
  경: "금", 신: "금",
  임: "수", 계: "수",
};

const ELEMENT_ESSENCE: Record<string, string> = {
  목: "곧고 자라는 결",
  화: "빛나고 펼치는 결",
  토: "품고 안정시키는 결",
  금: "다듬고 결단하는 결",
  수: "흐르고 지혜로운 결",
};

export function deriveEssenceKeywords(saju: SajuAnalysis): string[] {
  const keywords: string[] = [];

  // 1. 일간 본질
  const elem = STEM_ELEMENT[saju.ilgan];
  if (elem && ELEMENT_ESSENCE[elem]) keywords.push(ELEMENT_ESSENCE[elem]);

  // 2. 강한 오행
  const elemEntries = Object.entries(saju.elements) as [string, number][];
  if (elemEntries.length > 0) {
    const strongest = elemEntries.reduce((a, b) => (a[1] > b[1] ? a : b));
    if (strongest[1] > 0) keywords.push(`${strongest[0]}(${strongest[0]}) 기운 강함`);
  }

  // 3. 약한 오행 (채울 자리)
  if (elemEntries.length > 0) {
    const weakest = elemEntries.reduce((a, b) => (a[1] < b[1] ? a : b));
    if (weakest[1] === 0) keywords.push(`${weakest[0]} 기운 채울 자리`);
  }

  // 4. 매력 신살 1개 (있으면)
  const charm = saju.sinsal.find((s) => /도화|홍염|천을/.test(s));
  if (charm) keywords.push(charm);

  // 5. 용신
  if (saju.yongsin) keywords.push(`용신 ${saju.yongsin}`);

  return keywords.slice(0, 5);
}

export function deriveCharmSinsal(saju: SajuAnalysis): { name: string; hanja: string; has: boolean; meaning: string }[] {
  const ss = saju.sinsal;
  return [
    { name: "도화살", hanja: "桃花", has: ss.some((s) => s.includes("도화")), meaning: "사랑받고 빛나는 매력의 결" },
    { name: "홍염살", hanja: "紅艶", has: ss.some((s) => s.includes("홍염")), meaning: "은은히 끌어당기는 매력의 결" },
    { name: "천을귀인", hanja: "天乙", has: ss.some((s) => s.includes("천을")), meaning: "귀한 인연이 도와주는 자리" },
  ];
}

export function deriveInyeonKeywords(saju: SajuAnalysis): string[] {
  const keywords: string[] = [];
  const elem = STEM_ELEMENT[saju.ilgan];
  if (elem === "목") keywords.push("성장하는 인연");
  else if (elem === "화") keywords.push("빛나는 인연");
  else if (elem === "토") keywords.push("안정된 인연");
  else if (elem === "금") keywords.push("단단한 인연");
  else if (elem === "수") keywords.push("흐르는 인연");

  // 매력 신살 기반
  const sinsal = saju.sinsal;
  if (sinsal.some((s) => s.includes("도화"))) keywords.push("사랑받는 결");
  if (sinsal.some((s) => s.includes("홍염"))) keywords.push("은은한 매력");
  if (sinsal.some((s) => s.includes("천을"))) keywords.push("귀한 인연 만남");

  // 용신 기반
  if (saju.yongsin) keywords.push(`${saju.yongsin} 기운에서 깊어지는 인연`);

  // 강한 오행 기반
  const elemEntries = Object.entries(saju.elements) as [string, number][];
  if (elemEntries.length > 0) {
    const strongest = elemEntries.reduce((a, b) => (a[1] > b[1] ? a : b));
    if (strongest[1] >= 3) keywords.push(`${strongest[0]} 결의 사람과 끌림`);
  }

  return keywords.slice(0, 5);
}
