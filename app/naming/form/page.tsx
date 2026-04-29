"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const ACCENT = "#e8b84b";
const BG = "#1e1408";

interface Msg { id: string; from: "ai" | "user"; text: string; }

export default function NamingForm() {
  const router = useRouter();
  const [step, setStep] = useState(-1);
  const [form, setForm] = useState({
    gender: "", year: "", month: "", day: "",
    calendarType: "양력", lastName: "", feeling: "",
  });
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      aiMsg("안녕하세요.\n저는 황도인(煌道人)입니다.\n\n이름은 사주의 부족을 채워주는 또 하나의 결입니다.\n이름을 지어드릴 분의 성별을 알려주세요.", "q0", () => setStep(0));
    }, 500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, isTyping]);

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

  function submitGender(g: string) {
    setForm(f => ({ ...f, gender: g }));
    userMsg(g === "남" ? "남성" : "여성", "a0", () => {
      aiMsg("생년월일을 알려주세요.\n(모르시면 원하는 날짜를 입력해도 됩니다)", "q1", () => setStep(1));
    });
  }

  function submitDate() {
    if (!form.year || !form.month || !form.day) return;
    userMsg(`${form.calendarType} ${form.year}년 ${form.month}월 ${form.day}일`, "a1", () => {
      aiMsg("성(姓)을 알려주세요.\n예: 김, 이, 박", "q2", () => setStep(2));
    });
  }

  function submitLastName() {
    const ln = inputValue.trim();
    if (!ln) return;
    setForm(f => ({ ...f, lastName: ln }));
    setInputValue("");
    userMsg(ln, "a2", () => {
      aiMsg(`${ln}씨 성을 가진 이름이군요.\n\n어떤 느낌의 이름을 원하시나요?\n예: "강인하고 리더십 있는 느낌", "부드럽고 지혜로운 느낌", "세련되고 현대적인 느낌"`, "q3", () => setStep(3));
    });
  }

  function submitFeeling() {
    const f = inputValue.trim();
    if (!f) return;
    setForm(prev => ({ ...prev, feeling: f }));
    setInputValue("");
    userMsg(f, "a3", () => {
      aiMsg(`사주와 "${f}" 느낌을 담은\n최적의 이름 3가지를 추천해드리겠습니다.`, "q4", () => setStep(4));
    });
  }

  function handleSubmit() {
    const params = new URLSearchParams({ ...form, type: "naming" });
    router.push(`/naming/result?${params.toString()}`);
  }

  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(180deg, ${BG} 0%, #0a0704 100%)` }}>
      <main className="w-full max-w-[430px] mx-auto min-h-screen flex flex-col"
        style={{ background: `linear-gradient(180deg, ${BG} 0%, #0a0704 100%)` }}>

        {/* 헤더 */}
        <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
          style={{ borderBottom: `1px solid ${ACCENT}18` }}>
          <Link href="/naming" className="text-sm" style={{ color: `${ACCENT}66` }}>←</Link>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ backgroundColor: `${ACCENT}22`, color: ACCENT }}>
            名
          </div>
          <div>
            <div className="text-sm font-bold text-white">황도인(煌道人)</div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
              <span className="text-[10px]" style={{ color: `${ACCENT}55` }}>작명·개명 전문가</span>
            </div>
          </div>
        </div>

        {/* 채팅 영역 */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {msgs.map(msg => (
            <div key={msg.id}
              className={`flex items-end gap-2 ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
              {msg.from === "ai" && (
                <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold mb-0.5"
                  style={{ backgroundColor: `${ACCENT}22`, color: ACCENT }}>名</div>
              )}
              <div
                className="max-w-[78%] px-4 py-3 text-sm whitespace-pre-line leading-relaxed"
                style={{
                  backgroundColor: msg.from === "ai" ? `${ACCENT}18` : ACCENT,
                  color: msg.from === "ai" ? "white" : BG,
                  borderRadius: msg.from === "ai" ? "4px 18px 18px 18px" : "18px 4px 18px 18px",
                }}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-end gap-2">
              <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold"
                style={{ backgroundColor: `${ACCENT}22`, color: ACCENT }}>名</div>
              <div className="px-4 py-3" style={{ backgroundColor: `${ACCENT}18`, borderRadius: "4px 18px 18px 18px" }}>
                <div className="flex gap-1 items-center h-4">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                      style={{ backgroundColor: ACCENT, animationDelay: `${i * 150}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* 입력 영역 */}
        <div className="flex-shrink-0 px-4 pb-8 pt-3" style={{ borderTop: `1px solid ${ACCENT}18` }}>

          {/* 성별 */}
          {step === 0 && (
            <div className="grid grid-cols-2 gap-3">
              {[["남", "👦 남성"], ["여", "👧 여성"]].map(([val, label]) => (
                <button key={val} onClick={() => submitGender(val)}
                  className="py-4 rounded-2xl text-sm font-bold transition-all active:scale-95"
                  style={{ backgroundColor: `${ACCENT}18`, color: ACCENT, border: `1px solid ${ACCENT}33` }}>
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* 생년월일 */}
          {step === 1 && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {["양력", "음력"].map(c => (
                  <button key={c} onClick={() => setForm(f => ({ ...f, calendarType: c }))}
                    className="py-2.5 rounded-xl text-sm font-medium transition-all"
                    style={{
                      backgroundColor: form.calendarType === c ? ACCENT : `${ACCENT}18`,
                      color: form.calendarType === c ? BG : ACCENT,
                      border: `1px solid ${ACCENT}33`,
                    }}>
                    {c}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: "year", placeholder: "년도", max: 4 },
                  { key: "month", placeholder: "월", max: 2 },
                  { key: "day", placeholder: "일", max: 2 },
                ].map(({ key, placeholder, max }) => (
                  <input key={key} placeholder={placeholder} maxLength={max}
                    value={form[key as keyof typeof form]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value.replace(/\D/g, "") }))}
                    className="rounded-xl px-3 py-3 text-white text-sm text-center outline-none"
                    style={{ backgroundColor: `${ACCENT}0f`, border: `1px solid ${ACCENT}33` }}
                  />
                ))}
              </div>
              <button onClick={submitDate}
                disabled={!form.year || !form.month || !form.day}
                className="w-full py-3 rounded-xl text-sm font-bold transition-all active:scale-95"
                style={{
                  backgroundColor: (form.year && form.month && form.day) ? ACCENT : `${ACCENT}33`,
                  color: BG,
                }}>
                확인
              </button>
            </div>
          )}

          {/* 성 입력 */}
          {step === 2 && (
            <div className="flex gap-2">
              <input
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => e.key === "Enter" && submitLastName()}
                placeholder="성을 입력하세요 (예: 김)"
                autoFocus
                className="flex-1 rounded-xl px-4 py-3 text-white text-sm outline-none"
                style={{ backgroundColor: `${ACCENT}0f`, border: `1px solid ${ACCENT}33` }}
              />
              <button onClick={submitLastName} disabled={!inputValue.trim()}
                className="px-5 py-3 rounded-xl text-sm font-bold transition-all"
                style={{ backgroundColor: inputValue.trim() ? ACCENT : `${ACCENT}33`, color: BG }}>
                →
              </button>
            </div>
          )}

          {/* 원하는 느낌 입력 */}
          {step === 3 && (
            <div className="space-y-3">
              <textarea
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder={`원하는 이름 느낌을 자유롭게 적어주세요\n예: 강인하고 리더십 있는 느낌`}
                rows={3}
                autoFocus
                className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none resize-none leading-relaxed"
                style={{ backgroundColor: `${ACCENT}0f`, border: `1px solid ${ACCENT}33` }}
              />
              <button onClick={submitFeeling} disabled={!inputValue.trim()}
                className="w-full py-3 rounded-xl text-sm font-bold transition-all active:scale-95"
                style={{
                  backgroundColor: inputValue.trim() ? ACCENT : `${ACCENT}33`,
                  color: BG,
                }}>
                확인
              </button>
            </div>
          )}

          {/* 시작 버튼 */}
          {step === 4 && (
            <button onClick={handleSubmit}
              className="w-full py-4 rounded-2xl text-base font-bold tracking-widest transition-all active:scale-95"
              style={{ backgroundColor: ACCENT, color: BG }}>
              ✍️ &nbsp;이름 추천 시작
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
