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
  homeHref?: string;
  // 'gold' = 기존 금색 그라데이션 버튼 / 'unified' = accent 색으로 배경·글자 통일 (777 패턴)
  buttonStyle?: 'gold' | 'unified';
}

export default function ServiceLanding({
  character, title, tagline, features, emoji, bg, bgEnd = "#1a0d00", accent, formHref, image, refKey,
  homeHref = "/",
  buttonStyle = 'gold',
}: Props) {
  const homeUrl = homeHref;
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
            className={
              buttonStyle === 'unified'
                ? "w-full py-5 rounded-xl text-lg font-bold transition-all hover:brightness-125 active:scale-95"
                : "w-full py-4 rounded-2xl text-base font-bold tracking-wider transition-all hover:brightness-110 active:scale-95"
            }
            style={
              buttonStyle === 'unified'
                ? {
                    background: "linear-gradient(180deg, #1f1308 0%, #14090a 100%)",
                    color: "#ffd700",
                    border: "1.5px solid #c9960c",
                    boxShadow: "0 0 36px #c9960c55, 0 0 14px #c9960c44, 0 6px 20px #00000088, inset 0 1px 0 #ffd70033, inset 0 -1px 0 #00000066",
                    letterSpacing: "0.14em",
                    textShadow: "0 0 12px #ffd70088, 0 1px 0 #00000088",
                    fontFamily: "'Nanum Myeongjo', 'Noto Serif KR', serif",
                  }
                : {
                    background: "linear-gradient(135deg, #FFF4B0 0%, #FFE066 40%, #FFD700 100%)",
                    color: "#1a0d00",
                    boxShadow: "0 0 32px #FFE066cc, 0 0 14px #FFD700aa, 0 4px 16px #FFD70055",
                  }
            }
          >
            {buttonStyle === 'unified' ? `❖   ${labelStart}   ❖` : labelStart}
          </button>
        </Link>
        <p className="text-center text-xs mt-3" style={{ color: `${accent}55` }}>
          {labelFee}
        </p>
      </div>
    </main>
  );
}
