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

const ACCENT = "#f0a8b8";
const GOLD = "#FFD700";
const BG = "#2a1a1d";

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

// 만 나이 계산
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

export default function ParentChildForm() {
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
    window.location.href = `/parent-child/result?${new URLSearchParams(params).toString()}`;
  }

  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(180deg, ${BG} 0%, #150810 100%)` }}>
      <main className="w-full max-w-[430px] mx-auto min-h-screen flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ borderBottom: `1px solid ${ACCENT}18` }}>
          <Link href="/parent-child" className="text-sm" style={{ color: `${ACCENT}66` }}>←</Link>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ backgroundColor: `${ACCENT}22`, color: ACCENT }}>慈</div>
          <div>
            <div className="text-sm font-bold text-white">자도인</div>
            <div className="text-[10px]" style={{ color: `${ACCENT}77` }}>가족 인연 풀이</div>
          </div>
        </div>

        <div className="flex-1 px-4 py-5 space-y-5">
          <div className="text-center space-y-1">
            <h1 className="text-base font-bold text-white">가족의 결을 풀어드리겠습니다</h1>
            <p className="text-[12px] leading-relaxed" style={{ color: `${ACCENT}aa` }}>
              자녀와 함께 풀이할 부모님을 <strong style={{ color: GOLD }}>한 분 또는 두 분</strong> 입력해주세요.
              <br />두 분 모두 입력하시면 더 깊은 가족 인연 풀이를 받으실 수 있습니다.
              <br /><span style={{ color: `${ACCENT}77` }}>※ 자녀는 만 19세 이하만 풀이 가능합니다</span>
            </p>
          </div>

          {/* 자녀 카드 — 항상 펼침 */}
          <PersonCard
            label="자녀"
            sublabel="필수"
            color={GOLD}
            person={child}
            onChange={(p) => setChild((c) => ({ ...c, ...p }))}
            extra={
              <div className="flex gap-2 mb-3">
                <p className="text-[12px] self-center" style={{ color: "rgba(255,255,255,0.7)" }}>성별</p>
                {[["남", "아들"], ["여", "딸"]].map(([val, lbl]) => (
                  <button key={val} type="button" onClick={() => setChild((c) => ({ ...c, gender: val }))}
                    className="px-4 py-1.5 rounded-lg text-[12px] font-medium transition-all"
                    style={{
                      backgroundColor: child.gender === val ? `${GOLD}33` : `${ACCENT}15`,
                      color: child.gender === val ? GOLD : "rgba(255,255,255,0.85)",
                      border: `1px solid ${child.gender === val ? `${GOLD}88` : `${ACCENT}33`}`,
                    }}>
                    {lbl}
                  </button>
                ))}
              </div>
            }
          />

          {/* 만 2세 미만 자녀 — 미발현 단계 안내 */}
          {(() => {
            const y = parseInt(child.year || "0") || 0;
            const m = parseInt(child.month || "1") || 1;
            const dd = parseInt(child.day || "1") || 1;
            if (!y) return null;
            const now = new Date();
            const months = (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m) - (now.getDate() < dd ? 1 : 0);
            if (months >= 24 || months < 0) return null;
            return (
              <div
                className="rounded-xl p-3 mb-3 text-[12px] leading-relaxed"
                style={{
                  backgroundColor: "rgba(240, 168, 184, 0.10)",
                  border: "1px solid rgba(240, 168, 184, 0.35)",
                  color: "rgba(255,255,255,0.85)",
                }}
              >
                💡 <strong>만 2세 미만 자녀는 사주의 결이 행동에 본격 발현되기 전입니다.</strong>
                <br />
                지금은 <strong>&quot;타고난 결의 큰 그림&quot;을 미리 보고 부모님의 양육 가이드로 활용</strong>하시는 용도로 권장드립니다.
                본격적인 풀이는 만 2~3세 이후 다시 받아보시면 더 깊이 있는 결과를 보실 수 있습니다.
              </div>
            );
          })()}

          {/* 엄마 카드 — 토글 */}
          <ToggleCard
            title="엄마"
            included={includeMom}
            onToggle={() => setIncludeMom((v) => !v)}
            color="#f0a8b8"
          >
            {includeMom && (
              <PersonCard
                label="" sublabel="" color={ACCENT}
                person={mom}
                onChange={(p) => setMom((m) => ({ ...m, ...p }))}
                inline
              />
            )}
          </ToggleCard>

          {/* 아빠 카드 — 토글 */}
          <ToggleCard
            title="아빠"
            included={includeDad}
            onToggle={() => setIncludeDad((v) => !v)}
            color="#7eb6ff"
          >
            {includeDad && (
              <PersonCard
                label="" sublabel="" color="#7eb6ff"
                person={dad}
                onChange={(p) => setDad((d) => ({ ...d, ...p }))}
                inline
              />
            )}
          </ToggleCard>

          {childAge !== null && childAge > 19 && (
            <p className="text-[12px] text-center" style={{ color: "#ff8a8a" }}>
              자도인은 만 19세 이하 자녀의 가족 인연만 풀어드립니다 (현재 만 {childAge}세)
            </p>
          )}
          {!parentOk && (
            <p className="text-[12px] text-center" style={{ color: "#ff8a8a" }}>
              엄마 또는 아빠 중 한 분 이상 입력해주세요
            </p>
          )}

          {/* 풀이 시작 버튼 */}
          <button onClick={handleSubmit} disabled={!canSubmit || submitting}
            className="w-full py-4 rounded-2xl text-base font-bold tracking-widest transition-all active:scale-95"
            style={{
              background: canSubmit && !submitting
                ? "linear-gradient(135deg, #FFE066 0%, #FFD700 40%, #FFA800 100%)"
                : `${GOLD}33`,
              color: "#1a0d00",
              boxShadow: canSubmit && !submitting ? `0 0 24px ${GOLD}77` : "none",
              opacity: canSubmit && !submitting ? 1 : 0.5,
            }}>
            🌸{"  "}가족 인연 풀이 시작
          </button>
        </div>
      </main>
    </div>
  );
}

