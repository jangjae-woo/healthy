"use client";
// 신강신약 — 홍실 톤 + 단어 풀이
const THREAD = "#c8203a";
const PLUM = "#6b1e3a";
const GOLD = "#b88646";
const INK = "#1a0a14";
const INK_SOFT = "#1a0a14";

const STAGES = ["극약", "태약", "신약", "중화", "신강", "태강", "극왕"] as const;
type Stage = typeof STAGES[number];

const STAGE_DESC: Record<Stage, string> = {
  극약: "외부 결을 받아 자라는 사주",
  태약: "의지할 결을 찾는 협력형",
  신약: "신중하게 받아들이는 결",
  중화: "균형 잡힌 결 — 양면 가능",
  신강: "자기 결이 단단한 사주",
  태강: "강한 자기 색을 가진 결",
  극왕: "독자적으로 길을 만드는 결",
};

interface Props {
  ilgan: string;
  stage: Stage;
}

export default function SinKangBar({ ilgan, stage }: Props) {
  const idx = STAGES.indexOf(stage);
  const desc = STAGE_DESC[stage];
  return (
    <div
      className="rounded-md p-5"
      style={{
        background: "linear-gradient(180deg, rgba(255,251,247,0.95), rgba(253,243,232,0.85))",
        border: "1px solid rgba(212,169,107,0.4)",
        boxShadow: "0 6px 20px -8px rgba(178,40,71,0.12)",
      }}
    >
      <div
        className="text-[15px] font-bold mb-1 text-center"
        style={{ color: PLUM, fontFamily: "'Nanum Myeongjo', serif" }}
      >
        신강신약(身强身弱)
      </div>
      <div
        className="text-[11px] mb-5 text-center"
        style={{ color: GOLD, fontFamily: "'Cormorant Garamond', serif", letterSpacing: "0.15em" }}
      >
        일간이 사주 안에서 얼마나 단단한가
      </div>

      {/* 점 + 라벨 7단계 — 점은 항상 어두운 톤으로 */}
      <div className="flex justify-between items-end mb-2 px-1">
        {STAGES.map((s, i) => {
          const dist = Math.abs(i - idx);
          const isActive = i === idx;
          const dotColor = isActive ? THREAD : `rgba(106,30,58,${Math.max(0.18, 0.5 - dist * 0.08)})`;
          return (
            <div key={s} className="flex flex-col items-center">
              <div
                className="rounded-full transition-all"
                style={{
                  width: isActive ? 18 : 10,
                  height: isActive ? 18 : 10,
                  background: dotColor,
                  boxShadow: isActive ? `0 0 14px ${THREAD}99` : "none",
                  marginBottom: 6,
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[11px] px-1 mb-4" style={{ fontFamily: "'Gowun Batang', serif" }}>
        {STAGES.map((s) => (
          <div
            key={s}
            style={{
              color: s === stage ? THREAD : INK_SOFT,
              fontWeight: s === stage ? 800 : 400,
              fontSize: s === stage ? "12px" : "10px",
            }}
          >
            {s}
          </div>
        ))}
      </div>

      {/* 현재 단계 풀이 */}
      <div
        className="mt-3 px-4 py-3 rounded-md text-center"
        style={{
          background: `${THREAD}10`,
          border: `1px solid ${THREAD}55`,
        }}
      >
        <div className="text-[14px]" style={{ color: INK, fontFamily: "'Gowun Batang', serif" }}>
          일간 <strong style={{ color: THREAD, fontFamily: "'Nanum Myeongjo', serif" }}>{ilgan}</strong>은 <strong style={{ color: THREAD }}>{stage}</strong>한 사주
        </div>
        <div className="text-[12px] mt-1.5" style={{ color: INK_SOFT, fontFamily: "'Gowun Batang', serif" }}>
          ▸ {desc}
        </div>
      </div>

      {/* 7단계 풀어쓰기 — 항상 노출 (자도인 V2식 단어 사전) */}
      <div className="mt-4 pt-4" style={{ borderTop: `1px solid rgba(212,169,107,0.3)` }}>
        <div
          className="text-[12px] mb-2 text-center font-bold"
          style={{ color: GOLD, fontFamily: "'Nanum Myeongjo', serif" }}
        >
          7단계가 뭔가요?
        </div>
        <div className="space-y-1.5 text-[13px]" style={{ fontFamily: "'Gowun Batang', serif" }}>
          {STAGES.map((s) => {
            const isCurrent = s === stage;
            return (
              <div
                key={s}
                className="flex gap-2 px-2 py-1.5 rounded"
                style={{
                  background: isCurrent ? `${THREAD}10` : "transparent",
                  border: isCurrent ? `1px solid ${THREAD}55` : "1px solid transparent",
                }}
              >
                <span
                  className="font-bold w-10 flex-shrink-0"
                  style={{ color: isCurrent ? THREAD : PLUM, fontFamily: "'Nanum Myeongjo', serif" }}
                >
                  {s}
                </span>
                <span className="flex-1" style={{ color: isCurrent ? INK : INK_SOFT, fontWeight: isCurrent ? 600 : 400 }}>
                  {STAGE_DESC[s]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
