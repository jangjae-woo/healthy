"use client";
import { Suspense, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { STEM_HANJA, BRANCH_HANJA, type SajuAnalysis, type CompatibilityResult } from "@/lib/saju-calculator";

const ACCENT = "#d4a8e8";
const BG = "#1a0f20";
const BRIGHT = "#f0c040";

const STEM_EL: Record<string,string> = {
  갑:'목',을:'목',병:'화',정:'화',무:'토',기:'토',경:'금',신:'금',임:'수',계:'수',
};
const BRANCH_EL: Record<string,string> = {
  자:'수',축:'토',인:'목',묘:'목',진:'토',사:'화',오:'화',미:'토',신:'금',유:'금',술:'토',해:'수',
};
const ELEM_COLORS: Record<string,string> = {
  목:'#22c55e', 화:'#ef4444', 토:'#f59e0b', 금:'#94a3b8', 수:'#60a5fa',
};

function PillarCard({ name, saju }: { name: string; saju: SajuAnalysis }) {
  const cols = [
    { label: '연주', p: saju.pillars.year },
    { label: '월주', p: saju.pillars.month },
    { label: '일주', p: saju.pillars.day, isDay: true },
    { label: '시주', p: saju.pillars.hour, isDay: false },
  ];
  return (
    <div className="rounded-xl p-3"
      style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }}>
      <p className="text-xs font-bold mb-2 text-center" style={{ color: ACCENT }}>{name}</p>
      <div className="grid grid-cols-4 gap-1.5">
        {cols.map(c => (
          <div key={c.label} className="text-center py-2 rounded-lg"
            style={{
              backgroundColor: c.isDay ? `${ACCENT}1a` : 'transparent',
              border: c.isDay ? `1px solid ${ACCENT}66` : '1px solid rgba(255,255,255,0.08)',
            }}>
            <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.55)' }}>{c.label}</div>
            {c.p ? (
              <>
                <div className="text-base font-bold leading-tight mt-1"
                  style={{ color: ELEM_COLORS[STEM_EL[c.p.stem] ?? ''] ?? BRIGHT }}>
                  {STEM_HANJA[c.p.stem as keyof typeof STEM_HANJA] ?? c.p.stem}
                </div>
                <div className="text-base font-bold leading-tight"
                  style={{ color: ELEM_COLORS[BRANCH_EL[c.p.branch] ?? ''] ?? 'white' }}>
                  {BRANCH_HANJA[c.p.branch as keyof typeof BRANCH_HANJA] ?? c.p.branch}
                </div>
              </>
            ) : (
              <div className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.30)' }}>─</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoreGauge({ score, label }: { score: number; label: string }) {
  const color = score >= 85 ? '#ff6b9d' : score >= 70 ? '#d4a8e8' : score >= 55 ? '#f0c040' : '#94a3b8';
  return (
    <div className="text-center py-4">
      <div className="relative w-36 h-36 mx-auto">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
          <circle cx="60" cy="60" r="52" fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${(score / 100) * 326.7} 326.7`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-4xl font-bold" style={{ color }}>{score}</div>
          <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>/100</div>
        </div>
      </div>
      <p className="text-lg font-bold mt-3" style={{ color }}>{label}</p>
    </div>
  );
}

function formatText(text: string) {
  return text.split('\n').map((line, i) => {
    const l = line.trim();
    if (!l) return null;
    if (l.startsWith('### ')) {
      return <h3 key={i} className="text-base font-bold mt-5 mb-2" style={{ color: BRIGHT }}>{l.slice(4)}</h3>;
    }
    if (l.startsWith('**') && l.endsWith('**')) {
      return <p key={i} className="font-bold text-white mt-2 mb-1">{l.slice(2, -2)}</p>;
    }
    if (l.startsWith('- ')) {
      return <li key={i} className="text-sm ml-5 mb-1" style={{ color: 'rgba(255,255,255,0.85)' }}>{l.slice(2)}</li>;
    }
    return <p key={i} className="text-[15px] leading-relaxed mb-3" style={{ color: 'rgba(255,255,255,0.88)' }}>{l}</p>;
  });
}

function ResultContent() {
  const params = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [sajuA, setSajuA] = useState<SajuAnalysis | null>(null);
  const [sajuB, setSajuB] = useState<SajuAnalysis | null>(null);
  const [compat, setCompat] = useState<CompatibilityResult | null>(null);
  const [error, setError] = useState(false);
  const fetchedRef = useRef(false);

  const myName = params.get('myName') || '당신';
  const partnerName = params.get('partnerName') || '상대';

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const body: Record<string, string> = {
      type: 'matching',
      section: 'matching',
      myName, myGender: params.get('myGender') || '',
      myYear: params.get('myYear') || '', myMonth: params.get('myMonth') || '', myDay: params.get('myDay') || '',
      myHour: params.get('myHour') || '시간 모름', myCalendar: params.get('myCalendar') || '양력',
      partnerName, partnerGender: params.get('partnerGender') || '',
      partnerYear: params.get('partnerYear') || '', partnerMonth: params.get('partnerMonth') || '', partnerDay: params.get('partnerDay') || '',
      partnerHour: params.get('partnerHour') || '시간 모름', partnerCalendar: params.get('partnerCalendar') || '양력',
    };

    fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(async res => {
      if (!res.ok || !res.body) { setError(true); setLoading(false); return; }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let full = '';
      outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6);
          if (raw === '[DONE]') break outer;
          try {
            const msg = JSON.parse(raw);
            if (msg.t === 'm' && msg.d) {
              setSajuA(msg.d.sajuA);
              setSajuB(msg.d.sajuB);
              setCompat(msg.d.compat);
              setLoading(false);
            } else if (msg.t === 'x' && msg.v) {
              full += msg.v;
              setContent(full);
            }
          } catch {}
        }
      }
    }).catch(() => { setError(true); setLoading(false); });
  }, [params, myName, partnerName]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: BG }}>
        <p className="text-white/70">풀이 생성에 실패했습니다.</p>
        <Link href="/matching" className="mt-4 px-4 py-2 rounded-lg text-sm"
          style={{ backgroundColor: `${ACCENT}22`, color: ACCENT }}>← 돌아가기</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(180deg, ${BG} 0%, #0a0510 100%)` }}>
      <main className="w-full max-w-[430px] mx-auto min-h-screen flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
          style={{ borderBottom: `1px solid ${ACCENT}18` }}>
          <Link href="/matching" className="text-sm" style={{ color: `${ACCENT}88` }}>←</Link>
          <div className="text-sm font-bold text-white">월하도인의 궁합 풀이</div>
        </div>

        <div className="flex-1 px-4 py-6 space-y-4">
          {/* 이름 + 스코어 */}
          <div className="text-center">
            <div className="text-4xl mb-2" style={{ color: ACCENT, filter: `drop-shadow(0 0 12px ${ACCENT}cc)` }}>🌹</div>
            <h1 className="text-xl font-bold text-white">{myName} <span style={{ color: ACCENT }}>·</span> {partnerName}</h1>
          </div>

          {loading && !compat ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-8 h-8 rounded-full border-2 animate-spin"
                style={{ borderColor: `${ACCENT}33`, borderTopColor: ACCENT }} />
              <p className="text-sm" style={{ color: `${ACCENT}aa` }}>두 분의 인연을 풀이하는 중입니다</p>
            </div>
          ) : (
            <>
              {compat && <ScoreGauge score={compat.score} label={compat.scoreLabel} />}

              {sajuA && <PillarCard name={myName} saju={sajuA} />}
              {sajuB && <PillarCard name={partnerName} saju={sajuB} />}

              {/* 자동 지표 요약 카드 */}
              {compat && (
                <div className="rounded-xl p-4 space-y-2"
                  style={{ backgroundColor: `${ACCENT}10`, border: `1px solid ${ACCENT}33` }}>
                  <p className="text-xs font-bold" style={{ color: ACCENT }}>궁합 지표</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.75)' }}>
                    • 일간 관계: {compat.ilganRelation}
                  </p>
                  {compat.branchRelations.ilji !== '특별한 관계 없음' && (
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.75)' }}>
                      • 일지 관계: {compat.branchRelations.ilji}
                    </p>
                  )}
                  {compat.elementBalance.aHelpsB.length > 0 && (
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.75)' }}>
                      • 당신이 보충하는 기운: {compat.elementBalance.aHelpsB.join('·')}
                    </p>
                  )}
                  {compat.elementBalance.bHelpsA.length > 0 && (
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.75)' }}>
                      • 상대가 보충하는 기운: {compat.elementBalance.bHelpsA.join('·')}
                    </p>
                  )}
                </div>
              )}

              {/* AI 풀이 */}
              {content && (
                <div className="rounded-xl p-4"
                  style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)' }}>
                  {formatText(content)}
                </div>
              )}

              {!content && compat && (
                <div className="flex gap-1.5 justify-center items-center py-4">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full animate-bounce"
                      style={{ backgroundColor: ACCENT, animationDelay: `${i * 150}ms` }} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-4 py-6">
          <Link href="/" className="block text-center py-3 rounded-xl text-sm"
            style={{ backgroundColor: `${ACCENT}18`, color: ACCENT, border: `1px solid ${ACCENT}44` }}>
            처음으로
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function MatchingResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: `${ACCENT}33`, borderTopColor: ACCENT }} />
      </div>
    }>
      <ResultContent />
    </Suspense>
  );
}
