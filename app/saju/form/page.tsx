"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const HOURS = [
  "모름", "자시(23-01)", "축시(01-03)", "인시(03-05)", "묘시(05-07)",
  "진시(07-09)", "사시(09-11)", "오시(11-13)", "미시(13-15)",
  "신시(15-17)", "유시(17-19)", "술시(19-21)", "해시(21-23)",
];

const ACCENT = "#c9b4ff";
const BG = "#1a0a2e";

interface Msg { id: string; from: "ai" | "user"; text: string; }

export default function SajuChatForm() {
  const router = useRouter();
  const [step, setStep] = useState(-1); // -1: not started
  const [form, setForm] = useState({
    name: "", gender: "", year: "", month: "", day: "",
    hour: "모름", calendarType: "양력",
  });
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // 첫 메시지
  useEffect(() => {
    const t = setTimeout(() => {
      aiMsg("안녕하세요.\n저는 운학선인입니다.\n\n성함을 알려주시겠습니까?", "q0", () => setStep(0));
    }, 500);
    return () => clearTimeout(t);
  }, []);

  // 스크롤
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
    setStep(-1); // 입력 숨기기
    setTimeout(() => onDone?.(), 400);
  }

  // ── 각 단계 핸들러 ──
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
      aiMsg(`${form.name}님의 사주를 풀이할\n준비가 되었습니다.`, "q4", () => setStep(4));
    });
  }

  function handleSubmit() {
    const params = new URLSearchParams({ ...form, type: "saju" });
    router.push(`/saju/result?${params.toString()}`);
  }

  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(180deg, ${BG} 0%, #0d0019 100%)` }}>
    <main
      className="w-full max-w-[430px] mx-auto min-h-screen flex flex-col"
      style={{ background: `linear-gradient(180deg, ${BG} 0%, #0d0019 100%)` }}
    >
      {/* 헤더 */}
      <div
        className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ borderBottom: `1px solid ${ACCENT}18` }}
      >
        <Link href="/saju" className="text-sm" style={{ color: `${ACCENT}66` }}>←</Link>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{ backgroundColor: `${ACCENT}22`, color: ACCENT }}>
          命
        </div>
        <div>
          <div className="text-sm font-bold text-white">운학선인</div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span className="text-[10px]" style={{ color: `${ACCENT}55` }}>명리학 선생</span>
          </div>
        </div>
      </div>

      {/* 채팅 영역 */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {msgs.map(msg => (
          <div key={msg.id}
            className={`flex items-end gap-2 ${msg.from === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.from === "ai" && (
              <div
                className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold mb-0.5"
                style={{ backgroundColor: `${ACCENT}22`, color: ACCENT }}
              >
                命
              </div>
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

        {/* 타이핑 애니메이션 */}
        {isTyping && (
          <div className="flex items-end gap-2">
            <div
              className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold"
              style={{ backgroundColor: `${ACCENT}22`, color: ACCENT }}
            >
              命
            </div>
            <div
              className="px-4 py-3"
              style={{ backgroundColor: `${ACCENT}18`, borderRadius: "4px 18px 18px 18px" }}
            >
              <div className="flex gap-1 items-center h-4">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ backgroundColor: ACCENT, animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* 입력 영역 */}
      <div
        className="flex-shrink-0 px-4 pb-8 pt-3"
        style={{ borderTop: `1px solid ${ACCENT}18` }}
      >
        {/* 이름 입력 */}
        {step === 0 && (
          <div className="flex gap-2">
            <input
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submitName()}
              placeholder="이름을 입력하세요"
              autoFocus
              className="flex-1 rounded-xl px-4 py-3 text-white text-sm outline-none"
              style={{
                backgroundColor: `${ACCENT}0f`,
                border: `1px solid ${ACCENT}33`,
              }}
            />
            <button
              onClick={submitName}
              disabled={!inputValue.trim()}
              className="px-5 py-3 rounded-xl text-sm font-bold transition-all"
              style={{
                backgroundColor: inputValue.trim() ? ACCENT : `${ACCENT}33`,
                color: BG,
              }}
            >
              →
            </button>
          </div>
        )}

        {/* 성별 선택 */}
        {step === 1 && (
          <div className="grid grid-cols-2 gap-3">
            {[["남", "👨 남성"], ["여", "👩 여성"]].map(([val, label]) => (
              <button
                key={val}
                onClick={() => submitGender(val)}
                className="py-4 rounded-2xl text-sm font-bold transition-all active:scale-95"
                style={{ backgroundColor: `${ACCENT}18`, color: ACCENT, border: `1px solid ${ACCENT}33` }}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* 생년월일 */}
        {step === 2 && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {["양력", "음력"].map(c => (
                <button
                  key={c}
                  onClick={() => setForm(f => ({ ...f, calendarType: c }))}
                  className="py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{
                    backgroundColor: form.calendarType === c ? ACCENT : `${ACCENT}18`,
                    color: form.calendarType === c ? BG : ACCENT,
                    border: `1px solid ${ACCENT}33`,
                  }}
                >
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
                <input
                  key={key}
                  placeholder={placeholder}
                  maxLength={max}
                  value={form[key as keyof typeof form]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value.replace(/\D/g, "") }))}
                  className="rounded-xl px-3 py-3 text-white text-sm text-center outline-none"
                  style={{ backgroundColor: `${ACCENT}0f`, border: `1px solid ${ACCENT}33` }}
                />
              ))}
            </div>
            <button
              onClick={submitDate}
              disabled={!form.year || !form.month || !form.day}
              className="w-full py-3 rounded-xl text-sm font-bold transition-all active:scale-95"
              style={{
                backgroundColor: (form.year && form.month && form.day) ? ACCENT : `${ACCENT}33`,
                color: BG,
              }}
            >
              확인
            </button>
          </div>
        )}

        {/* 시간 선택 */}
        {step === 3 && (
          <div className="grid grid-cols-3 gap-2 max-h-44 overflow-y-auto">
            {HOURS.map(h => (
              <button
                key={h}
                onClick={() => submitHour(h)}
                className="py-2.5 rounded-xl text-xs font-medium transition-all active:scale-95"
                style={{ backgroundColor: `${ACCENT}18`, color: ACCENT, border: `1px solid ${ACCENT}22` }}
              >
                {h}
              </button>
            ))}
          </div>
        )}

        {/* 시작 버튼 */}
        {step === 4 && (
          <button
            onClick={handleSubmit}
            className="w-full py-4 rounded-2xl text-base font-bold tracking-widest transition-all active:scale-95"
            style={{ backgroundColor: ACCENT, color: BG }}
          >
            🌙 &nbsp;사주 풀이 시작
          </button>
        )}
      </div>
    </main>
    </div>
  );
}
