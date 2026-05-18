"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import OpeningVideo from "@/components/OpeningVideo";
import PaymentModal from "@/components/PaymentModal";

type ApiResult = {
  ok: boolean;
  html?: string;
  summary?: { pageCount?: number };
  error?: string;
};

const YOUA_PRICE = 32900;
const UNKNOWN_HOUR = "시간 모름";
const PAGE_TITLES = [
  "표지",
  "보고서 안내",
  "어떤 결인가",
  "활기",
  "조심성",
  "만족",
  "흔들림",
  "어울림",
  "끈기",
  "동물 유형",
  "부모 양육으로 이어가기",
  "보고서 미리보기",
  "어머님 사주",
  "아버님 사주",
  "부모-자녀 사주 궁합",
  "함께 살펴줄 결",
  "마지막 안내",
];

const CHAPTER_NUMBERS: Record<number, string> = {
  2: "1장",
  3: "2장",
  4: "3장",
  5: "4장",
  6: "5장",
  7: "6장",
  8: "7장",
  9: "8장",
  12: "9장",
  13: "10장",
  14: "11장",
  15: "12장",
};

function displayChapter(index: number) {
  if (index === 0) return "표지";
  if (index === 1) return "보고서 안내";
  if (index === 10) return "부모 양육으로 이어가기";
  if (index === 11) return "보고서 미리보기";
  if (index === 16) return "outro · 마지막 안내";
  const chapter = CHAPTER_NUMBERS[index];
  return chapter ? `${chapter} · ${PAGE_TITLES[index] || `Page ${index + 1}`}` : PAGE_TITLES[index] || `Page ${index + 1}`;
}

function displayCount(index: number, total: number) {
  return `${index + 1} / ${total}`;
}

function tocEntries(total: number) {
  return Array.from({ length: total })
    .map((_, index) => index)
    .filter((index) => index >= 2 && index !== 10 && index !== 11);
}

