// ── 사주 상식 박스 (Phase 4-C) ──
// 청월당 회색 카드 패턴 차용 + paljawon 검정 다크 톤 변형:
//   - 챕터 끝에 챕터에서 다룬 사주 용어 정의 노출
//   - 신뢰도·학습 가치 ↑
//   - 회색 톤 (검정 배경 위 살짝 밝은 회색 카드 = 정통 명리 자료실 느낌)

interface KnowledgeItem {
  hanja: string;       // 격국(格局)
  korean: string;      // 격국
  definition: string;  // 한 줄 정의
}

interface Props {
  title?: string;        // "사주 상식"
  items: KnowledgeItem[];
  accentColor?: string;
}

export default function SajuKnowledgeBox({ title = "사주 상식", items, accentColor = "#bcb3a0" }: Props) {
  if (!items || items.length === 0) return null;
  return (
    <div className="mt-8 mb-4">
      {/* 헤더 — 자간 넓은 작은 라벨 */}
      <div className="flex items-center gap-3 mb-3 px-1">
        <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, transparent, ${accentColor}33)` }} />
        <p className="text-[10.5px] tracking-[0.4em] text-center" style={{ color: `${accentColor}cc`, fontFamily: "'Noto Serif KR', serif" }}>
          ─ {title} ─
        </p>
        <div className="flex-1 h-px" style={{ background: `linear-gradient(to left, transparent, ${accentColor}33)` }} />
      </div>
      {/* 회색 톤 카드 */}
      <div
        className="rounded-xl p-4"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={`${item.hanja}-${i}`} className="flex flex-col gap-1">
              <div className="flex items-baseline gap-1.5">
                <span
                  className="font-bold"
                  style={{
                    color: `${accentColor}ee`,
                    fontSize: 13,
                    fontFamily: "'Noto Serif KR', serif",
                    letterSpacing: "0.04em",
                  }}
                >
                  {item.hanja}
                </span>
              </div>
              <p
                className="leading-[1.6]"
                style={{
                  color: "rgba(255,255,255,0.65)",
                  fontSize: 11.5,
                  letterSpacing: "0.01em",
                }}
              >
                {item.definition}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── 챕터별 사주 상식 정의 매핑 ──
// Ch 8(last-word)는 표시 X — 마지막 챕터라 정리·마무리 톤
export const CHAPTER_KNOWLEDGE: Record<string, KnowledgeItem[]> = {
  // Ch 1 본질
  "overview": [
    {
      hanja: "격국(格局)",
      korean: "격국",
      definition: "사주의 가장 강한 결로 정해지는 인생의 큰 그림. 자녀가 평생 자라가는 결의 방향을 가리킵니다.",
    },
    {
      hanja: "일주(日柱)",
      korean: "일주",
      definition: "태어난 날의 결 — 천간(자녀 자신)과 지지(자녀의 자기 자리)가 만나는 본질의 핵.",
    },
    {
      hanja: "용신·기신(用神·忌神)",
      korean: "용신·기신",
      definition: "사주에 채워주면 빛나는 결(용신)과 과해지면 살펴주실 결(기신). 평생 균형의 양면.",
    },
    {
      hanja: "귀인(貴人)",
      korean: "귀인",
      definition: "자녀에게 빛나는 별. 천을·문창·학당·복성 등 자녀 결을 더 환히 비추는 자리들.",
    },
  ],
  // Ch 2 마음
  "heart": [
    {
      hanja: "십성(十星) 5분류",
      korean: "십성 5분류",
      definition: "사주를 다섯 결로 나누는 정통 분류 — 비겁(자기)·식상(표현)·재성(실리)·관성(절제)·인성(사색).",
    },
    {
      hanja: "오행(五行)",
      korean: "오행",
      definition: "다섯 자연의 결 — 목(나무·성장)·화(불·열정)·토(흙·안정)·금(쇠·결단)·수(물·지혜).",
    },
  ],
  // Ch 3 배움
  "learning": [
    {
      hanja: "학당귀인(學堂貴人)",
      korean: "학당귀인",
      definition: "학문의 별 — 자녀가 책·공부·지식의 자리에서 빛나는 결을 가리킵니다.",
    },
    {
      hanja: "문창귀인(文昌貴人)",
      korean: "문창귀인",
      definition: "글의 별 — 자녀가 말과 글로 자기 결을 펼칠 때 자연스럽게 빛나는 자리.",
    },
    {
      hanja: "12운성(十二運星)",
      korean: "12운성",
      definition: "일주의 12단계 결의 흐름 — 절·태·양·생·욕·대·관·왕·쇠·병·사·묘. 자녀 결의 호흡 단계.",
    },
  ],
  // Ch 4 관계
  "relations": [
    {
      hanja: "일지(日支) 관계",
      korean: "일지 관계",
      definition: "자녀와 사람의 결이 만나는 다섯 자리 — 합(끌림)·충(부딪힘)·형(자극)·해(피곤)·파(틀어짐). 작용 방식의 차이.",
    },
    {
      hanja: "천을귀인(天乙貴人)",
      korean: "천을귀인",
      definition: "어려움에 귀한 도움이 닿는 별 — 결정적 인연의 결.",
    },
    {
      hanja: "복성귀인(福星貴人)",
      korean: "복성귀인",
      definition: "평생의 복과 행운이 자연스럽게 따르는 별.",
    },
  ],
  // Ch 5 몸·일상·시기
  "lifestyle": [
    {
      hanja: "신강·신약(身强·身弱)",
      korean: "신강신약",
      definition: "자녀의 일간(자기 자신)이 사주 안에서 얼마나 단단한지를 7단계로 본 결. 일상의 토대.",
    },
    {
      hanja: "대운(大運)",
      korean: "대운",
      definition: "10년마다 자녀에게 흐르는 큰 결의 변환 — 자녀 인생의 챕터가 바뀌는 호흡.",
    },
    {
      hanja: "개운법(改運法)",
      korean: "개운법",
      definition: "용신을 일상에 자연스럽게 녹이는 다섯 채널 — 색·방위·음식·시간·숫자.",
    },
  ],
  // Ch 6 진로
  "talent": [
    {
      hanja: "격국 직업 적성",
      korean: "격국 직업",
      definition: "격국의 결이 직업·진로 영역에서 어떤 큰 방향과 자연스럽게 닿는지의 풀이.",
    },
    {
      hanja: "재성·관성·식상",
      korean: "재성·관성·식상",
      definition: "진로 결정의 세 결 — 재성(실리·소유)·관성(체계·규율)·식상(창의·표현). 어느 결이 강한지에 따라 어울리는 영역.",
    },
  ],
  // Ch 7 부모와 함께
  "parents": [
    {
      hanja: "부모 십성",
      korean: "부모 십성",
      definition: "어머님·아버님이 자녀 사주에서 차지하는 위치 — 인성·재성·관성 등으로 양육 톤이 달라집니다.",
    },
    {
      hanja: "일지 합·충",
      korean: "일지 합·충",
      definition: "부모와 자녀의 일지가 만나는 자리 — 합(부드러운 만남)·충(자극의 자리)으로 일상 결이 갈라집니다.",
    },
  ],
};
