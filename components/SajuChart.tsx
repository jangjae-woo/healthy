"use client";
import { SajuAnalysis, STEM_HANJA, BRANCH_HANJA, SIPSEONG_COLOR, SINSAL_INFO } from "@/lib/saju-calculator";

interface Props {
  data: SajuAnalysis;
  accent: string;
}

export default function SajuChart({ data, accent }: Props) {
  const { pillars, sipseong, elements, daeun, sinsal, yongsin, isHourUnknown } = data;

  const cols = [
    { label: '시(時)', pillar: pillars.hour, ss: sipseong.hour, empty: isHourUnknown },
    { label: '일(日)', pillar: pillars.day,  ss: sipseong.day,  empty: false },
    { label: '월(月)', pillar: pillars.month,ss: sipseong.month,empty: false },
    { label: '연(年)', pillar: pillars.year, ss: sipseong.year, empty: false },
  ];

  const totalElems = Object.values(elements).reduce((a, b) => a + b, 0) || 1;
  const ELEM_COLORS: Record<string, string> = {
    목: '#22c55e', 화: '#ef4444', 토: '#f59e0b', 금: '#94a3b8', 수: '#60a5fa',
  };

  return (
    <div className="w-full max-w-sm space-y-4">

      {/* ── 사주원국 표 ── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: `1px solid ${accent}33`, backgroundColor: `${accent}08` }}
      >
        <div className="text-center text-xs py-2" style={{ color: `${accent}88`, borderBottom: `1px solid ${accent}22` }}>
          사주원국 (四柱原局)
        </div>
        <table className="w-full text-center text-xs">
          <thead>
            <tr>
              {cols.map(c => (
                <th key={c.label} className="py-2 font-normal" style={{ color: `${accent}77`, width: '25%' }}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* 천간 */}
            <tr style={{ borderTop: `1px solid ${accent}15` }}>
              {cols.map(c => (
                <td key={c.label} className="py-2">
                  {c.empty || !c.pillar ? (
                    <span style={{ color: `${accent}44` }}>─</span>
                  ) : (
                    <div>
                      <div className="text-base font-bold" style={{ color: accent }}>
                        {STEM_HANJA[c.pillar.stem as keyof typeof STEM_HANJA] ?? c.pillar.stem}
                      </div>
                      <div className="text-[10px]" style={{ color: `${accent}88` }}>
                        {c.pillar.stem}
                      </div>
                    </div>
                  )}
                </td>
              ))}
            </tr>
            {/* 천간 십성 */}
            <tr style={{ borderTop: `1px solid ${accent}10`, backgroundColor: `${accent}06` }}>
              {cols.map((c, i) => (
                <td key={c.label} className="py-1">
                  {c.empty || !c.ss ? (
                    <span style={{ color: `${accent}33` }}>─</span>
                  ) : (
                    <span
                      className="text-[10px] font-medium px-1 py-0.5 rounded"
                      style={{
                        color: i === 1 ? accent : (SIPSEONG_COLOR[c.ss.stem] ?? `${accent}99`),
                        backgroundColor: i === 1 ? `${accent}22` : 'transparent',
                      }}
                    >
                      {i === 1 ? '일간' : c.ss.stem}
                    </span>
                  )}
                </td>
              ))}
            </tr>
            {/* 지지 */}
            <tr style={{ borderTop: `1px solid ${accent}20` }}>
              {cols.map(c => (
                <td key={c.label} className="py-2">
                  {c.empty || !c.pillar ? (
                    <span style={{ color: `${accent}44` }}>─</span>
                  ) : (
                    <div>
                      <div className="text-base font-bold text-white">
                        {BRANCH_HANJA[c.pillar.branch as keyof typeof BRANCH_HANJA] ?? c.pillar.branch}
                      </div>
                      <div className="text-[10px]" style={{ color: `${accent}88` }}>
                        {c.pillar.branch}
                      </div>
                    </div>
                  )}
                </td>
              ))}
            </tr>
            {/* 지지 십성 */}
            <tr style={{ borderTop: `1px solid ${accent}10`, backgroundColor: `${accent}06` }}>
              {cols.map((c) => (
                <td key={c.label} className="py-1">
                  {c.empty || !c.ss ? (
                    <span style={{ color: `${accent}33` }}>─</span>
                  ) : (
                    <span
                      className="text-[10px] font-medium"
                      style={{ color: SIPSEONG_COLOR[c.ss.branch] ?? `${accent}77` }}
                    >
                      {c.ss.branch}
                    </span>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── 오행 분포 ── */}
      <div
        className="rounded-2xl p-4"
        style={{ border: `1px solid ${accent}33`, backgroundColor: `${accent}08` }}
      >
        <div className="text-xs mb-3 text-center" style={{ color: `${accent}88` }}>
          오행 분포 · 용신: <span className="font-bold" style={{ color: accent }}>
            {yongsin}({
              yongsin === '목' ? '木' : yongsin === '화' ? '火' :
              yongsin === '토' ? '土' : yongsin === '금' ? '金' : '水'
            })
          </span>
        </div>
        <div className="space-y-1.5">
          {Object.entries(elements).map(([el, count]) => (
            <div key={el} className="flex items-center gap-2 text-xs">
              <span className="w-5 text-right" style={{ color: ELEM_COLORS[el] }}>
                {el === '목' ? '木' : el === '화' ? '火' : el === '토' ? '土' : el === '금' ? '金' : '水'}
              </span>
              <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: `${accent}15` }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(count / totalElems) * 100}%`,
                    backgroundColor: ELEM_COLORS[el],
                    opacity: count === 0 ? 0.2 : 1,
                  }}
                />
              </div>
              <span style={{ color: count === 0 ? `${accent}33` : 'white' }}>
                {count}
              </span>
              {el === yongsin && (
                <span className="text-[10px]" style={{ color: accent }}>용신</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── 신살 ── */}
      {sinsal.length > 0 && (
        <div
          className="rounded-2xl p-4"
          style={{ border: `1px solid ${accent}33`, backgroundColor: `${accent}08` }}
        >
          <div className="text-xs mb-3 text-center" style={{ color: `${accent}88` }}>신살(神殺)</div>
          <div className="space-y-2">
            {sinsal.map(s => {
              const info = SINSAL_INFO[s];
              return (
                <div key={s} className="flex items-start gap-2">
                  <span className="text-base">{info?.icon ?? '•'}</span>
                  <div>
                    <div className="text-xs font-bold" style={{ color: accent }}>{s}</div>
                    <div className="text-[11px] text-white/70 leading-relaxed">{info?.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 대운표 ── */}
      <div
        className="rounded-2xl p-4"
        style={{ border: `1px solid ${accent}33`, backgroundColor: `${accent}08` }}
      >
        <div className="text-xs mb-3 text-center" style={{ color: `${accent}88` }}>
          대운 흐름 ({daeun.direction} · {daeun.number}세 시작)
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {daeun.cycles.slice(0, 8).map((c) => (
            <div
              key={c.age}
              className="text-center py-2 rounded-xl"
              style={{ backgroundColor: `${accent}12`, border: `1px solid ${accent}22` }}
            >
              <div className="text-[10px] mb-0.5" style={{ color: `${accent}66` }}>
                {c.age}세
              </div>
              <div className="text-sm font-bold" style={{ color: accent }}>
                {STEM_HANJA[c.stem as keyof typeof STEM_HANJA] ?? c.stem}
                {BRANCH_HANJA[c.branch as keyof typeof BRANCH_HANJA] ?? c.branch}
              </div>
              <div className="text-[10px]" style={{ color: `${accent}77` }}>
                {c.ganji}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