const REPORT_CSS = `
.youa-root *{box-sizing:border-box}
.youa-root{min-height:100vh;background:radial-gradient(ellipse at 30% 0%,#ffe1ea 0%,transparent 60%),radial-gradient(ellipse at 70% 100%,#fff0d6 0%,transparent 60%),linear-gradient(180deg,#fff7f9 0%,#ffeef3 60%,#fce4d6 100%);font-family:Pretendard,-apple-system,BlinkMacSystemFont,"Noto Sans KR",sans-serif;color:#1a0a14;padding-bottom:86px}
.youa-shell{max-width:480px;margin:0 auto}
.youa-top{position:sticky;top:0;z-index:18;display:grid;grid-template-columns:74px 1fr 86px;align-items:center;gap:8px;padding:12px;background:rgba(255,247,249,.92);backdrop-filter:blur(12px);border-bottom:1px solid rgba(212,169,107,.3)}
.youa-top a{color:#6b1e3a;text-decoration:none;font-size:13px;font-family:"Cormorant Garamond",serif}
.youa-title{text-align:center;min-width:0;color:#1a0a14;font-weight:700;font-family:"Nanum Myeongjo","Noto Serif KR",serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.youa-title small{display:block;margin-top:2px;color:#b88646;font-family:"Cormorant Garamond",serif;font-size:10px;letter-spacing:.22em;font-weight:400}
.youa-toc-button{border:1px solid rgba(200,32,58,.35);background:rgba(255,255,255,.62);color:#c8203a;border-radius:999px;padding:7px 10px;font-size:12px;font-weight:700}
.youa-toc-backdrop{position:fixed;inset:0;z-index:30;background:rgba(106,30,58,.35)}
.youa-toc-panel{position:fixed;top:62px;left:50%;transform:translateX(-50%);z-index:31;width:calc(100% - 20px);max-width:460px;max-height:72vh;overflow:auto;background:linear-gradient(180deg,rgba(255,251,247,.98),rgba(253,243,232,.96));border:1px solid rgba(212,169,107,.42);border-radius:10px;box-shadow:0 24px 60px -16px rgba(178,40,71,.25)}
.youa-toc-head{display:flex;align-items:center;justify-content:space-between;padding:13px 16px;border-bottom:1px solid rgba(212,169,107,.25);font-weight:700}
.youa-toc-head button{border:0;background:transparent;color:#b88646;font-size:18px}
.youa-toc-item{width:100%;display:flex;align-items:center;justify-content:space-between;border:0;border-bottom:1px solid rgba(212,169,107,.15);background:transparent;padding:14px 16px;text-align:left;color:#1a0a14;font-size:13px}
.youa-toc-item.active{background:rgba(200,32,58,.06);color:#c8203a;font-weight:700}
.report-frame{padding:18px 10px 24px;font-family:"Noto Serif KR","Gowun Batang",serif;letter-spacing:0;word-spacing:0;word-break:keep-all}
.report-frame *{letter-spacing:0;word-spacing:0}
.report-frame .page{max-width:420px;margin:0 auto 20px;padding:30px 20px;background:#fff;border-radius:14px;box-shadow:0 4px 24px rgba(0,0,0,.08);min-height:640px;position:relative;font-family:"Noto Serif KR","Gowun Batang",serif;word-break:keep-all;overflow-wrap:normal}
.report-frame .page-num{position:absolute;top:14px;right:18px;color:#aaa;font-size:11px}
.report-frame .cover{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;background:linear-gradient(180deg,#fef0e6 0%,#fdfaf6 100%)}
.report-frame .cover .title{font-size:24px;font-weight:800;color:#c84d20;margin-bottom:18px;line-height:1.35}
.report-frame .cover .subtitle{font-size:13px;color:#777;line-height:1.7}
.report-frame .cover .info{font-size:13px;line-height:1.9;color:#56616d;margin-top:26px}
.report-frame .cover .jado-mark{font-size:12px;color:#93a0aa;margin-top:62px}
.report-frame h1{font-size:24px;font-weight:800;margin-bottom:12px;color:#333}
.report-frame h2{font-size:18px;font-weight:700;margin:18px 0 10px;color:#333}
.report-frame h3{font-size:15px;font-weight:700;margin:16px 0 8px;color:#444}
.report-frame p{font-size:13px;line-height:1.75;color:#444;margin:10px 0}
.report-frame table{width:100%;border-collapse:collapse;margin:14px 0;font-size:12px}
.report-frame th,.report-frame td{padding:8px 10px;border-bottom:1px solid #eee;text-align:left}
.report-frame th{background:#f8f5f1;font-weight:600;color:#555}
.report-frame .disclaimer{font-size:12px!important;line-height:1.75!important;color:#7b8790!important;border:1px dashed #ded8d2;border-radius:10px;padding:14px 16px;margin:22px 0;background:#fff}
.report-frame .disclaimer strong{font-size:inherit}
.report-frame .chapter-header{padding:12px 18px;border-radius:10px;margin-bottom:22px;font-size:18px;font-weight:700;display:inline-block}
.report-frame .chapter-mini{display:inline-flex;align-items:center;justify-content:center;margin-right:7px;padding:2px 7px;border-radius:999px;background:#fff7ef;border:1px solid #e7c9ac;color:#b46b2b;font-size:12px;font-weight:800;vertical-align:middle}
.report-frame .ch-hwalgi{background:#FFE5DA;color:#c84d20}.report-frame .ch-josim{background:#E5F2D1;color:#5d8225}.report-frame .ch-manjok{background:#FFF6CC;color:#b89400}.report-frame .ch-heundeullim{background:#EBDAF5;color:#6e4099}.report-frame .ch-eoullim{background:#FFE0E8;color:#c44366}.report-frame .ch-kkeungi{background:#DBE9F5;color:#2d5a8a}.report-frame .ch-parent{background:#F0E7DC;color:#8a6332}.report-frame .ch-outro{background:#F5E4D8;color:#a16a3a}
.report-frame .score-box{background:#fef9f6;border-left:4px solid #d97757;padding:12px 14px;border-radius:8px;margin:16px 0;font-size:13px}
.report-frame .score-box p,.report-frame .score-box div{font-size:13px!important;line-height:1.75!important}
.report-frame .radar-wrap{display:flex;justify-content:center;margin:20px 0}.report-frame .radar{width:100%;max-width:320px;height:auto}.report-frame .radar-label{font-size:12px;font-weight:600;fill:#555}.report-frame .radar-score{font-size:10px;fill:#d97757;font-weight:700}
.report-frame .bar-row{display:flex;align-items:center;margin:8px 0;gap:8px}.report-frame .bar-name{width:48px;font-size:12px;font-weight:600;color:#555}.report-frame .bar-track{flex:1;height:11px;background:#f0ebe5;border-radius:6px;overflow:hidden}.report-frame .bar-fill{height:100%;border-radius:6px}.report-frame .bar-score{width:44px;text-align:right;font-size:12px;font-weight:700;color:#d97757}.report-frame .bar-label{width:62px;font-size:11px}.report-frame .level-low{color:#2d5a8a;font-weight:600}.report-frame .level-mid{color:#888;font-weight:600}.report-frame .level-high{color:#c84d20;font-weight:600}
.report-frame .bipolar-section{margin:24px 0}.report-frame .bipolar-title{text-align:center;font-size:14px;font-weight:700;color:#444;margin-bottom:4px}.report-frame .bipolar-subtitle{text-align:center;font-size:11px;color:#888;margin-bottom:14px}.report-frame .bipolar-list{background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 1px 6px rgba(0,0,0,.04)}.report-frame .bipolar-item{border-bottom:1px solid #f0ebe5;cursor:pointer}.report-frame .bipolar-row{display:grid;grid-template-columns:1fr 60px 1fr 22px;gap:6px;align-items:center;padding:12px 10px}.report-frame .bp-low-mini{text-align:right;font-size:10.5px;color:#888;line-height:1.4}.report-frame .bp-high-mini{text-align:left;font-size:10.5px;color:#c84d20;line-height:1.4;font-weight:500}.report-frame .bipolar-label{padding:5px 8px;border-radius:6px;font-size:12px;font-weight:700;text-align:center}.report-frame .bp-toggle{font-size:15px;color:#9a9a9a;text-align:center;font-weight:700}.report-frame .bipolar-detail{display:none;padding:0 14px 14px;background:#faf6f1}.report-frame .bipolar-item.expanded .bipolar-detail{display:block}.report-frame .bp-full{font-size:11px;line-height:1.65;padding:8px 10px;margin:6px 0;border-radius:6px}.report-frame .bp-low-full{background:#f8f5f1;color:#666;border-left:3px solid #bbb}.report-frame .bp-high-full{background:#fff5ec;color:#444;border-left:3px solid #d97757}
.report-frame .saju8-box{background:#faf6f1;padding:14px;border-radius:10px;margin:14px 0}.report-frame .saju8-title{font-size:12px;color:#888;margin-bottom:10px}.report-frame .saju8-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;text-align:center}.report-frame .saju8-cell{background:#fff;padding:8px 4px;border-radius:6px;border:1px solid #eee}.report-frame .saju8-cell .pos{font-size:10px;color:#aaa;margin-bottom:4px}.report-frame .saju8-cell .char{font-size:18px;font-weight:700;color:#555;line-height:1.25;white-space:nowrap}.report-frame .saju8-cell.day .char{color:#d97757;font-size:22px}.report-frame .saju8-info{font-size:11px;color:#666;margin-top:10px;text-align:center}
.report-frame .transition-page{display:flex;align-items:center;justify-content:center;text-align:center;background:linear-gradient(180deg,#fffdf9 0%,#fff7f0 100%)}
.report-frame .transition-content{width:100%;padding:24px 8px}
.report-frame .transition-icon{font-size:34px;margin-bottom:18px}
.report-frame .transition-title{font-size:22px;line-height:1.55;color:#c84d20;margin:0 0 18px;font-weight:800}
.report-frame .transition-divider{width:54px;height:2px;background:#e6c7a7;margin:0 auto 22px;border-radius:999px}
.report-frame .transition-body{font-size:14px;line-height:1.9;color:#555;margin:14px 0}
.report-frame .transition-body.emphasis{font-weight:700;color:#8a6332}
.report-frame .preview-list{display:flex;flex-direction:column;gap:14px;margin:22px 0}
.report-frame .preview-item{display:grid;grid-template-columns:58px 1fr;gap:12px;align-items:center;background:#faf6f1;border-radius:12px;padding:16px 18px}
.report-frame .preview-num{font-size:24px;font-weight:800;color:#d97757;white-space:nowrap}
.report-frame .preview-title{font-size:16px;font-weight:800;color:#2f2f2f;margin-bottom:4px}
.report-frame .preview-desc{font-size:12.5px;line-height:1.5;color:#68717b}
.report-frame .value-message{margin-top:18px;padding:28px 20px;border-radius:14px;text-align:center;background:linear-gradient(180deg,#fffaf4 0%,#fef3e8 100%);color:#4d5560}
.report-frame .value-message .value-mark{font-size:28px;margin-bottom:12px}
.report-frame .value-message p{font-size:13px;line-height:1.9;margin:12px 0;color:#4d5560}
.report-frame .value-message .value-final{font-weight:800;color:#c84d20}
.report-frame .factor-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:16px 0}.report-frame .factor-card{padding:10px 12px;border-radius:10px;transition:all .15s;cursor:pointer}.report-frame .factor-card .icon{font-size:14px;margin-bottom:2px}.report-frame .factor-card .name{font-size:12px;font-weight:700;color:#333;margin-bottom:2px}.report-frame .factor-card .kind{font-size:10px;color:#666;margin-bottom:6px;line-height:1.3}.report-frame .factor-card .strength-bar{height:6px;background:rgba(0,0,0,.06);border-radius:3px;overflow:hidden;margin:5px 0}.report-frame .factor-card .strength-fill{height:100%;border-radius:3px}.report-frame .factor-card .strength-label{font-size:10.5px;font-weight:700}.report-frame .factor-card .position{display:flex;justify-content:space-between;align-items:center;gap:6px;font-size:9.5px;color:#888;margin-top:6px;padding-top:6px;border-top:1px dashed rgba(0,0,0,.08)}.report-frame .factor-card .card-toggle{color:#aaa;font-size:13px;font-weight:700;line-height:1}.report-frame .factor-card .note{font-size:9.5px;color:#999;margin-top:4px;font-style:italic}.report-frame .factor-card .card-detail{display:none;font-size:10.5px;line-height:1.65;color:#555;margin-top:8px;padding-top:8px;border-top:1px dashed rgba(0,0,0,.08)}.report-frame .factor-card.expanded .card-detail{display:block}
.report-frame .factor-table{background:#fef9f6;padding:14px;border-radius:10px;margin:14px 0}.report-frame .factor-table h4{font-size:14px;line-height:1.5;margin:0 0 12px;color:#35424c}.report-frame .factor-row{display:grid;grid-template-columns:1fr;gap:12px}.report-frame .factor-positive,.report-frame .factor-negative{background:#fff;padding:16px 18px;border-radius:10px}.report-frame .factor-positive{border-left:4px solid #95C540}.report-frame .factor-negative{border-left:4px solid #d97757}.report-frame .factor-table .ftitle{display:block;font-size:14px;font-weight:800;margin-bottom:12px}.report-frame .factor-positive .ftitle{color:#5d8225}.report-frame .factor-negative .ftitle{color:#c84d20}.report-frame .factor-table ul{list-style:none;margin:0;padding:0}.report-frame .factor-table li{display:grid;grid-template-columns:13px minmax(0,1fr);column-gap:4px;row-gap:2px;align-items:start;font-size:13px;line-height:1.48;color:#46525d;margin:6px 0 11px;word-break:keep-all;overflow-wrap:normal}.report-frame .factor-table li span{word-break:keep-all;overflow-wrap:normal}.report-frame .factor-positive li::before{content:"✓";color:#95C540;font-weight:900;line-height:1.48}.report-frame .factor-negative li::before{content:"△";color:#d97757;font-weight:900;line-height:1.48}
.report-frame .factor-table .trace-note{display:inline-block;margin-top:2px;line-height:1.35;white-space:nowrap;word-break:keep-all;overflow-wrap:normal}.report-frame .factor-table .han{white-space:nowrap;word-break:keep-all;overflow-wrap:normal}
.report-frame .tip-box{background:linear-gradient(135deg,#f5f8e8 0%,#ecf4d5 100%);padding:14px;border-radius:12px;margin:16px 0;border:1px solid #d4e4a8}.report-frame .tip-box .tip-label{font-size:12px;color:#5d8225;font-weight:700;margin-bottom:10px}.report-frame .tip-box .tip-item{background:#fff;padding:12px 14px;border-radius:8px;margin:8px 0;border-left:3px solid #95C540;font-size:13px;line-height:1.72;color:#444}.report-frame .tip-box .tip-item strong,.report-frame .tip-box .tip-item b{display:block;font-size:14px;line-height:1.45;margin-bottom:8px;color:#5d8225}
.report-frame .strength-box,.report-frame .care-box{padding:14px 16px;border-radius:12px;margin:14px 0;background:#fff;border:1px solid rgba(212,169,107,.24)}
.report-frame .strength-box{border-left:4px solid #c44366}.report-frame .care-box{border-left:4px solid #95C540}
.report-frame .strength-box .title,.report-frame .care-box .title{font-size:14px;line-height:1.45;font-weight:800;margin-bottom:10px;color:#3f3438}
.report-frame .strength-box ul,.report-frame .care-box ul{margin:0;padding-left:18px}
.report-frame .strength-box li,.report-frame .care-box li{font-size:13px;line-height:1.72;color:#444;margin:6px 0}
.report-frame .tip-box .tip-title{font-size:13px;line-height:1.45;font-weight:800;margin-bottom:6px;color:#5d8225}
.report-frame .tip-box .tip-desc{font-size:13px;line-height:1.72;color:#444}
.report-frame .gunghap{background:#faf6f1;padding:18px;border-radius:14px;margin:18px 0;text-align:center}.report-frame .gunghap-summary{text-align:center;font-size:12px;color:#666;margin-top:14px;padding:12px 14px;background:#fff;border-radius:8px;line-height:1.7}
.report-frame .matrix-card{padding:14px 16px;border-radius:12px;margin:12px 0;font-family:"Noto Sans KR",Pretendard,-apple-system,BlinkMacSystemFont,sans-serif;color:#40505c}
.report-frame .matrix-card .header{font-size:14px;line-height:1.45;font-weight:800;color:#3b3430;margin-bottom:4px}
.report-frame .matrix-card .sub{font-size:12px;line-height:1.45;color:#6f7d86;margin-bottom:12px;font-weight:600}
.report-frame .matrix-card .body p{font-size:13px!important;line-height:1.78!important;color:#40505c!important}
.report-frame .matrix-card .body>div{font-size:12px!important;line-height:1.7!important}
.report-frame .matrix-card .body>div p{font-size:12px!important;line-height:1.7!important;color:inherit!important}
.report-frame .matrix-card .body>div strong{font-size:12.5px;line-height:1.45}
.report-frame .syn-card{background:linear-gradient(135deg,#fff5e8 0%,#fef0d8 100%);border-left:4px solid #d4a838}.report-frame .con-card{background:linear-gradient(135deg,#f5f5f7 0%,#eaeaef 100%);border-left:4px solid #8a8a9e}.report-frame .amb-card{background:linear-gradient(135deg,#fdf0e6 0%,#fae0c8 100%);border-left:4px solid #c4a578}
.youa-nav{position:fixed;left:50%;bottom:0;transform:translateX(-50%);width:100%;max-width:480px;z-index:20;background:rgba(255,247,249,.92);backdrop-filter:blur(14px);border-top:1px solid rgba(200,32,58,.16);padding:10px 14px calc(10px + env(safe-area-inset-bottom))}
.youa-nav-inner{max-width:480px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:10px}.youa-nav button{border:1px solid rgba(200,32,58,.28);background:#fff;color:#c8203a;border-radius:8px;padding:13px 10px;font-weight:700;font-size:13px}.youa-nav button:disabled{opacity:.35}
`;

