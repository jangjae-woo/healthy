"use client";

import Link from "next/link";
import { useEffect } from "react";

// ════════════════════════════════════════════════════════════════════
// /love — 홍실(紅絲) 테마 랜딩 (358.html 기반)
// 운명의 두 사람을 잇는 붉은 실. 사주가 읽어주는 인연.
// ════════════════════════════════════════════════════════════════════

const CSS = `
:root{
  --sakura-50: #fff7f9; --sakura-100:#ffe8ee; --sakura-200:#ffd2dd; --sakura-300:#ffb6c8;
  --sakura-400:#ff95b1; --sakura-500:#f06b8e;
  --rose-deep:#c2406a; --plum-deep:#6b1e3a; --crimson:#b22847; --thread:#c8203a;
  --cream:#fbf3e8; --cream-deep:#f3e3cb; --gold:#b88646; --gold-light:#d4a96b;
  --ink:#2a1722; --ink-soft:#5a3c4a;
}
.hongsil-root *{box-sizing:border-box;margin:0;padding:0}
.hongsil-root{
  font-family:"Noto Serif KR","Gowun Batang",serif;
  color:var(--ink);
  background:
    radial-gradient(ellipse at 20% 0%, #ffe1ea 0%, transparent 50%),
    radial-gradient(ellipse at 80% 30%, #ffd9e3 0%, transparent 55%),
    radial-gradient(ellipse at 50% 100%, #fff0d6 0%, transparent 60%),
    linear-gradient(180deg, #fff7f9 0%, #ffeef3 40%, #fce4d6 100%);
  background-attachment:fixed;
  overflow-x:hidden;
  line-height:1.65;
  min-height:100vh;
  position:relative;
}
.hongsil-root::before{
  content:"";
  position:fixed;inset:0;
  pointer-events:none;
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.6  0 0 0 0 0.3  0 0 0 0 0.4  0 0 0 0.06 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
  opacity:0.55;mix-blend-mode:multiply;z-index:1;
}
#hongsil-petals{position:fixed;inset:0;pointer-events:none;z-index:2;overflow:hidden}
.petal{position:absolute;top:-40px;width:18px;height:16px;will-change:transform;opacity:0.92;filter:drop-shadow(0 2px 4px rgba(192,64,106,0.15))}
.petal svg{width:100%;height:100%;display:block}
@keyframes petal-fall{0%{transform:translate3d(0,-50px,0) rotate(0deg)}100%{transform:translate3d(var(--drift,80px),110vh,0) rotate(var(--spin,360deg))}}
@keyframes petal-sway{0%,100%{margin-left:0}50%{margin-left:var(--sway,30px)}}
.hongsil-main{position:relative;z-index:5;max-width:480px;margin:0 auto}

.hongsil-header{position:relative;z-index:10;padding:18px 0 0}
.top-row{display:flex;align-items:center;justify-content:space-between;padding:0 20px}
.back-link{font-family:"Cormorant Garamond",serif;font-style:italic;font-weight:400;font-size:13px;color:var(--plum-deep);text-decoration:none;letter-spacing:0.02em;transition:color 0.3s,transform 0.3s}
.back-link:hover{color:var(--rose-deep);transform:translateX(-3px)}
.brand-mark{font-family:"Italiana",serif;font-size:11px;letter-spacing:0.4em;color:var(--gold);text-transform:uppercase}

.hero{position:relative;min-height:calc(100vh - 60px);display:flex;align-items:center;justify-content:center;text-align:center;padding:30px 20px 60px}
.hero-deco-tag{display:inline-block;font-family:"Cormorant Garamond",serif;font-style:italic;font-size:11px;letter-spacing:0.4em;color:var(--gold);margin-bottom:20px;position:relative;padding:0 28px}
.hero-deco-tag::before,.hero-deco-tag::after{content:"";position:absolute;top:50%;width:20px;height:1px;background:linear-gradient(90deg,transparent,var(--gold-light),transparent)}
.hero-deco-tag::before{left:0}
.hero-deco-tag::after{right:0}
.hero-pre{font-family:"Gowun Batang",serif;font-size:14px;color:var(--ink-soft);margin-bottom:20px;letter-spacing:0.02em;line-height:1.9}
.hero-pre em{font-style:normal;color:var(--thread);font-weight:700}
.hero-title{font-family:"Nanum Myeongjo",serif;font-weight:800;font-size:64px;line-height:1.0;letter-spacing:-0.02em;color:var(--ink);margin-bottom:6px;position:relative}
.hero-title .ko{display:inline-block;background:linear-gradient(180deg,var(--plum-deep) 0%,var(--crimson) 50%,var(--thread) 100%);-webkit-background-clip:text;background-clip:text;color:transparent;padding:0 6px}
.hero-title-en{font-family:"Italiana",serif;font-size:11px;letter-spacing:0.45em;color:var(--gold);margin-top:10px;margin-bottom:4px}
.hero-hanja{font-family:"Nanum Myeongjo",serif;font-size:16px;color:var(--thread);letter-spacing:0.35em;margin-bottom:6px;font-weight:400}
.hero-title-suffix{font-family:"Cormorant Garamond",serif;font-style:italic;font-size:15px;color:var(--rose-deep);margin-bottom:24px}
.hero-title-suffix::before{content:"— "}
.hero-title-suffix::after{content:" —"}
.hero-sub{font-family:"Gowun Batang",serif;font-size:14px;line-height:1.95;color:var(--ink-soft);max-width:340px;margin:0 auto 36px}
.hero-sub .accent{color:var(--thread);font-weight:700}
.cta-enter{display:inline-flex;flex-direction:column;align-items:center;gap:8px;text-decoration:none;color:var(--ink);font-family:"Cormorant Garamond",serif;font-style:italic;font-size:14px;letter-spacing:0.25em;padding:14px 0;cursor:pointer}
.cta-arrow{width:1px;height:42px;background:linear-gradient(180deg,var(--thread) 0%,transparent 100%);position:relative;animation:arrowDrop 2s ease-in-out infinite}
.cta-arrow::after{content:"";position:absolute;bottom:0;left:50%;transform:translateX(-50%) rotate(45deg);width:7px;height:7px;border-right:1px solid var(--thread);border-bottom:1px solid var(--thread)}
@keyframes arrowDrop{0%,100%{transform:translateY(0);opacity:1}50%{transform:translateY(6px);opacity:0.5}}
.hero-ornament{display:none}

.divider{display:flex;align-items:center;justify-content:center;gap:14px;padding:24px 20px}
.divider-line{flex:1;max-width:120px;height:1px;background:linear-gradient(90deg,transparent,var(--gold-light),transparent)}
.divider-mark{font-family:"Nanum Myeongjo",serif;color:var(--thread);font-size:18px;letter-spacing:0.3em}

.legend{padding:30px 20px 40px;position:relative}
.legend-inner{max-width:100%;margin:0 auto;position:relative;padding:40px 24px 44px;background:linear-gradient(180deg,rgba(255,251,247,0.92) 0%,rgba(253,243,232,0.88) 100%);border-radius:4px;box-shadow:0 16px 40px -16px rgba(178,40,71,0.18),0 0 0 1px rgba(212,169,107,0.25) inset;overflow:hidden}
.legend-thread{position:absolute;pointer-events:none;z-index:0}
.legend-thread.tl{top:-10px;left:-20px;width:120px;opacity:0.85;transform:rotate(-12deg)}
.legend-thread.br{bottom:-15px;right:-22px;width:140px;opacity:0.85;transform:rotate(195deg)}
.legend-content{position:relative;z-index:2}
.legend-tag{text-align:center;font-family:"Cormorant Garamond",serif;font-style:italic;color:var(--gold);font-size:11px;letter-spacing:0.4em;margin-bottom:16px}
.legend-tag .hanja{font-family:"Nanum Myeongjo",serif;font-style:normal;color:var(--thread);margin-right:10px;letter-spacing:0.25em}
.legend-headline{font-family:"Nanum Myeongjo",serif;font-weight:800;font-size:22px;line-height:1.45;text-align:center;color:var(--ink);margin-bottom:28px;letter-spacing:-0.01em}
.legend-headline .red{background:linear-gradient(180deg,var(--crimson) 0%,var(--thread) 100%);-webkit-background-clip:text;background-clip:text;color:transparent;font-weight:800}
.legend-body{font-family:"Gowun Batang",serif;font-size:14px;line-height:2.05;color:var(--ink);text-align:center;max-width:100%;margin:0 auto 28px}
.legend-body p{margin-bottom:16px}
.legend-body p:last-child{margin-bottom:0}
.legend-body .soft{color:var(--ink-soft)}
.legend-body .red{color:var(--thread);font-weight:700}
.legend-attribution{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:28px;padding-top:24px;border-top:1px solid rgba(212,169,107,0.3);flex-wrap:wrap}
.legend-attribution-text{font-family:"Cormorant Garamond",serif;font-style:italic;color:var(--ink-soft);font-size:11px;letter-spacing:0.15em}
.legend-attribution-mark{font-family:"Nanum Myeongjo",serif;color:var(--thread);font-size:15px;letter-spacing:0.25em}

.section-tag{text-align:center;font-family:"Cormorant Garamond",serif;font-style:italic;color:var(--gold);font-size:11px;letter-spacing:0.4em;margin-bottom:14px}
.section-title{text-align:center;font-family:"Nanum Myeongjo",serif;font-weight:800;font-size:26px;line-height:1.4;letter-spacing:-0.02em;color:var(--ink);margin-bottom:36px}
.section-title .soft{font-family:"Cormorant Garamond",serif;font-style:italic;font-weight:400;color:var(--rose-deep);margin:0 4px}

.choices{padding:30px 20px 40px;position:relative}
.cards{display:flex;flex-direction:column;gap:18px;max-width:100%;margin:0 auto;position:relative}
.cards-thread{display:none}
.card{position:relative;padding:28px 22px 26px;border-radius:8px;background:linear-gradient(180deg,rgba(255,255,255,0.88) 0%,rgba(255,247,249,0.75) 100%);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,182,200,0.5);box-shadow:0 12px 32px -12px rgba(194,64,106,0.22),0 0 0 1px rgba(255,255,255,0.6) inset;overflow:hidden;transition:transform 0.4s cubic-bezier(.2,.7,.2,1),box-shadow 0.4s;text-decoration:none;color:inherit;display:block;z-index:1}
.card::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at top right,rgba(255,182,200,0.4),transparent 50%),radial-gradient(circle at bottom left,rgba(212,169,107,0.15),transparent 50%);pointer-events:none}
.card::after{content:"";position:absolute;top:-20px;right:-20px;width:90px;height:90px;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><g fill='%23ffb6c8' opacity='0.45'><path d='M50,15 C55,25 65,30 75,30 C70,40 70,50 75,60 C65,60 55,65 50,75 C45,65 35,60 25,60 C30,50 30,40 25,30 C35,30 45,25 50,15 Z'/><circle cx='50' cy='45' r='4' fill='%23f06b8e'/></g></svg>");background-size:contain;background-repeat:no-repeat;transform:rotate(15deg);pointer-events:none}
.card:active{transform:scale(0.99)}
.card-en{font-family:"Italiana",serif;font-size:11px;letter-spacing:0.45em;color:var(--gold);margin-bottom:10px}
.card-title{font-family:"Nanum Myeongjo",serif;font-weight:800;font-size:22px;color:var(--plum-deep);margin-bottom:12px;letter-spacing:-0.02em}
.card-quote{font-family:"Gowun Batang",serif;font-size:13px;color:var(--rose-deep);margin-bottom:18px;font-style:italic;padding:10px 14px;border-left:2px solid var(--thread);background:rgba(255,235,240,0.5);border-radius:0 4px 4px 0;line-height:1.6}
.card ul{list-style:none;margin-bottom:22px}
.card li{font-family:"Gowun Batang",serif;font-size:13px;line-height:1.95;color:var(--ink-soft);padding-left:18px;position:relative}
.card li::before{content:"";position:absolute;left:0;top:11px;width:5px;height:5px;border-radius:50%;background:var(--thread);box-shadow:0 0 0 2.5px rgba(200,32,58,0.18)}
.card-cta{display:inline-flex;align-items:center;justify-content:space-between;gap:10px;font-family:"Cormorant Garamond",serif;font-style:italic;font-size:14px;letter-spacing:0.18em;color:var(--thread);padding-top:14px;border-top:1px solid rgba(212,169,107,0.3);width:100%}
.card-cta-arrow{font-size:18px}

.rules{padding:40px 20px 30px;position:relative}
.rules-inner{max-width:100%;margin:0 auto}
.rule-list{list-style:none;counter-reset:rule}
.rule-list li{display:flex;align-items:flex-start;gap:18px;padding:18px 0;border-bottom:1px solid rgba(212,169,107,0.25);counter-increment:rule}
.rule-list li:last-child{border-bottom:none}
.rule-num{flex-shrink:0;font-family:"Italiana",serif;font-size:22px;color:var(--gold);width:42px;line-height:1.2}
.rule-num::before{content:"0" counter(rule)}
.rule-text{font-family:"Gowun Batang",serif;font-size:14px;color:var(--ink);line-height:1.75;padding-top:4px}
.rule-text strong{color:var(--thread);font-weight:700}

.hongsil-footer{padding:40px 20px 40px;text-align:center;position:relative;z-index:5}
.footer-mark{font-family:"Nanum Myeongjo",serif;color:var(--thread);font-size:14px;letter-spacing:0.45em;margin-bottom:14px}
.footer-line{font-family:"Gowun Batang",serif;font-size:12px;color:var(--ink-soft);line-height:1.95}
.footer-fine{margin-top:24px;padding-top:18px;border-top:1px solid rgba(212,169,107,0.2);font-family:"Gowun Batang",serif;font-style:italic;font-size:11px;color:var(--ink-soft);opacity:0.85;line-height:1.95}

.reveal{opacity:0;transform:translateY(24px);transition:opacity 1s ease,transform 1s cubic-bezier(.2,.7,.2,1)}
.reveal.in{opacity:1;transform:none}
.reveal.d1{transition-delay:0.15s}
.reveal.d2{transition-delay:0.3s}
.reveal.d3{transition-delay:0.45s}
.reveal.d4{transition-delay:0.6s}

@keyframes drawThread{to{stroke-dashoffset:0}}
.thread-path{stroke-dasharray:1500;stroke-dashoffset:1500;animation:drawThread 3s ease-out forwards;animation-delay:0.3s}
`;

