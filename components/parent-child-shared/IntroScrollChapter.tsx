"use client";
// IntroScrollChapter — 들어가며 스크롤 인트로 (V1 ParentChildSlideResult에서 추출, V1·V2 공용)
// V1 원본 보존 위해 V1은 인라인 복사본 그대로 유지. V2가 import해서 사용.
import { STEM_HANJA, BRANCH_HANJA, type SajuAnalysis } from "@/lib/saju-calculator";

const ACCENT = "#f0a8b8";
const BRIGHT = "#FFD700";

export default function IntroScrollChapter({
  sajuChild,
  childName,
  childGender,
  ilganMetaphor,
  onStart,
}: {
  sajuChild: SajuAnalysis;
  childName: string;
  childGender: "남" | "여";
  ilganMetaphor: string;
  onStart: () => void;
}) {
  const childLabel = `${childName}${childGender === "남" ? "군" : "양"}`;
  const ilgan = sajuChild.ilgan;
  const ilji = sajuChild.pillars.day.branch;
  const ilganHanja = STEM_HANJA[ilgan as keyof typeof STEM_HANJA] ?? ilgan;
  const iljiHanja = BRANCH_HANJA[ilji as keyof typeof BRANCH_HANJA] ?? ilji;
  const sectionDivider = (
    <div className="my-6 flex items-center gap-3 px-2">
      <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(255,255,255,0.15), transparent)" }} />
      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>✦</span>
      <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(255,255,255,0.15), transparent)" }} />
    </div>
  );
  return (
    <div className="flex-1 flex flex-col" style={{ overflowY: "auto", paddingBottom: 100 }}>
      <div className="px-4 py-6 space-y-1">
        {/* 챕터 헤더 */}
        <div className="text-center mb-3">
          <p className="text-xs font-semibold tracking-[0.25em]" style={{ color: "#a8b8d4" }}>
            Part 00 — 사주 첫걸음
          </p>
          <p className="text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
            아래로 스크롤해서 읽어주세요
          </p>
        </div>

        {/* 1. 사주란? */}
        <section className="space-y-3 py-4">
          <p className="text-[14px] tracking-[0.15em] text-center font-semibold" style={{ color: "#7dd3c0" }}>─ 사주(四柱)란 무엇인가요? ─</p>
          <p className="text-[12.5px] leading-[1.7]" style={{ color: "rgba(255,255,255,0.85)" }}>
            <strong style={{ color: "#7dd3c0" }}>사주(四柱)</strong>는 한자 그대로 “네 개의 기둥”이라는 뜻이에요.
          </p>
          <p className="text-[12.5px] leading-[1.7]" style={{ color: "rgba(255,255,255,0.85)" }}>
            태어난 ① 연(年) ② 월(月) ③ 일(日) ④ 시(時) 네 가지 시간의 기둥을 말합니다.
          </p>
          <p className="text-[12.5px] leading-[1.7]" style={{ color: "rgba(255,255,255,0.85)" }}>
            각 기둥은 위아래 두 글자로 이루어집니다. 윗글자 = <strong>천간(天干)</strong> — 하늘의 기운, 아랫글자 = <strong>지지(地支)</strong> — 땅의 기운. 4 기둥 × 2 글자 = 8 글자, 그래서 <strong style={{ color: BRIGHT }}>사주팔자(四柱八字)</strong> 라고 부릅니다.
          </p>
          {/* 자녀 4기둥 미리보기 */}
          <div className="rounded-xl p-4 mt-2" style={{ background: "rgba(125,211,192,0.06)", border: "1px solid rgba(125,211,192,0.25)" }}>
            <p className="text-[10px] text-center mb-2" style={{ color: "rgba(255,255,255,0.55)" }}>{childLabel}의 사주 미리보기</p>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { label: "시주", stem: sajuChild.pillars.hour?.stem ?? "—", branch: sajuChild.pillars.hour?.branch ?? "—" },
                { label: "일주", stem: sajuChild.pillars.day.stem, branch: sajuChild.pillars.day.branch, mark: "★" },
                { label: "월주", stem: sajuChild.pillars.month.stem, branch: sajuChild.pillars.month.branch },
                { label: "년주", stem: sajuChild.pillars.year.stem, branch: sajuChild.pillars.year.branch },
              ].map((p, i) => (
                <div key={i} className={`rounded-lg p-2 ${p.mark ? "ring-1" : ""}`} style={{ background: p.mark ? "rgba(245,185,66,0.08)" : "rgba(255,255,255,0.03)", border: p.mark ? `1px solid ${ACCENT}` : "1px solid rgba(255,255,255,0.1)" }}>
                  <p className="text-[9px]" style={{ color: p.mark ? ACCENT : "rgba(255,255,255,0.4)" }}>{p.mark ?? ""} {p.label}</p>
                  <p className="text-[16px] font-bold mt-1" style={{ color: BRIGHT }}>{STEM_HANJA[p.stem as keyof typeof STEM_HANJA] ?? p.stem}</p>
                  <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.5)" }}>{p.stem}</p>
                  <p className="text-[16px] font-bold mt-2" style={{ color: BRIGHT }}>{BRANCH_HANJA[p.branch as keyof typeof BRANCH_HANJA] ?? p.branch}</p>
                  <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.5)" }}>{p.branch}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="text-[11.5px] leading-[1.7] italic mt-2" style={{ color: "rgba(255,255,255,0.7)" }}>
            사주는 미래를 점치는 게 아니라, 자녀 안에 타고난 결을 읽는 <strong style={{ color: BRIGHT }}>지도(地圖)</strong>입니다.
          </p>
        </section>

        {sectionDivider}

        {/* 3. 사주의 기본 요소 — 천간·지지·오행 */}
        <section className="space-y-3 py-4">
          <p className="text-[14px] tracking-[0.15em] text-center font-semibold" style={{ color: "#7dd3c0" }}>─ 사주의 기본 요소 ─</p>
          <p className="text-[12.5px] leading-[1.75]" style={{ color: "rgba(255,255,255,0.82)" }}>
            사주에서 쓰이는 재료는 딱 세 가지예요. 하늘의 기운인 <strong style={{ color: "#7dd3c0" }}>천간</strong>, 땅의 기운인 <strong style={{ color: "#7dd3c0" }}>지지</strong>, 그리고 두 기운이 만나 이루는 다섯 계절인 <strong style={{ color: "#7dd3c0" }}>오행</strong>이에요. 아래를 한 번만 훑어보시면 금방 눈에 익으실 거예요.
          </p>

          {/* 천간 표 */}
          <div className="space-y-1.5">
            <p className="text-[12.5px] font-bold" style={{ color: BRIGHT }}>① 천간(天干) — 하늘의 기운 10가지</p>
            <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <div className="grid grid-cols-5 gap-1 text-center text-[10.5px]">
                {[
                  { e: "목(木)", c: "#7dd3c0", k: "갑·을 (甲乙)", m: "큰 나무·봄풀" },
                  { e: "화(火)", c: "#ff8a8a", k: "병·정 (丙丁)", m: "햇살·등불" },
                  { e: "토(土)", c: "#e8c9a5", k: "무·기 (戊己)", m: "들판·흙" },
                  { e: "금(金)", c: "#cdd9e4", k: "경·신 (庚辛)", m: "강철·보석" },
                  { e: "수(水)", c: "#a8c4e8", k: "임·계 (壬癸)", m: "큰 강물·샘물" },
                ].map((c, i) => (
                  <div key={i} className="space-y-1 py-1">
                    <p className="font-bold" style={{ color: c.c }}>{c.e}</p>
                    <p className="text-[9.5px]" style={{ color: "rgba(255,255,255,0.78)" }}>{c.k}</p>
                    <p className="text-[8.5px] italic" style={{ color: "rgba(255,255,255,0.5)" }}>{c.m}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 지지 표 — 5 오행 그룹핑 */}
          <div className="space-y-1.5">
            <p className="text-[12.5px] font-bold" style={{ color: BRIGHT }}>② 지지(地支) — 땅의 기운 12가지</p>
            <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <p className="text-[10.5px] leading-[1.6] mb-3" style={{ color: "rgba(255,255,255,0.78)" }}>
                자녀의 결을 만드는 12지지는 <strong>다섯 오행</strong>으로 묶여요.
              </p>
              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { e: "🌿 목", c: "#7dd3c0", h: "(木)", branches: ["인(寅)", "묘(卯)"] },
                  { e: "🔥 화", c: "#ff8a8a", h: "(火)", branches: ["사(巳)", "오(午)"] },
                  { e: "🟫 토", c: "#e8c9a5", h: "(土)", branches: ["진(辰)", "술(戌)", "축(丑)", "미(未)"] },
                  { e: "🤍 금", c: "#cdd9e4", h: "(金)", branches: ["신(申)", "유(酉)"] },
                  { e: "🔵 수", c: "#a8c4e8", h: "(水)", branches: ["해(亥)", "자(子)"] },
                ].map((g, i) => (
                  <div key={i} className="rounded-lg p-2" style={{ background: `${g.c}15`, border: `1px solid ${g.c}40` }}>
                    <p className="text-[10px] font-bold text-center mb-0.5" style={{ color: g.c }}>{g.e}</p>
                    <p className="text-[8px] text-center mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>{g.h}</p>
                    <div className="space-y-0.5">
                      {g.branches.map((b, j) => (
                        <p key={j} className="text-[10px] text-center" style={{ color: BRIGHT }}>{b}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                <p className="text-[10.5px] mb-2 text-center" style={{ color: ACCENT }}>
                  ─ {childLabel}의 사주에 자리한 4지지 ─
                </p>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: "시지", branch: sajuChild.pillars.hour?.branch, isStar: false },
                    { label: "★ 일지", branch: sajuChild.pillars.day.branch, isStar: true },
                    { label: "월지", branch: sajuChild.pillars.month.branch, isStar: false },
                    { label: "년지", branch: sajuChild.pillars.year.branch, isStar: false },
                  ].map((p, i) => {
                    const elemMap: Record<string, { e: string; c: string }> = {
                      인: { e: "🌿 목", c: "#7dd3c0" }, 묘: { e: "🌿 목", c: "#7dd3c0" },
                      사: { e: "🔥 화", c: "#ff8a8a" }, 오: { e: "🔥 화", c: "#ff8a8a" },
                      진: { e: "🟫 토", c: "#e8c9a5" }, 술: { e: "🟫 토", c: "#e8c9a5" },
                      축: { e: "🟫 토", c: "#e8c9a5" }, 미: { e: "🟫 토", c: "#e8c9a5" },
                      신: { e: "🤍 금", c: "#cdd9e4" }, 유: { e: "🤍 금", c: "#cdd9e4" },
                      해: { e: "🔵 수", c: "#a8c4e8" }, 자: { e: "🔵 수", c: "#a8c4e8" },
                    };
                    const m = p.branch ? elemMap[p.branch] : null;
                    return (
                      <div key={i} className="rounded-lg p-2 text-center" style={{
                        background: p.isStar ? `${ACCENT}15` : "rgba(255,255,255,0.03)",
                        border: p.isStar ? `1px solid ${ACCENT}` : "1px solid rgba(255,255,255,0.1)",
                      }}>
                        <p className="text-[8.5px]" style={{ color: p.isStar ? ACCENT : "rgba(255,255,255,0.5)" }}>{p.label}</p>
                        <p className="text-[14px] font-bold mt-0.5" style={{ color: BRIGHT }}>
                          {p.branch ? `${BRANCH_HANJA[p.branch as keyof typeof BRANCH_HANJA] ?? p.branch}(${p.branch})` : "—"}
                        </p>
                        {m && <p className="text-[8.5px] mt-0.5" style={{ color: m.c }}>{m.e}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
              <p className="text-[9.5px] italic mt-2 leading-[1.55] text-center" style={{ color: "rgba(255,255,255,0.5)" }}>
                *자녀의 사주 4기둥 아랫글자가 12지지 중 4개로 자리하며, 이 결의 묶음(오행)이 자녀의 일상 호흡을 만듭니다.
              </p>
            </div>
          </div>

          {/* 오행 생극 오각도 */}
          <div className="space-y-1.5">
            <p className="text-[12.5px] font-bold" style={{ color: BRIGHT }}>③ 오행(五行) — 다섯 가지 기운</p>
            <div className="rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <svg viewBox="0 0 320 285" width="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <marker id="ohArrowV2" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L6,3 L0,6 z" fill="rgba(255,255,255,0.5)" />
                  </marker>
                </defs>
                <line x1="65" y1="117" x2="255" y2="117" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" strokeDasharray="4,3" />
                <line x1="160" y1="48" x2="219" y2="229" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" strokeDasharray="4,3" />
                <line x1="255" y1="117" x2="101" y2="229" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" strokeDasharray="4,3" />
                <line x1="219" y1="229" x2="65" y2="117" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" strokeDasharray="4,3" />
                <line x1="101" y1="229" x2="160" y2="48" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" strokeDasharray="4,3" />
                <line x1="84" y1="103" x2="141" y2="62" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" markerEnd="url(#ohArrowV2)" />
                <line x1="179" y1="62" x2="236" y2="103" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" markerEnd="url(#ohArrowV2)" />
                <line x1="248" y1="138" x2="227" y2="207" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" markerEnd="url(#ohArrowV2)" />
                <line x1="196" y1="229" x2="124" y2="229" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" markerEnd="url(#ohArrowV2)" />
                <line x1="92" y1="207" x2="71" y2="138" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" markerEnd="url(#ohArrowV2)" />
                <circle cx="160" cy="48" r="25" fill="rgba(255,138,138,0.15)" stroke="#ff8a8a" strokeWidth="1.5" />
                <text x="160" y="44" textAnchor="middle" fontSize="15" fontWeight="bold" fill="#ff8a8a">火</text>
                <text x="160" y="58" textAnchor="middle" fontSize="8" fill="#ff8a8a">활기·표현</text>
                <circle cx="255" cy="117" r="25" fill="rgba(232,201,165,0.15)" stroke="#e8c9a5" strokeWidth="1.5" />
                <text x="255" y="113" textAnchor="middle" fontSize="15" fontWeight="bold" fill="#e8c9a5">土</text>
                <text x="255" y="127" textAnchor="middle" fontSize="8" fill="#e8c9a5">안정·자리</text>
                <circle cx="219" cy="229" r="25" fill="rgba(205,217,228,0.15)" stroke="#cdd9e4" strokeWidth="1.5" />
                <text x="219" y="225" textAnchor="middle" fontSize="15" fontWeight="bold" fill="#cdd9e4">金</text>
                <text x="219" y="239" textAnchor="middle" fontSize="8" fill="#cdd9e4">단단·결단</text>
                <circle cx="101" cy="229" r="25" fill="rgba(168,196,232,0.15)" stroke="#a8c4e8" strokeWidth="1.5" />
                <text x="101" y="225" textAnchor="middle" fontSize="15" fontWeight="bold" fill="#a8c4e8">水</text>
                <text x="101" y="239" textAnchor="middle" fontSize="8" fill="#a8c4e8">사색·고요</text>
                <circle cx="65" cy="117" r="25" fill="rgba(125,211,192,0.15)" stroke="#7dd3c0" strokeWidth="1.5" />
                <text x="65" y="113" textAnchor="middle" fontSize="15" fontWeight="bold" fill="#7dd3c0">木</text>
                <text x="65" y="127" textAnchor="middle" fontSize="8" fill="#7dd3c0">성장·움직임</text>
              </svg>
              <div className="flex justify-center gap-5 pb-3" style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>
                <span>──→ 생(生) 서로 살림</span>
                <span>╌╌╌ 극(剋) 서로 견제</span>
              </div>
            </div>
          </div>
        </section>

        {sectionDivider}

        {/* 4. 일주 = 자녀 본질의 핵 */}
        <section className="space-y-3 py-4">
          <p className="text-[14px] tracking-[0.15em] text-center font-semibold" style={{ color: "#c89cff" }}>─ 자녀 본질의 핵, 일주(日柱) ─</p>
          <p className="text-[12.5px] leading-[1.75]" style={{ color: "rgba(255,255,255,0.85)" }}>
            4기둥 중 딱 하나만 기억하신다면, 바로 <strong style={{ color: "#c89cff" }}>일주(日柱)</strong>예요. 아이가 태어난 날의 기둥인데, 이 안에 자녀 본질의 핵이 담겨 있어요.
          </p>
          <ul className="text-[12.5px] leading-[1.75] space-y-1 ml-3" style={{ color: "rgba(255,255,255,0.85)" }}>
            <li>· 윗글자 = <strong>일간(日干)</strong> → 본질의 핵 (성격·기질·자아)</li>
            <li>· 아랫글자 = <strong>일지(日支)</strong> → 일상 속 자녀의 결</li>
          </ul>
          <div className="rounded-xl p-4 mt-2 text-center" style={{ background: "rgba(200,156,255,0.08)", border: "1px solid rgba(200,156,255,0.3)" }}>
            <p className="text-[10px] mb-2" style={{ color: "rgba(255,255,255,0.55)" }}>{childLabel}의 일주</p>
            <p className="text-[24px] font-bold mb-1" style={{ color: BRIGHT }}>{ilganHanja}{iljiHanja}</p>
            <p className="text-[12px] mb-3" style={{ color: "rgba(255,255,255,0.7)" }}>{ilgan}{ilji}</p>
            {ilganMetaphor && (
              <p className="text-[12.5px] italic" style={{ color: "#c89cff" }}>
                → <strong>{ilganHanja}({ilgan})</strong> — {ilganMetaphor} 같은 자녀
              </p>
            )}
          </div>
        </section>

        {sectionDivider}

        {/* 5. 십성 */}
        <section className="space-y-3 py-4">
          <p className="text-[14px] tracking-[0.15em] text-center font-semibold" style={{ color: "#a78bfa" }}>─ 자녀의 10가지 성향, 십성(十星) ─</p>
          <p className="text-[12.5px] leading-[1.75]" style={{ color: "rgba(255,255,255,0.85)" }}>
            <strong style={{ color: "#a78bfa" }}>십성(十星)</strong>은 쉽게 말하면 <strong>"이 아이는 어떤 방식으로 세상과 만나는 아이인가"</strong>를 10가지 패턴으로 나눈 거예요. 비슷한 결끼리 5개로 묶으면 이렇게 돼요:
          </p>
          <div className="rounded-xl p-3" style={{ background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.25)" }}>
            <ul className="text-[12px] leading-[1.8] space-y-1.5" style={{ color: "rgba(255,255,255,0.85)" }}>
              <li><strong style={{ color: "#a78bfa" }}>비겁(比劫)</strong> — 자기를 세움 <span style={{ color: "rgba(255,255,255,0.55)" }}>(비견·겁재)</span></li>
              <li><strong style={{ color: "#34d399" }}>식상(食傷)</strong> — 표현·창의 <span style={{ color: "rgba(255,255,255,0.55)" }}>(식신·상관)</span></li>
              <li><strong style={{ color: "#fbbf24" }}>재성(財星)</strong> — 손에 잡으려는 <span style={{ color: "rgba(255,255,255,0.55)" }}>(정재·편재)</span></li>
              <li><strong style={{ color: "#60a5fa" }}>관성(官星)</strong> — 절제·규율 <span style={{ color: "rgba(255,255,255,0.55)" }}>(정관·편관)</span></li>
              <li><strong style={{ color: "#c084fc" }}>인성(印星)</strong> — 받아들임·사색 <span style={{ color: "rgba(255,255,255,0.55)" }}>(정인·편인)</span></li>
            </ul>
          </div>
        </section>

        {sectionDivider}

        {/* 보고서 안내 */}
        <section className="space-y-3 py-4">
          <p className="text-[14px] tracking-[0.15em] text-center font-semibold" style={{ color: BRIGHT }}>─ 보고서 안내 ─</p>
          <p className="text-[12.5px] leading-[1.7] text-center" style={{ color: "rgba(255,255,255,0.85)" }}>
            이 보고서는 총 <strong style={{ color: BRIGHT }}>8장</strong>으로 구성되어 있어요.
          </p>
          <div className="rounded-xl p-4 mt-2 space-y-2" style={{ background: "rgba(255,215,0,0.04)", border: `1px solid ${BRIGHT}33` }}>
            {[
              { num: "1장", title: "우리 아이의 첫 페이지" },
              { num: "2장", title: "우리 아이는 어떤 아이일까" },
              { num: "3장", title: "우리 아이는 어떻게 공부할까" },
              { num: "4장", title: "우리 아이 칭찬하고 혼내는 법" },
              { num: "5장", title: "친구 사이 우리 아이" },
              { num: "6장", title: "우리 아이는 무엇으로 빛날까" },
              { num: "7장", title: "엄마·아빠와 우리 셋의 결" },
              { num: "마지막", title: "자도인의 마지막 당부" },
            ].map((c, i) => (
              <div key={i} className="flex items-center gap-3 py-1.5 px-1">
                <span className="text-[11px] font-bold w-12 text-center rounded px-1.5 py-0.5" style={{ color: BRIGHT, background: `${BRIGHT}15`, border: `1px solid ${BRIGHT}40` }}>{c.num}</span>
                <span className="text-[12.5px]" style={{ color: "rgba(255,255,255,0.85)" }}>{c.title}</span>
              </div>
            ))}
          </div>
          <p className="text-[12.5px] leading-[1.7] text-center italic mt-3" style={{ color: "rgba(255,255,255,0.85)" }}>
            그럼 이제, 자도인과 함께 <strong style={{ color: BRIGHT }}>{childLabel}</strong>의 사주를 펼쳐볼까요?
          </p>
        </section>

        {/* CTA */}
        <div className="pt-4 pb-2">
          <button
            onClick={onStart}
            className="w-full rounded-2xl py-4 font-bold text-[14px] transition-all"
            style={{
              background: `linear-gradient(135deg, ${ACCENT}, #f5b942cc)`,
              color: "#1a1a1a",
              boxShadow: `0 4px 24px ${ACCENT}55`,
            }}
          >
            사주풀이 시작 →
          </button>
        </div>
      </div>
    </div>
  );
}
