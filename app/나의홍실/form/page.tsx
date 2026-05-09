"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import EntryModal from "@/components/나의홍실/EntryModal";
import { InyeonEntryChoice } from "@/lib/나의홍실/types";

const HOURS = [
  "시간 모름",
  "자시 (23:30~01:29)", "축시 (01:30~03:29)", "인시 (03:30~05:29)",
  "묘시 (05:30~07:29)", "진시 (07:30~09:29)", "사시 (09:30~11:29)",
  "오시 (11:30~13:29)", "미시 (13:30~15:29)", "신시 (15:30~17:29)",
  "유시 (17:30~19:29)", "술시 (19:30~21:29)", "해시 (21:30~23:29)",
];

const ACCENT = "#f0a8b8";
const BG = "#2a1a1d";
const BG_INNER = "#1a0d10";

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
  title, value, onChange,
}: { title: string; value: PersonForm; onChange: (v: PersonForm) => void }) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: BG_INNER, border: `1px solid ${ACCENT}33` }}
    >
      <div
        className="text-sm font-bold mb-3"
        style={{ color: "#fef3c7", fontFamily: "'Noto Serif KR', serif" }}
      >
        {title}
      </div>
      <input
        placeholder="이름"
        value={value.name}
        onChange={(e) => onChange({ ...value, name: e.target.value })}
        className="w-full px-3 py-2 rounded-lg text-sm mb-2"
        style={{
          background: BG,
          border: `1px solid ${ACCENT}33`,
          color: "#fef3c7",
        }}
      />
      <div className="grid grid-cols-3 gap-2 mb-2">
        <input
          placeholder="년"
          inputMode="numeric"
          value={value.year}
          onChange={(e) => onChange({ ...value, year: e.target.value })}
          className="px-3 py-2 rounded-lg text-sm"
          style={{ background: BG, border: `1px solid ${ACCENT}33`, color: "#fef3c7" }}
        />
        <input
          placeholder="월"
          inputMode="numeric"
          value={value.month}
          onChange={(e) => onChange({ ...value, month: e.target.value })}
          className="px-3 py-2 rounded-lg text-sm"
          style={{ background: BG, border: `1px solid ${ACCENT}33`, color: "#fef3c7" }}
        />
        <input
          placeholder="일"
          inputMode="numeric"
          value={value.day}
          onChange={(e) => onChange({ ...value, day: e.target.value })}
          className="px-3 py-2 rounded-lg text-sm"
          style={{ background: BG, border: `1px solid ${ACCENT}33`, color: "#fef3c7" }}
        />
      </div>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <select
          value={value.calendar}
          onChange={(e) => onChange({ ...value, calendar: e.target.value as "양력" | "음력" })}
          className="px-3 py-2 rounded-lg text-sm"
          style={{ background: BG, border: `1px solid ${ACCENT}33`, color: "#fef3c7" }}
        >
          <option value="양력">양력</option>
          <option value="음력">음력</option>
        </select>
        <select
          value={value.gender}
          onChange={(e) => onChange({ ...value, gender: e.target.value as "남" | "여" | "" })}
          className="px-3 py-2 rounded-lg text-sm"
          style={{ background: BG, border: `1px solid ${ACCENT}33`, color: "#fef3c7" }}
        >
          <option value="">성별</option>
          <option value="남">남</option>
          <option value="여">여</option>
        </select>
      </div>
      <select
        value={value.hour}
        onChange={(e) => onChange({ ...value, hour: e.target.value })}
        className="w-full px-3 py-2 rounded-lg text-sm"
        style={{ background: BG, border: `1px solid ${ACCENT}33`, color: "#fef3c7" }}
      >
        {HOURS.map((h) => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
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
    router.push(`/나의홍실/result?${params.toString()}`);
  };

  return (
    <main
      className="min-h-screen px-4 py-6"
      style={{
        background: `linear-gradient(180deg, ${BG} 0%, ${BG_INNER} 100%)`,
        fontFamily: "'Gowun Batang', 'Noto Serif KR', serif",
      }}
    >
      <Link
        href="/나의홍실"
        className="text-xs"
        style={{ color: `${ACCENT}cc` }}
      >
        ← 뒤로
      </Link>

      <div className="max-w-md mx-auto pt-4">
        <h1
          className="text-xl font-bold text-center mb-1"
          style={{ color: "#fef3c7", fontFamily: "'Noto Serif KR', serif" }}
        >
          두 분의 생년월일을 알려주세요
        </h1>
        <p
          className="text-xs text-center mb-6"
          style={{ color: `${ACCENT}cc` }}
        >
          입력이 끝나면 관계를 골라 풀이 톤을 맞춰드려요
        </p>

        <div className="flex flex-col gap-4">
          <PersonBlock title="첫 번째 분 (A)" value={a} onChange={setA} />
          <PersonBlock title="두 번째 분 (B)" value={b} onChange={setB} />
        </div>

        <button
          onClick={onNext}
          disabled={!ready}
          className="w-full mt-6 py-3.5 rounded-xl text-sm font-bold transition-all"
          style={{
            background: ready ? ACCENT : `${ACCENT}33`,
            color: ready ? BG : `${ACCENT}88`,
            opacity: ready ? 1 : 0.6,
          }}
        >
          관계 고르기 →
        </button>
      </div>

      <EntryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={onSubmit}
      />
    </main>
  );
}
