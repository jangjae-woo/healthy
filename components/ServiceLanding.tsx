"use client";
import Link from "next/link";

interface Props {
  character: string;
  title: string;
  tagline: string;
  features: string[];
  emoji: string;
  bg: string;
  accent: string;
  formHref: string;
}

export default function ServiceLanding({
  character, title, tagline, features, emoji, bg, accent, formHref,
}: Props) {
  return (
    <main
      className="min-h-screen flex flex-col items-center px-4 py-8"
      style={{ background: `linear-gradient(180deg, ${bg} 0%, #1a0d00 100%)` }}
    >
      {/* 뒤로가기 */}
      <div className="w-full max-w-sm mb-6">
        <Link href="/" className="flex items-center gap-1 text-sm" style={{ color: `${accent}88` }}>
          ← 홈으로
        </Link>
      </div>

      {/* 캐릭터 영역 */}
      <div className="text-center mb-8">
        <div className="text-7xl mb-4">{emoji}</div>
        <p className="text-xs tracking-widest mb-1" style={{ color: `${accent}77` }}>
          {character}
        </p>
        <h1 className="text-2xl font-bold text-white mb-3">{title}</h1>
        <p className="text-sm leading-relaxed max-w-xs break-keep" style={{ color: `${accent}99` }}>
          {tagline}
        </p>
      </div>

      {/* 포함 내용 */}
      <div
        className="w-full max-w-sm rounded-2xl p-5 mb-8"
        style={{ backgroundColor: `${accent}11`, border: `1px solid ${accent}22` }}
      >
        <p className="text-xs font-bold mb-3 tracking-wider" style={{ color: `${accent}99` }}>
          풀이 내용
        </p>
        <ul className="space-y-2">
          {features.map((f, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-white">
              <span style={{ color: accent }}>✦</span>
              {f}
            </li>
          ))}
        </ul>
      </div>

      {/* 시작 버튼 */}
      <div className="w-full max-w-sm">
        <Link href={formHref}>
          <button
            className="w-full py-4 rounded-2xl text-base font-bold tracking-wider transition-opacity hover:opacity-90 active:opacity-70"
            style={{ backgroundColor: accent, color: bg }}
          >
            시작하기
          </button>
        </Link>
        <p className="text-center text-xs mt-3" style={{ color: `${accent}55` }}>
          결과 확인 시 소정의 이용료가 발생합니다
        </p>
      </div>
    </main>
  );
}