function splitPages(html: string) {
  return html.match(/<div class="page(?:\s[^"]*|")[\s\S]*?(?=<div class="page(?:\s[^"]*|")|\s*$)/g) ?? [];
}

function normalizeHanjaSpacing(html: string) {
  let normalized = html;

  for (let i = 0; i < 4; i += 1) {
    normalized = normalized.replace(/([\u3400-\u9fff])\s+([\u3400-\u9fff])/g, "$1$2");
  }

  return normalized
    .replace(/\(([^()<>]{0,16})[.\u00b7]\s*([\u3400-\u9fff]+)\)\s*([\u3400-\u9fff]+)/g, "($1·$2$3)")
    .replace(/\(([^()<>]{0,16})\s+([\u3400-\u9fff]+)\)/g, "($1·$2)")
    .replace(/([가-힣])\s*[.]\s*([\u3400-\u9fff])/g, "$1·$2")
    .replace(/([가-힣])\s*\u00b7\s*([\u3400-\u9fff])/g, "$1·$2")
    .replace(/([\u3400-\u9fff]+)\s+오행/g, "$1 오행")
    .replace(/([가-힣])\s+오행/g, "$1 오행")
    .replace(/<br\/>\(([^<>()]+·<span class="han">[\u3400-\u9fff]+<\/span>[^()]*)\)/g, '<br/><span class="trace-note">($1)</span>');
}