const PETAL_SVGS = [
  `<svg viewBox="0 0 30 28" xmlns="http://www.w3.org/2000/svg"><path d="M15 2 C18 8, 24 10, 27 14 C24 18, 22 24, 15 26 C8 24, 6 18, 3 14 C6 10, 12 8, 15 2 Z" fill="#ffc8d4"/><path d="M15 5 C16 12, 18 16, 15 22 C12 16, 14 12, 15 5 Z" fill="#ff95b1" opacity="0.6"/></svg>`,
  `<svg viewBox="0 0 30 28" xmlns="http://www.w3.org/2000/svg"><path d="M15 2 C18 8, 24 10, 27 14 C24 18, 22 24, 15 26 C8 24, 6 18, 3 14 C6 10, 12 8, 15 2 Z" fill="#ffb0c4"/><path d="M15 5 C16 12, 18 16, 15 22 C12 16, 14 12, 15 5 Z" fill="#f06b8e" opacity="0.55"/></svg>`,
  `<svg viewBox="0 0 30 28" xmlns="http://www.w3.org/2000/svg"><path d="M15 2 C18 8, 24 10, 27 14 C24 18, 22 24, 15 26 C8 24, 6 18, 3 14 C6 10, 12 8, 15 2 Z" fill="#ffe1ea"/><path d="M15 5 C16 12, 18 16, 15 22 C12 16, 14 12, 15 5 Z" fill="#ffb6c8" opacity="0.7"/></svg>`,
];

