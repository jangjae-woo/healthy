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

const ACCENT = "#c9960c";
const GOLD = "#FFD700";
const BG = "#0d1a0f";
const PRICE = 45900;

interface Msg { id: string; from: "ai" | "user"; text: string; }

export default function SajuChatForm() {
  const [step, setStep] = useState(-1);
  const [refDiscount, setRefDiscount] = useState(false);
  const [paying, setPaying] = useState(false);
  const [form, setForm] = useState({
    name: "", gender: "", year: "", month: "", day: "",
    hour: "시간 모름", calendarType: "양력", phone: "",
  });
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try { if (localStorage.getItem('saju_ref')) setRefDiscount(true); } catch {}
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      aiMsg("안녕하세요.\n저는 묵도인입니다.\n\n성함을 알려주시겠습니까?", "q0", () => setStep(0));
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

  function submitName() {
    const name = inputValue.trim();
    if (!name) return;
    setForm(f => ({ ...f, name }));
    setInputValue("");
    userMsg(name, "a0", () => {
      aiMsg(`${name}님, 반갑습니다.\n성별을 알려주세요.`, "q1", () => setStep(1));
    });
  }

  function submitGender(g: string) {
    setForm(f => ({ ...f, gender: g }));
    userMsg(g === "남" ? "남성" : "여성", "a1", () => {
      aiMsg("생년월일을 알려주세요.", "q2", () => setStep(2));
    });
  }

  function submitDate() {
    if (!form.year || !form.month || !form.day) return;
    userMsg(`${form.calendarType} ${form.year}년 ${form.month}월 ${form.day}일`, "a2", () => {
      aiMsg("태어난 시간을 알려주세요.\n모르시면 '모름'을 선택하셔도 됩니다.", "q3", () => setStep(3));
    });
  }

  function submitHour(h: string) {
    setForm(f => ({ ...f, hour: h }));
    userMsg(h, "a3", () => {
      aiMsg(`${form.name}님의 사주를 풀이할\n준비가 되었습니다.`, "q5", () => setStep(5));
    });
  }

  function handleSubmit() {
    if (paying) return;
    setPaying(true);
    const params = new URLSearchParams({ ...form, type: 'saju' });
    window.location.href = `/saju/result?${params.toString()}`;
  }

  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(180deg, ${BG} 0%, #060d07 100%)` }}>
    <main
      className="w-full max-w-[430px] mx-auto min-h-screen flex flex-col"
      style={{ background: `linear-gradient(180deg, ${BG} 0%, #060d07 100%)` }}
    >
      {/* 헤더 */}
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ borderBottom: `1px solid ${ACCENT}18` }}>
        <Link href="/saju" className="text-sm" style={{ color: `${ACCENT}66` }}>←</Link>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: `${ACCENT}22`, color: ACCENT }}>命</div>
        <div>
          <div className="text-sm font-bold text-white">묵도인</div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span className="text-[10px]" style={{ color: `${ACCENT}55` }}>명리학 선생</span>
          </div>
        </div>
      </div>

      {/* 채팅 + 인라인 입력 */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5 pb-10">

        {msgs.map(msg => (
          <div key={msg.id} className={`flex items-end gap-2 ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
            {msg.from === "ai" && (
              <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold mb-0.5" style={{ backgroundColor: `${ACCENT}22`, color: ACCENT }}>命</div>
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

        {/* 타이핑 */}
        {isTyping && (
          <div className="flex items-end gap-2">
            <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: `${ACCENT}22`, color: ACCENT }}>命</div>
            <div className="px-4 py-3" style={{ backgroundColor: `${ACCENT}18`, borderRadius: "4px 18px 18px 18px" }}>
              <div className="flex gap-1 items-center h-4">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: ACCENT, animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 이름 입력 */}
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

        {/* 성별 선택 */}
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

        {/* 생년월일 */}
        {step === 2 && (
          <div className="flex flex-col items-end gap-3">
            <div className="flex gap-4 text-sm">
              {["양력", "음력"].map(c => (
                <button key={c} onClick={() => setForm(f => ({ ...f, calendarType: c }))}
                  className="flex items-center gap-1"
                  style={{ color: form.calendarType === c ? GOLD : `${ACCENT}77` }}>
                  {form.calendarType === c ? "✓" : "○"} {c}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {[
                { key: "year", placeholder: "년도", w: "w-20", max: 4 },
                { key: "month", placeholder: "월", w: "w-12", max: 2 },
                { key: "day", placeholder: "일", w: "w-12", max: 2 },
              ].map(({ key, placeholder, w, max }) => (
                <input key={key} placeholder={placeholder} maxLength={max}
                  value={form[key as keyof typeof form]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value.replace(/\D/g, "") }))}
                  className={`${w} px-2 py-2 text-white text-sm text-center outline-none`}
                  style={{ background: "transparent", borderBottom: `1.5px solid ${ACCENT}88` }}
                />
              ))}
            </div>
            <button onClick={submitDate} disabled={!form.year || !form.month || !form.day}
              className="px-6 py-2 rounded-lg text-sm font-bold"
              style={{ backgroundColor: (form.year && form.month && form.day) ? GOLD : `${ACCENT}33`, color: "#1a0d00" }}>
              확인
            </button>
          </div>
        )}

        {/* 시간 선택 */}
        {step === 3 && (
          <div className="flex flex-wrap justify-end gap-2">
            {HOURS.map(h => (
              <button key={h} onClick={() => submitHour(h)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95"
                style={{ backgroundColor: `${ACCENT}22`, color: "white", border: `1px solid ${ACCENT}44` }}>
                {h}
              </button>
            ))}
          </div>
        )}

        {/* 결제 버튼 */}
        {step === 5 && (
          <div className="mt-2">
            <button onClick={handleSubmit} disabled={paying}
              className="w-full py-4 rounded-2xl text-base font-bold tracking-widest transition-all active:scale-95"
              style={{
                background: paying ? `${GOLD}66` : "linear-gradient(135deg, #FFE066 0%, #FFD700 40%, #FFA800 100%)",
                color: "#1a0d00",
                boxShadow: paying ? "none" : `0 0 24px ${GOLD}99, 0 0 8px ${GOLD}66`,
              }}>
              {paying ? '결제창 여는 중...' : '🌙 \u00a0사주 풀이 시작'}
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </main>
    </div>
  );
}
