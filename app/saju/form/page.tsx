"use client";
import { useState, useEffect } from "react";
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

interface FormState {
  name: string;
  gender: "남" | "여" | "";
  year: string;
  month: string;
  day: string;
  hour: string;
  calendarType: "양력" | "음력";
}

const initialForm: FormState = {
  name: "", gender: "", year: "", month: "", day: "",
  hour: "시간 모름", calendarType: "양력",
};

function ready(f: FormState) {
  return f.name.trim() && f.gender && f.year && f.month && f.day;
}

export default function SajuForm() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    try {
      const refParam = new URLSearchParams(window.location.search).get('ref');
      if (refParam) localStorage.setItem('saju_ref', refParam);
    } catch {}
  }, []);

  function handleSubmit() {
    if (paying || !ready(form)) return;
    setPaying(true);
    const params = new URLSearchParams({ ...form, type: 'saju' });
    window.location.href = `/saju/result?${params.toString()}`;
  }

  const canSubmit = ready(form);

  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(180deg, ${BG} 0%, #060d07 100%)` }}>
      <main className="w-full max-w-[430px] mx-auto min-h-screen flex flex-col px-4 py-6">

        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/saju" className="text-sm" style={{ color: `${ACCENT}aa` }}>← 돌아가기</Link>
          <div className="text-[10px] tracking-[0.4em]" style={{ color: ACCENT, fontFamily: "'Nanum Myeongjo', serif" }}>
            八 字 苑
          </div>
        </div>

        {/* 타이틀 */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center text-base font-bold"
            style={{ backgroundColor: `${ACCENT}22`, color: ACCENT, border: `1px solid ${ACCENT}55` }}>
            命
          </div>
          <div className="text-[11px] tracking-[0.4em] mb-2" style={{ color: `${ACCENT}aa`, fontFamily: "'Nanum Myeongjo', serif" }}>
            묵 도 인
          </div>
          <h1 className="text-[22px] font-bold text-white mb-2" style={{ fontFamily: "'Nanum Myeongjo', serif", letterSpacing: "-0.01em" }}>
            당신의 사주를 알려주세요
          </h1>
          <p className="text-[13px]" style={{ color: `${ACCENT}99` }}>
            입력이 끝나면 묵도인이 평생 사주를 풀어드립니다
          </p>
        </div>

        {/* 입력 카드 */}
        <div className="rounded-2xl p-5 mb-5 space-y-5"
          style={{
            background: `linear-gradient(180deg, ${ACCENT}0e 0%, ${ACCENT}06 100%)`,
            border: `1px solid ${ACCENT}33`,
          }}>

          {/* 이름 */}
          <div>
            <label className="text-[12px] font-bold block mb-2" style={{ color: `${ACCENT}cc` }}>
              이름 (또는 별명)
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="홍길동"
              className="w-full px-3 py-3 rounded-lg text-[14px] outline-none transition"
              style={{
                background: `${BG}cc`,
                border: `1px solid ${ACCENT}44`,
                color: "white",
              }}
            />
          </div>

          {/* 성별 */}
          <div>
            <label className="text-[12px] font-bold block mb-2" style={{ color: `${ACCENT}cc` }}>
              성별
            </label>
            <div className="flex gap-2">
              {(["남", "여"] as const).map((g) => (
                <button key={g} type="button" onClick={() => setForm(f => ({ ...f, gender: g }))}
                  className="flex-1 py-3 rounded-lg text-[14px] font-bold transition active:scale-95"
                  style={{
                    background: form.gender === g ? `${GOLD}22` : `${BG}cc`,
                    border: `1.5px solid ${form.gender === g ? GOLD : `${ACCENT}44`}`,
                    color: form.gender === g ? GOLD : "white",
                  }}>
                  {g === "남" ? "남성" : "여성"}
                </button>
              ))}
            </div>
          </div>

          {/* 달력 */}
          <div>
            <label className="text-[12px] font-bold block mb-2" style={{ color: `${ACCENT}cc` }}>
              달력
            </label>
            <div className="flex gap-2">
              {(["양력", "음력"] as const).map((c) => (
                <button key={c} type="button" onClick={() => setForm(f => ({ ...f, calendarType: c }))}
                  className="flex-1 py-2.5 rounded-lg text-[13px] transition active:scale-95"
                  style={{
                    background: form.calendarType === c ? `${GOLD}18` : `${BG}cc`,
                    border: `1px solid ${form.calendarType === c ? GOLD : `${ACCENT}33`}`,
                    color: form.calendarType === c ? GOLD : `${ACCENT}cc`,
                    fontWeight: form.calendarType === c ? 700 : 400,
                  }}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* 생년월일 */}
          <div>
            <label className="text-[12px] font-bold block mb-2" style={{ color: `${ACCENT}cc` }}>
              생년월일
            </label>
            <div className="grid grid-cols-3 gap-2">
              <input value={form.year} onChange={(e) => setForm(f => ({ ...f, year: e.target.value.replace(/\D/g, "") }))}
                placeholder="YYYY" inputMode="numeric" maxLength={4}
                className="px-3 py-3 rounded-lg text-[14px] text-center outline-none"
                style={{ background: `${BG}cc`, border: `1px solid ${ACCENT}44`, color: "white" }} />
              <input value={form.month} onChange={(e) => setForm(f => ({ ...f, month: e.target.value.replace(/\D/g, "") }))}
                placeholder="MM" inputMode="numeric" maxLength={2}
                className="px-3 py-3 rounded-lg text-[14px] text-center outline-none"
                style={{ background: `${BG}cc`, border: `1px solid ${ACCENT}44`, color: "white" }} />
              <input value={form.day} onChange={(e) => setForm(f => ({ ...f, day: e.target.value.replace(/\D/g, "") }))}
                placeholder="DD" inputMode="numeric" maxLength={2}
                className="px-3 py-3 rounded-lg text-[14px] text-center outline-none"
                style={{ background: `${BG}cc`, border: `1px solid ${ACCENT}44`, color: "white" }} />
            </div>
          </div>

          {/* 출생 시간 */}
          <div>
            <label className="text-[12px] font-bold block mb-2" style={{ color: `${ACCENT}cc` }}>
              출생 시간
            </label>
            <select value={form.hour} onChange={(e) => setForm(f => ({ ...f, hour: e.target.value }))}
              className="w-full px-3 py-3 rounded-lg text-[14px] outline-none"
              style={{ background: `${BG}cc`, border: `1px solid ${ACCENT}44`, color: "white" }}>
              {HOURS.map((h) => <option key={h} value={h} style={{ background: BG }}>{h}</option>)}
            </select>
            <p className="text-[11px] mt-1.5" style={{ color: `${ACCENT}77` }}>
              모르시면 &apos;시간 모름&apos;을 선택하셔도 됩니다
            </p>
          </div>
        </div>

        {/* 시작 버튼 */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || paying}
          className="w-full py-4 rounded-2xl text-base font-bold tracking-widest transition-all active:scale-95 disabled:cursor-not-allowed"
          style={{
            background: (canSubmit && !paying)
              ? "linear-gradient(135deg, #FFF4B0 0%, #FFE066 40%, #FFD700 100%)"
              : `${ACCENT}33`,
            color: (canSubmit && !paying) ? "#1a0d00" : `${ACCENT}77`,
            boxShadow: (canSubmit && !paying)
              ? `0 0 32px ${GOLD}cc, 0 0 14px ${GOLD}aa, 0 4px 16px ${GOLD}55`
              : "none",
          }}
        >
          {paying ? '결제창 여는 중...' : '🌙  사주 풀이 시작'}
        </button>

        <p className="text-center text-[11px] mt-4" style={{ color: `${ACCENT}77` }}>
          결과 확인 시 소정의 이용료가 발생합니다
        </p>

      </main>
    </div>
  );
}
