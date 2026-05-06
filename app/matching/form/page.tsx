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

// 자기보고 컨텍스트 — 청월당 폼 패턴 (000/111/222/555/666/777.png)
const CONTACT_FREQ_OPTIONS = [
  "이성과 어울릴 기회가 자주 있다",
  "직장·학교에서 어울리고 있다",
  "이성을 만날 기회가 거의 없다",
];
const MEET_COUNT_OPTIONS = ["없음", "1~3회", "4회 이상"];
const SOLO_REASON_OPTIONS = [
  "이성을 만날 기회가 부족해서",
  "애써 만나고 싶지 않아서",
  "일이나 학업이 우선이어서",
  "이별의 정리가 안 돼서",
  "스스로에게 자신이 없어서",
  "마음에 여유가 없어서",
];

const ACCENT = "#d4a8e8";
const GOLD = "#FFD700";
const BG = "#1a0f20";

interface Msg { id: string; from: "ai" | "user"; text: string; }

export default function MatchingChatForm() {
  const [step, setStep] = useState(-1);
  const [paying, setPaying] = useState(false);
  const [form, setForm] = useState({
    myName: "", myGender: "", myYear: "", myMonth: "", myDay: "",
    myHour: "시간 모름", myCalendar: "양력",
    contactFreq: "", meetCount: "", soloReason: "",
  });
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      aiMsg(
        "안녕하세요.\n저는 홍도인(紅道人)입니다.\n\n붉은 실(紅絲)에 묶인 인연의 결을\n사주만으로 풀어드립니다.\n\n먼저 성함과 생년월일을 알려주시겠어요?",
        "q0",
        () => setStep(0)
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

  // Q0 — 이름
  function submitName() {
    const v = inputValue.trim();
    if (!v) return;
    setForm(f => ({ ...f, myName: v }));
    setInputValue("");
    userMsg(v, "a0", () => aiMsg("성별을 알려주세요.", "q1", () => setStep(1)));
  }
  // Q1 — 성별
  function submitGender(g: string) {
    setForm(f => ({ ...f, myGender: g }));
    userMsg(g === "남" ? "남성" : "여성", "a1", () => aiMsg("생년월일을 알려주세요.", "q2", () => setStep(2)));
  }
  // Q2 — 생년월일
  function submitDate() {
    if (!form.myYear || !form.myMonth || !form.myDay) return;
    userMsg(`${form.myCalendar} ${form.myYear}년 ${form.myMonth}월 ${form.myDay}일`, "a2", () =>
      aiMsg("태어난 시간을 알려주세요.\n모르시면 '시간 모름'을 선택하셔도 됩니다.", "q3", () => setStep(3))
    );
  }
  // Q3 — 시간
  function submitHour(h: string) {
    setForm(f => ({ ...f, myHour: h }));
    userMsg(h, "a3", () =>
      aiMsg(`${form.myName}님의 결을 더 깊이 헤아리기 위해\n몇 가지만 더 여쭙겠습니다.\n\n이성을 얼마나 많이 접하시나요?`, "q4", () => setStep(4))
    );
  }
  // Q4 — 이성 접하는 빈도
  function submitContactFreq(c: string) {
    setForm(f => ({ ...f, contactFreq: c }));
    userMsg(c, "a4", () =>
      aiMsg("지금까지의 만남 경험은 어찌 되십니까?", "q5", () => setStep(5))
    );
  }
  // Q5 — 만남 횟수
  function submitMeetCount(c: string) {
    setForm(f => ({ ...f, meetCount: c }));
    userMsg(c, "a5", () =>
      aiMsg("현재 홀로이시라면, 그 결은 어디에서 비롯되었을지요?\n\n해당이 적으시다면 가장 가까운 답을 골라주셔도 좋습니다.", "q6", () => setStep(6))
    );
  }
  // Q6 — 솔로 사유
  function submitSoloReason(r: string) {
    setForm(f => ({ ...f, soloReason: r }));
    userMsg(r, "a6", () =>
      aiMsg(`${form.myName}님의 인연을 풀이할 준비가 되었습니다.`, "q9", () => setStep(9))
    );
  }

  function handleSubmit() {
    if (paying) return;
    setPaying(true);
    // 결제 연동 전까지는 바로 결과 페이지로 이동
    const params = new URLSearchParams({ ...form, type: 'matching' });
    window.location.href = `/matching/result?${params.toString()}`;
  }

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

        {/* Q0 — 이름 */}
        {step === 0 && (
          <div className="flex justify-end gap-2">
            <input
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submitName()}
              placeholder="이름 입력"
              autoFocus
              className="rounded-lg px-3 py-2 text-white text-sm outline-none w-36"
              style={{ background: "transparent", borderBottom: `1.5px solid ${ACCENT}88` }}
            />
            <button onClick={submitName} disabled={!inputValue.trim()} className="px-4 py-2 rounded-lg text-sm font-bold"
              style={{ backgroundColor: inputValue.trim() ? GOLD : `${ACCENT}33`, color: "#1a0d00" }}>→</button>
          </div>
        )}

        {/* Q1 — 성별 */}
        {step === 1 && (
          <div className="flex justify-end gap-2">
            {[["남", "남성"], ["여", "여성"]].map(([val, label]) => (
              <button key={val} onClick={() => submitGender(val)}
                className="px-5 py-2 rounded-lg text-sm font-medium"
                style={{ backgroundColor: `${ACCENT}22`, color: "white", border: `1px solid ${ACCENT}44` }}>
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Q2 — 생년월일 */}
        {step === 2 && (
          <DateBlock
            calendar={form.myCalendar}
            year={form.myYear} month={form.myMonth} day={form.myDay}
            onCalendarChange={c => setForm(f => ({ ...f, myCalendar: c }))}
            onChange={(k, v) => setForm(f => ({ ...f, [`my${k}`]: v }))}
            onSubmit={submitDate}
            accent={ACCENT} gold={GOLD}
          />
        )}

        {/* Q3 — 시간 */}
        {step === 3 && <HourGrid hours={HOURS} onSelect={submitHour} accent={ACCENT} />}

        {/* Q4 — 이성 접하는 빈도 (청월당 555.png) */}
        {step === 4 && (
          <div className="flex justify-end">
            <div className="w-full max-w-[320px] grid grid-cols-1 gap-2">
              {CONTACT_FREQ_OPTIONS.map(c => (
                <button key={c} onClick={() => submitContactFreq(c)}
                  className="px-4 py-3 rounded-xl text-[13px] font-medium transition-all active:scale-95 text-left"
                  style={{ backgroundColor: `${ACCENT}1a`, color: "white", border: `1px solid ${ACCENT}44` }}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Q5 — 만남 횟수 (청월당 666.png 하단) */}
        {step === 5 && (
          <div className="flex justify-end gap-2">
            {MEET_COUNT_OPTIONS.map(c => (
              <button key={c} onClick={() => submitMeetCount(c)}
                className="px-5 py-2 rounded-lg text-sm font-medium transition-all active:scale-95"
                style={{ backgroundColor: `${ACCENT}22`, color: "white", border: `1px solid ${ACCENT}44` }}>
                {c}
              </button>
            ))}
          </div>
        )}

        {/* Q6 — 솔로 사유 (청월당 777.png 6옵션) */}
        {step === 6 && (
          <div className="flex justify-end">
            <div className="w-full max-w-[320px] grid grid-cols-1 gap-2">
              {SOLO_REASON_OPTIONS.map(r => (
                <button key={r} onClick={() => submitSoloReason(r)}
                  className="px-4 py-3 rounded-xl text-[13px] font-medium transition-all active:scale-95 text-left"
                  style={{ backgroundColor: `${ACCENT}1a`, color: "white", border: `1px solid ${ACCENT}44` }}>
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

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
              인연 풀이 시작
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </main>
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
