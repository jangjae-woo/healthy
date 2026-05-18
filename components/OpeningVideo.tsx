"use client";
import { useEffect, useRef, useState } from "react";

interface Props {
  dataReady: boolean;
  onComplete: () => void;
  loadingMessage?: string;
  src?: string;  // 영상 경로 (default: /opening.mp4)
  theme?: 'inyeon' | 'saju';  // 'inyeon' (default): 분홍·자두·금 / 'saju': 짙은 초록·금
  // ⭐ LLM 진행률 (0~1, 50% 도달 = 1.0). 지정 시 진행바가 영상·LLM 중 느린 쪽을 따름.
  loadProgress?: number;
  postVideoLoadingMessages?: string[];
}

// 풀이 진입 로딩 — 오프닝 영상 (소리 자동재생) + 진행바 sync
// - 진행바 = min(영상 진행, LLM 진행률) — 둘 중 느린 쪽 (loadProgress 지정 시)
// - 영상 끝 + 데이터 준비 → onComplete()
// - 영상 끝 + 데이터 미준비 → 진행바가 LLM 따라 계속 차오르며 대기
export default function OpeningVideo({ dataReady, onComplete, loadingMessage, src = "/opening.mp4", theme = 'inyeon', loadProgress, postVideoLoadingMessages }: Props) {
  const SAJU = theme === 'saju';
  const bgGradient = SAJU
    ? `radial-gradient(ellipse at 50% 0%, #1a2a1e 0%, transparent 60%),
       radial-gradient(ellipse at 50% 100%, #0a1208 0%, transparent 60%),
       linear-gradient(180deg, #0d1a0f 0%, #060d07 100%)`
    : `radial-gradient(ellipse at 30% 0%, #ffe1ea 0%, transparent 60%),
       radial-gradient(ellipse at 70% 100%, #fff0d6 0%, transparent 60%),
       linear-gradient(180deg, #fff7f9 0%, #ffeef3 60%, #fce4d6 100%)`;
  const videoShadow = SAJU
    ? "0 24px 60px -16px rgba(201,150,12,0.25)"
    : "0 24px 60px -16px rgba(178,40,71,0.25)";
  const msgColor = SAJU ? "#FFD700" : "#6b1e3a";
  const progressTrack = SAJU ? "rgba(201,150,12,0.25)" : "rgba(212,169,107,0.25)";
  const progressFill = SAJU
    ? "linear-gradient(90deg, #c9960c 0%, #FFD700 100%)"
    : "linear-gradient(90deg, #c8203a 0%, #b88646 100%)";
  const progressGlow = SAJU ? "0 0 8px rgba(255,215,0,0.4)" : "0 0 8px rgba(200,32,58,0.4)";
  const percentColor = SAJU ? "#FFD700" : "#b88646";
  const videoRef = useRef<HTMLVideoElement>(null);
  const [progress, setProgress] = useState(0);
  const [videoEnded, setVideoEnded] = useState(false);
  const [postVideoMessageIndex, setPostVideoMessageIndex] = useState(0);
  const completedRef = useRef(false);

  // 진행 중 표시용 애니메이션 점 — 1초마다 1개 → 2개 → 3개 → 1개 …
  // 멈춘 게 아니라 계속 진행 중이라는 시각 신호 (렉 의심 방지)
  const [dotCount, setDotCount] = useState(1);
  useEffect(() => {
    const id = setInterval(() => {
      setDotCount((c) => (c >= 3 ? 1 : c + 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!videoEnded || dataReady || !postVideoLoadingMessages?.length) return;
    const id = setInterval(() => {
      setPostVideoMessageIndex((i) => (i + 1) % postVideoLoadingMessages.length);
    }, 700);
    return () => clearInterval(id);
  }, [dataReady, postVideoLoadingMessages, videoEnded]);

  // 자동재생 시도 (사운드 포함)
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = 1.0;
    // 시도 1: 사운드와 함께 자동재생
    v.play().catch(() => {
      // 시도 2: 모바일 자동재생 정책으로 막히면 muted로 시도 (시각만)
      v.muted = true;
      v.play().catch(() => { /* 그래도 실패 시 무시 */ });
    });
  }, []);

  // 진행바 sync
  function handleTimeUpdate() {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const p = Math.min(100, (v.currentTime / v.duration) * 100);
    setProgress(p);
  }

  function handleEnded() {
    setVideoEnded(true);
    setProgress(100);
  }

  // 영상 끝 + 데이터 준비 → 완료
  useEffect(() => {
    if (videoEnded && dataReady && !completedRef.current) {
      completedRef.current = true;
      // 살짝 딜레이로 진행바 100% 시각 효과
      setTimeout(() => onComplete(), 300);
    }
  }, [videoEnded, dataReady, onComplete]);

  // ⭐ 진행바 표시값 — loadProgress 지정 시 영상·LLM 중 느린 쪽.
  // LLM이 영상보다 느리면 진행바가 LLM 진행률을 따라감 (영상 끝나도 계속 차오름).
  const displayProgress = loadProgress !== undefined
    ? Math.min(progress, Math.max(0, Math.min(1, loadProgress)) * 100)
    : progress;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: bgGradient }}
    >
      {/* 영상 */}
      <div
        className="relative w-full max-w-[480px] aspect-video"
        style={{
          boxShadow: videoShadow,
          borderRadius: 12,
          overflow: "hidden",
          background: "#000",
        }}
      >
        <video
          ref={videoRef}
          src={src}
          autoPlay
          playsInline
          preload="auto"
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onError={() => {
            // 영상 로드 실패 시 즉시 진행 (사용자 멈춤 차단)
            setVideoEnded(true);
            setProgress(100);
          }}
          style={{ width: "100%", height: "100%", objectFit: "contain", background: "#000" }}
        />
      </div>

      {/* 로딩 메시지 — 끝에 애니메이션 점(1→2→3→1)으로 진행 중 표시 */}
      <div
        className="mt-6 text-[14px] tracking-[0.05em] text-center px-4"
        style={{ color: msgColor, fontFamily: "'Nanum Myeongjo', 'Gowun Batang', serif", fontWeight: 700 }}
      >
        {(videoEnded && !dataReady
          ? (postVideoLoadingMessages?.[postVideoMessageIndex] ?? "거의 다 됐어요")
          : (loadingMessage ?? "사주를 펼치는 중")
        ).replace(/[.…\s]+$/u, "")}
        {!videoEnded || dataReady || !postVideoLoadingMessages?.length ? (
          <span
            style={{
              display: "inline-block",
              width: "1.6em",
              textAlign: "left",
              letterSpacing: "0.1em",
            }}
          >
            {".".repeat(dotCount)}
          </span>
        ) : null}
      </div>

      {/* 진행바 */}
      <div className="w-full max-w-[480px] px-4 mt-4">
        <div
          className="w-full rounded-full overflow-hidden"
          style={{
            height: 6,
            background: progressTrack,
          }}
        >
          <div
            style={{
              width: `${displayProgress}%`,
              height: "100%",
              background: progressFill,
              transition: "width 0.2s ease-out",
              boxShadow: progressGlow,
            }}
          />
        </div>
        <div
          className="text-[11px] mt-2 text-center tabular-nums"
          style={{ color: percentColor, fontFamily: "'Cormorant Garamond', serif", letterSpacing: "0.1em" }}
        >
          {Math.round(displayProgress)}%
        </div>
      </div>
    </div>
  );
}
