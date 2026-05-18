"use client";

import { useState } from "react";
import Link from "next/link";

const HOURS = [
  "시간 모름",
  "자시 (23:30~01:29)",
  "축시 (01:30~03:29)",
  "인시 (03:30~05:29)",
  "묘시 (05:30~07:29)",
  "진시 (07:30~09:29)",
  "사시 (09:30~11:29)",
  "오시 (11:30~13:29)",
  "미시 (13:30~15:29)",
  "신시 (15:30~17:29)",
  "유시 (17:30~19:29)",
  "술시 (19:30~21:29)",
  "해시 (21:30~23:29)",
];

const THREAD = "#c8203a";
const PLUM = "#6b1e3a";
const GOLD = "#b88646";

type PersonForm = {
  name: string;
  year: string;
  month: string;
  day: string;
  hour: string;
  calendar: string;
};

const emptyPerson: PersonForm = {
  name: "",
  year: "",
  month: "",
  day: "",
  hour: "시간 모름",
  calendar: "양력",
};

function isPersonComplete(person: PersonForm) {
  return person.name.trim() && person.year.length === 4 && person.month && person.day;
}

function birthDate(person: PersonForm) {
  return `${person.year}-${person.month.padStart(2, "0")}-${person.day.padStart(2, "0")}`;
}

function calcAge(year: string, month: string, day: string): number | null {
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);
  if (!y || !m || !d) return null;
  const now = new Date();
  let age = now.getFullYear() - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) age -= 1;
  return Math.max(age, 0);
}

