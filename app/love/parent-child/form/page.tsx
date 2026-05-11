"use client";
import { useState } from "react";
import Link from "next/link";

const HOURS = [
  "시간 모름",
  "자시 (23:30~01:29)", "축시 (01:30~03:29)", "인시 (03:30~05:29)",
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
  calendar: string;
}

const emptyPerson: PersonForm = {
  name: "", year: "", month: "", day: "",
  hour: "시간 모름", calendar: "양력",
};

function isPersonComplete(p: PersonForm) {
  return p.name.trim() && p.year && p.month && p.day;
}

function calcAge(year: string, month: string, day: string): number | null {
  const y = parseInt(year), m = parseInt(month), d = parseInt(day);
  if (!y || !m || !d) return null;
  const now = new Date();
  let age = now.getFullYear() - y;
  const beforeBirthday =
    now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d);
  if (beforeBirthday) age -= 1;
  return age < 0 ? 0 : age;
}

export default function LoveParentChildForm() {
  const [child, setChild] = useState<PersonForm & { gender: string }>({ ...emptyPerson, gender: "" });
  const [mom, setMom] = useState<PersonForm>({ ...emptyPerson });
  const [dad, setDad] = useState<PersonForm>({ ...emptyPerson });
  const [includeMom, setIncludeMom] = useState(true);
  const [includeDad, setIncludeDad] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const childAge = calcAge(child.year, child.month, child.day);
  const childAgeOk = childAge === null || childAge <= 19;
  const childOk = isPersonComplete(child) && child.gender && childAgeOk;
  const momOk = !includeMom || isPersonComplete(mom);
  const dadOk = !includeDad || isPersonComplete(dad);
  const parentOk = includeMom || includeDad;
  const canSubmit = childOk && momOk && dadOk && parentOk;

  function handleSubmit() {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    const params: Record<string, string> = {
      childName: child.name.trim(),
      childGender: child.gender,
      childYear: child.year,
      childMonth: child.month,
      childDay: child.day,
      childHour: child.hour,
      childCalendar: child.calendar,
    };
    if (includeMom) {
      params.momName = mom.name.trim();
      params.momYear = mom.year;
      params.momMonth = mom.month;
      params.momDay = mom.day;
      params.momHour = mom.hour;
      params.momCalendar = mom.calendar;
    }
    if (includeDad) {
      params.dadName = dad.name.trim();
      params.dadYear = dad.year;
      params.dadMonth = dad.month;
      params.dadDay = dad.day;
      params.dadHour = dad.hour;
      params.dadCalendar = dad.calendar;
    }
    window.location.href = `/love/parent-child/result?${new URLSearchParams(params).toString()}`;
  }

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
        <div className="flex items-center justify-between mb-6">
          <Link href="/love/parent-child" className="text-[13px]" style={{ color: PLUM, fontFamily: "'Cormorant Garamond', serif" }}>
            ← 돌아가기
          </Link>
          <div className="text-[10px] tracking-[0.4em]" style={{ color: GOLD, fontFamily: "'Cormorant Garamond', serif" }}>
            紅 絲
          </div>
        </div>

        <div className="text-center mb-8">
          <div className="text-[10px] tracking-[0.4em] mb-2" style={{ color: GOLD, fontFamily: "'Cormorant Garamond', serif" }}>
            부모와 자녀궁합 · 가족 인연 풀이
          </div>
          <h1 className="text-[22px] font-bold" style={{ color: PLUM, fontFamily: "'Nanum Myeongjo', serif" }}>
            가족의 결을 풀어드리겠습니다
          </h1>
          <p className="text-[12px] mt-3 leading-[1.65]" style={{ color: "#5a3c4a", fontFamily: "'Gowun Batang', serif" }}>
            자녀와 함께 풀이할 부모님을 <strong style={{ color: THREAD }}>한 분 또는 두 분</strong> 입력해주세요.<br />
            두 분 모두 입력하시면 더 깊은 가족 인연 풀이를 받으실 수 있습니다.<br />
            <span style={{ color: GOLD }}>※ 자녀는 만 19세 이하만 풀이 가능합니다</span>
          </p>
        </div>

        {/* 자녀 카드 */}
        <PersonCard
          label="자녀"
          sublabel="필수"
          person={child}
          onChange={(p) => setChild((c) => ({ ...c, ...p }))}
          extra={
            <div className="flex gap-2 mb-3">
              <p className="text-[12px] self-center font-bold" style={{ color: PLUM }}>성별</p>
              {[["남", "아들"], ["여", "딸"]].map(([val, lbl]) => (
                <button key={val} type="button" onClick={() => setChild((c) => ({ ...c, gender: val }))}
                  className="px-4 py-1.5 rounded-md text-[12px] transition-all"
                  style={{
                    background: child.gender === val ? `linear-gradient(135deg, ${THREAD}1a, ${PLUM}10)` : "rgba(255,255,255,0.7)",
                    border: `1.5px solid ${child.gender === val ? THREAD : "rgba(212,169,107,0.5)"}`,
                    color: child.gender === val ? PLUM : "#1a0a14",
                    fontWeight: child.gender === val ? 700 : 400,
                  }}>
                  {lbl}
                </button>
              ))}
            </div>
          }
        />

        {/* 만 2세 미만 자녀 안내 */}
        {(() => {
          const y = parseInt(child.year || "0") || 0;
          const m = parseInt(child.month || "1") || 1;
          const dd = parseInt(child.day || "1") || 1;
          if (!y) return null;
          const now = new Date();
          const months = (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m) - (now.getDate() < dd ? 1 : 0);
          if (months >= 24 || months < 0) return null;
          return (
            <div className="rounded-md p-3 mb-4 text-[12px] leading-[1.6]"
              style={{
                background: "rgba(200,32,58,0.08)",
                border: "1px dashed rgba(200,32,58,0.4)",
                color: "#1a0a14",
              }}>
              💡 <strong style={{ color: PLUM }}>만 2세 미만 자녀는 사주의 결이 행동에 본격 발현되기 전입니다.</strong><br />
              지금은 <strong>&quot;타고난 결의 큰 그림&quot;을 미리 보고 부모님의 양육 가이드로 활용</strong>하시는 용도로 권장드립니다.
              본격적인 풀이는 만 2~3세 이후 다시 받아보시면 더 깊이 있는 결과를 보실 수 있습니다.
            </div>
          );
        })()}

        <ToggleCard title="엄마" included={includeMom} onToggle={() => setIncludeMom((v) => !v)}>
          {includeMom && (
            <PersonCard label="" sublabel="" person={mom} onChange={(p) => setMom((m) => ({ ...m, ...p }))} inline />
          )}
        </ToggleCard>

        <ToggleCard title="아빠" included={includeDad} onToggle={() => setIncludeDad((v) => !v)}>
          {includeDad && (
            <PersonCard label="" sublabel="" person={dad} onChange={(p) => setDad((d) => ({ ...d, ...p }))} inline />
          )}
        </ToggleCard>

        {childAge !== null && childAge > 19 && (
          <p className="text-[12px] text-center mb-3" style={{ color: "#c8203a", fontWeight: 700 }}>
            부모와 자녀궁합 풀이는 만 19세 이하 자녀만 가능해요 (현재 만 {childAge}세)
          </p>
        )}
        {!parentOk && (
          <p className="text-[12px] text-center mb-3" style={{ color: "#c8203a", fontWeight: 700 }}>
            엄마 또는 아빠 중 한 분 이상 입력해주세요
          </p>
        )}

        <button onClick={handleSubmit} disabled={!canSubmit || submitting}
          className="w-full py-4 rounded-md text-[15px] font-bold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: canSubmit && !submitting ? `${THREAD}22` : "rgba(212,169,107,0.2)",
            color: canSubmit && !submitting ? THREAD : GOLD,
            fontFamily: "'Gowun Batang', serif",
            letterSpacing: "0.05em",
            border: canSubmit && !submitting ? `1.5px solid ${THREAD}55` : "1.5px solid transparent",
          }}>
          가족 인연 풀이 시작 ›
        </button>

        <div className="text-[11px] text-center mt-4" style={{ color: GOLD, fontFamily: "'Cormorant Garamond', serif" }}>
          ─ 紅 絲 · 부모와 자녀의 결 ─
        </div>
      </div>
    </div>
  );
}