function sanitizeReportHtml(html: string) {
  return normalizeHanjaSpacing(html)
    .replace(/\bundefined\b/g, "모름")
    .replace(/📊/g, '<span class="chapter-mini">1장</span>');
}

export default function YouaSlideReportResult() {
  const params = useSearchParams();
  const [result, setResult] = useState<ApiResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pageIdx, setPageIdx] = useState(0);
  const [tocOpen, setTocOpen] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const unlocked = params.get("unlocked") === "1";
  const [videoPlaying, setVideoPlaying] = useState(unlocked);

  const requestBody = useMemo(
    () => ({
      child: {
        name: params.get("childName") || "child",
        birthDate: params.get("childBirthDate") || "2020-01-01",
        gender: params.get("childGender") === "male" ? "male" : "female",
        hour: params.get("childHour") || UNKNOWN_HOUR,
      },
      mother: {
        name: params.get("motherName") || "mother",
        birthDate: params.get("motherBirthDate") || "1950-01-01",
        hour: params.get("motherHour") || UNKNOWN_HOUR,
      },
      father: {
        name: params.get("fatherName") || "father",
        birthDate: params.get("fatherBirthDate") || "1950-01-01",
        hour: params.get("fatherHour") || UNKNOWN_HOUR,
      },
    }),
    [params],
  );

  useEffect(() => {
    const id = "youa-report-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;1,400&family=Gowun+Batang:wght@400;700&family=Nanum+Myeongjo:wght@400;700;800&family=Noto+Serif+KR:wght@400;700&display=swap";
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    const win = window as unknown as {
      toggleFactorCard?: (el: HTMLElement) => void;
      toggleBipolarItem?: (el: HTMLElement) => void;
    };
    win.toggleFactorCard = (el) => {
      el.classList.toggle("expanded");
      const toggle = el.querySelector(".card-toggle");
      if (toggle) toggle.textContent = el.classList.contains("expanded") ? "⌃" : "⌄";
    };
    win.toggleBipolarItem = (el) => {
      el.classList.toggle("expanded");
      const toggle = el.querySelector(".bp-toggle");
      if (toggle) toggle.textContent = el.classList.contains("expanded") ? "⌃" : "⌄";
    };
  }, []);

  useEffect(() => {
    if (!unlocked) {
      setShowPay(true);
      return;
    }

    const controller = new AbortController();
    async function loadReport() {
      try {
        const response = await fetch("/api/youa-family-report", {
          method: "POST",
          headers: { "content-type": "application/json; charset=utf-8" },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });
        const json = (await response.json()) as ApiResult;
        if (!response.ok || !json.ok) throw new Error(json.error || `HTTP ${response.status}`);
        setResult(json);
      } catch (caught) {
        if (!controller.signal.aborted) {
          setError(caught instanceof Error ? caught.message : String(caught));
        }
      }
    }

    loadReport();
    return () => controller.abort();
  }, [requestBody, unlocked]);

  const reportHtml = useMemo(() => sanitizeReportHtml(result?.html ?? ""), [result?.html]);
  const pages = useMemo(() => splitPages(reportHtml), [reportHtml]);
  const total = pages.length || result?.summary?.pageCount || PAGE_TITLES.length;
  const currentHtml = pages[pageIdx] ?? "";
  const pageTitle = displayChapter(pageIdx);
  const tocIndexes = useMemo(() => tocEntries(total), [total]);

  function movePage(delta: number) {
    setPageIdx((current) => Math.min(Math.max(current + delta, 0), Math.max(total - 1, 0)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function jumpTo(index: number) {
    setPageIdx(index);
    setTocOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handlePayment(finalPrice: number) {
    const PortOne = (await import("@portone/browser-sdk/v2")).default;
    const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID;
    const channelKey = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY;
    if (!storeId || !channelKey) {
      alert("결제 설정이 누락되었습니다. 관리자에게 문의해주세요.");
      throw new Error("PortOne env missing");
    }

    const paymentId = `youa${Date.now()}${Math.random().toString(36).slice(2, 10)}`;
    const response = await PortOne.requestPayment({
      storeId,
      channelKey,
      paymentId,
      orderName: "사주로 풀어보는 우리 아이 마음",
      totalAmount: finalPrice,
      currency: "CURRENCY_KRW",
      payMethod: "CARD",
    } as Parameters<typeof PortOne.requestPayment>[0]);

    if (response?.code !== undefined) {
      if (response.code !== "USER_CANCEL") alert(response.message || "결제가 취소되었습니다.");
      throw new Error(response.message || "결제 취소");
    }

    const verifyResponse = await fetch("/api/portone/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId }),
    });
    const verify = await verifyResponse.json();
    if (!verify.success) throw new Error(verify.error || "결제 검증 실패");

    const url = new URL(window.location.href);
    url.searchParams.set("unlocked", "1");
    url.searchParams.set("paymentId", paymentId);
    window.location.href = url.toString();
  }

  async function handleFreeUnlock(couponCode: string) {
    const response = await fetch("/api/coupon/free-unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: couponCode }),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error || "쿠폰 적용 실패");

    const url = new URL(window.location.href);
    url.searchParams.set("unlocked", "1");
    url.searchParams.set("paymentId", data.paymentId || "coupon");
    window.location.href = url.toString();
  }

  return (
    <div className="youa-root">
      <style dangerouslySetInnerHTML={{ __html: REPORT_CSS }} />
      <div className="youa-shell">
        <div className="youa-top">
          <Link href="/love/youa/form">Back</Link>
          <div className="youa-title">
            {pageTitle}
            <small>
              {displayCount(pageIdx, total)}
            </small>
          </div>
          <button className="youa-toc-button" onClick={() => setTocOpen(true)}>
            목차
          </button>
        </div>

        {tocOpen && (
          <>
            <div className="youa-toc-backdrop" onClick={() => setTocOpen(false)} />
            <div className="youa-toc-panel">
              <div className="youa-toc-head">
                <span>목차</span>
                <button onClick={() => setTocOpen(false)}>×</button>
              </div>
              {tocIndexes.map((index) => (
                <button
                  key={index}
                  className={`youa-toc-item${index === pageIdx ? " active" : ""}`}
                  onClick={() => jumpTo(index)}
                >
                  <span>
                    {displayChapter(index)}
                  </span>
                  {index === pageIdx && <span>✓</span>}
                </button>
              ))}
            </div>
          </>
        )}

        {!result && !error && (
          <div className="report-frame">
            <div className="page cover">
              <div className="title">보고서를 준비하고 있습니다</div>
              <div className="subtitle">결제 후 영상이 끝나면 결과가 열립니다</div>
            </div>
          </div>
        )}

        {error && (
          <div className="report-frame">
            <div className="page cover">
              <div className="title">보고서를 불러오지 못했습니다</div>
              <div className="subtitle">{error}</div>
            </div>
          </div>
        )}

        {currentHtml && <div className="report-frame" dangerouslySetInnerHTML={{ __html: currentHtml }} />}
      </div>

      {showPay && !unlocked && (
        <PaymentModal
          open
          onClose={() => setShowPay(false)}
          price={YOUA_PRICE}
          goodsName="사주로 풀어보는 우리 아이 마음"
          onSubmit={handlePayment}
          onFreeUnlock={handleFreeUnlock}
        />
      )}

      {videoPlaying && (
        <OpeningVideo
          src="/opening-jadoin.mp4"
          dataReady={Boolean(result) || Boolean(error)}
          loadProgress={result || error ? 1 : 0.45}
          onComplete={() => setVideoPlaying(false)}
          loadingMessage="보고서 자료를 불러오는 중"
          postVideoLoadingMessages={["자료 확인 중", "보고서 구성 중", "거의 다 됐어요"]}
        />
      )}

      <div className="youa-nav">
        <div className="youa-nav-inner">
          <button onClick={() => movePage(-1)} disabled={pageIdx === 0}>
            ← 이전 챕터
          </button>
          <button onClick={() => movePage(1)} disabled={pageIdx >= total - 1}>
            다음 챕터 →
          </button>
        </div>
      </div>
    </div>
  );
}
