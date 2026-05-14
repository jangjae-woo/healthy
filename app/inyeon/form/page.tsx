"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import EntryModal from "@/components/inyeon/EntryModal";
import { InyeonEntryChoice } from "@/lib/inyeon/types";

const HOURS = [
  "시간 모름",
  "야자시 (23:30~23:59)", "자시 (00:00~01:29)", "축시 (01:30~03:29)", "인시 (03:30~05:29)",
  "묘시 (05:30~07:29)", "진시 (07:30~09:29)", "사시 (09:30~11:29)",
  "오시 (11:30~13:29)", "미시 (13:30~15:29)", "신시 (15:30~17:29)",
  "유시 (17:30~19:29)", "술시 (19:30~21:29)", "해시 (21:30~23:29)",
];

const THREAD = "#c8203a";
const PLUM = "#6b1e3a";
const GOLD = "#b88646";

interface PersonForm {
  name: string;
  year: string;
  month: string;
  day: string;
  hour: string;
  calendar: "양력" | "음력";
  gender: "남" | "여" | "";
}

const empty: PersonForm = {
  name: "", year: "", month: "", day: "",
  hour: "시간 모름", calendar: "양력", gender: "",
};

function ok(p: PersonForm) {
  return p.name.trim() && p.year && p.month && p.day && p.gender;
}

