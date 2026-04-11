"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const HOURS = [
  "모름", "자시(23-01)", "축시(01-03)", "인시(03-05)", "묘시(05-07)",
  "진시(07-09)", "사시(09-11)", "오시(11-13)", "미시(13-15)",
  "신시(15-17)", "유시(17-19)", "술시(19-21)", "해시(21-23)",
];

const ACCENT = "#ffd700";
const BG = "#1a1a0a";

export default function FaceFormPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "", gender: "", year: "", month: "", day: "",
    hour: "모름", calendarType: "양력",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const params = new URLSearchParams({ ...form, type: "face" });
    router.push(`/face/result?${params.toString()}`);
  };

  const inputClass = "w-full bg-white/5 border rounded-xl px-4 py-3 text-white text-sm outline-none focus:ring-2 transition-all";

  return (
    <main
      className="min-h-screen flex flex-col items-center px-4 py-8"
      style={{ background: `linear-gradient(180deg, ${BG} 0%, #1a0d00 100%)` }}
    >
      <div className="w-full max-w-sm mb-6">
        <Link href="/face" className="flex items-center gap-1 text-sm" style={{ color: `${ACCENT}88` }}>
          ← 뒤로
        </Link>
      </div>
      <div className="text-center mb-8">
        <div className="text-4xl mb-2">🪬</div>
        <h1 className="text-xl font-bold text-white mb-1">정통 관상</h1>
        <p className="text-xs" style={{ color: `${ACCENT}77` }}>이름·생년월일을 입력해주세요</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        {/* 이름 */}
        <div>
          <label className="text-xs mb-1 block" style={{ color: `${ACCENT}88` }}>이름</label>
          <input
            className={inputClass}
            style={{ borderColor: `${ACCENT}33` }}
            placeholder="이름을 입력하세요"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>

        {/* 성별 */}
        <div>
          <label className="text-xs mb-1 block" style={{ color: `${ACCENT}88` }}>성별</label>
          <div className="grid grid-cols-2 gap-2">
            {["남", "여"].map((g) => (
              <button key={g} type="button" onClick={() => setForm({ ...form, gender: g })}
                className="py-3 rounded-xl text-sm font-medium transition-all"
                style={{
                  backgroundColor: form.gender === g ? ACCENT : `${ACCENT}11`,
                  color: form.gender === g ? BG : `${ACCENT}88`,
                  border: `1px solid ${ACCENT}33`,
                }}>
                {g === "남" ? "남성" : "여성"}
              </button>
            ))}
          </div>
        </div>

        {/* 양/음력 */}
        <div>
          <label className="text-xs mb-1 block" style={{ color: `${ACCENT}88` }}>양력 / 음력</label>
          <div className="grid grid-cols-2 gap-2">
            {["양력", "음력"].map((c) => (
              <button key={c} type="button" onClick={() => setForm({ ...form, calendarType: c })}
                className="py-3 rounded-xl text-sm font-medium transition-all"
                style={{
                  backgroundColor: form.calendarType === c ? ACCENT : `${ACCENT}11`,
                  color: form.calendarType === c ? BG : `${ACCENT}88`,
                  border: `1px solid ${ACCENT}33`,
                }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* 생년월일 */}
        <div>
          <label className="text-xs mb-1 block" style={{ color: `${ACCENT}88` }}>생년월일</label>
          <div className="grid grid-cols-3 gap-2">
            <input className={inputClass} style={{ borderColor: `${ACCENT}33` }}
              placeholder="년도" maxLength={4} value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value.replace(/\D/g, "") })} required />
            <input className={inputClass} style={{ borderColor: `${ACCENT}33` }}
              placeholder="월" maxLength={2} value={form.month}
              onChange={(e) => setForm({ ...form, month: e.target.value.replace(/\D/g, "") })} required />
            <input className={inputClass} style={{ borderColor: `${ACCENT}33` }}
              placeholder="일" maxLength={2} value={form.day}
              onChange={(e) => setForm({ ...form, day: e.target.value.replace(/\D/g, "") })} required />
          </div>
        </div>

        {/* 시간 */}
        <div>
          <label className="text-xs mb-1 block" style={{ color: `${ACCENT}88` }}>태어난 시간</label>
          <select className={inputClass} style={{ borderColor: `${ACCENT}33` }}
            value={form.hour} onChange={(e) => setForm({ ...form, hour: e.target.value })}>
            {HOURS.map((h) => (
              <option key={h} value={h} className="bg-gray-900">{h}</option>
            ))}
          </select>
        </div>

        {/* 안내 */}
        <div className="rounded-xl p-4 text-xs leading-relaxed"
          style={{ backgroundColor: `${ACCENT}11`, color: `${ACCENT}88`, border: `1px solid ${ACCENT}22` }}>
          ✦ 정통 관상은 사주(四柱)와 관상(觀相)을 함께 봅니다. 생년월일을 입력하시면 더 정확한 풀이를 받으실 수 있습니다.
        </div>

        <button
          type="submit"
          disabled={loading || !form.name || !form.gender || !form.year || !form.month || !form.day}
          className="w-full py-4 rounded-2xl text-base font-bold tracking-wider transition-all disabled:opacity-40"
          style={{ backgroundColor: ACCENT, color: BG }}
        >
          {loading ? "분석 중..." : "관상 풀이 보기"}
        </button>
      </form>
    </main>
  );
}
