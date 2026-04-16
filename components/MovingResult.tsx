"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const ACCENT = "#5ec98e";
const BG = "#0a1e14";

interface Section { heading: string; content: string; }

function parseSections(text: string): Section[] {
  const parts = text.split(/(?=\n### |\A### )/).filter(Boolean);
  const result: Section[] = [];

  // Handle leading text before first ###
  const firstHash = text.indexOf('\n### ');
  if (firstHash > 0) {
    const leading = text.slice(0, firstHash).trim();
    if (leading) result.push({ heading: '', content: leading });
  }

  const hashParts = text.split(/\n(?=### )/);
  for (const part of hashParts) {
    const m = part.match(/^### (.+?)\n([\s\S]*)/);
    if (m) result.push({ heading: m[1].trim(), content: m[2].trim() });
  }

  return result.length ? result : [];
}

function renderLine(line: string, accent: string, i: number): React.ReactNode {
  if (line.startsWith('- ') || line.startsWith('• ')) {
    return (
      <li key={i} className="text-sm leading-relaxed text-white/80 ml-4 mb-1 list-disc">
        {renderInline(line.slice(2), accent)}
      </li>
    );
  }
  if (line.trim() === '') return <div key={i} className="h-2" />;
  return (
    <p key={i} className="text-sm leading-relaxed text-white/85 mb-1.5">
      {renderInline(line, accent)}
    </p>
  );
}

function renderInline(text: string, accent: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/);
  return parts.map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return <strong key={i} className="font-bold" style={{ color: accent }}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

function renderContent(text: string): React.ReactNode {
  return text.split('\n').map((line, i) => renderLine(line, ACCENT, i));
}

export default function MovingResult() {
  const params = useSearchParams();
  const name        = params.get('name')         ?? '';
  const gender      = params.get('gender')       ?? '';
  const year        = params.get('year')         ?? '';
  const month       = params.get('month')        ?? '';
  const day         = params.get('day')          ?? '';
  const calendarType= params.get('calendarType') ?? '양력';
  const moveYear    = params.get('moveYear')     ?? '';
  const moveMonth   = params.get('moveMonth')    ?? '';

  const [text, setText] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const body = {
      type: 'moving', section: '1',
      name, gender, year, month, day, hour: '모름', calendarType,
      moveYear, moveMonth,
    };

    fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(res => {
      if (!res.ok || !res.body) { setError(true); return; }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      function pump() {
        reader.read().then(({ done: d, value }) => {
          if (d) { setDone(true); return; }
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split('\n');
          buf = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const raw = line.slice(6).trim();
            if (raw === '[DONE]') { setDone(true); return; }
            try {
              const msg = JSON.parse(raw);
              if (msg.t === 'x' && msg.v) setText(prev => prev + msg.v);
            } catch { /* skip */ }
          }
          pump();
        }).catch(() => setDone(true));
      }
      pump();
    }).catch(() => setError(true));
  }, []);

  const sections = parseSections(text);

  return (
    <main className="min-h-screen" style={{ background: `linear-gradient(180deg, ${BG} 0%, #040f09 100%)` }}>
      <div className="w-full max-w-[430px] mx-auto px-4 py-8">

        {/* 뒤로 */}
        <div className="mb-6">
          <Link href="/moving/form" className="text-sm" style={{ color: `${ACCENT}88` }}>← 다시 입력</Link>
        </div>

        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏠</div>
          <h1 className="text-xl font-bold text-white mb-1">{name}님의 이사날짜 운세</h1>
          <p className="text-sm" style={{ color: `${ACCENT}88` }}>{moveYear}년 {moveMonth}월 이사 택일 분석</p>
          <p className="text-xs mt-1" style={{ color: `${ACCENT}55` }}>
            {year}.{month}.{day} ({calendarType}) · {gender}
          </p>
        </div>

        {/* 에러 */}
        {error && (
          <div className="rounded-2xl p-5 text-center mb-4"
            style={{ backgroundColor: `${ACCENT}11`, border: `1px solid ${ACCENT}22` }}>
            <p className="text-red-400 text-sm">풀이 생성에 실패했습니다. 새로고침 해주세요.</p>
          </div>
        )}

        {/* 로딩 */}
        {!error && sections.length === 0 && !done && (
          <div className="flex flex-col items-center gap-4 py-20">
            <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: `${ACCENT}33`, borderTopColor: ACCENT }} />
            <p className="text-sm" style={{ color: `${ACCENT}77` }}>택일 분석 중...</p>
            <p className="text-xs" style={{ color: `${ACCENT}44` }}>손없는 날과 사주 궁합을 계산하고 있습니다</p>
          </div>
        )}

        {/* 섹션 카드들 */}
        <div className="space-y-4">
          {sections.map((s, i) => (
            <div key={i} className="rounded-2xl overflow-hidden"
              style={{ border: `1px solid ${ACCENT}22`, backgroundColor: `${ACCENT}07` }}>
              {s.heading && (
                <div className="px-4 py-3 flex items-center gap-2"
                  style={{ borderBottom: `1px solid ${ACCENT}15`, backgroundColor: `${ACCENT}10` }}>
                  <span className="text-sm font-bold" style={{ color: ACCENT }}>{s.heading}</span>
                </div>
              )}
              <div className="px-4 py-4">
                {renderContent(s.content)}
              </div>
            </div>
          ))}

          {/* 스트리밍 진행 표시 */}
          {!done && text && (
            <div className="flex items-center gap-2 px-2 py-2">
              <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin flex-shrink-0"
                style={{ borderColor: `${ACCENT}33`, borderTopColor: ACCENT }} />
              <span className="text-xs" style={{ color: `${ACCENT}55` }}>분석 중...</span>
            </div>
          )}
        </div>

        {/* 완료 후 버튼 */}
        {done && (
          <div className="mt-8 space-y-3">
            <Link href="/moving/form">
              <button className="w-full py-4 rounded-2xl text-sm font-bold tracking-wider"
                style={{ backgroundColor: ACCENT, color: BG }}>
                다른 달 분석하기
              </button>
            </Link>
            <Link href="/">
              <button className="w-full py-4 rounded-2xl text-sm font-bold tracking-wider"
                style={{ backgroundColor: `${ACCENT}15`, color: ACCENT, border: `1px solid ${ACCENT}25` }}>
                홈으로
              </button>
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