export default function YouaFormPage() {
  const [child, setChild] = useState<PersonForm & { gender: "female" | "male" | "" }>({
    ...emptyPerson,
    gender: "",
  });
  const [mother, setMother] = useState<PersonForm>({ ...emptyPerson });
  const [father, setFather] = useState<PersonForm>({ ...emptyPerson });
  const [includeMother, setIncludeMother] = useState(true);
  const [includeFather, setIncludeFather] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const childAge = calcAge(child.year, child.month, child.day);
  const childAgeOk = childAge === null || childAge <= 19;
  const childOk = Boolean(isPersonComplete(child) && child.gender && childAgeOk);
  const motherOk = includeMother && isPersonComplete(mother);
  const fatherOk = includeFather && isPersonComplete(father);
  const canSubmit = childOk && motherOk && fatherOk;

  function handleSubmit() {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    const params = new URLSearchParams({
      childName: child.name.trim(),
      childBirthDate: birthDate(child),
      childGender: child.gender,
      childHour: child.hour,
      childCalendar: child.calendar,
      motherName: mother.name.trim(),
      motherBirthDate: birthDate(mother),
      motherHour: mother.hour,
      motherCalendar: mother.calendar,
      fatherName: father.name.trim(),
      fatherBirthDate: birthDate(father),
      fatherHour: father.hour,
      fatherCalendar: father.calendar,
    });
    window.location.href = `/love/youa/result?${params.toString()}`;
  }

  return (
    <div
      className="min-h-screen px-4 py-6"
      style={{
        background: `
          radial-gradient(ellipse at 30% 0%, #ffe1ea 0%, transparent 60%),
          radial-gradient(ellipse at 70% 100%, #fff0d6 0%, transparent 60%),
          linear-gradient(180deg, #fff7f9 0%, #ffeef3 60%, #fce4d6 100%)
        `,
        fontFamily: "'Noto Serif KR', 'Gowun Batang', serif",
      }}
    >
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/love/youa"
            className="text-[13px]"
            style={{ color: PLUM, fontFamily: "'Cormorant Garamond', serif" }}
          >
            ← 돌아가기
          </Link>
          <div
            className="text-[10px] tracking-[0.4em]"
            style={{ color: GOLD, fontFamily: "'Cormorant Garamond', serif" }}
          >
            PALJAWON
          </div>
        </div>

        <div className="mb-8 text-center">
          <div
            className="mb-2 text-[10px] tracking-[0.4em]"
            style={{ color: GOLD, fontFamily: "'Cormorant Garamond', serif" }}
          >
            아이기질과 부모양육 · 가족 인연 풀이
          </div>
          <h1
            className="text-[22px] font-bold"
            style={{ color: PLUM, fontFamily: "'Nanum Myeongjo', serif" }}
          >
            아이와 부모님의 사주를 입력해주세요
          </h1>
          <p className="mt-3 text-[12px] leading-[1.65]" style={{ color: "#5a3c4a" }}>
            아이의 결을 중심으로 어머님과 아버님의 양육 흐름을 함께 봅니다.
            <br />
            <span style={{ color: GOLD }}>아이는 만 19세 이하만 분석 가능합니다</span>
          </p>
        </div>

        <PersonCard
          label="자녀"
          sublabel="필수"
          person={child}
          onChange={(partial) => setChild((current) => ({ ...current, ...partial }))}
          extra={
            <div className="mb-3 flex items-center gap-2">
              <p className="min-w-[34px] text-[12px] font-bold" style={{ color: PLUM }}>
                성별
              </p>
              {[
                ["male", "아들"],
                ["female", "딸"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setChild((current) => ({ ...current, gender: value as "male" | "female" }))}
                  className="rounded-md px-4 py-1.5 text-[12px] transition-all"
                  style={segmentStyle(child.gender === value)}
                >
                  {label}
                </button>
              ))}
            </div>
          }
        />

        {childAge !== null && childAge > 19 && (
          <p className="mb-3 text-center text-[12px]" style={{ color: THREAD, fontWeight: 700 }}>
            이 보고서는 만 19세 이하 아이만 분석 가능합니다. 현재 만 {childAge}세입니다.
          </p>
        )}

        <TogglePersonCard
          title="어머님"
          included={includeMother}
          onToggle={() => setIncludeMother((value) => !value)}
        >
          <PersonCardBody person={mother} onChange={(partial) => setMother((current) => ({ ...current, ...partial }))} />
        </TogglePersonCard>

        <TogglePersonCard
          title="아버님"
          included={includeFather}
          onToggle={() => setIncludeFather((value) => !value)}
        >
          <PersonCardBody person={father} onChange={(partial) => setFather((current) => ({ ...current, ...partial }))} />
        </TogglePersonCard>

        {(!includeMother || !includeFather) && (
          <p className="mb-3 text-center text-[12px]" style={{ color: THREAD, fontWeight: 700 }}>
            이 보고서는 어머님과 아버님 정보를 모두 입력해야 결과를 볼 수 있습니다.
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          className="w-full rounded-md py-4 text-[15px] font-bold transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          style={{
            background: canSubmit && !submitting ? `${THREAD}22` : "rgba(212,169,107,0.2)",
            color: canSubmit && !submitting ? THREAD : GOLD,
            fontFamily: "'Gowun Batang', serif",
            letterSpacing: "0.05em",
            border: canSubmit && !submitting ? `1.5px solid ${THREAD}55` : "1.5px solid transparent",
          }}
        >
          결제하고 결과 보기 →
        </button>

        <div
          className="mt-4 text-center text-[11px]"
          style={{ color: GOLD, fontFamily: "'Cormorant Garamond', serif" }}
        >
          PALJAWON · CHILD TEMPERAMENT REPORT
        </div>
      </div>
    </div>
  );
}

function PersonCard({
  label,
  sublabel,
  person,
  onChange,
  extra,
}: {
  label: string;
  sublabel: string;
  person: PersonForm;
  onChange: (person: Partial<PersonForm>) => void;
  extra?: React.ReactNode;
}) {
  return (
    <section
      className="mb-4 rounded-md p-5"
      style={{
        background: "linear-gradient(180deg, rgba(255,251,247,0.95), rgba(253,243,232,0.85))",
        border: "1px solid rgba(212,169,107,0.4)",
      }}
    >
      <CardTitle title={label} status={sublabel} />
      <PersonCardBody person={person} onChange={onChange} extra={extra} />
    </section>
  );
}

function TogglePersonCard({
  title,
  included,
  onToggle,
  children,
}: {
  title: string;
  included: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section
      className="mb-4 rounded-md p-5"
      style={{
        background: included
          ? "linear-gradient(180deg, rgba(255,251,247,0.95), rgba(253,243,232,0.85))"
          : "rgba(255,255,255,0.5)",
        border: `1px solid ${included ? "rgba(212,169,107,0.4)" : "rgba(212,169,107,0.2)"}`,
      }}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <CardTitle title={title} status={included ? "입력 중" : "입력 안 함"} muted={!included} />
        <ToggleSwitch checked={included} onClick={onToggle} />
      </div>
      {included && children}
    </section>
  );
}

