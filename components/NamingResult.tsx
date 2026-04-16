"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const ACCENT = "#e8b84b";
const BG = "#1e1408";

interface NameSection { heading: string; content: string; }

function parseSections(text: string): NameSection[] {
  const result: NameSection[] = [];
  const parts = text.split(/\n(?=### )/);
  for (const part of parts) {
    const m = part.match(/^### (.+?)\n([\s\S]*)/);
    if (m) {
      result.push({ heading: m[1].trim(), content: m[2].trim() });
    } else {
      const trimmed = part.trim();
      if (trimmed && !trimmed.startsWith('###')) {
        result.push({ heading: '', content: trimmed });
      }
    }
  }
  return result;
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/);
  return parts.map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return <strong key={i} className="font-bold" style={{ color: ACCENT }}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

function renderContent(text: string): React.ReactNode {
  return text.split('\n').map((line, i) => {
    if (line.startsWith('- ') || line.startsWith('• ')) {
      return (
        <li key={i} className="text-sm leading-relaxed text-white/80 ml-4 mb-1 list-disc">
          {renderInline(line.slice(2))}
        </li>
      );
    }
    if (line.trim() === '') return <div key={i} className="h-2" />;
    return (
      <p key={i} className="text-sm leading-relaxed text-white/85 mb-1.5">
        {renderInline(line)}
      </p>
    );
  });
}

// 이름 카드 vs 일반 섹션 판단
function isNameSection(heading: string) {
  return heading.includes('추천 이름');
}

// 이름 섹션에서 이름만 추출 (예: "추천 이름 ① — 김하준" → "김하준")
function extractName(heading: string): string {
  const m = heading.match(/—\s*(.+)$/);
  return m ? m[1].trim() : heading;
}

function NameCard({ section }: { section: NameSection }) {
  const fullName = extractName(section.heading);
  const num = section.heading.match(/[①②③]/)?.[0] ?? '';

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ border: `1px solid ${ACCENT}33`, backgroundColor: `${ACCENT}08` }}>
      {/* 이름 헤더 */}
      <div className="px-5 py-5 text-center"
        style={{ borderBottom: `1px solid ${ACCENT}20`, backgroundColor: `${ACCENT}12` }}>
        <div className="text-xs mb-2 tracking-wider" style={{ color: `${ACCENT}77` }}>
          추천 이름 {num}
        </div>
        <div className="text-3xl font-bold tracking-widest text-white mb-1">
          {fullName}
        </div>
      </div>

      {/* 상세 내용 */}
      <div className="px-4 py-4 space-y-1">
        {renderContent(section.content)}
      </div>
    </div>
  );
}

export default function NamingResult() {
  const params = useSearchParams();
  const gender      = params.get('gender')       ?? '';
  const year        = params.get('year')         ?? '';
  const month       = params.get('month')        ?? '';
  const day         = params.get('day')          ?? '';
  const calendarType= params.get('calendarType') ?? '양력';
  const lastName    = params.get('lastName')     ?? '';
  const feeling     = params.get('feeling')      ?? '';

  const [text, setText] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const body = {
      type: 'naming', section: '1',
      gender, year, month, day, hour: '모름', calendarType,
      lastName, feeling,
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
    <main className="min-h-screen" style={{ background: `linear-gradient(180deg, ${BG} 0%, #0a0704 100%)` }}>
      <div className="w-full max-w-[430px] mx-auto px-4 py-8">

        {/* 뒤로 */}
        <div className="mb-6">
          <Link href="/naming/form" className="text-sm" style={{ color: `${ACCENT}88` }}>← 다시 입력</Link>
        </div>

        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">✍️</div>
          <h1 className="text-xl font-bold text-white mb-1">이름 추천 결과</h1>
          <p className="text-sm mb-1" style={{ color: `${ACCENT}88` }}>
            {lastName}씨 · {gender} · {year}.{month}.{day} ({calendarType})
          </p>
          {feeling && (
            <p className="text-xs px-4 py-1.5 rounded-full inline-block"
              style={{ backgroundColor: `${ACCENT}18`, color: `${ACCENT}99` }}>
              "{feeling}"
            </p>
          )}
        </div>

        {/* 에러 */}
        {error && (
          <div className="rounded-2xl p-5 text-center mb-4"
            style={{ backgroundColor: `${ACCENT}11`, border: `1px solid ${ACCENT}22` }}>
            <p className="text-red-400 text-sm">이름 생성에 실패했습니다. 새로고침 해주세요.</p>
          </div>
        )}

        {/* 로딩 */}
        {!error && sections.length === 0 && !done && (
          <div className="flex flex-col items-center gap-4 py-20">
            <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: `${ACCENT}33`, borderTopColor: ACCENT }} />
            <p className="text-sm" style={{ color: `${ACCENT}77` }}>이름 분석 중...</p>
            <p className="text-xs" style={{ color: `${ACCENT}44` }}>사주 오행과 발음오행을 분석하고 있습니다</p>
          </div>
        )}

        {/* 섹션 카드들 */}
        <div className="space-y-5">
          {sections.map((s, i) => (
            isNameSection(s.heading)
              ? <NameCard key={i} section={s} />
              : s.heading || s.content ? (
                <div key={i} className="rounded-2xl overflow-hidden"
                  style={{ border: `1px solid ${ACCENT}22`, backgroundColor: `${ACCENT}07` }}>
                  {s.heading && (
                    <div className="px-4 py-3"
                      style={{ borderBottom: `1px solid ${ACCENT}15`, backgroundColor: `${ACCENT}10` }}>
                      <span className="text-sm font-bold" style={{ color: ACCENT }}>{s.heading}</span>
                    </div>
                  )}
                  <div className="px-4 py-4">
                    {renderContent(s.content)}
                  </div>
                </div>
              ) : null
          ))}

          {/* 스트리밍 진행 */}
          {!done && text && (
            <div className="flex items-center gap-2 px-2 py-2">
              <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin flex-shrink-0"
                style={{ borderColor: `${ACCENT}33`, borderTopColor: ACCENT }} />
              <span className="text-xs" style={{ color: `${ACCENT}55` }}>이름 분석 중...</span>
            </div>
          )}
        </div>

        {/* 완료 후 버튼 */}
        {done && (
          <div className="mt-8 space-y-3">
            <Link href="/naming/form">
              <button className="w-full py-4 rounded-2xl text-sm font-bold tracking-wider"
                style={{ backgroundColor: ACCENT, color: BG }}>
                다시 추천받기
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
