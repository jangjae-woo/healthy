// ════════════════════════════════════════════════════════════════════
// 인자 압축 + 암묵적 회수 (룰 4·5·8·9)
// sub별 인자 후보 → LLM 주입 가이드 문자열
// ════════════════════════════════════════════════════════════════════

export type FactorCategory = "primary" | "support" | "absorbed" | "duplicate";

export interface FactorSlot {
  hanja: string;              // 일간(日干), 도화살(桃花殺), 정관(正官) 등
  category: FactorCategory;
  meaning?: string;            // 작용 한 줄 (LLM 참고)
}

// sub별 인자 후보 정의 — B.txt + C.txt 풀이 방향 기반
export const SUB_FACTOR_SLOTS: Record<number, FactorSlot[]> = {
  // ─── 1장 매력 ───
  1: [
    { hanja: "일간(日干)", category: "primary", meaning: "본인 결의 핵심" },
    { hanja: "도화살(桃花殺)", category: "primary", meaning: "매력의 별" },
    { hanja: "월덕귀인(月德貴人)", category: "support", meaning: "평소 매력" },
    { hanja: "재성(財星)", category: "support", meaning: "끌어당기는 자성" },
    { hanja: "비겁(比劫)", category: "support", meaning: "결의 활성" },
  ],
  2: [
    { hanja: "일주(日柱)", category: "primary", meaning: "60갑자 첫인상 결" },
    { hanja: "도화살(桃花殺)", category: "duplicate", meaning: "1장 등장 - 회수" },
    { hanja: "홍염살(紅艶殺)", category: "primary", meaning: "이성 끌림 첫인상" },
    { hanja: "일간 음양", category: "support", meaning: "양/음 외형 결" },
  ],
  3: [
    { hanja: "신강신약", category: "primary", meaning: "썸 단계 깊이" },
    { hanja: "일주 겉/속", category: "primary", meaning: "반전 매력" },
    { hanja: "식상(食傷)", category: "support", meaning: "절제된 표현" },
  ],
  4: [
    { hanja: "일주 합·충", category: "primary", meaning: "사랑할 때 변형" },
    { hanja: "관성(官星)", category: "support", meaning: "책임감 결" },
    { hanja: "비겁(比劫)", category: "duplicate", meaning: "1장 등장 - 회수" },
    { hanja: "세운(歲運)", category: "support", meaning: "올해 변형 강도" },
  ],
  5: [
    { hanja: "관성(官星)", category: "primary", meaning: "다가가는 결" },
    { hanja: "일주 음양", category: "primary", meaning: "주도/수동" },
    { hanja: "신강신약", category: "duplicate", meaning: "3sub 등장 - 회수" },
    { hanja: "천을귀인(天乙貴人)", category: "support", meaning: "도움 인연" },
  ],
  6: [
    { hanja: "편관(偏官)", category: "primary", meaning: "끌림의 결" },
    { hanja: "편재(偏財)", category: "primary", meaning: "끌림의 결" },
    { hanja: "정관(正官)", category: "primary", meaning: "적합한 결" },
    { hanja: "정재(正財)", category: "primary", meaning: "적합한 결" },
  ],

  // ─── 3장 짝꿍 ───
  7: [
    { hanja: "화개살(華蓋殺)", category: "primary", meaning: "자만추 자리" },
    { hanja: "도화살(桃花殺)", category: "duplicate", meaning: "1장 등장 - 회수" },
    { hanja: "홍염살(紅艶殺)", category: "duplicate", meaning: "2장 등장 - 회수" },
    { hanja: "인성(印星)", category: "primary", meaning: "결정사 자리" },
  ],
  8: [
    { hanja: "부족 오행", category: "primary", meaning: "보완 짝꿍" },
    { hanja: "약한 십성", category: "primary", meaning: "보완 짝꿍" },
    { hanja: "일지(日支)", category: "support", meaning: "배우자궁" },
  ],
  9: [
    { hanja: "일지(日支)", category: "primary", meaning: "배우자궁 시각 인상" },
    { hanja: "정관(正官)", category: "primary", meaning: "(여) 짝꿍 결" },
    { hanja: "편관(偏官)", category: "support", meaning: "(여) 짝꿍 결" },
    { hanja: "정재(正財)", category: "primary", meaning: "(남) 짝꿍 결" },
    { hanja: "편재(偏財)", category: "support", meaning: "(남) 짝꿍 결" },
    { hanja: "용신(用神)", category: "support", meaning: "짝꿍 직업군" },
  ],
  10: [
    { hanja: "천을귀인(天乙貴人)", category: "primary", meaning: "운명 단서" },
    { hanja: "역마살(驛馬殺)", category: "primary", meaning: "만남 임박 신호" },
    { hanja: "신살", category: "support", meaning: "일상 신호" },
  ],
  11: [
    { hanja: "식상(食傷)", category: "primary", meaning: "행동 결" },
    { hanja: "재성(財星)", category: "primary", meaning: "잡는 한 수" },
    { hanja: "일간 표현", category: "support", meaning: "결정적 행동" },
  ],
  12: [
    { hanja: "관성 대운", category: "primary", meaning: "결혼 자리" },
    { hanja: "재성 대운", category: "primary", meaning: "결혼 자리" },
    { hanja: "일주 합", category: "primary", meaning: "결혼 시점" },
    { hanja: "일지 합", category: "support", meaning: "결혼 시점" },
  ],

  // ─── 4장 반복 패턴 ───
  13: [
    { hanja: "편관(偏官)", category: "primary", meaning: "통제 결 위험" },
    { hanja: "정관(正官)", category: "duplicate", meaning: "5/6장 등장 - 회수" },
    { hanja: "기신(忌神)", category: "support", meaning: "함정 작용" },
  ],
  14: [
    { hanja: "약한 십성", category: "primary", meaning: "반복 결말 원인" },
    { hanja: "일지(日支)", category: "duplicate", meaning: "9장 등장 - 회수" },
    { hanja: "공망(空亡)", category: "support", meaning: "반복 빈자리" },
  ],
  15: [
    { hanja: "용신(用神)", category: "primary", meaning: "굴레 해법" },
    { hanja: "인성(印星)", category: "primary", meaning: "보강 해법" },
    { hanja: "희신(喜神)", category: "support", meaning: "도움 결" },
  ],

  // ─── 2장 사랑타이밍 ───
  16: [
    { hanja: "대운(大運)", category: "primary", meaning: "30년 큰 흐름" },
    { hanja: "용신 흐름", category: "support", meaning: "사랑 결 진입 자리" },
  ],
  17: [
    { hanja: "역마살(驛馬殺)", category: "duplicate", meaning: "10장 등장 - 회수" },
    { hanja: "관성 진입 시기", category: "primary", meaning: "솔로 탈출" },
    { hanja: "세운(歲運)", category: "primary", meaning: "가까운 미래" },
  ],
  18: [
    { hanja: "병오(丙午) 세운", category: "primary", meaning: "2026 한 해" },
    { hanja: "일간 작용", category: "primary", meaning: "본인×세운 결" },
    { hanja: "월운(月運)", category: "support", meaning: "상반기·하반기 분기" },
  ],

  // ─── 5장 19금 ───
  19: [
    { hanja: "도화살(桃花殺) 위치", category: "primary", meaning: "년/월/일/시 분류" },
    { hanja: "홍염살(紅艶殺) 위치", category: "primary", meaning: "년/월/일/시 분류" },
  ],
  20: [
    { hanja: "욕신살(浴神殺)", category: "primary", meaning: "본능 깨우는 자리" },
    { hanja: "일지 합(日支 合)", category: "primary", meaning: "본능 결" },
  ],
  21: [
    { hanja: "일지(日支)", category: "duplicate", meaning: "9·14장 등장 - 회수" },
    { hanja: "용신(用神)", category: "duplicate", meaning: "15장 등장 - 회수" },
    { hanja: "일간 음양", category: "duplicate", meaning: "2·5장 등장 - 회수" },
  ],

  // ─── 6장 편지 ───
  22: [
    { hanja: "일간(日干)", category: "primary", meaning: "전체 회상" },
    { hanja: "용신(用神)", category: "support", meaning: "마무리 결" },
  ],
};