function PersonBlock({
  title, subtitle, value, onChange,
}: { title: string; subtitle: string; value: PersonForm; onChange: (v: PersonForm) => void }) {
  return (
    <div className="rounded-md p-5 mb-4" style={{
      background: "linear-gradient(180deg, rgba(255,251,247,0.95), rgba(253,243,232,0.85))",
      border: "1px solid rgba(212,169,107,0.4)",
    }}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-[14px] font-bold" style={{ color: PLUM, fontFamily: "'Nanum Myeongjo', serif" }}>
          {title}
        </div>
        <div className="text-[10px] tracking-[0.2em]" style={{ color: GOLD, fontFamily: "'Cormorant Garamond', serif" }}>
          {subtitle}
        </div>
      </div>
      <div className="space-y-3">
        <div>
          <label className="text-[12px] font-bold block mb-1" style={{ color: PLUM }}>이름 (또는 별명)</label>
          <input
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            placeholder="홍길동"
            className="w-full px-3 py-2.5 rounded-md text-[14px]"
            style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(212,169,107,0.5)", color: "#1a0a14" }}
          />
        </div>

        <div>
          <label className="text-[12px] font-bold block mb-1" style={{ color: PLUM }}>성별</label>
          <div className="flex gap-2">
            {(["남", "여"] as const).map((g) => (
              <button key={g} type="button" onClick={() => onChange({ ...value, gender: g })}
                className="flex-1 py-2.5 rounded-md text-[14px] transition"
                style={{
                  background: value.gender === g ? `linear-gradient(135deg, ${THREAD}1a, ${PLUM}10)` : "rgba(255,255,255,0.7)",
                  border: `1.5px solid ${value.gender === g ? THREAD : "rgba(212,169,107,0.5)"}`,
                  color: value.gender === g ? PLUM : "#1a0a14",
                  fontWeight: value.gender === g ? 700 : 400,
                }}>
                {g}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[12px] font-bold block mb-1" style={{ color: PLUM }}>달력</label>
          <div className="flex gap-2">
            {(["양력", "음력"] as const).map((c) => (
              <button key={c} type="button" onClick={() => onChange({ ...value, calendar: c })}
                className="flex-1 py-2 rounded-md text-[13px] transition"
                style={{
                  background: value.calendar === c ? `${THREAD}15` : "rgba(255,255,255,0.7)",
                  border: `1px solid ${value.calendar === c ? THREAD : "rgba(212,169,107,0.4)"}`,
                  color: value.calendar === c ? PLUM : "#5a3c4a",
                  fontWeight: value.calendar === c ? 700 : 400,
                }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[12px] font-bold block mb-1" style={{ color: PLUM }}>생년월일</label>
          <div className="grid grid-cols-3 gap-2">
            <input value={value.year} onChange={(e) => onChange({ ...value, year: e.target.value })} placeholder="YYYY" inputMode="numeric"
              className="px-3 py-2.5 rounded-md text-[14px] text-center"
              style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(212,169,107,0.5)", color: "#1a0a14" }} />
            <input value={value.month} onChange={(e) => onChange({ ...value, month: e.target.value })} placeholder="MM" inputMode="numeric"
              className="px-3 py-2.5 rounded-md text-[14px] text-center"
              style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(212,169,107,0.5)", color: "#1a0a14" }} />
            <input value={value.day} onChange={(e) => onChange({ ...value, day: e.target.value })} placeholder="DD" inputMode="numeric"
              className="px-3 py-2.5 rounded-md text-[14px] text-center"
              style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(212,169,107,0.5)", color: "#1a0a14" }} />
          </div>
        </div>

        <div>
          <label className="text-[12px] font-bold block mb-1" style={{ color: PLUM }}>출생 시간</label>
          <select value={value.hour} onChange={(e) => onChange({ ...value, hour: e.target.value })}
            className="w-full px-3 py-2.5 rounded-md text-[14px]"
            style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(212,169,107,0.5)", color: "#1a0a14" }}>
            {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}

export default function InyeonForm() {
  const router = useRouter();
  const [a, setA] = useState<PersonForm>({ ...empty });
  const [b, setB] = useState<PersonForm>({ ...empty });
  const [modalOpen, setModalOpen] = useState(false);

  const ready = ok(a) && ok(b);

  const onNext = () => {
    if (!ready) return;
    setModalOpen(true);
  };

  const onSubmit = (choice: InyeonEntryChoice) => {
    const params = new URLSearchParams({
      aName: a.name, aYear: a.year, aMonth: a.month, aDay: a.day,
      aHour: a.hour, aCalendar: a.calendar, aGender: a.gender,
      bName: b.name, bYear: b.year, bMonth: b.month, bDay: b.day,
      bHour: b.hour, bCalendar: b.calendar, bGender: b.gender,
      relationship: choice.relationship,
      duration: choice.duration,
    });
    router.push(`/inyeon/result?${params.toString()}`);
  };

  return (
    <div className="min-h-screen px-4 py-6" style={{
      background: `
        radial-gradient(ellipse at 30% 0%, #ffe1ea 0%, transparent 60%),
        radial-gradient(ellipse at 70% 100%, #fff0d6 0%, transparent 60%),
        linear-gradient(180deg, #fff7f9 0%, #ffeef3 60%, #fce4d6 100%)
      `,
      fontFamily: "'Noto Serif KR', 'Gowun Batang', serif",
    }}>
      <div className="max-w-md mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/inyeon" className="text-[13px]" style={{ color: PLUM, fontFamily: "'Cormorant Garamond', serif" }}>
            ← 돌아가기
          </Link>
          <div className="text-[10px] tracking-[0.4em]" style={{ color: GOLD, fontFamily: "'Cormorant Garamond', serif" }}>
            紅 蓮
          </div>
        </div>

        <div className="text-center mb-8">
          <div className="text-[10px] tracking-[0.4em] mb-2" style={{ color: GOLD, fontFamily: "'Cormorant Garamond', serif" }}>
            인연궁합
          </div>
          <h1 className="text-[24px] font-bold" style={{ color: PLUM, fontFamily: "'Nanum Myeongjo', serif" }}>
            두 분의 생년월일을 알려주세요
          </h1>
          <p className="text-[13px] mt-2" style={{ color: "#5a3c4a", fontFamily: "'Gowun Batang', serif" }}>
            입력이 끝나면 관계를 골라 풀이 톤을 맞춰드려요
          </p>
        </div>

        {/* 두 분 입력 */}
        <PersonBlock title="첫 번째 분" subtitle="A" value={a} onChange={setA} />
        <PersonBlock title="두 번째 분" subtitle="B" value={b} onChange={setB} />

        {/* 진행 버튼 */}
        <button
          onClick={onNext}
          disabled={!ready}
          className="w-full py-4 rounded-md text-[15px] font-bold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: ready ? `${THREAD}22` : "rgba(212,169,107,0.2)",
            color: ready ? THREAD : GOLD,
            fontFamily: "'Gowun Batang', serif",
            letterSpacing: "0.05em",
            border: ready ? `1.5px solid ${THREAD}55` : "1.5px solid transparent",
          }}
        >
          관계 고르기 ›
        </button>

        <div className="text-[11px] text-center mt-4" style={{ color: GOLD, fontFamily: "'Cormorant Garamond', serif" }}>
          ─ 紅 蓮 · 사주가 읽어주는 두 분의 인연 ─
        </div>
      </div>

      <EntryModal open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={onSubmit} />
    </div>
  );
}
