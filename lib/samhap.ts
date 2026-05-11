// ════════════════════════════════════════════════════════════════════
// 삼합(三合)·방합(方合)·반합(半合) 결합 분석
// 자평진전·적천수 정통 — 지지 결합으로 합화 오행 형성, 사주 영향 큼
//
// 삼합: 3지지 — 가장 강함 (그 오행으로 합국)
//   신자진 = 수국 (申子辰)
//   인오술 = 화국 (寅午戌)
//   사유축 = 금국 (巳酉丑)
//   해묘미 = 목국 (亥卯未)
//
// 방합: 3지지 같은 방향 — 매우 강함
//   인묘진 = 동방 목
//   사오미 = 남방 화
//   신유술 = 서방 금
//   해자축 = 북방 수
//
// 반합: 2지지 (삼합 중 2개) — 부분 형성, 약함
//   신자/자진/신진 — 수 부분
//   인오/오술/인술 — 화 부분
//   사유/유축/사축 — 금 부분
//   해묘/묘미/해미 — 목 부분
//   (신자, 사유 등 왕지 포함이 강함. 신진 같은 단독은 약함)
// ════════════════════════════════════════════════════════════════════

import type { SajuAnalysis } from "./saju-calculator";

const SAMHAP_GROUPS: { branches: string[]; element: string; name: string }[] = [
  { branches: ["신", "자", "진"], element: "수", name: "신자진(申子辰) 수국" },
  { branches: ["인", "오", "술"], element: "화", name: "인오술(寅午戌) 화국" },
  { branches: ["사", "유", "축"], element: "금", name: "사유축(巳酉丑) 금국" },
  { branches: ["해", "묘", "미"], element: "목", name: "해묘미(亥卯未) 목국" },
];

const BANGHAP_GROUPS: { branches: string[]; element: string; name: string }[] = [
  { branches: ["인", "묘", "진"], element: "목", name: "인묘진(寅卯辰) 동방 목" },
  { branches: ["사", "오", "미"], element: "화", name: "사오미(巳午未) 남방 화" },
  { branches: ["신", "유", "술"], element: "금", name: "신유술(申酉戌) 서방 금" },
  { branches: ["해", "자", "축"], element: "수", name: "해자축(亥子丑) 북방 수" },
];

// 반합: 삼합의 왕지 포함 2지지가 강함
// 신자/자진/사유/유축/인오/오술/해묘/묘미 — 왕지(자/오/유/묘) 포함
// 신진/사축/인술/해미 — 왕지 X, 약함
const BANHAP_STRONG: { branches: string[]; element: string; name: string }[] = [
  { branches: ["신", "자"], element: "수", name: "신자(申子) 반합" },
  { branches: ["자", "진"], element: "수", name: "자진(子辰) 반합" },
  { branches: ["인", "오"], element: "화", name: "인오(寅午) 반합" },
  { branches: ["오", "술"], element: "화", name: "오술(午戌) 반합" },
  { branches: ["사", "유"], element: "금", name: "사유(巳酉) 반합" },
  { branches: ["유", "축"], element: "금", name: "유축(酉丑) 반합" },
  { branches: ["해", "묘"], element: "목", name: "해묘(亥卯) 반합" },
  { branches: ["묘", "미"], element: "목", name: "묘미(卯未) 반합" },
];

export interface HapResult {
  type: "삼합" | "방합" | "반합";
  name: string;
  element: string;
  formedBy: string[];      // 사주 4지지 중 합 형성한 지지
  strength: number;         // 가중치 (삼합=3, 방합=3, 반합=1.5)
}

export function deriveSamhap(saju: SajuAnalysis): HapResult[] {
  const allBranches = [
    saju.pillars.year.branch,
    saju.pillars.month.branch,
    saju.pillars.day.branch,
    ...(saju.pillars.hour ? [saju.pillars.hour.branch] : []),
  ];
  const branchSet = new Set(allBranches);

  const results: HapResult[] = [];

  // 삼합 우선 검사
  for (const group of SAMHAP_GROUPS) {
    const matched = group.branches.filter(b => branchSet.has(b));
    if (matched.length === 3) {
      results.push({
        type: "삼합",
        name: group.name,
        element: group.element,
        formedBy: matched,
        strength: 3.0,
      });
    }
  }

  // 방합 검사
  for (const group of BANGHAP_GROUPS) {
    const matched = group.branches.filter(b => branchSet.has(b));
    if (matched.length === 3) {
      results.push({
        type: "방합",
        name: group.name,
        element: group.element,
        formedBy: matched,
        strength: 3.0,
      });
    }
  }

  // 반합 검사 (삼합 형성된 케이스는 제외 — 이미 삼합이라 반합 무의미)
  if (!results.some(r => r.type === "삼합")) {
    for (const pair of BANHAP_STRONG) {
      const matched = pair.branches.filter(b => branchSet.has(b));
      if (matched.length === 2) {
        results.push({
          type: "반합",
          name: pair.name,
          element: pair.element,
          formedBy: matched,
          strength: 1.5,
        });
      }
    }
  }

  return results;
}

// 합화 오행이 일간에게 십성 → 가중 카운트 보정 (이미 형성된 합 오행 +1)
export function hapElemToSip(ilgan: string, hapElem: string): string {
  const ELEM: Record<string, string> = {
    갑: "목", 을: "목", 병: "화", 정: "화",
    무: "토", 기: "토", 경: "금", 신: "금",
    임: "수", 계: "수",
  };
  const ilElem = ELEM[ilgan] ?? "토";
  const generates: Record<string, string> = { 목: "화", 화: "토", 토: "금", 금: "수", 수: "목" };
  const controls: Record<string, string> = { 목: "토", 화: "금", 토: "수", 금: "목", 수: "화" };
  if (hapElem === ilElem) return "비겁";
  if (generates[ilElem] === hapElem) return "식상";
  if (controls[ilElem] === hapElem) return "재성";
  if (controls[hapElem] === ilElem) return "관성";
  return "인성";
}
