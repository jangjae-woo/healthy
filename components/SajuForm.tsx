"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const HOURS = [
  "모름", "자시(23-01)", "축시(01-03)", "인시(03-05)", "묘시(05-07)",
  "진시(07-09)", "사시(09-11)", "오시(11-13)", "미시(13-15)",
  "신시(15-17)", "유시(17-19)", "술시(19-21)", "해시(21-23)",
];

interface Props {
  type: string;
  accent: string;
  bg: string;
  resultPath: string;
}

export default function SajuForm({ type, accent, bg, resultPath }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    gender: "",
    year: "",
    month: "",
    day: "",
    hour: "모름",
    calendarType: "양력",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const params = new URLSearchParams({ ...form, type });
    router.push(`${resultPath}?${params.toString()}`);
  };

  const inputClass = "w-full bg-white/5 border rounded-xl px-4 py-3 text-white text-sm outline-none focus:ring-2 transition-all";

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
      {/* 이름 */}
      <div>
        <label className="text-xs mb-1 block" style={{ color: `${accent}88` }}>이름</label>
        <input
          className={inputClass}
          style={{ borderColor: `${accent}33` }}
          placeholder="이름을 입력하세요"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
      </div>

      {/* 성별 */}
      <div>
        <label className="text-xs mb-1 block" style={{ color: `${accent}88` }}>성별</label>
        <div className="grid grid-cols-2 gap-2">
          {["남", "여"].map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setForm({ ...form, gender: g })}
              className="py-3 rounded-xl text-sm font-medium transition-all"
              style={{
                backgroundColor: form.gender === g ? accent : `${accent}11`,
                color: form.gender === g ? bg : `${accent}88`,
                border: `1px solid ${accent}33`,
              }}
            >
              {g === "남" ? "남성" : "여성"}
            </button>
          ))}
        </div>
      </div>

      {/* 양/음력 */}
      <div>
        <label className="text-xs mb-1 block" style={{ color: `${accent}88` }}>양력 / 음력</label>
        <div className="grid grid-cols-2 gap-2">
          {["양력", "음력"].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setForm({ ...form, calendarType: c })}
              className="py-3 rounded-xl text-sm font-medium transition-all"
              style={{
                backgroundColor: form.calendarType === c ? accent : `${accent}11`,
                color: form.calendarType === c ? bg : `${accent}88`,
                border: `1px solid ${accent}33`,
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* 생년월일 */}
      <div>
        <label className="text-xs mb-1 block" style={{ color: `${accent}88` }}>생년월일</label>
        <div className="grid grid-cols-3 gap-2">
          <input
            className={inputClass}
            style={{ borderColor: `${accent}33` }}
            placeholder="년도"
            maxLength={4}
            value={form.year}
            onChange={(e) => setForm({ ...form, year: e.target.value.replace(/\D/g, "") })}
            required
          />
          <input
            className={inputClass}
            style={{ borderColor: `${accent}33` }}
            placeholder="월"
            maxLength={2}
            value={form.month}
            onChange={(e) => setForm({ ...form, month: e.target.value.replace(/\D/g, "") })}
            required
          />
          <input
            className={inputClass}
            style={{ borderColor: `${accent}33` }}
            placeholder="일"
            maxLength={2}
            value={form.day}
            onChange={(e) => setForm({ ...form, day: e.target.value.replace(/\D/g, "") })}
            required
          />
        </div>
      </div>

      {/* 태어난 시간 */}
      <div>
        <label className="text-xs mb-1 block" style={{ color: `${accent}88` }}>태어난 시간</label>
        <select
          className={inputClass}
          style={{ borderColor: `${accent}33` }}
          value={form.hour}
          onChange={(e) => setForm({ ...form, hour: e.target.value })}
        >
          {HOURS.map((h) => (
            <option key={h} value={h} className="bg-gray-900">{h}</option>
          ))}
        </select>
      </div>

      {/* 제출 */}
      <button
        type="submit"
        disabled={loading || !form.name || !form.gender || !form.year || !form.month || !form.day}
        className="w-full py-4 rounded-2xl text-base font-bold tracking-wider transition-all disabled:opacity-40"
        style={{ backgroundColor: accent, color: bg }}
      >
        {loading ? "분석 중..." : "사주 풀이 보기"}
      </button>
    </form>
  );
}