function CardTitle({ title, status, muted = false }: { title: string; status: string; muted?: boolean }) {
  return (
    <div className="mb-3 flex min-w-0 items-baseline gap-2">
      <h3
        className="shrink-0 text-[15px] font-bold leading-none"
        style={{
          color: muted ? "rgba(106,30,58,0.5)" : PLUM,
          fontFamily: "'Nanum Myeongjo', serif",
        }}
      >
        {title}
      </h3>
      <span
        className="truncate text-[10px]"
        style={{ color: muted ? "rgba(184,134,70,0.55)" : GOLD }}
      >
        {status}
      </span>
    </div>
  );
}

function ToggleSwitch({ checked, onClick }: { checked: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={checked}
      className="relative h-7 w-12 shrink-0 rounded-full transition-all"
      style={{ background: checked ? `linear-gradient(135deg, ${THREAD}, ${PLUM})` : "rgba(212,169,107,0.3)" }}
    >
      <span
        className="absolute top-1 h-5 w-5 rounded-full bg-white transition-all"
        style={{
          left: checked ? "calc(100% - 24px)" : "4px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }}
      />
    </button>
  );
}

function PersonCardBody({
  person,
  onChange,
  extra,
}: {
  person: PersonForm;
  onChange: (person: Partial<PersonForm>) => void;
  extra?: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <input
        type="text"
        value={person.name}
        onChange={(event) => onChange({ name: event.target.value })}
        placeholder="이름 또는 호칭"
        className="w-full rounded-md px-3 py-2.5 text-[14px] outline-none"
        style={inputStyle}
      />

      {extra}

      <div>
        <div className="mb-1 text-[12px] font-bold" style={{ color: PLUM }}>
          양력/음력
        </div>
        <div className="grid grid-cols-2 gap-2">
          {["양력", "음력"].map((calendar) => (
            <button
              key={calendar}
              type="button"
              onClick={() => onChange({ calendar })}
              className="rounded-md py-2 text-[13px] transition"
              style={segmentStyle(person.calendar === calendar)}
            >
              {calendar}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-1 text-[12px] font-bold" style={{ color: PLUM }}>
          생년월일
        </div>
        <div className="grid grid-cols-3 gap-2">
          <input
            placeholder="YYYY"
            maxLength={4}
            value={person.year}
            onChange={(event) => onChange({ year: event.target.value.replace(/\D/g, "") })}
            className="min-w-0 rounded-md px-2 py-2.5 text-center text-[14px] outline-none"
            style={inputStyle}
          />
          <input
            placeholder="MM"
            maxLength={2}
            value={person.month}
            onChange={(event) => onChange({ month: event.target.value.replace(/\D/g, "") })}
            className="min-w-0 rounded-md px-2 py-2.5 text-center text-[14px] outline-none"
            style={inputStyle}
          />
          <input
            placeholder="DD"
            maxLength={2}
            value={person.day}
            onChange={(event) => onChange({ day: event.target.value.replace(/\D/g, "") })}
            className="min-w-0 rounded-md px-2 py-2.5 text-center text-[14px] outline-none"
            style={inputStyle}
          />
        </div>
      </div>

      <div>
        <div className="mb-1 text-[12px] font-bold" style={{ color: PLUM }}>
          출생 시간
        </div>
        <select
          value={person.hour}
          onChange={(event) => onChange({ hour: event.target.value })}
          className="w-full rounded-md px-3 py-2.5 text-[14px] outline-none"
          style={inputStyle}
        >
          {HOURS.map((hour) => (
            <option key={hour} value={hour}>
              {hour}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function segmentStyle(active: boolean): React.CSSProperties {
  return {
    background: active ? `${THREAD}15` : "rgba(255,255,255,0.7)",
    border: `1.5px solid ${active ? THREAD : "rgba(212,169,107,0.5)"}`,
    color: active ? PLUM : "#1a0a14",
    fontWeight: active ? 700 : 400,
  };
}

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.7)",
  border: "1px solid rgba(212,169,107,0.5)",
  color: "#1a0a14",
};
