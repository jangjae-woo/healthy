"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const HOURS = [
  "시간 모름",
  "자시 (23:30~01:29)", "축시 (01:30~03:29)", "인시 (03:30~05:29)",
  "묘시 (05:30~07:29)", "진시 (07:30~09:29)", "사시 (09:30~11:29)",
  "오시 (11:30~13:29)", "미시 (13:30~15:29)", "신시 (15:30~17:29)",
  "유시 (17:30~19:29)", "술시 (19:30~21:29)", "해시 (21:30~23:29)",
];

// 관계 유형 12가지 + 직접 입력
// 4개 그룹: 로맨틱 / 사회 / 가족·기타 / 팬덤
// 펫은 정통 사주명리학 영역 밖이라 제외 (출생일 정확성·시주 부재·고전 근거 부족)
const RELATIONSHIP_OPTIONS: Array<{ value: string; label: string; group: "romantic" | "social" | "family" | "fan"; aLabel?: string; bLabel?: string }> = [
  { value: "친구",           label: "친구",          group: "social", aLabel: "나", bLabel: "친구" },
  { value: "썸남썸녀",       label: "썸남 / 썸녀",   group: "romantic", aLabel: "나", bLabel: "상대" },
  { value: "연인",           label: "연인",          group: "romantic", aLabel: "나", bLabel: "연인" },
  { value: "배우자",         label: "배우자",        group: "romantic", aLabel: "나", bLabel: "배우자" },
  { value: "전연인",         label: "전 연인",       group: "romantic", aLabel: "나", bLabel: "전 연인" },
  { value: "전배우자",       label: "전 배우자",     group: "romantic", aLabel: "나", bLabel: "전 배우자" },
  { value: "부모와자녀",     label: "부모와 자녀",   group: "family", aLabel: "부모", bLabel: "자녀" },
  { value: "형제자매",       label: "형제 / 자매",   group: "family", aLabel: "본인", bLabel: "형제·자매" },
  { value: "직장동료",       label: "직장 동료",     group: "social", aLabel: "나", bLabel: "동료" },
  { value: "사업파트너",     label: "사업 파트너",   group: "social", aLabel: "나", bLabel: "파트너" },
  { value: "아이돌과팬",     label: "아이돌과 팬",   group: "fan", aLabel: "팬", bLabel: "아이돌" },
  { value: "아이돌과아이돌", label: "아이돌과 아이돌", group: "fan", aLabel: "멤버 A", bLabel: "멤버 B" },
];

const ACCENT = "#d4a8e8";
const GOLD = "#FFD700";
const BG = "#1a0f20";
const PRICE = 45900;

interface Msg { id: string; from: "ai" | "user"; text: string; }