// ── 인물 카드 (이름·생년월일·시) ──
function PersonCard({
  label, sublabel, color, person, onChange, extra, inline,
}: {
  label: string; sublabel: string; color: string;
  person: PersonForm;
  onChange: (p: Partial<PersonForm>) => void;
  extra?: React.ReactNode;
  inline?: boolean;
}) {
  return (
    <div
      className={inline ? "" : "rounded-2xl p-4 space-y-3"}
      style={inline ? {} : {
        backgroundColor: `${color}10`,
        border: `1px solid ${color}33`,
      }}
    >
      {label && (
        <div className="flex items-baseline gap-2">
          <h3 className="text-[15px] font-bold" style={{ color }}>{label}</h3>
          {sublabel && (
            <span className="text-[10px] px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${color}22`, color }}>
              {sublabel}
            </span>
          )}
        </div>
      )}
      {/* 이름 */}
      <input
        type="text"
        value={person.name}
        onChange={(e) => onChange({ name: e.target.value })}
        placeholder="이름 (또는 태명)"
        className="w-full rounded-lg px-3 py-2.5 text-white text-[14px] outline-none"
        style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${color}44` }}
      />
      {extra}
      {/* 양력/음력 */}
      <div className="flex gap-3 text-[13px]">
        {["양력", "음력"].map((c) => (
          <button key={c} type="button" onClick={() => onChange({ calendar: c })}
            className="flex items-center gap-1"
            style={{ color: person.calendar === c ? GOLD : `${color}99` }}>
            {person.calendar === c ? "✓" : "○"} {c}
          </button>
        ))}
      </div>
      {/* 생년월일 */}
      <div className="flex gap-2">
        <input placeholder="년" maxLength={4} value={person.year}
          onChange={(e) => onChange({ year: e.target.value.replace(/\D/g, "") })}
          className="flex-1 px-3 py-2 text-white text-[14px] text-center outline-none rounded-lg"
          style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${color}44` }} />
        <input placeholder="월" maxLength={2} value={person.month}
          onChange={(e) => onChange({ month: e.target.value.replace(/\D/g, "") })}
          className="w-16 px-2 py-2 text-white text-[14px] text-center outline-none rounded-lg"
          style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${color}44` }} />
        <input placeholder="일" maxLength={2} value={person.day}
          onChange={(e) => onChange({ day: e.target.value.replace(/\D/g, "") })}
          className="w-16 px-2 py-2 text-white text-[14px] text-center outline-none rounded-lg"
          style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${color}44` }} />
      </div>
      {/* 시간 */}
      <select
        value={person.hour}
        onChange={(e) => onChange({ hour: e.target.value })}
        className="w-full rounded-lg px-3 py-2 text-white text-[13px] outline-none"
        style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${color}44` }}
      >
        {HOURS.map((h) => (
          <option key={h} value={h} style={{ background: "#2a1a1d" }}>{h}</option>
        ))}
      </select>
    </div>
  );
}

// ── 토글 카드 (엄마·아빠) ──
function ToggleCard({
  title, included, onToggle, color, children,
}: {
  title: string;
  included: boolean;
  onToggle: () => void;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl p-4 space-y-3"
      style={{
        backgroundColor: included ? `${color}10` : "rgba(255,255,255,0.02)",
        border: `1px solid ${included ? `${color}44` : "rgba(255,255,255,0.08)"}`,
      }}>
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <h3 className="text-[15px] font-bold" style={{ color: included ? color : "rgba(255,255,255,0.5)" }}>
            {title}
          </h3>
          <span className="text-[10px]" style={{ color: included ? `${color}99` : "rgba(255,255,255,0.4)" }}>
            {included ? "입력 중" : "입력 안 함"}
          </span>
        </div>
        <button type="button" onClick={onToggle}
          className="relative w-11 h-6 rounded-full transition-all"
          style={{
            backgroundColor: included ? color : "rgba(255,255,255,0.15)",
          }}>
          <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
            style={{ left: included ? "calc(100% - 22px)" : "2px" }} />
        </button>
      </div>
      {children}
    </div>
  );
}
