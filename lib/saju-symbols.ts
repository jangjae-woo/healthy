// ── 천간(天干) 10가지 / 지지(地支) 12가지 정적 매핑 ───────────────
// Phase 1 (양반사주 시각 SSOT 채택+변형):
// - 자녀 사주에 등장하는 천간/지지 카드를 강조 표시할 때 사용
// - 사주 상식 박스에서도 작은 사이즈로 재사용
// - 양반사주처럼 10개/12개 모두 풀 그리드로 노출하지는 않음 (정보 과부하 방지)

export type ElementKey = "목" | "화" | "토" | "금" | "수";

export const ELEMENT_COLOR: Record<ElementKey, string> = {
  목: "#3a8a5e",   // 짙은 녹
  화: "#c43c3c",   // 깊은 적
  토: "#8b6f3a",   // 황토
  금: "#7a7a7a",   // 회금
  수: "#2d4a78",   // 짙은 청
};

// 라이트 모드 한지 톤에서 잘 읽히는 배경 색 (각 오행)
export const ELEMENT_BG: Record<ElementKey, string> = {
  목: "#e3efe5",
  화: "#f4dada",
  토: "#efe7d3",
  금: "#e5e5e5",
  수: "#d9e1ee",
};

// ── 천간 10간 ──
// 음양·오행·한 줄 의미
export interface CheonganInfo {
  hanja: string;       // 甲
  hangul: string;      // 갑
  yinYang: "양" | "음";
  element: ElementKey;
  meaning: string;     // 한 줄 본질 비유
}

export const CHEONGAN: Record<string, CheonganInfo> = {
  甲: { hanja: "甲", hangul: "갑", yinYang: "양", element: "목", meaning: "곧게 뻗은 큰 나무" },
  乙: { hanja: "乙", hangul: "을", yinYang: "음", element: "목", meaning: "유연한 풀·덩굴" },
  丙: { hanja: "丙", hangul: "병", yinYang: "양", element: "화", meaning: "환히 비추는 태양" },
  丁: { hanja: "丁", hangul: "정", yinYang: "음", element: "화", meaning: "따뜻한 등불·촛불" },
  戊: { hanja: "戊", hangul: "무", yinYang: "양", element: "토", meaning: "너른 들판·산" },
  己: { hanja: "己", hangul: "기", yinYang: "음", element: "토", meaning: "기름진 논·밭" },
  庚: { hanja: "庚", hangul: "경", yinYang: "양", element: "금", meaning: "단단한 무쇠·바위" },
  辛: { hanja: "辛", hangul: "신", yinYang: "음", element: "금", meaning: "빛나는 보석·칼" },
  壬: { hanja: "壬", hangul: "임", yinYang: "양", element: "수", meaning: "넓은 강·바다" },
  癸: { hanja: "癸", hangul: "계", yinYang: "음", element: "수", meaning: "이슬·맑은 샘물" },
};

// ── 지지 12지 ──
export interface JijiInfo {
  hanja: string;       // 子
  hangul: string;      // 자
  animal: string;      // 쥐
  yinYang: "양" | "음";
  element: ElementKey;
  meaning: string;     // 한 줄 시간/계절 비유
}

export const JIJI: Record<string, JijiInfo> = {
  子: { hanja: "子", hangul: "자", animal: "쥐",   yinYang: "양", element: "수", meaning: "한밤의 시작" },
  丑: { hanja: "丑", hangul: "축", animal: "소",   yinYang: "음", element: "토", meaning: "겨울 끝자락의 축적" },
  寅: { hanja: "寅", hangul: "인", animal: "호랑이", yinYang: "양", element: "목", meaning: "이른 봄의 약동" },
  卯: { hanja: "卯", hangul: "묘", animal: "토끼", yinYang: "음", element: "목", meaning: "깊은 봄의 새싹" },
  辰: { hanja: "辰", hangul: "진", animal: "용",   yinYang: "양", element: "토", meaning: "봄에서 여름으로의 전환" },
  巳: { hanja: "巳", hangul: "사", animal: "뱀",   yinYang: "음", element: "화", meaning: "초여름의 햇살" },
  午: { hanja: "午", hangul: "오", animal: "말",   yinYang: "양", element: "화", meaning: "한낮의 정점" },
  未: { hanja: "未", hangul: "미", animal: "양",   yinYang: "음", element: "토", meaning: "여름 끝자락의 결실" },
  申: { hanja: "申", hangul: "신", animal: "원숭이", yinYang: "양", element: "금", meaning: "초가을의 결단" },
  酉: { hanja: "酉", hangul: "유", animal: "닭",   yinYang: "음", element: "금", meaning: "한가을의 다듬음" },
  戌: { hanja: "戌", hangul: "술", animal: "개",   yinYang: "양", element: "토", meaning: "가을 끝자락의 갈무리" },
  亥: { hanja: "亥", hangul: "해", animal: "돼지", yinYang: "음", element: "수", meaning: "초겨울의 침잠" },
};

// ── 오행 생·극 관계 ──
// 생(生): 목→화→토→금→수→목 (시계방향 순환)
// 극(剋): 목→토→수→화→금→목 (별 모양)
export const OHAENG_ORDER: ElementKey[] = ["목", "화", "토", "금", "수"];

export const OHAENG_SAENG: Record<ElementKey, ElementKey> = {
  목: "화", 화: "토", 토: "금", 금: "수", 수: "목",
};

export const OHAENG_GEUK: Record<ElementKey, ElementKey> = {
  목: "토", 토: "수", 수: "화", 화: "금", 금: "목",
};

// ── 오행 정의 한 줄 (사주 상식 카드용) ──
export const ELEMENT_MEANING: Record<ElementKey, string> = {
  목: "성장·뻗어나감",
  화: "열정·표현",
  토: "안정·중심",
  금: "결단·다듬음",
  수: "지혜·흐름",
};