function PersonCard({
  label, sublabel, person, onChange, extra, inline,
}: {
  label: string; sublabel: string;
  person: PersonForm;
  onChange: (p: Partial<PersonForm>) => void;
  extra?: React.ReactNode;
  inline?: boolean;
}) {
  const wrapStyle = inline ? {} : {
    background: "linear-gradient(180deg, rgba(255,251,247,0.95), rgba(253,243,232,0.85))",
    border: "1px solid rgba(212,169,107,0.4)",
  };
  return (
    <div className={inline ? "space-y-3" : "rounded-md p-5 mb-4 space-y-3"} style={wrapStyle}>
      {label && (
        <div className="flex items-baseline gap-2 mb-2">
          <h3 className="text-[15px] font-bold" style={{ color: PLUM, fontFamily: "'Nanum Myeongjo', serif" }}>{label}</h3>
          {sublabel && (
            <span className="text-[10px] px-2 py-0.5 rounded-full"
              style={{ background: `${THREAD}15`, color: THREAD, border: `1px solid ${THREAD}55`, fontWeight: 700 }}>
              {sublabel}
            </span>
          )}
        </div>
      )}
      <input
        type="text"
        value={person.name}
        onChange={(e) => onChange({ name: e.target.value })}
        placeholder="이름 (또는 태명)"
        className="w-full rounded-md px-3 py-2.5 text-[14px] outline-none"
        style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(212,169,107,0.5)", color: "#1a0a14" }}
      />
      {extra}
      <div>
        <div className="text-[12px] font-bold mb-1" style={{ color: PLUM }}>달력</div>
        <div className="flex gap-2">
          {["양력", "음력"].map((c) => (
            <button key={c} type="button" onClick={() => onChange({ calendar: c })}
              className="flex-1 py-2 rounded-md text-[13px] transition"
              style={{
                background: person.calendar === c ? `${THREAD}15` : "rgba(255,255,255,0.7)",
                border: `1px solid ${person.calendar === c ? THREAD : "rgba(212,169,107,0.4)"}`,
                color: person.calendar === c ? PLUM : "#5a3c4a",
                fontWeight: person.calendar === c ? 700 : 400,
              }}>
              {c}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="text-[12px] font-bold mb-1" style={{ color: PLUM }}>생년월일</div>
        <div className="grid grid-cols-3 gap-2">
          <input placeholder="YYYY" maxLength={4} value={person.year}
            onChange={(e) => onChange({ year: e.target.value.replace(/\D/g, "") })}
            className="px-3 py-2.5 rounded-md text-[14px] text-center outline-none"
            style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(212,169,107,0.5)", color: "#1a0a14" }} />
          <input placeholder="MM" maxLength={2} value={person.month}
            onChange={(e) => onChange({ month: e.target.value.replace(/\D/g, "") })}
            className="px-3 py-2.5 rounded-md text-[14px] text-center outline-none"
            style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(212,169,107,0.5)", color: "#1a0a14" }} />
          <input placeholder="DD" maxLength={2} value={person.day}
            onChange={(e) => onChange({ day: e.target.value.replace(/\D/g, "") })}
            className="px-3 py-2.5 rounded-md text-[14px] text-center outline-none"
            style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(212,169,107,0.5)", color: "#1a0a14" }} />
        </div>
      </div>
      <div>
        <div className="text-[12px] font-bold mb-1" style={{ color: PLUM }}>출생 시간</div>
        <select value={person.hour} onChange={(e) => onChange({ hour: e.target.value })}
          className="w-full rounded-md px-3 py-2.5 text-[14px] outline-none"
          style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(212,169,107,0.5)", color: "#1a0a14" }}>
          {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
        </select>
      </div>
    </div>
  );
}

function ToggleCard({
  title, included, onToggle, children,
}: {
  title: string;
  included: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md p-5 mb-4"
      style={{
        background: included
          ? "linear-gradient(180deg, rgba(255,251,247,0.95), rgba(253,243,232,0.85))"
          : "rgba(255,255,255,0.5)",
        border: `1px solid ${included ? "rgba(212,169,107,0.4)" : "rgba(212,169,107,0.2)"}`,
      }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-baseline gap-2">
          <h3 className="text-[15px] font-bold" style={{ color: included ? PLUM : "rgba(106,30,58,0.5)", fontFamily: "'Nanum Myeongjo', serif" }}>
            {title}
          </h3>
          <span className="text-[10px]" style={{ color: included ? GOLD : "rgba(184,134,70,0.5)" }}>
            {included ? "입력 중" : "입력 안 함"}
          </span>
        </div>
        <button type="button" onClick={onToggle}
          className="relative w-11 h-6 rounded-full transition-all"
          style={{
            background: included ? `linear-gradient(135deg, ${THREAD}, ${PLUM})` : "rgba(212,169,107,0.3)",
          }}>
          <span className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
            style={{
              left: included ? "calc(100% - 22px)" : "2px",
              background: "#fff",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            }} />
        </button>
      </div>
      {children}
    </div>
  );
}
