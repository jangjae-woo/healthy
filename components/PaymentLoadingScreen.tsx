'use client';

import { useEffect, useState } from 'react';

const GOLD = '#c9960c';
const GOLD_LIGHT = '#e4b840';

const STAGES: { from: number; to: number; label: string; hanja: string }[] = [
  { from: 0,  to: 6,  label: '천간을 살피는 중',          hanja: '天干' },
  { from: 6,  to: 12, label: '지지의 기운을 헤아리는 중', hanja: '地支' },
  { from: 12, to: 18, label: '오행의 조화를 보는 중',     hanja: '五行' },
  { from: 18, to: 24, label: '십성의 배치를 풀이하는 중', hanja: '十星' },
  { from: 24, to: 30, label: '운명의 별자리를 찾는 중',   hanja: '神煞' },
];

const PILLARS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

interface Props {
  durationSec?: number;
  onComplete: () => void;
}

export default function PaymentLoadingScreen({ durationSec = 30, onComplete }: Props) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const tick = setInterval(() => {
      const sec = (Date.now() - start) / 1000;
      if (sec >= durationSec) {
        clearInterval(tick);
        setElapsed(durationSec);
        onComplete();
      } else {
        setElapsed(sec);
      }
    }, 100);
    return () => clearInterval(tick);
  }, [durationSec, onComplete]);

  const progress = Math.min(100, (elapsed / durationSec) * 100);
  const currentStage =
    STAGES.find((s) => elapsed >= s.from && elapsed < s.to) || STAGES[STAGES.length - 1];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'linear-gradient(180deg, #0d1a0f 0%, #060d07 100%)',
        color: '#e7e2d8',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        fontFamily: "'Gowun Batang', 'Noto Serif KR', serif",
      }}
    >
      {/* 별빛 배경 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            radial-gradient(1px 1px at 20% 30%, rgba(228,184,64,0.5), transparent),
            radial-gradient(1px 1px at 70% 60%, rgba(228,184,64,0.4), transparent),
            radial-gradient(1px 1px at 40% 80%, rgba(228,184,64,0.3), transparent),
            radial-gradient(1px 1px at 85% 20%, rgba(228,184,64,0.4), transparent),
            radial-gradient(1px 1px at 15% 70%, rgba(228,184,64,0.3), transparent)
          `,
          pointerEvents: 'none',
        }}
      />

      {/* 회전 태극 */}
      <div
        style={{
          fontSize: 72,
          color: GOLD,
          textShadow: `0 0 32px ${GOLD}aa, 0 0 12px ${GOLD_LIGHT}77`,
          marginBottom: 8,
          animation: 'paljaSpin 8s linear infinite',
        }}
      >
        ☯
      </div>

      {/* 메인 카피 */}
      <div
        style={{
          fontSize: 11,
          letterSpacing: '0.4em',
          color: GOLD,
          fontFamily: "'Cormorant Garamond', serif",
          textTransform: 'uppercase',
          marginTop: 16,
          marginBottom: 6,
        }}
      >
        Reading your Saju
      </div>
      <h2
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: '#fef3c7',
          fontFamily: "'Noto Serif KR', serif",
          letterSpacing: '0.05em',
          textAlign: 'center',
          margin: 0,
        }}
      >
        당신의 사주를
        <br />
        읽어드리는 중입니다
      </h2>

      {/* 사주 카드들 — 4개 기둥 */}
      <div
        style={{
          marginTop: 28,
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 10,
          width: '100%',
          maxWidth: 320,
        }}
      >
        {[0, 1, 2, 3].map((i) => {
          const flipDelay = i * 0.4;
          const hanja = PILLARS[(Math.floor(elapsed / 1.5) + i * 3) % PILLARS.length];
          return (
            <div
              key={i}
              style={{
                aspectRatio: '2 / 3',
                borderRadius: 10,
                background: `linear-gradient(135deg, #132419 0%, #0a1408 100%)`,
                border: `1px solid ${GOLD}55`,
                boxShadow: `0 0 16px ${GOLD}33`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: `paljaFlip 4s ease-in-out ${flipDelay}s infinite`,
              }}
            >
              <span
                style={{
                  fontFamily: "'Ma Shan Zheng', serif",
                  fontSize: 36,
                  color: GOLD_LIGHT,
                  textShadow: `0 0 12px ${GOLD}66`,
                }}
              >
                {hanja}
              </span>
            </div>
          );
        })}
      </div>

      {/* 진행바 */}
      <div
        style={{
          marginTop: 32,
          width: '100%',
          maxWidth: 320,
          height: 4,
          borderRadius: 4,
          background: `${GOLD}22`,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${GOLD} 0%, ${GOLD_LIGHT} 100%)`,
            boxShadow: `0 0 12px ${GOLD}aa`,
            transition: 'width 0.2s linear',
          }}
        />
      </div>

      <div
        style={{
          marginTop: 6,
          width: '100%',
          maxWidth: 320,
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 10,
          color: `${GOLD}aa`,
          fontFamily: "'Cormorant Garamond', serif",
          letterSpacing: '0.1em',
        }}
      >
        <span>{Math.floor(elapsed)}s</span>
        <span>{durationSec}s</span>
      </div>

      {/* 현재 단계 */}
      <div style={{ marginTop: 22, textAlign: 'center', minHeight: 56 }}>
        <div
          style={{
            fontFamily: "'Ma Shan Zheng', serif",
            fontSize: 22,
            color: GOLD_LIGHT,
            marginBottom: 4,
            letterSpacing: '0.1em',
            textShadow: `0 0 12px ${GOLD}55`,
          }}
        >
          {currentStage.hanja}
        </div>
        <div style={{ fontSize: 13, color: '#d6cdb8', letterSpacing: '0.05em' }}>
          {currentStage.label}…
        </div>
      </div>

      {/* 단계 점들 */}
      <div
        style={{
          marginTop: 18,
          display: 'flex',
          gap: 6,
        }}
      >
        {STAGES.map((s, i) => {
          const done = elapsed >= s.to;
          const active = elapsed >= s.from && elapsed < s.to;
          return (
            <span
              key={i}
              style={{
                width: active ? 18 : 6,
                height: 6,
                borderRadius: 999,
                background: done ? GOLD_LIGHT : active ? GOLD : `${GOLD}33`,
                transition: 'all 0.4s ease',
                boxShadow: active ? `0 0 8px ${GOLD}aa` : 'none',
              }}
            />
          );
        })}
      </div>

      <p
        style={{
          marginTop: 28,
          fontSize: 11,
          color: '#78350f99',
          textAlign: 'center',
          fontFamily: "'Gowun Batang', serif",
        }}
      >
        잠시만 기다려 주세요. 깊이 있는 풀이를 준비하고 있습니다.
      </p>

      <style jsx>{`
        @keyframes paljaSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes paljaFlip {
          0%, 40%   { transform: rotateY(0deg); }
          50%, 90%  { transform: rotateY(180deg); }
          100%      { transform: rotateY(360deg); }
        }
      `}</style>
    </div>
  );
}
