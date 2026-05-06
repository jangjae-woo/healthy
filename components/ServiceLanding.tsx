"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";

interface Props {
  character: string;
  title: string;
  tagline: string;
  features: string[];
  emoji: string;
  bg: string;
  bgEnd?: string;
  accent: string;
  formHref: string;
  image?: string;
  refKey?: string;
}

export default function ServiceLanding({
  character, title, tagline, features, emoji, bg, bgEnd = "#1a0d00", accent, formHref, image, refKey,
}: Props) {
  const homeUrl = "/";
  const labelHome = "← 홈으로";
  const labelStart = "시작하기";
  const labelFee = "결과 확인 시 소정의 이용료가 발생합니다";

  useEffect(() => {
    if (!refKey) return;
    try {
      const ref = new URLSearchParams(window.location.search).get('ref');
      if (ref) localStorage.setItem(refKey, ref);
    } catch {}
  }, [refKey]);
  return (
    <main
      className="min-h-screen flex flex-col items-center px-4 py-8"
      style={{ background: `linear-gradient(180deg, ${bg} 0%, ${bgEnd} 100%)` }}
    >
      {/* 뒤로가기 */}
      <div className="w-full max-w-sm mb-6">
        <Link href={homeUrl} className="flex items-center gap-1 text-sm" style={{ color: `${accent}88` }}>
          {labelHome}
        </Link>
      </div>

      {/* 캐릭터 영역 */}
      <div className="text-center mb-10">
        {image
          ? <Image src={image} alt={character} width={280} height={280} className="mx-auto mb-6 object-contain" />
          : <div className="text-9xl mb-6">{emoji}</div>
        }
        <p className="text-sm tracking-widest mb-2" style={{ color: `${accent}77` }}>
          {character}
        </p>
        <h1 className="text-4xl font-bold text-white mb-4">{title}</h1>
        <p className="text-base leading-relaxed max-w-xs break-keep" style={{ color: `${accent}99` }}>
          {tagline}
        </p>
      </div>

      {/* 시작 버튼 */}
      <div className="w-full max-w-sm">
        <Link href={formHref}>
          <button
            className="w-full py-4 rounded-2xl text-base font-bold tracking-wider transition-all hover:brightness-110 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #FFE066 0%, #FFD700 40%, #FFA800 100%)",
              color: "#1a0d00",
              boxShadow: "0 0 24px #FFD70099, 0 0 8px #FFD70066, 0 4px 16px #FFA80044",
            }}
          >
            {labelStart}
          </button>
        </Link>
        <p className="text-center text-xs mt-3" style={{ color: `${accent}55` }}>
          {labelFee}
        </p>
      </div>
    </main>
  );
}