export default function LoveLandingPage() {
  useEffect(() => {
    // 폰트 로드
    const fontLink = document.createElement("link");
    fontLink.rel = "stylesheet";
    fontLink.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Gowun+Batang:wght@400;700&family=Nanum+Myeongjo:wght@400;700;800&family=Noto+Serif+KR:wght@200;300;400;500;600;700;900&family=Italiana&display=swap";
    document.head.appendChild(fontLink);

    // 꽃잎 — 페이지 로드 시 즉시 spawn
    const root = document.getElementById("hongsil-petals");
    if (root) {
      const initialCount = window.innerWidth < 720 ? 18 : 32;
      for (let i = 0; i < initialCount; i++) {
        const petal = document.createElement("div");
        petal.className = "petal";
        petal.innerHTML = PETAL_SVGS[Math.floor(Math.random() * PETAL_SVGS.length)];
        const startX = Math.random() * 100;
        const drift = Math.random() * 200 - 100;
        const sway = Math.random() * 60 - 30;
        const spin = 180 + Math.random() * 540;
        const size = 0.6 + Math.random() * 0.9;
        const fallDur = 9 + Math.random() * 10;
        const swayDur = 2.5 + Math.random() * 3;
        const delay = -Math.random() * fallDur;
        petal.style.left = startX + "vw";
        petal.style.transform = `scale(${size})`;
        petal.style.setProperty("--drift", drift + "px");
        petal.style.setProperty("--spin", spin + "deg");
        petal.style.setProperty("--sway", sway + "px");
        petal.style.animation = `petal-fall ${fallDur}s linear ${delay}s infinite, petal-sway ${swayDur}s ease-in-out ${delay}s infinite`;
        petal.style.opacity = (0.5 + Math.random() * 0.5).toFixed(2);
        root.appendChild(petal);
      }
    }

    // Reveal on scroll
    const items = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          (e.target as HTMLElement).classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });
    items.forEach((el) => io.observe(el));
    setTimeout(() => {
      document.querySelectorAll(".hero .reveal").forEach((el) => el.classList.add("in"));
    }, 100);

    return () => {
      io.disconnect();
      if (root) root.innerHTML = "";
      try { document.head.removeChild(fontLink); } catch {}
    };
  }, []);

  return (
    <div className="hongsil-root">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div id="hongsil-petals" aria-hidden="true" />
      <main className="hongsil-main">
        <header className="hongsil-header">
          <div className="top-row">
            <Link href="/" className="back-link">← paljawon</Link>
            <div className="brand-mark">八字苑</div>
          </div>
        </header>

        {/* HERO */}
        <section className="hero">
          <svg className="hero-ornament left" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <g fill="#ffb6c8" opacity="0.6">
              <path d="M100,30 C108,55 130,65 155,65 C148,90 148,110 155,135 C130,135 108,145 100,170 C92,145 70,135 45,135 C52,110 52,90 45,65 C70,65 92,55 100,30 Z" />
              <circle cx="100" cy="100" r="8" fill="#f06b8e" />
            </g>
          </svg>
          <svg className="hero-ornament right" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <g fill="#ffd2dd" opacity="0.7">
              <path d="M100,30 C108,55 130,65 155,65 C148,90 148,110 155,135 C130,135 108,145 100,170 C92,145 70,135 45,135 C52,110 52,90 45,65 C70,65 92,55 100,30 Z" />
              <circle cx="100" cy="100" r="8" fill="#f06b8e" />
            </g>
          </svg>

          <div>
            <div className="hero-deco-tag reveal">千年의 인연</div>
            <p className="hero-pre reveal d1">
              운명의 두 사람을 잇는<br />
              보이지 않는 <em>붉은 실</em>
            </p>
            <div className="hero-title-en reveal d2">R E D &nbsp; T H R E A D</div>
            <h1 className="hero-title reveal d2">
              <span className="ko">홍실</span>
            </h1>
            <div className="hero-hanja reveal d2">紅 絲</div>
            <div className="hero-title-suffix reveal d3">사주가 읽어주는 인연</div>
            <p className="hero-sub reveal d3">
              세상에는 <span className="accent">정해진 인연</span>이 있다.<br />
              그 매듭의 끝이 어디로 향하는지,<br />
              <span className="accent">사주</span>가 말해줍니다.
            </p>
            <a href="#legend" className="cta-enter reveal d4">
              <span>입장하기</span>
              <span className="cta-arrow" />
            </a>
          </div>
        </section>

        <div className="divider">
          <span className="divider-line" />
          <span className="divider-mark">紅</span>
          <span className="divider-line" />
        </div>

        {/* LEGEND */}
        <section className="legend" id="legend">
          <div className="legend-inner">
            <svg className="legend-thread tl" viewBox="0 0 240 200" xmlns="http://www.w3.org/2000/svg">
              <path d="M 10,20 C 60,40 100,10 130,50 C 160,90 90,110 130,140 C 170,170 220,140 230,180" fill="none" stroke="#c8203a" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
              <circle cx="10" cy="20" r="4" fill="#c8203a" />
              <circle cx="230" cy="180" r="3" fill="#c8203a" opacity="0.6" />
            </svg>
            <svg className="legend-thread br" viewBox="0 0 240 200" xmlns="http://www.w3.org/2000/svg">
              <path d="M 10,20 C 60,40 100,10 130,50 C 160,90 90,110 130,140 C 170,170 220,140 230,180" fill="none" stroke="#c8203a" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
              <circle cx="10" cy="20" r="4" fill="#c8203a" />
              <circle cx="230" cy="180" r="3" fill="#c8203a" opacity="0.6" />
            </svg>

            <div className="legend-content">
              <div className="legend-tag reveal">
                <span className="hanja">傳 說</span>THE LEGEND
              </div>
              <h2 className="legend-headline reveal d1">
                운명의 두 사람은,<br />
                <span className="red">붉은 실</span>로 묶여 있다.
              </h2>
              <div className="legend-body reveal d2">
                <p>
                  오래전부터 동아시아에 전해지는 이야기.<br />
                  태어날 때부터 <span className="red">운명의 두 사람</span>은<br />
                  새끼손가락이 보이지 않는 붉은 실로 이어져 있어,
                </p>
                <p>
                  <span className="soft">시간이 흘러도, 거리가 멀어도,</span><br />
                  <span className="soft">때로는 엉키고 늘어질지라도</span><br />
                  그 매듭은 결코 끊어지지 않는다.
                </p>
                <p>
                  <span className="red">사주(四柱)</span>는 그 실의 결을 읽는 일.<br />
                  당신의 실이 어디서 시작해,<br />
                  누구에게로 이어져 있는지를.
                </p>
              </div>
              <div className="legend-attribution reveal d3">
                <span className="legend-attribution-mark">月下老人</span>
                <span className="legend-attribution-text">Yue Lao · The Old Man Under the Moon</span>
              </div>
            </div>
          </div>
        </section>

        <div className="divider">
          <span className="divider-line" />
          <span className="divider-mark">緣</span>
          <span className="divider-line" />
        </div>

        {/* CHOICES */}
        <section className="choices" id="choose">
          <div className="section-tag reveal">CHOOSE YOUR PATH</div>
          <h2 className="section-title reveal d1">
            당신의 홍실은<br />
            <span className="soft">어디로</span> 이어져 있나요
          </h2>

          <div className="cards">
            <svg className="cards-thread" viewBox="0 0 1000 60" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
              <path className="thread-path" d="M 50,30 C 250,5 350,55 500,30 C 650,5 750,55 950,30" fill="none" stroke="#c8203a" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
            </svg>

            <Link href="/saju-love" className="card reveal d2">
              <div className="card-en">F O R &nbsp; O N E</div>
              <div className="card-title">나의 홍실</div>
              <p className="card-quote">"내 사주가 보여주는 사랑의 패턴"</p>
              <ul>
                <li>나의 연애 스타일</li>
                <li>끌리는 이상형의 결</li>
                <li>인연이 오는 시기</li>
                <li>반복되는 연애 약점</li>
              </ul>
              <div className="card-cta">
                <span>REVEAL ME</span>
                <span className="card-cta-arrow">→</span>
              </div>
            </Link>

            <Link href="/inyeon" className="card reveal d3">
              <div className="card-en">F O R &nbsp; T W O</div>
              <div className="card-title">둘의 홍실</div>
              <p className="card-quote">"이 사람, 정말 맞는 사람일까?"</p>
              <ul>
                <li>짝사랑·썸·연인·부부·재회 분기</li>
                <li>두 사주의 깊은 결</li>
                <li>결혼·미래 궁합</li>
                <li>홍도인의 마지막 편지</li>
              </ul>
              <div className="card-cta">
                <span>CHECK US</span>
                <span className="card-cta-arrow">→</span>
              </div>
            </Link>
          </div>
        </section>

        <div className="divider">
          <span className="divider-line" />
          <span className="divider-mark">命</span>
          <span className="divider-line" />
        </div>

        {/* RULES */}
        <section className="rules">
          <div className="rules-inner">
            <div className="section-tag reveal">THE RULES</div>
            <h2 className="section-title reveal d1">
              홍실을 풀어드리는 <span className="soft">약속</span>
            </h2>
            <ol className="rule-list">
              <li className="reveal d1">
                <span className="rule-num" />
                <span className="rule-text"><strong>진심으로 인연</strong>을 찾는 분을 위한 풀이입니다.</span>
              </li>
              <li className="reveal d2">
                <span className="rule-num" />
                <span className="rule-text">본명은 묻지 않습니다 — <strong>자기 사주</strong>만 가져오세요.</span>
              </li>
              <li className="reveal d3">
                <span className="rule-num" />
                <span className="rule-text">결과는 <strong>만세력 + AI 명리학</strong>의 정통 풀이입니다.</span>
              </li>
              <li className="reveal d4">
                <span className="rule-num" />
                <span className="rule-text">인연은 정해진 결과가 아닌 <strong>선택의 가능성</strong>입니다.</span>
              </li>
            </ol>
          </div>
        </section>

        <footer className="hongsil-footer">
          <div className="footer-mark">홍 실 · 紅 絲</div>
          <div className="footer-line">
            © PALJAWON 八字苑 · 사주 기반 인연 풀이<br />
            만 18세 이상
          </div>
          <div className="footer-fine">
            "운명의 인연은 붉은 실로 묶여 있다.<br />
            그 매듭을 풀어드립니다."
          </div>
        </footer>
      </main>
    </div>
  );
}