// ─── 인자 가이드 문자열 생성 ─────────────────
export function buildFactorGuide(subId: number): string {
  const slots = SUB_FACTOR_SLOTS[subId] ?? [];
  if (slots.length === 0) return "";

  const primary = slots.filter((s) => s.category === "primary");
  const support = slots.filter((s) => s.category === "support");
  const duplicate = slots.filter((s) => s.category === "duplicate");

  let guide = `
[★ sub${String(subId).padStart(2, "0")} 인자 가이드 — 룰 4·5·8·9]

🔴 1차 인자 (반드시 노출):
${primary.map((s) => `  • ${s.hanja} — ${s.meaning ?? ""}`).join("\n")}

`;

  if (support.length > 0) {
    guide += `🟡 보강 인자 (권장 노출, 양보 가능):
${support.map((s) => `  • ${s.hanja} — ${s.meaning ?? ""}`).join("\n")}

`;
  }

  if (duplicate.length > 0) {
    guide += `🟢 중복 회수 인자 (한자 노출 X — 암묵적 회수만):
${duplicate.map((s) => `  • ${s.hanja} → "앞서 말씀드린 ㅡㅡ 결을 떠올려 보세요" 패턴`).join("\n")}

`;
  }

  const totalPrimary = primary.length;
  if (totalPrimary >= 4) {
    guide += `[압축 룰 적용] 1차 인자 ${totalPrimary}개 → 단락엔 2~3개만 자연스럽게 녹임. 우선: 처음 등장 + 종류 분산.\n`;
  } else {
    guide += `[압축 룰 적용] 1차 인자 ${totalPrimary}개 → 단락에 모두 노출.\n`;
  }

  return guide;
}