export default function MatchingChatForm() {
  const [step, setStep] = useState(-1);
  const [paying, setPaying] = useState(false);
  const [modal, setModal] = useState<null | "parent-child" | "custom">(null);
  const [customRelInput, setCustomRelInput] = useState("");
  const [form, setForm] = useState({
    relationshipType: "", relationshipLabel: "",
    myName: "", myGender: "", myYear: "", myMonth: "", myDay: "",
    myHour: "시간 모름", myCalendar: "양력",
    partnerName: "", partnerGender: "", partnerYear: "", partnerMonth: "", partnerDay: "",
    partnerHour: "시간 모름", partnerCalendar: "양력",
  });
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      aiMsg(
        "안녕하세요.\n저는 홍도인입니다.\n\n붉은 실(紅絲)에 묶인 모든 인연을 풀어드립니다.\n\n먼저 두 분은 어떤 관계이신가요?",
        "qRel",
        () => setStep(100)
      );
    }, 500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, isTyping, step]);

  function aiMsg(text: string, id: string, onDone?: () => void) {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMsgs(prev => [...prev, { id, from: "ai", text }]);
      onDone?.();
    }, 900);
  }

  function userMsg(text: string, id: string, onDone?: () => void) {
    setMsgs(prev => [...prev, { id, from: "user", text }]);
    setStep(-1);
    setTimeout(() => onDone?.(), 400);
  }

  // ── 관계 유형 선택 (step 100) ──
  function submitRelationship(opt: typeof RELATIONSHIP_OPTIONS[number]) {
    // 부모와 자녀 → 자도인으로 안내 (자도인이 더 깊이 풀이)
    if (opt.value === "부모와자녀") {
      setModal("parent-child");
      return;
    }
    setForm((f) => ({ ...f, relationshipType: opt.value, relationshipLabel: opt.label }));
    const aL = opt.aLabel ?? "나";
    userMsg(opt.label, "aRel", () =>
      aiMsg(`${opt.label} 관계로군요.\n\n${aL}의 성함부터 알려주시겠습니까?`, "q0", () => setStep(0))
    );
  }
  function submitCustomRelationship() {
    const v = customRelInput.trim();
    if (!v) return;
    setForm((f) => ({ ...f, relationshipType: "직접입력", relationshipLabel: v }));
    setModal(null);
    setCustomRelInput("");
    userMsg(v, "aRel", () =>
      aiMsg(`'${v}' 관계로군요.\n\n첫 번째 분의 성함부터 알려주시겠습니까?`, "q0", () => setStep(0))
    );
  }

  // Q0 — 내 이름
  function submitMyName() {
    const v = inputValue.trim();
    if (!v) return;
    setForm(f => ({ ...f, myName: v }));
    setInputValue("");
    userMsg(v, "a0", () => aiMsg("성별을 알려주세요.", "q1", () => setStep(1)));
  }
  // Q1 — 내 성별
  function submitMyGender(g: string) {
    setForm(f => ({ ...f, myGender: g }));
    userMsg(g === "남" ? "남성" : "여성", "a1", () => aiMsg("생년월일을 알려주세요.", "q2", () => setStep(2)));
  }
  // Q2 — 내 생년월일
  function submitMyDate() {
    if (!form.myYear || !form.myMonth || !form.myDay) return;
    userMsg(`${form.myCalendar} ${form.myYear}년 ${form.myMonth}월 ${form.myDay}일`, "a2", () =>
      aiMsg("태어난 시간을 알려주세요.\n모르시면 '시간 모름'을 선택하셔도 됩니다.", "q3", () => setStep(3))
    );
  }
  // Q3 — 내 시간
  function submitMyHour(h: string) {
    setForm(f => ({ ...f, myHour: h }));
    const opt = RELATIONSHIP_OPTIONS.find((o) => o.value === form.relationshipType);
    const partnerLabel = opt?.bLabel ?? "상대";
    userMsg(h, "a3", () =>
      aiMsg(`이제 ${partnerLabel}분에 대해 여쭙겠습니다.\n\n${partnerLabel}분의 성함(또는 별명)을 알려주세요.`, "q4", () => setStep(4))
    );
  }
  // Q4 — 상대 이름
  function submitPartnerName() {
    const v = inputValue.trim();
    if (!v) return;
    setForm(f => ({ ...f, partnerName: v }));
    setInputValue("");
    userMsg(v, "a4", () => aiMsg(`${v}님의 성별을 알려주세요.`, "q5", () => setStep(5)));
  }
  // Q5 — 상대 성별
  function submitPartnerGender(g: string) {
    setForm(f => ({ ...f, partnerGender: g }));
    userMsg(g === "남" ? "남성" : "여성", "a5", () =>
      aiMsg(`${form.partnerName}님의 생년월일을 알려주세요.`, "q6", () => setStep(6))
    );
  }
  // Q6 — 상대 생년월일
  function submitPartnerDate() {
    if (!form.partnerYear || !form.partnerMonth || !form.partnerDay) return;
    userMsg(`${form.partnerCalendar} ${form.partnerYear}년 ${form.partnerMonth}월 ${form.partnerDay}일`, "a6", () =>
      aiMsg(`${form.partnerName}님의 태어난 시간은요?\n모르시면 '시간 모름'을 선택하셔도 됩니다.`, "q7", () => setStep(7))
    );
  }
  // Q7 — 상대 시간
  function submitPartnerHour(h: string) {
    setForm(f => ({ ...f, partnerHour: h }));
    userMsg(h, "a7", () =>
      aiMsg(`${form.myName}님과 ${form.partnerName}님의\n인연을 풀이할 준비가 되었습니다.`, "q9", () => setStep(9))
    );
  }

  function handleSubmit() {
    if (paying) return;
    setPaying(true);
    // 결제 연동 전까지는 바로 결과 페이지로 이동
    const params = new URLSearchParams({ ...form, type: 'matching' });
    window.location.href = `/matching/result?${params.toString()}`;
  }

  // 관계 유형 그룹별 색조
  const GROUP_HUE: Record<string, string> = {
    romantic: "#ff6b9d",
    social: "#7dd3c0",
    family: "#f5b942",
    fan: "#c89cff",
  };

  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(180deg, ${BG} 0%, #0a0510 100%)` }}>
    <main
      className="w-full max-w-[430px] mx-auto min-h-screen flex flex-col"
      style={{ background: `linear-gradient(180deg, ${BG} 0%, #0a0510 100%)` }}
    >
      {/* 헤더 */}
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ borderBottom: `1px solid ${ACCENT}18` }}>
        <Link href="/matching" className="text-sm" style={{ color: `${ACCENT}66` }}>←</Link>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: `${ACCENT}22`, color: ACCENT }}>紅</div>
        <div>
          <div className="text-sm font-bold text-white">홍도인</div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span className="text-[10px]" style={{ color: `${ACCENT}55` }}>인연 상담가</span>
          </div>
        </div>
      </div>

      {/* 채팅 */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5 pb-10">
        {msgs.map(msg => (
          <div key={msg.id} className={`flex items-end gap-2 ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
            {msg.from === "ai" && (
              <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold mb-0.5" style={{ backgroundColor: `${ACCENT}22`, color: ACCENT }}>緣</div>
            )}
            {msg.from === "ai" ? (
              <div className="max-w-[78%] px-4 py-3 text-sm whitespace-pre-line leading-relaxed" style={{ backgroundColor: `${ACCENT}18`, color: "white", borderRadius: "4px 18px 18px 18px" }}>
                {msg.text}
              </div>
            ) : (
              <span className="text-sm text-white pb-0.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.35)" }}>
                {msg.text}
              </span>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex items-end gap-2">
            <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: `${ACCENT}22`, color: ACCENT }}>緣</div>
            <div className="px-4 py-3" style={{ backgroundColor: `${ACCENT}18`, borderRadius: "4px 18px 18px 18px" }}>
              <div className="flex gap-1 items-center h-4">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: ACCENT, animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Q-Rel — 관계 유형 선택 (step 100) */}
        {step === 100 && (
          <div className="flex justify-end">
            <div className="w-full max-w-[340px] grid grid-cols-2 gap-2">
              {RELATIONSHIP_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => submitRelationship(opt)}
                  className="px-3 py-3 rounded-xl text-[13px] font-medium transition-all active:scale-95 text-left flex items-center gap-2"
                  style={{
                    backgroundColor: `${ACCENT}1a`,
                    color: "white",
                    border: `1px solid ${ACCENT}44`,
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: GROUP_HUE[opt.group] ?? ACCENT }} />
                  <span className="flex-1">{opt.label}</span>
                </button>
              ))}
              <button
                onClick={() => setModal("custom")}
                className="col-span-2 px-3 py-3 rounded-xl text-[13px] font-medium transition-all active:scale-95"
                style={{
                  backgroundColor: `${GOLD}11`,
                  color: GOLD,
                  border: `1px dashed ${GOLD}66`,
                }}
              >
                ✎ 직접 입력
              </button>
            </div>
          </div>
        )}

        {/* Q0 — 내 이름 */}
        {step === 0 && (
          <div className="flex justify-end gap-2">
            <input
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submitMyName()}
              placeholder="이름 입력"
              autoFocus
              className="rounded-lg px-3 py-2 text-white text-sm outline-none w-36"
              style={{ background: "transparent", borderBottom: `1.5px solid ${ACCENT}88` }}
            />
            <button onClick={submitMyName} disabled={!inputValue.trim()} className="px-4 py-2 rounded-lg text-sm font-bold"
              style={{ backgroundColor: inputValue.trim() ? GOLD : `${ACCENT}33`, color: "#1a0d00" }}>→</button>
          </div>
        )}

        {/* Q1 — 내 성별 */}
        {step === 1 && (
          <div className="flex justify-end gap-2">
            {[["남", "남성"], ["여", "여성"]].map(([val, label]) => (
              <button key={val} onClick={() => submitMyGender(val)}
                className="px-5 py-2 rounded-lg text-sm font-medium"
                style={{ backgroundColor: `${ACCENT}22`, color: "white", border: `1px solid ${ACCENT}44` }}>
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Q2 — 내 생년월일 */}
        {step === 2 && (
          <DateBlock
            calendar={form.myCalendar}
            year={form.myYear} month={form.myMonth} day={form.myDay}
            onCalendarChange={c => setForm(f => ({ ...f, myCalendar: c }))}
            onChange={(k, v) => setForm(f => ({ ...f, [`my${k}`]: v }))}
            onSubmit={submitMyDate}
            accent={ACCENT} gold={GOLD}
          />
        )}

        {/* Q3 — 내 시간 */}
        {step === 3 && <HourGrid hours={HOURS} onSelect={submitMyHour} accent={ACCENT} />}

        {/* Q4 — 상대 이름 */}
        {step === 4 && (
          <div className="flex justify-end gap-2">
            <input
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submitPartnerName()}
              placeholder="이름 또는 별명"
              autoFocus
              className="rounded-lg px-3 py-2 text-white text-sm outline-none w-36"
              style={{ background: "transparent", borderBottom: `1.5px solid ${ACCENT}88` }}
            />
            <button onClick={submitPartnerName} disabled={!inputValue.trim()} className="px-4 py-2 rounded-lg text-sm font-bold"
              style={{ backgroundColor: inputValue.trim() ? GOLD : `${ACCENT}33`, color: "#1a0d00" }}>→</button>
          </div>
        )}

        {/* Q5 — 상대 성별 */}
        {step === 5 && (
          <div className="flex justify-end gap-2">
            {[["남", "남성"], ["여", "여성"]].map(([val, label]) => (
              <button key={val} onClick={() => submitPartnerGender(val)}
                className="px-5 py-2 rounded-lg text-sm font-medium"
                style={{ backgroundColor: `${ACCENT}22`, color: "white", border: `1px solid ${ACCENT}44` }}>
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Q6 — 상대 생년월일 */}
        {step === 6 && (
          <DateBlock
            calendar={form.partnerCalendar}
            year={form.partnerYear} month={form.partnerMonth} day={form.partnerDay}
            onCalendarChange={c => setForm(f => ({ ...f, partnerCalendar: c }))}
            onChange={(k, v) => setForm(f => ({ ...f, [`partner${k}`]: v }))}
            onSubmit={submitPartnerDate}
            accent={ACCENT} gold={GOLD}
          />
        )}

        {/* Q7 — 상대 시간 */}
        {step === 7 && <HourGrid hours={HOURS} onSelect={submitPartnerHour} accent={ACCENT} />}

        {/* Q9 — 인연 풀이 시작 */}
        {step === 9 && (
          <div className="mt-2">
            <button onClick={handleSubmit} disabled={paying}
              className="w-full py-4 rounded-2xl text-base font-bold tracking-widest transition-all active:scale-95"
              style={{
                background: paying ? `${GOLD}66` : "linear-gradient(135deg, #FFE066 0%, #FFD700 40%, #FFA800 100%)",
                color: "#1a0d00",
                boxShadow: paying ? "none" : `0 0 24px ${GOLD}99, 0 0 8px ${GOLD}66`,
              }}>
              🌹 {"\u00A0"}인연 풀이 시작
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </main>

    {/* ── 모달: 부모와 자녀 → 자도인 안내 ── */}
    {modal === "parent-child" && (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ backgroundColor: "rgba(0,0,0,0.7)" }}>
        <div className="w-full max-w-[360px] rounded-2xl p-6" style={{ backgroundColor: BG, border: `1px solid ${ACCENT}33` }}>
          <div className="text-center mb-4">
            <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center text-lg font-bold" style={{ backgroundColor: "#f5b94222", color: "#f5b942" }}>慈</div>
            <h3 className="text-base font-bold text-white mb-2">부모와 자녀의 인연은</h3>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>
              <strong style={{ color: "#f5b942" }}>자도인(慈道人)</strong>이 더 깊이 풀이합니다.<br />
              어머니와 아이의 결을 정통 명리로 짚어드리는 별도 도원으로 안내드릴까요?
            </p>
          </div>
          <div className="flex gap-2 mt-5">
            <button onClick={() => setModal(null)} className="flex-1 py-3 rounded-xl text-sm" style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.65)" }}>
              돌아가기
            </button>
            <Link href="/parent-child" className="flex-1 py-3 rounded-xl text-sm font-bold text-center" style={{ background: "linear-gradient(135deg, #f5b942 0%, #d4951f 100%)", color: "#1a0d00" }}>
              자도인으로 →
            </Link>
          </div>
        </div>
      </div>
    )}

    {/* ── 모달: 직접 입력 ── */}
    {modal === "custom" && (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ backgroundColor: "rgba(0,0,0,0.7)" }}>
        <div className="w-full max-w-[360px] rounded-2xl p-6" style={{ backgroundColor: BG, border: `1px solid ${GOLD}55` }}>
          <h3 className="text-base font-bold text-white mb-2 text-center">관계를 직접 입력해주세요</h3>
          <p className="text-xs text-center mb-4" style={{ color: "rgba(255,255,255,0.55)" }}>
            예: 외할머니와 손녀, 멘토와 멘티, 스승과 제자
          </p>
          <input
            value={customRelInput}
            onChange={(e) => setCustomRelInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitCustomRelationship()}
            placeholder="관계 입력"
            autoFocus
            maxLength={20}
            className="w-full px-3 py-3 text-white text-sm outline-none rounded-lg text-center"
            style={{ background: "rgba(255,255,255,0.05)", border: `1.5px solid ${GOLD}66` }}
          />
          <div className="flex gap-2 mt-4">
            <button onClick={() => { setModal(null); setCustomRelInput(""); }} className="flex-1 py-3 rounded-xl text-sm" style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.65)" }}>
              취소
            </button>
            <button onClick={submitCustomRelationship} disabled={!customRelInput.trim()} className="flex-1 py-3 rounded-xl text-sm font-bold" style={{ backgroundColor: customRelInput.trim() ? GOLD : `${GOLD}33`, color: "#1a0d00" }}>
              확인
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}

// 날짜 입력 블록
function DateBlock({
  calendar, year, month, day, onCalendarChange, onChange, onSubmit, accent, gold,
}: {
  calendar: string;
  year: string; month: string; day: string;
  onCalendarChange: (c: string) => void;
  onChange: (k: 'Year'|'Month'|'Day', v: string) => void;
  onSubmit: () => void;
  accent: string; gold: string;
}) {
  return (
    <div className="flex flex-col items-end gap-3">
      <div className="flex gap-4 text-sm">
        {["양력", "음력"].map(c => (
          <button key={c} onClick={() => onCalendarChange(c)}
            className="flex items-center gap-1"
            style={{ color: calendar === c ? gold : `${accent}77` }}>
            {calendar === c ? "✓" : "○"} {c}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input placeholder="년도" maxLength={4} value={year}
          onChange={e => onChange('Year', e.target.value.replace(/\D/g, ""))}
          className="w-20 px-2 py-2 text-white text-sm text-center outline-none"
          style={{ background: "transparent", borderBottom: `1.5px solid ${accent}88` }} />
        <input placeholder="월" maxLength={2} value={month}
          onChange={e => onChange('Month', e.target.value.replace(/\D/g, ""))}
          className="w-12 px-2 py-2 text-white text-sm text-center outline-none"
          style={{ background: "transparent", borderBottom: `1.5px solid ${accent}88` }} />
        <input placeholder="일" maxLength={2} value={day}
          onChange={e => onChange('Day', e.target.value.replace(/\D/g, ""))}
          className="w-12 px-2 py-2 text-white text-sm text-center outline-none"
          style={{ background: "transparent", borderBottom: `1.5px solid ${accent}88` }} />
      </div>
      <button onClick={onSubmit} disabled={!year || !month || !day}
        className="px-6 py-2 rounded-lg text-sm font-bold"
        style={{ backgroundColor: (year && month && day) ? gold : `${accent}33`, color: "#1a0d00" }}>
        확인
      </button>
    </div>
  );
}

// 시간 선택 블록
function HourGrid({ hours, onSelect, accent }: { hours: string[]; onSelect: (h: string) => void; accent: string }) {
  return (
    <div className="flex flex-wrap justify-end gap-2">
      {hours.map(h => (
        <button key={h} onClick={() => onSelect(h)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95"
          style={{ backgroundColor: `${accent}22`, color: "white", border: `1px solid ${accent}44` }}>
          {h}
        </button>
      ))}
    </div>
  );
}
