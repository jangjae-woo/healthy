"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import ChapterShell from "@/components/inyeon/ChapterShell";
import SajuTable from "@/components/inyeon/SajuTable";
import OhaengChart from "@/components/inyeon/OhaengChart";
import YongsinCards from "@/components/inyeon/YongsinCards";
import SinKangBar from "@/components/inyeon/SinKangBar";
import ScoreGauge from "@/components/inyeon/ScoreGauge";
import SeasonGrid from "@/components/inyeon/SeasonGrid";
import SipseongRow from "@/components/inyeon/SipseongRow";
import AssetCurve from "@/components/inyeon/AssetCurve";
import {
  RELATIONSHIP_LABEL, DURATION_LABEL,
  RelationshipKind, MeetDuration,
} from "@/lib/inyeon/types";
import { FEMALE_META, MALE_META } from "@/lib/inyeon/character-match";
import { renderParagraphs } from "@/lib/inline-emphasis";
import OpeningVideo from "@/components/OpeningVideo";

const ACCENT = "#f0a8b8";
const BG = "#2a1a1d";

interface PersonData {
  pillars: {
    year: { stem: string; branch: string };
    month: { stem: string; branch: string };
    day: { stem: string; branch: string };
    hour: { stem: string; branch: string } | null;
  };
  ilgan: string;
  sipseong: {
    year: { stem: string; branch: string };
    month: { stem: string; branch: string };
    day: { stem: string; branch: string };
    hour: { stem: string; branch: string } | null;
  };
  elements: { 목: number; 화: number; 토: number; 금: number; 수: number };
  yongsin: string;
  sinsal: string[];
  shinkang: "극약" | "태약" | "신약" | "중화" | "신강" | "태강" | "극왕";
  ohaengTop: string;
  ohaengWeak: string;
}
interface CharacterMatchData {
  name: string;
  innerImage: string;
  signal: string;
  color: string;
  enLabel: string;
}
interface InyeonComputeData {
  a: PersonData;
  b: PersonData;
  character?: {
    a: CharacterMatchData;
    b: CharacterMatchData;
    pair: { label: string; tone: string } | null;
  };
  compat: {
    score: number; scoreLabel: string;
    ilganRelation: string; ilganDetail: string;
    sharedSinsal: string[];
    strengths: string[]; weaknesses: string[];
  };
  scores: {
    inyeon: number; seonggyeok: number; emotion: number;
    physical: number; finance: number; marriage: number;
    labels: Record<"inyeon" | "seonggyeok" | "emotion" | "physical" | "finance" | "marriage", string>;
  };
  curves: {
    a: { phase: "초년기" | "청년기" | "중년기" | "말년기"; value: number }[];
    b: { phase: "초년기" | "청년기" | "중년기" | "말년기"; value: number }[];
    together: { phase: "초년기" | "청년기" | "중년기" | "말년기"; value: number }[];
  };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2
        className="text-base font-bold mb-3 pl-3"
        style={{
          color: "#2a1722",
          fontFamily: "'Nanum Myeongjo', 'Noto Serif KR', serif",
          borderLeft: `3px solid #c8203a`,
        }}
      >
        {title}
      </h2>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

function SubSection({ title, body }: { title: string; body: string }) {
  return (
    <div
      className="rounded-md p-6"
      style={{
        background: "linear-gradient(180deg, rgba(255,251,247,0.95) 0%, rgba(253,243,232,0.88) 100%)",
        border: `1px solid rgba(212,169,107,0.4)`,
        boxShadow: `0 8px 24px -12px rgba(178,40,71,0.14)`,
      }}
    >
      <div
        className="text-[17px] font-bold mb-3 leading-relaxed"
        style={{ color: "#6b1e3a", fontFamily: "'Nanum Myeongjo', serif", paddingTop: 2 }}
      >
        {title}
      </div>
      <div
        className="text-[15px] leading-[2.0]"
        style={{ color: "#1a0a14", fontFamily: "'Gowun Batang', serif", fontWeight: 400 }}
      >
        {renderParagraphs(body, "#b88646")}
      </div>
    </div>
  );
}

// 캐릭터 풍부 데이터 — 시그너처·태그·본문·강점·살펴볼 자리·어울리는 결
interface CharacterRich {
  signature: string;     // 한 줄 시그너처 카피
  tags: string[];        // 키워드 태그 3~4개
  detail: string;        // 본문 설명 2~3줄
  strengths: string[];   // 강점 3개
  watchout: string[];    // 살펴볼 자리 2개
  chemistry: string;     // 어울리는 결 한 줄
}

const CHARACTER_RICH: Record<string, CharacterRich> = {
  옥순: {
    signature: "마음에 들면 망설임 없이 직진하는 결",
    tags: ["#솔직", "#직진", "#불꽃", "#자유분방"],
    detail: "솔직하고 직진하는 결의 사람이에요. 마음에 들면 망설임이 없고, 표현이 풍부해서 함께 있을 때 분위기가 환해져요. 자기 결이 분명해 한 번 정한 마음은 잘 흔들리지 않아요.",
    strengths: ["감정을 숨기지 않는 솔직함", "강한 추진력과 결단", "함께 있을 때 분위기를 환하게 함"],
    watchout: ["속도가 너무 빨라 상대가 따라잡기 어려울 때", "한 번 식으면 회복이 더디는 결"],
    chemistry: "받쳐주고 차분한 결의 영수·광수와 가장 잘 어우러져요",
  },
  현숙: {
    signature: "차가워 보이지만 속은 단단한 도시적 결",
    tags: ["#시크", "#완벽주의", "#도시적", "#차도녀"],
    detail: "쿨하고 시크한 도시적 매력이 있는 사람이에요. 겉은 차분해 보이지만 속은 단단하고, 자기 기준이 분명해요. 가까워질수록 그 안의 다정함이 보이는 결이에요.",
    strengths: ["분명한 자기 기준과 안목", "감정에 휩쓸리지 않는 절제력", "세련된 매력의 결"],
    watchout: ["처음 다가오는 사람에게 차가워 보일 수 있음", "기준이 너무 높아 까다로워 보일 때"],
    chemistry: "편안하게 풀어주는 영호·상철과 만나면 가장 부드러워져요",
  },
  정숙: {
    signature: "흔들림 없이 자기 길을 가는 강단의 결",
    tags: ["#강단", "#성숙", "#안정", "#차분"],
    detail: "성숙하고 강단 있는 결의 사람이에요. 흔들림 없이 자기 길을 가는 차분함이 매력이에요. 가벼운 만남보다는 깊고 안정된 관계를 자연스럽게 만들어가는 결이에요.",
    strengths: ["흔들리지 않는 자기 결의 안정감", "성숙한 판단력", "오래 기댈 수 있는 신뢰"],
    watchout: ["표현이 적어 마음이 닿는 데 시간이 걸림", "변화에 다소 보수적일 수 있음"],
    chemistry: "광수·영수와 만나면 가장 깊고 안정된 결이 펼쳐져요",
  },
  순자: {
    signature: "표현이 풍부하고 일상이 즐거워지는 애교의 결",
    tags: ["#애교", "#발랄", "#감수성", "#마이웨이"],
    detail: "발랄하고 애교 있는 감수성의 사람이에요. 표현이 풍부하고 활기찬 매력이 있어요. 함께 있으면 일상이 즐거워지는 결이에요.",
    strengths: ["감정을 자연스럽게 표현하는 결", "활기와 위트로 분위기를 살림", "감수성이 풍부한 다정함"],
    watchout: ["기분에 따라 결이 자주 바뀜", "혼자 결정하는 자리에서 흔들리기 쉬움"],
    chemistry: "광수·영수와 만나면 활기가 깊이를 깨워주는 결이 돼요",
  },
  영숙: {
    signature: "상대를 자연스럽게 챙기는 다정한 결",
    tags: ["#참한", "#다정", "#부드러움", "#배려"],
    detail: "참하고 다정한 결의 사람이에요. 상대를 자연스럽게 챙기고 분위기를 부드럽게 만드는 매력이 있어요. 따뜻하고 받아주는 결이에요.",
    strengths: ["상대 마음을 자연스럽게 헤아리는 다정함", "분위기를 부드럽게 만드는 결", "오래 함께해도 편안한 결"],
    watchout: ["자기 의견을 못 내고 맞춰주기만 할 때", "혼자 짊어지는 결의 무거움"],
    chemistry: "영철·영수와 만나면 가장 평화롭고 따뜻한 결이 돼요",
  },
  영자: {
    signature: "어떤 자리에서도 편안한 균형의 결",
    tags: ["#무난", "#균형", "#일상적", "#편안"],
    detail: "무난하고 따스한 일상의 결을 가진 사람이에요. 균형 잡힌 사주로 어떤 자리에서도 편안한 매력이 있어요. 평범함 속의 깊이가 매력 포인트예요.",
    strengths: ["어떤 자리에서도 자연스럽게 어우러짐", "흔들림 없는 일상의 결", "부담 없이 다가갈 수 있는 매력"],
    watchout: ["눈에 띄는 매력이 약하다고 느껴질 때", "결정의 순간 미루기 쉬운 결"],
    chemistry: "상철과 만나면 가장 부담 없고 평온한 결이 돼요",
  },
  영철: {
    signature: "자연스러운 자신감으로 분위기를 환하게 하는 결",
    tags: ["#자신감", "#솔직", "#활기", "#매력적"],
    detail: "자연스러운 자신감과 매력이 있는 사람이에요. 솔직하고 활기차며, 표현에 거침이 없어요. 함께 있으면 분위기가 환해지는 결이에요.",
    strengths: ["자신감 있는 결로 사람을 끌어당김", "솔직하고 거침없는 표현력", "활기로 분위기를 살리는 매력"],
    watchout: ["속도가 빨라 상대가 부담스러울 수 있음", "감정이 너무 직접적으로 드러날 때"],
    chemistry: "정숙·영숙과 만나면 단단함과 따뜻함의 균형이 좋아요",
  },
  영식: {
    signature: "착실·정성으로 사람을 단단히 챙기는 모범생 결",
    tags: ["#착실", "#정성", "#세심", "#바른생활"],
    detail: "착실하고 정성스러운 결의 사람이에요. 약속을 지키고 세심히 챙기는 모범생 같은 매력이 있어요. 화려하지 않지만 오래 함께해도 마음이 편안한 결이에요.",
    strengths: ["약속과 책임을 지키는 단단한 신뢰", "세심히 챙기는 정성", "감정의 결이 안정적이라 마음이 편함"],
    watchout: ["표현이 약해 마음이 닿는 데 시간 걸릴 때", "원칙에 너무 엄격해 보일 수 있음"],
    chemistry: "발랄·표현 풍부한 순자·옥순과 만나면 가장 균형 잘 맞는 결이에요",
  },
  영호: {
    signature: "사람을 자연스럽게 끌어당기는 인싸의 결",
    tags: ["#포용력", "#인싸", "#사교적", "#점잖음"],
    detail: "포용력 있고 외향적인 인싸형이에요. 사람을 자연스럽게 끌어당기는 사교 매력이 있고, 모임 안에서 가장 빛나는 결이에요. 점잖은 면도 함께 가지고 있어요.",
    strengths: ["사람들 안에서 가장 빛나는 사교성", "포용력 있는 따뜻한 결", "활기와 점잖음의 균형"],
    watchout: ["혼자만의 시간이 부족할 때 지치는 결", "여러 사람에게 친절해 오해를 받기 쉬움"],
    chemistry: "현숙·순자와 만나면 가장 활기 넘치는 결이 돼요",
  },
  광수: {
    signature: "신중하게 마음을 여는 진중한 결",
    tags: ["#이지적", "#진중", "#깊이", "#신중"],
    detail: "이지적이고 진중한 깊이의 사람이에요. 신중하게 마음을 여는 결이라 처음엔 조용해 보이지만, 가까워질수록 그 안의 깊이가 매력으로 다가와요.",
    strengths: ["깊이 있는 사색과 통찰", "신중하고 흔들림 없는 결", "한 번 마음 주면 길게 가는 신뢰"],
    watchout: ["감정 표현이 더뎌 답답하게 느껴질 때", "혼자 짊어지고 가는 무거움"],
    chemistry: "옥순·순자의 활기가 깊이를 깨워주는 결이에요",
  },
  영수: {
    signature: "흔들림 없는 안정감으로 마음이 편해지는 결",
    tags: ["#중후", "#든든", "#안정", "#신뢰"],
    detail: "중후하고 든든한 결의 사람이에요. 흔들림 없는 안정감이 매력이에요. 함께 있으면 마음이 편해지고, 오래 기댈 수 있는 결이에요.",
    strengths: ["흔들리지 않는 든든한 결", "오래 함께할 수 있는 안정감", "묵묵히 받쳐주는 신뢰"],
    watchout: ["표현이 적어 마음이 닿는 데 시간이 걸림", "변화나 새로움에 다소 무딘 결"],
    chemistry: "정숙·옥순과 만나면 가장 안정되고 균형 좋은 결이 돼요",
  },
  상철: {
    signature: "어디서든 편안하게 어우러지는 균형의 결",
    tags: ["#편안", "#무난", "#밸런스", "#부담없음"],
    detail: "편안하고 부담 없는 균형의 결을 가진 사람이에요. 어떤 자리에서도 자연스럽게 어우러지는 매력이 있어요. 일상을 함께 가꾸기 좋은 결이에요.",
    strengths: ["부담 없이 다가갈 수 있는 편안함", "어떤 결과도 잘 어우러지는 균형", "일상을 함께 가꾸기 좋은 결"],
    watchout: ["눈에 띄는 매력이 약하다고 느껴질 때", "강한 결을 가진 사람과 부딪히면 흐려지기 쉬움"],
    chemistry: "현숙의 강함을 부드럽게 풀어주는 자리에 가장 잘 맞아요",
  },
};

// ─── 11명 캐릭터 라인업 (포켓몬 효과) ───
const FEMALE_LINEUP = ["옥순", "현숙", "정숙", "순자", "영숙", "영자"] as const;
const MALE_LINEUP = ["영철", "영식", "영호", "광수", "영수", "상철"] as const;

// ─── 일간 한자 + 자연 비유 (Ceremony용) ───
const ILGAN_HANJA: Record<string, string> = {
  갑: "甲", 을: "乙", 병: "丙", 정: "丁", 무: "戊",
  기: "己", 경: "庚", 신: "辛", 임: "壬", 계: "癸",
};
const ILGAN_NATURE: Record<string, string> = {
  갑: "곧게 뻗는 큰 나무",
  을: "유연하게 휘는 풀",
  병: "한낮의 태양",
  정: "따뜻한 등불",
  무: "광활한 큰 산",
  기: "곡식을 품은 옥토",
  경: "단단한 강철",
  신: "빛나는 보석",
  임: "끝없이 흐르는 큰 강",
  계: "조용히 스미는 이슬",
};

function CharacterLineup({ highlightName, gender }: { highlightName: string; gender: "여" | "남" }) {
  const lineup = gender === "여" ? FEMALE_LINEUP : MALE_LINEUP;
  const meta = (gender === "여" ? FEMALE_META : MALE_META) as Record<string, { color: string; innerImage: string; enLabel: string }>;
  return (
    <div className="grid grid-cols-6 gap-1.5">
      {lineup.map((name) => {
        const m = meta[name];
        const isMe = name === highlightName;
        return (
          <div
            key={name}
            className="flex flex-col items-center py-2 rounded transition-all"
            style={{
              background: isMe ? `${m.color}22` : "transparent",
              border: isMe ? `1.5px solid ${m.color}` : `1px solid rgba(212,169,107,0.25)`,
            }}
          >
            <div
              className="text-[11px] mb-0.5"
              style={{
                color: isMe ? m.color : "#2a1722",
                fontFamily: "'Nanum Myeongjo', serif",
                fontWeight: 800,
              }}
            >
              {name}
            </div>
            {isMe && <div className="text-[7px]" style={{ color: m.color }}>●</div>}
          </div>
        );
      })}
    </div>
  );
}

// ─── 공유 카드 캡처 영역 (html2canvas로 이미지 변환) ───
function ShareableCard({
  aName, bName, character, captureRef,
}: {
  aName: string; bName: string;
  character: NonNullable<InyeonComputeData["character"]>;
  captureRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { a, b, pair } = character;
  const aRich = CHARACTER_RICH[a.name] ?? null;
  const bRich = CHARACTER_RICH[b.name] ?? null;
  const aDetail = aRich?.detail ?? a.innerImage;
  const bDetail = bRich?.detail ?? b.innerImage;
  const thread = "#c8203a";
  const gold = "#b88646";
  const plumDeep = "#6b1e3a";
  const inkSoft = "#1a0a14";
  return (
    <div
      ref={captureRef}
      style={{
        position: "fixed", left: "-9999px", top: 0,
        width: 540, padding: 32,
        background: `
          radial-gradient(ellipse at 30% 0%, #ffe1ea 0%, transparent 55%),
          radial-gradient(ellipse at 70% 100%, #fff0d6 0%, transparent 60%),
          linear-gradient(180deg, #fff7f9 0%, #ffeef3 60%, #fce4d6 100%)
        `,
        fontFamily: "'Noto Serif KR', 'Gowun Batang', serif",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ color: gold, fontSize: 11, letterSpacing: "0.4em", fontFamily: "'Cormorant Garamond', serif" }}>
          紅 絲 · RED THREAD
        </div>
        <div style={{ color: thread, fontSize: 13, letterSpacing: "0.3em", marginTop: 6 }}>
          홍실 인연
        </div>
      </div>
      {pair && (
        <div style={{ textAlign: "center", padding: "16px 12px", borderTop: `1px solid rgba(212,169,107,0.3)`, borderBottom: `1px solid rgba(212,169,107,0.3)`, marginBottom: 18 }}>
          <h3 style={{
            fontSize: 22, fontWeight: 800,
            backgroundImage: `linear-gradient(180deg, ${plumDeep} 0%, ${thread} 100%)`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            fontFamily: "'Nanum Myeongjo', serif",
          }}>
            "{pair.label}"
          </h3>
          {pair.tone && (
            <div style={{ fontSize: 12, color: inkSoft, marginTop: 8, fontFamily: "'Gowun Batang', serif" }}>{pair.tone}</div>
          )}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div style={{ padding: 16, borderRadius: 6, background: `linear-gradient(135deg, ${a.color}1a, ${a.color}05)`, border: `1px solid ${a.color}66`, textAlign: "center" }}>
          <div style={{ fontSize: 11, color: inkSoft, fontFamily: "'Gowun Batang', serif" }}>{aName}님은</div>
          <div style={{ fontSize: 38, fontWeight: 900, color: a.color, fontFamily: "'Nanum Myeongjo', serif", letterSpacing: "0.05em", lineHeight: 1, margin: "6px 0" }}>{a.name}</div>
          <div style={{ fontSize: 12, color: "#6b1e3a", letterSpacing: "0.1em", fontFamily: "'Nanum Myeongjo', serif", fontWeight: 700 }}>스타일</div>
          <div style={{ fontSize: 11, color: inkSoft, marginTop: 10, paddingTop: 8, borderTop: `1px solid ${a.color}33`, lineHeight: 1.7, fontFamily: "'Gowun Batang', serif" }}>{aDetail}</div>
        </div>
        <div style={{ padding: 16, borderRadius: 6, background: `linear-gradient(135deg, ${b.color}1a, ${b.color}05)`, border: `1px solid ${b.color}66`, textAlign: "center" }}>
          <div style={{ fontSize: 11, color: inkSoft, fontFamily: "'Gowun Batang', serif" }}>{bName}님은</div>
          <div style={{ fontSize: 38, fontWeight: 900, color: b.color, fontFamily: "'Nanum Myeongjo', serif", letterSpacing: "0.05em", lineHeight: 1, margin: "6px 0" }}>{b.name}</div>
          <div style={{ fontSize: 12, color: "#6b1e3a", letterSpacing: "0.1em", fontFamily: "'Nanum Myeongjo', serif", fontWeight: 700 }}>스타일</div>
          <div style={{ fontSize: 11, color: inkSoft, marginTop: 10, paddingTop: 8, borderTop: `1px solid ${b.color}33`, lineHeight: 1.7, fontFamily: "'Gowun Batang', serif" }}>{bDetail}</div>
        </div>
      </div>
      <div style={{ textAlign: "center", paddingTop: 16, borderTop: `1px solid rgba(212,169,107,0.3)` }}>
        <div style={{ fontSize: 13, color: thread, fontFamily: "'Nanum Myeongjo', serif", fontWeight: 700, letterSpacing: "0.1em" }}>
          paljawon.com / love
        </div>
        <div style={{ fontSize: 10, color: gold, letterSpacing: "0.2em", marginTop: 4, fontFamily: "'Cormorant Garamond', serif" }}>
          사주가 읽어주는 인연
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// RevealCeremony — 결과 발표 빌드업 5막 (8초)
// Act 1 (0~2s): 분석 중 + 한자 흩날림
// Act 2 (2~4s): 일간 단서 펼침
// Act 3 (4~7s): 캐릭터 슬롯 회전 (점점 느려짐)
// Act 4 (7~8s): 정적 + BIG REVEAL
// Act 5 (8s~): 자동 dismiss
// ════════════════════════════════════════════════════════════════════
function RevealCeremony({
  aName, bName, character, aIlganHanja, bIlganHanja, aIlganNature, bIlganNature, aGender, bGender, onComplete,
}: {
  aName: string;
  bName: string;
  character: NonNullable<InyeonComputeData["character"]>;
  aIlganHanja: string;
  bIlganHanja: string;
  aIlganNature: string;
  bIlganNature: string;
  aGender: "여" | "남";
  bGender: "여" | "남";
  onComplete: () => void;
}) {
  const [act, setAct] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [aSlotIdx, setASlotIdx] = useState(0);
  const [bSlotIdx, setBSlotIdx] = useState(0);
  const aLineup = aGender === "여" ? FEMALE_LINEUP : MALE_LINEUP;
  const bLineup = bGender === "여" ? FEMALE_LINEUP : MALE_LINEUP;
  const aMeta = (aGender === "여" ? FEMALE_META : MALE_META) as Record<string, { color: string; innerImage: string; enLabel: string }>;
  const bMeta = (bGender === "여" ? FEMALE_META : MALE_META) as Record<string, { color: string; innerImage: string; enLabel: string }>;

  const thread = "#c8203a";
  const plumDeep = "#6b1e3a";
  const gold = "#b88646";
  const cream = "#fbf3e8";

  // 타이밍 — 모바일 친화 8초 빌드업
  useEffect(() => {
    const t1 = setTimeout(() => setAct(1), 100);    // Act 1 시작
    const t2 = setTimeout(() => setAct(2), 2000);   // Act 2 — 일간 단서
    const t3 = setTimeout(() => setAct(3), 4000);   // Act 3 — 슬롯 회전
    const t4 = setTimeout(() => setAct(4), 7000);   // Act 4 — REVEAL
    const t5 = setTimeout(() => onComplete(), 9500); // Auto dismiss
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); };
  }, [onComplete]);

  // 슬롯 회전 — Act 3 동안 빠르게 → 점점 느리게
  useEffect(() => {
    if (act < 3) return;
    if (act >= 4) return;
    let aLast = 0; let bLast = 0;
    let aSpeed = 80; let bSpeed = 90;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      // 점점 느리게 (0~3000ms 동안)
      aSpeed = 80 + (elapsed / 3000) * 200;
      bSpeed = 90 + (elapsed / 3000) * 200;
      if (Date.now() - aLast > aSpeed) {
        setASlotIdx((i) => (i + 1) % aLineup.length);
        aLast = Date.now();
      }
      if (Date.now() - bLast > bSpeed) {
        setBSlotIdx((i) => (i + 1) % bLineup.length);
        bLast = Date.now();
      }
      if (act === 3 && elapsed < 3000) requestAnimationFrame(tick);
    };
    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [act, aLineup.length, bLineup.length]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6 overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse at 30% 20%, rgba(255,225,234,0.95) 0%, transparent 60%),
          radial-gradient(ellipse at 70% 80%, rgba(255,240,214,0.95) 0%, transparent 60%),
          linear-gradient(180deg, #fff7f9 0%, #ffeef3 50%, #fce4d6 100%)
        `,
        animation: "fadeIn 0.6s ease",
        fontFamily: "'Noto Serif KR', 'Gowun Batang', serif",
      }}
    >
      {/* 한자 배경 흩날림 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"].map((h, i) => (
          <div
            key={h}
            className="absolute select-none"
            style={{
              left: `${(i * 13 + 7) % 95}%`,
              top: `${(i * 19 + 11) % 90}%`,
              fontSize: 32 + (i % 3) * 14,
              color: i % 2 === 0 ? `${thread}22` : `${gold}33`,
              fontFamily: "'Nanum Myeongjo', serif",
              fontWeight: 800,
              opacity: act === 1 ? 0.9 : act === 2 ? 0.5 : act === 3 ? 0.3 : act === 4 ? 0.2 : 0,
              transform: `rotate(${(i * 23) % 30 - 15}deg) translateY(${act === 1 ? 0 : -15}px)`,
              transition: "opacity 1.2s ease, transform 1.5s ease",
            }}
          >
            {h}
          </div>
        ))}
      </div>

      {/* 스킵 버튼 */}
      <button
        onClick={onComplete}
        className="absolute top-5 right-5 text-[11px] px-3 py-1.5 rounded-full z-10"
        style={{
          background: "rgba(255,255,255,0.7)",
          border: `1px solid rgba(212,169,107,0.5)`,
          color: plumDeep,
          fontFamily: "'Cormorant Garamond', serif",
          letterSpacing: "0.15em",
        }}
      >
        skip ›
      </button>

      {/* Act 1 — 분석 중 */}
      <div
        className="relative z-10 text-center"
        style={{
          opacity: act === 1 ? 1 : 0,
          transform: act === 1 ? "translateY(0)" : "translateY(-20px)",
          transition: "opacity 0.8s ease, transform 0.8s ease",
          position: act === 1 ? "relative" : "absolute",
        }}
      >
        <div
          className="text-[12px] tracking-[0.5em] mb-6"
          style={{ color: gold, fontFamily: "'Cormorant Garamond', serif" }}
        >
          紅 絲
        </div>
        <div
          className="text-[18px] font-bold leading-relaxed"
          style={{ color: plumDeep, fontFamily: "'Nanum Myeongjo', serif" }}
        >
          두 분의 사주를<br />펼치는 중…
        </div>
        <div className="flex justify-center gap-1.5 mt-6">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 6, height: 6, borderRadius: "50%",
                background: thread,
                animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Act 2 — 일간 단서 */}
      <div
        className="relative z-10 text-center max-w-xs"
        style={{
          opacity: act === 2 ? 1 : 0,
          transform: act === 2 ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.7s ease, transform 0.8s ease",
          position: act === 2 ? "relative" : "absolute",
        }}
      >
        <div
          className="text-[12px] tracking-[0.4em] mb-5"
          style={{ color: gold, fontFamily: "'Cormorant Garamond', serif" }}
        >
          THE READING
        </div>
        <div
          className="space-y-3"
          style={{ fontFamily: "'Gowun Batang', serif" }}
        >
          <div className="text-[14px]" style={{ color: plumDeep, lineHeight: 1.8 }}>
            <span style={{ fontWeight: 700 }}>{aName}</span>님의 일간 ─{" "}
            <span style={{ color: thread, fontWeight: 800, fontFamily: "'Nanum Myeongjo', serif", fontSize: 18 }}>
              {aIlganHanja}
            </span>
            <div className="text-[11px] mt-0.5" style={{ color: "#1a0a14" }}>{aIlganNature}</div>
          </div>
          <div className="text-[14px]" style={{ color: plumDeep, lineHeight: 1.8 }}>
            <span style={{ fontWeight: 700 }}>{bName}</span>님의 일간 ─{" "}
            <span style={{ color: thread, fontWeight: 800, fontFamily: "'Nanum Myeongjo', serif", fontSize: 18 }}>
              {bIlganHanja}
            </span>
            <div className="text-[11px] mt-0.5" style={{ color: "#1a0a14" }}>{bIlganNature}</div>
          </div>
        </div>
      </div>

      {/* Act 3 — 슬롯 회전 */}
      <div
        className="relative z-10 text-center"
        style={{
          opacity: act === 3 ? 1 : 0,
          transform: act === 3 ? "scale(1)" : "scale(0.95)",
          transition: "opacity 0.6s ease, transform 0.6s ease",
          position: act === 3 ? "relative" : "absolute",
        }}
      >
        <div
          className="text-[12px] tracking-[0.4em] mb-6"
          style={{ color: gold, fontFamily: "'Cormorant Garamond', serif" }}
        >
          {aGender === "여" ? "여자 6 캐릭터" : "남자 6 캐릭터"} · {bGender === "여" ? "여자 6 캐릭터" : "남자 6 캐릭터"} 중에서
        </div>
        <div className="space-y-4">
          <div className="text-[12px]" style={{ color: "#1a0a14", fontFamily: "'Gowun Batang', serif" }}>
            {aName}님은…
          </div>
          <div
            className="text-[44px] font-black leading-none"
            style={{
              color: aMeta[aLineup[aSlotIdx]]?.color ?? thread,
              fontFamily: "'Nanum Myeongjo', serif",
              letterSpacing: "0.05em",
              transition: "color 0.05s linear",
            }}
          >
            {aLineup[aSlotIdx]}
          </div>
          <div className="text-[12px] mt-4" style={{ color: "#1a0a14", fontFamily: "'Gowun Batang', serif" }}>
            {bName}님은…
          </div>
          <div
            className="text-[44px] font-black leading-none"
            style={{
              color: bMeta[bLineup[bSlotIdx]]?.color ?? thread,
              fontFamily: "'Nanum Myeongjo', serif",
              letterSpacing: "0.05em",
              transition: "color 0.05s linear",
            }}
          >
            {bLineup[bSlotIdx]}
          </div>
        </div>
      </div>

      {/* Act 4 — BIG REVEAL */}
      <div
        className="relative z-10 text-center"
        style={{
          opacity: act === 4 ? 1 : 0,
          transform: act === 4 ? "scale(1)" : "scale(0.7)",
          transition: "opacity 0.5s ease, transform 0.6s cubic-bezier(.2,1.4,.4,1)",
          position: act === 4 ? "relative" : "absolute",
        }}
      >
        <div
          className="text-[11px] tracking-[0.5em] mb-3"
          style={{ color: thread, fontFamily: "'Cormorant Garamond', serif" }}
        >
          REVEALED
        </div>
        <div
          className="text-[13px] mb-6"
          style={{ color: plumDeep, fontFamily: "'Nanum Myeongjo', serif" }}
        >
          {aName}님은
        </div>
        <div
          className="text-[68px] font-black leading-none mb-3"
          style={{
            color: character.a.color,
            fontFamily: "'Nanum Myeongjo', serif",
            letterSpacing: "0.05em",
            textShadow: `0 4px 20px ${character.a.color}66`,
          }}
        >
          {character.a.name}
        </div>
        <div
          className="text-[13px] mb-6 mt-8"
          style={{ color: plumDeep, fontFamily: "'Nanum Myeongjo', serif" }}
        >
          {bName}님은
        </div>
        <div
          className="text-[68px] font-black leading-none mb-4"
          style={{
            color: character.b.color,
            fontFamily: "'Nanum Myeongjo', serif",
            letterSpacing: "0.05em",
            textShadow: `0 4px 20px ${character.b.color}66`,
          }}
        >
          {character.b.name}
        </div>
        {character.pair && (
          <div
            className="text-[13px] mt-8 px-6 py-2 rounded-full inline-block"
            style={{
              background: `linear-gradient(135deg, ${thread}10, ${plumDeep}05)`,
              border: `1px solid ${thread}55`,
              color: plumDeep,
              fontFamily: "'Gowun Batang', serif",
            }}
          >
            "{character.pair.label}"
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes pulse { 0%,100% { opacity: 0.3; transform: scale(0.85) } 50% { opacity: 1; transform: scale(1.1) } }
      `}} />
    </div>
  );
}

// 풍부한 캐릭터 카드 — 시그너처 + 태그 + 본문 + 강점·살펴볼 자리 + 어울리는 결
function RichCharCard({
  name, match, rich, detailFallback,
}: {
  name: string;
  match: CharacterMatchData;
  rich: CharacterRich | null;
  detailFallback: string;
}) {
  const gold = "#b88646";
  const inkSoft = "#1a0a14";
  const ink = "#2a1722";
  return (
    <div
      className="rounded-lg p-5 relative"
      style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(253,243,232,0.92) 100%)",
        border: `2px solid #c9a871`,
        boxShadow: `0 12px 32px -10px rgba(184,134,70,0.30), 0 4px 12px -4px rgba(178,40,71,0.10), inset 0 0 0 1px rgba(255,255,255,0.5)`,
      }}
    >
      {/* 상단 베이지 액센트 라인 */}
      <div
        style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 4,
          background: "linear-gradient(90deg, transparent, #d4a96b, #b88646, #d4a96b, transparent)",
          borderRadius: "8px 8px 0 0",
        }}
      />
      {/* 이름 + 캐릭터 큰 글씨 */}
      <div className="text-center pt-2">
        <div className="text-[11px] tracking-[0.3em] mb-1" style={{ color: gold, fontFamily: "'Cormorant Garamond', serif" }}>
          MY HONGSIL
        </div>
        <div className="text-[12px] mb-2" style={{ color: inkSoft, fontFamily: "'Gowun Batang', serif" }}>
          {name}님은
        </div>
        <div
          className="text-[48px] font-black leading-none mb-2"
          style={{
            color: match.color,
            fontFamily: "'Nanum Myeongjo', serif",
            letterSpacing: "0.05em",
            textShadow: `0 2px 12px ${match.color}33`,
          }}
        >
          {match.name}
        </div>
        <div className="text-[11px] font-bold tracking-[0.2em]" style={{ color: "#6b1e3a", fontFamily: "'Nanum Myeongjo', serif" }}>
          스타일
        </div>
      </div>

      {/* 시그너처 한 줄 */}
      {rich?.signature && (
        <div
          className="text-center text-[14px] mt-3 px-2"
          style={{ color: match.color, fontFamily: "'Nanum Myeongjo', serif", lineHeight: 1.6, fontWeight: 700 }}
        >
          "{rich.signature}"
        </div>
      )}

      {/* 태그 chips */}
      {rich?.tags && rich.tags.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1.5 mt-3">
          {rich.tags.map((t) => (
            <span
              key={t}
              className="text-[11px] px-2 py-0.5 rounded-full"
              style={{
                background: `${match.color}22`,
                color: match.color,
                border: `1px solid ${match.color}55`,
                fontFamily: "'Gowun Batang', serif",
              }}
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {/* 본문 설명 */}
      <div
        className="text-[14px] leading-[1.95] mt-4 pt-3"
        style={{
          color: ink,
          fontFamily: "'Gowun Batang', serif",
          borderTop: `1px solid ${match.color}33`,
          fontWeight: 400,
        }}
      >
        {rich?.detail ?? detailFallback}
      </div>

      {/* 강점 */}
      {rich?.strengths && rich.strengths.length > 0 && (
        <div className="mt-4">
          <div
            className="text-[11px] font-bold mb-1.5 tracking-wider"
            style={{ color: match.color, fontFamily: "'Nanum Myeongjo', serif" }}
          >
            ✦ 이런 면이 빛나요
          </div>
          <ul className="space-y-1.5">
            {rich.strengths.map((s, i) => (
              <li
                key={i}
                className="text-[13px] leading-[1.75] pl-4 relative"
                style={{ color: "#1a0a14", fontFamily: "'Gowun Batang', serif" }}
              >
                <span style={{ position: "absolute", left: 0, top: 0, color: match.color, fontWeight: 800 }}>·</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 살펴볼 자리 */}
      {rich?.watchout && rich.watchout.length > 0 && (
        <div className="mt-3">
          <div
            className="text-[11px] font-bold mb-1.5 tracking-wider"
            style={{ color: gold, fontFamily: "'Nanum Myeongjo', serif" }}
          >
            ⌇ 이런 결은 살펴주세요
          </div>
          <ul className="space-y-1.5">
            {rich.watchout.map((s, i) => (
              <li
                key={i}
                className="text-[13px] leading-[1.75] pl-4 relative"
                style={{ color: "#1a0a14", fontFamily: "'Gowun Batang', serif" }}
              >
                <span style={{ position: "absolute", left: 0, top: 0, color: gold, fontWeight: 800 }}>·</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 어울리는 결 */}
      {rich?.chemistry && (
        <div
          className="mt-4 pt-3 text-[13px] text-center leading-[1.7]"
          style={{
            borderTop: `1px solid ${match.color}33`,
            color: match.color,
            fontFamily: "'Gowun Batang', serif",
            fontWeight: 600,
          }}
        >
          ❀ {rich.chemistry}
        </div>
      )}
    </div>
  );
}

function CharacterIntroCard({
  aName, bName, character, aGender, bGender,
}: {
  aName: string;
  bName: string;
  character: NonNullable<InyeonComputeData["character"]>;
  aGender: "여" | "남";
  bGender: "여" | "남";
}) {
  const { a, b, pair } = character;
  const aRich = CHARACTER_RICH[a.name] ?? null;
  const bRich = CHARACTER_RICH[b.name] ?? null;
  const aDetail = aRich?.detail ?? a.innerImage;
  const bDetail = bRich?.detail ?? b.innerImage;
  const [revealed, setRevealed] = useState<0 | 1 | 2 | 3>(0);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const captureRef = useRef<HTMLDivElement>(null);

  // BIG REVEAL — 단계별 페이드인
  useEffect(() => {
    const t1 = setTimeout(() => setRevealed(1), 200);   // 짝꿍 라벨
    const t2 = setTimeout(() => setRevealed(2), 900);   // 캐릭터 카드
    const t3 = setTimeout(() => setRevealed(3), 1500);  // 갤러리·공유
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  async function handleShare() {
    const text = pair
      ? `난 #${a.name}이래! ${aName} × ${bName} = "${pair.label}"\n사주가 읽어주는 인연 — paljawon.com/love`
      : `난 #${a.name}이래! 사주가 읽어주는 인연 — paljawon.com/love`;
    try {
      if (typeof window !== "undefined" && (navigator as any).share) {
        // 이미지 캡처 시도
        try {
          const html2canvas = (await import("html2canvas-pro")).default;
          if (captureRef.current) {
            const canvas = await html2canvas(captureRef.current, { scale: 2, useCORS: true, backgroundColor: null });
            const blob = await new Promise<Blob | null>((res) => canvas.toBlob((b) => res(b), "image/png"));
            if (blob && (navigator as any).canShare?.({ files: [new File([blob], "hongsil.png", { type: "image/png" })] })) {
              await (navigator as any).share({
                files: [new File([blob], "hongsil.png", { type: "image/png" })],
                text,
              });
              return;
            }
          }
        } catch {}
        await (navigator as any).share({ text, url: "https://www.paljawon.com/love" });
        return;
      }
      // fallback: 클립보드 복사
      await navigator.clipboard.writeText(text);
      setShareMsg("링크 복사됐어요");
      setTimeout(() => setShareMsg(null), 2000);
    } catch {
      // 사용자 취소 또는 미지원 — 무시
    }
  }

  async function handleDownload() {
    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      if (!captureRef.current) return;
      const canvas = await html2canvas(captureRef.current, { scale: 2, useCORS: true, backgroundColor: null });
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `홍실_${a.name}x${b.name}.png`;
      link.click();
      setShareMsg("이미지 저장됨");
      setTimeout(() => setShareMsg(null), 2000);
    } catch {
      setShareMsg("저장 실패");
      setTimeout(() => setShareMsg(null), 2000);
    }
  }

  // 홍실 팔레트
  const thread = "#c8203a";
  const gold = "#b88646";
  const plumDeep = "#6b1e3a";
  const inkSoft = "#1a0a14";
  return (
    <>
      {/* 캡처용 숨김 카드 (SNS 공유 이미지) */}
      <ShareableCard aName={aName} bName={bName} character={character} captureRef={captureRef} />

      <div
        className="mb-8 rounded-lg overflow-hidden"
        style={{
          background: `linear-gradient(180deg, rgba(255,251,247,0.95) 0%, rgba(253,243,232,0.92) 100%)`,
          border: `1px solid rgba(212,169,107,0.35)`,
          boxShadow: `0 16px 40px -16px rgba(178,40,71,0.18), 0 0 0 1px rgba(255,255,255,0.5) inset`,
        }}
      >
        {/* 홍실 헤드 — 짝꿍 라벨 (REVEAL stage 1) */}
        {pair && (
          <div
            className="px-5 py-6 text-center"
            style={{
              borderBottom: `1px solid rgba(212,169,107,0.25)`,
              opacity: revealed >= 1 ? 1 : 0,
              transform: revealed >= 1 ? "translateY(0)" : "translateY(8px)",
              transition: "opacity 0.7s ease, transform 0.7s ease",
            }}
          >
            <div
              className="text-[10px] tracking-[0.4em] mb-3"
              style={{ color: gold, fontFamily: "'Cormorant Garamond', serif" }}
            >
              紅 絲 · RED THREAD
            </div>
            <h3
              className="text-[20px] font-bold leading-snug px-2"
              style={{
                fontFamily: "'Nanum Myeongjo', 'Noto Serif KR', serif",
                backgroundImage: `linear-gradient(180deg, ${plumDeep} 0%, ${thread} 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              "{pair.label}"
            </h3>
            {pair.tone && (
              <div
                className="text-[12px] mt-3 leading-relaxed px-2"
                style={{ color: inkSoft, fontFamily: "'Gowun Batang', serif" }}
              >
                {pair.tone}
              </div>
            )}
          </div>
        )}

        {/* 캐릭터 발표 (REVEAL stage 2) — BIG REVEAL */}
        <div
          className="p-4 space-y-3"
          style={{
            opacity: revealed >= 2 ? 1 : 0,
            transform: revealed >= 2 ? "translateY(0) scale(1)" : "translateY(12px) scale(0.97)",
            transition: "opacity 0.8s ease, transform 0.8s cubic-bezier(.2,.7,.2,1)",
          }}
        >
          {/* 발표 라벨 */}
          <div
            className="text-center text-[13px] font-bold"
            style={{ color: thread, fontFamily: "'Nanum Myeongjo', serif", letterSpacing: "0.1em" }}
          >
            당신의 결
          </div>

          {/* A 카드 */}
          <RichCharCard name={aName} match={a} rich={aRich} detailFallback={aDetail} />

          {/* B 카드 */}
          <RichCharCard name={bName} match={b} rich={bRich} detailFallback={bDetail} />
        </div>

        {/* 11명 갤러리 + 공유 (REVEAL stage 3) */}
        <div
          className="px-4 pb-4 space-y-4"
          style={{
            opacity: revealed >= 3 ? 1 : 0,
            transition: "opacity 0.7s ease",
          }}
        >
          {/* 11명 라인업 */}
          <div className="pt-3" style={{ borderTop: `1px solid rgba(212,169,107,0.25)` }}>
            <div
              className="text-center text-[10px] tracking-[0.3em] mb-2"
              style={{ color: gold, fontFamily: "'Cormorant Garamond', serif" }}
            >
              {aGender === "여" ? "여자 6 캐릭터 중" : "남자 6 캐릭터 중"} {aName}님은
            </div>
            <CharacterLineup highlightName={a.name} gender={aGender} />
            <div
              className="text-center text-[10px] tracking-[0.3em] mt-3 mb-2"
              style={{ color: gold, fontFamily: "'Cormorant Garamond', serif" }}
            >
              {bGender === "여" ? "여자 6 캐릭터 중" : "남자 6 캐릭터 중"} {bName}님은
            </div>
            <CharacterLineup highlightName={b.name} gender={bGender} />
          </div>

          {/* 공유 버튼 — 숨김 (나중에 살릴 수 있도록 코드 보존) */}
          <div className="hidden flex gap-2 pt-3" style={{ borderTop: `1px solid rgba(212,169,107,0.25)` }}>
            <button
              onClick={handleShare}
              className="flex-1 py-3 rounded-md text-sm font-bold active:scale-95 transition-all"
              style={{
                background: `${thread}22`,
                color: thread,
                fontFamily: "'Gowun Batang', serif",
                letterSpacing: "0.05em",
                border: `1.5px solid ${thread}55`,
              }}
            >
              결과 공유하기
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-3 rounded-md text-sm active:scale-95 transition-all"
              style={{
                background: "rgba(255,255,255,0.7)",
                border: `1px solid rgba(212,169,107,0.5)`,
                color: plumDeep,
                fontFamily: "'Gowun Batang', serif",
              }}
            >
              이미지 저장
            </button>
          </div>
          {shareMsg && (
            <div className="text-center text-[11px]" style={{ color: thread, fontFamily: "'Gowun Batang', serif" }}>
              {shareMsg}
            </div>
          )}

          {/* 안내 */}
          <div
            className="text-center text-[10px]"
            style={{ color: gold, fontFamily: "'Cormorant Garamond', serif", letterSpacing: "0.15em" }}
          >
            ─ paljawon.com / love ─
          </div>
        </div>
      </div>
    </>
  );
}

function NoticeBubble({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-md px-5 py-4 text-[14px] leading-[1.9] mb-4"
      style={{
        background: "rgba(255,235,240,0.75)",
        border: `1px dashed rgba(200,32,58,0.5)`,
        color: "#1a0a14",
        fontFamily: "'Gowun Batang', serif",
      }}
    >
      {children}
    </div>
  );
}

// AttractionStyleBar — 1·2장 연애 스타일 5 막대 + 단어 풀이 (자도인 V2식)
const SIP5_INFO = [
  { label: "식상", sub: "표현", desc: "감정·말·창작 — 마음을 바깥으로 풀어내는 결", color: "#ff9d6b" },
  { label: "재성", sub: "현실", desc: "돈·결과·실용 — 손에 잡히는 것을 챙기는 결", color: "#7dd3c0" },
  { label: "관성", sub: "책임", desc: "규칙·약속·절제 — 틀과 책임에 따르는 결", color: "#7eb6ff" },
  { label: "인성", sub: "받침", desc: "사색·받아들임·깊이 — 곱씹고 받아주는 결", color: "#c89cff" },
  { label: "비겁", sub: "자존", desc: "자기 결·동지 — 함께 가거나 스스로 서는 결", color: "#f5b942" },
];

function AttractionStyleBar({ name, sipseong, color }: {
  name: string;
  sipseong: { year: { stem: string; branch: string }; month: { stem: string; branch: string }; day: { branch: string }; hour: { stem: string; branch: string } | null };
  color: string;
}) {
  const all = [
    sipseong.year.stem, sipseong.year.branch,
    sipseong.month.stem, sipseong.month.branch,
    sipseong.day.branch,
    sipseong.hour?.stem, sipseong.hour?.branch,
  ].filter(Boolean) as string[];
  const counts: Record<string, number> = {
    식상: all.filter(s => s.includes("식신") || s.includes("상관")).length,
    재성: all.filter(s => s.includes("정재") || s.includes("편재")).length,
    관성: all.filter(s => s.includes("정관") || s.includes("편관") || s.includes("칠살")).length,
    인성: all.filter(s => s.includes("정인") || s.includes("편인") || s.includes("효신")).length,
    비겁: all.filter(s => s.includes("비견") || s.includes("겁재")).length,
  };
  const max = Math.max(1, ...Object.values(counts));
  const top = (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0]) ?? "비겁";

  return (
    <div
      className="rounded-md p-5"
      style={{
        background: "linear-gradient(180deg, rgba(255,251,247,0.95), rgba(253,243,232,0.85))",
        border: `1px solid ${color}55`,
        boxShadow: `0 6px 20px -8px ${color}22`,
      }}
    >
      <div
        className="text-[15px] font-bold mb-1 text-center"
        style={{ color: "#6b1e3a", fontFamily: "'Nanum Myeongjo', serif" }}
      >
        {name}님의 십성(十星) 분포
      </div>
      <div
        className="text-[11px] mb-5 text-center"
        style={{ color: "#b88646", fontFamily: "'Cormorant Garamond', serif", letterSpacing: "0.15em" }}
      >
        연애·관계에서 어떤 결로 다가가는가
      </div>

      <div className="space-y-3">
        {SIP5_INFO.map((info) => {
          const c = counts[info.label] ?? 0;
          const pct = (c / max) * 100;
          const isTop = info.label === top;
          return (
            <div key={info.label}>
              <div className="flex items-baseline gap-2 mb-1.5">
                <span
                  className="text-[16px] font-black"
                  style={{
                    color: info.color,
                    fontFamily: "'Nanum Myeongjo', serif",
                    minWidth: 36,
                  }}
                >
                  {info.label}
                </span>
                <span
                  className="text-[12px]"
                  style={{ color: "#1a0a14", fontFamily: "'Gowun Batang', serif", fontWeight: isTop ? 700 : 400 }}
                >
                  {info.sub}
                </span>
                <span
                  className="text-[16px] font-bold ml-auto"
                  style={{ color: info.color, fontFamily: "'Cormorant Garamond', serif" }}
                >
                  {c}
                </span>
              </div>
              <div className="h-3 rounded-full overflow-hidden" style={{ background: "rgba(212,169,107,0.15)" }}>
                <div
                  style={{
                    width: `${pct}%`,
                    height: "100%",
                    background: info.color,
                    transition: "width 0.6s ease",
                    boxShadow: isTop ? `0 0 8px ${info.color}88` : "none",
                  }}
                />
              </div>
              <div className="text-[12px] mt-1.5 leading-snug" style={{ color: "#1a0a14", fontFamily: "'Gowun Batang', serif" }}>
                {info.desc}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ChemistryDiagram — 3장 일간·일지 결합 시각화 (정합·충·생·극)
function ChemistryDiagram({
  aIlgan, bIlgan, aDayBranch, bDayBranch, aColor, bColor,
}: {
  aIlgan: string;
  bIlgan: string;
  aDayBranch: string;
  bDayBranch: string;
  aColor: string;
  bColor: string;
}) {
  const STEM_HANJA: Record<string, string> = {
    갑: "甲", 을: "乙", 병: "丙", 정: "丁", 무: "戊",
    기: "己", 경: "庚", 신: "辛", 임: "壬", 계: "癸",
  };
  const BRANCH_HANJA: Record<string, string> = {
    자: "子", 축: "丑", 인: "寅", 묘: "卯", 진: "辰", 사: "巳",
    오: "午", 미: "未", 신: "申", 유: "酉", 술: "戌", 해: "亥",
  };
  // 천간 정합 5쌍
  const GANHAP: Record<string, string> = { 갑: "기", 기: "갑", 을: "경", 경: "을", 병: "신", 신: "병", 정: "임", 임: "정", 무: "계", 계: "무" };
  // 천간 충
  const STEM_CHUNG: Record<string, string> = { 갑: "경", 경: "갑", 을: "신", 신: "을", 병: "임", 임: "병", 정: "계", 계: "정" };
  // 지지 육합
  const YUKHAP: Record<string, string> = { 자: "축", 축: "자", 인: "해", 해: "인", 묘: "술", 술: "묘", 진: "유", 유: "진", 사: "신", 신: "사", 오: "미", 미: "오" };
  // 지지 충
  const BR_CHUNG: Record<string, string> = { 자: "오", 오: "자", 축: "미", 미: "축", 인: "신", 신: "인", 묘: "유", 유: "묘", 진: "술", 술: "진", 사: "해", 해: "사" };

  const stemRel = GANHAP[aIlgan] === bIlgan ? { label: "정합(正合)", color: "#c8203a", glow: true }
    : STEM_CHUNG[aIlgan] === bIlgan ? { label: "충(沖)", color: "#1a0a14", glow: false }
    : aIlgan === bIlgan ? { label: "비견(同)", color: "#b88646", glow: false }
    : { label: "일반", color: "#2a1722", glow: false };

  const branchRel = YUKHAP[aDayBranch] === bDayBranch ? { label: "육합(六合)", color: "#c8203a", glow: true }
    : BR_CHUNG[aDayBranch] === bDayBranch ? { label: "충(沖)", color: "#1a0a14", glow: false }
    : aDayBranch === bDayBranch ? { label: "동지(同)", color: "#b88646", glow: false }
    : { label: "일반", color: "#2a1722", glow: false };

  return (
    <div
      className="rounded-md p-5"
      style={{
        background: "linear-gradient(180deg, rgba(255,251,247,0.95), rgba(253,243,232,0.85))",
        border: "1px solid rgba(212,169,107,0.4)",
      }}
    >
      <div
        className="text-[12px] mb-4 text-center"
        style={{ color: "#6b1e3a", fontFamily: "'Nanum Myeongjo', serif", fontWeight: 700 }}
      >
        두 사주의 결합 — 천간(天干) · 지지(地支)
      </div>

      {/* 천간 */}
      <div className="flex items-center justify-center gap-3 mb-3">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-[26px] font-black"
          style={{
            background: `${aColor}1a`, border: `2px solid ${aColor}`, color: aColor,
            fontFamily: "'Nanum Myeongjo', serif",
            boxShadow: stemRel.glow ? `0 0 20px ${stemRel.color}66` : "none",
          }}
        >
          {STEM_HANJA[aIlgan] ?? aIlgan}
        </div>
        <div className="text-center">
          <div className="text-[12px] font-bold" style={{ color: "#2a1722", fontFamily: "'Nanum Myeongjo', serif" }}>
            천간
          </div>
          <div
            className="text-[13px] font-bold px-3 py-0.5 rounded-full mt-1"
            style={{
              color: stemRel.color,
              background: `${stemRel.color}15`,
              border: `1px solid ${stemRel.color}66`,
              fontFamily: "'Nanum Myeongjo', serif",
            }}
          >
            {stemRel.label}
          </div>
        </div>
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-[26px] font-black"
          style={{
            background: `${bColor}1a`, border: `2px solid ${bColor}`, color: bColor,
            fontFamily: "'Nanum Myeongjo', serif",
            boxShadow: stemRel.glow ? `0 0 20px ${stemRel.color}66` : "none",
          }}
        >
          {STEM_HANJA[bIlgan] ?? bIlgan}
        </div>
      </div>

      {/* 점선 연결 */}
      <div className="flex justify-center my-2">
        <div className="h-4 w-px" style={{ background: "linear-gradient(180deg, rgba(212,169,107,0.5), transparent)" }} />
      </div>

      {/* 지지 */}
      <div className="flex items-center justify-center gap-3">
        <div
          className="w-12 h-12 rounded flex items-center justify-center text-[22px] font-black"
          style={{
            background: `${aColor}10`, border: `1.5px solid ${aColor}88`, color: aColor,
            fontFamily: "'Nanum Myeongjo', serif",
            boxShadow: branchRel.glow ? `0 0 16px ${branchRel.color}66` : "none",
          }}
        >
          {BRANCH_HANJA[aDayBranch] ?? aDayBranch}
        </div>
        <div className="text-center">
          <div className="text-[12px] font-bold" style={{ color: "#2a1722", fontFamily: "'Nanum Myeongjo', serif" }}>
            지지
          </div>
          <div
            className="text-[12px] font-bold px-2.5 py-0.5 rounded-full mt-1"
            style={{
              color: branchRel.color,
              background: `${branchRel.color}15`,
              border: `1px solid ${branchRel.color}66`,
              fontFamily: "'Nanum Myeongjo', serif",
            }}
          >
            {branchRel.label}
          </div>
        </div>
        <div
          className="w-12 h-12 rounded flex items-center justify-center text-[22px] font-black"
          style={{
            background: `${bColor}10`, border: `1.5px solid ${bColor}88`, color: bColor,
            fontFamily: "'Nanum Myeongjo', serif",
            boxShadow: branchRel.glow ? `0 0 16px ${branchRel.color}66` : "none",
          }}
        >
          {BRANCH_HANJA[bDayBranch] ?? bDayBranch}
        </div>
      </div>

      <div className="text-[10px] text-center mt-4" style={{ color: "#2a1722", fontFamily: "'Gowun Batang', serif" }}>
        {stemRel.label === "정합(正合)" ? "✦ 천간 정합은 음양의 깊은 끌림이에요"
          : branchRel.label === "육합(六合)" ? "✦ 지지 육합은 일상에서의 잘 맞음이에요"
          : "두 사주의 결을 본문에서 풀어드려요"}
      </div>
    </div>
  );
}

// BehaviorTranslator — 4·5장 그 사람 행동 통역 카드 (4 항목)
function BehaviorTranslator({ targetName, ilgan, shinkang, sipseong, color }: {
  targetName: string;
  ilgan: string;
  shinkang: string;
  sipseong: { year: { stem: string; branch: string }; month: { stem: string; branch: string }; day: { branch: string }; hour: { stem: string; branch: string } | null };
  color: string;
}) {
  const all = [
    sipseong.year.stem, sipseong.year.branch,
    sipseong.month.stem, sipseong.month.branch,
    sipseong.day.branch,
    sipseong.hour?.stem, sipseong.hour?.branch,
  ].filter(Boolean) as string[];
  const sik = all.filter(s => s.includes("식신") || s.includes("상관")).length;
  const inn = all.filter(s => s.includes("정인") || s.includes("편인") || s.includes("효신")).length;
  const gwan = all.filter(s => s.includes("정관") || s.includes("편관") || s.includes("칠살")).length;
  const STRONG = ["신강", "태강", "극왕"];

  const items = [
    {
      label: "표현 속도",
      tone: sik >= 3 ? "감정을 빠르게 드러내요" : sik <= 1 ? "마음을 천천히 보여줘요" : "필요할 때만 표현해요",
      hint: `식상 ${sik} 기반`,
    },
    {
      label: "마음 여는 결",
      tone: inn >= 3 ? "받아들이고 깊이 곱씹어요" : inn <= 1 ? "직진형, 즉시 반응해요" : "자기 호흡으로 다가와요",
      hint: `인성 ${inn} 기반`,
    },
    {
      label: "거리 두는 방식",
      tone: gwan >= 2 ? "책임감으로 거리 유지해요" : "자유로운 결로 다가와요",
      hint: `관성 ${gwan} 기반`,
    },
    {
      label: "결정 속도",
      tone: STRONG.includes(shinkang) ? "한 번 정한 결은 잘 안 흔들려요" : "신중하게 헤아리는 결",
      hint: `${shinkang} 기반`,
    },
  ];
  return (
    <div
      className="rounded-md p-4"
      style={{
        background: `linear-gradient(135deg, ${color}10, ${color}03)`,
        border: `1px solid ${color}55`,
      }}
    >
      <div
        className="text-[13px] mb-1 text-center font-bold"
        style={{ color, fontFamily: "'Nanum Myeongjo', serif", letterSpacing: "0.05em" }}
      >
        그 사람 행동 통역
      </div>
      <div
        className="text-[13px] mb-3 text-center"
        style={{ color: "#1a0a14", fontFamily: "'Gowun Batang', serif" }}
      >
        {targetName}님의 일간 <span style={{ color, fontWeight: 700 }}>{ilgan}</span> 결로 풀어보면
      </div>
      <div className="grid grid-cols-2 gap-2">
        {items.map((it) => (
          <div
            key={it.label}
            className="rounded p-3"
            style={{ background: "rgba(255,251,247,0.85)", border: `1px solid ${color}55` }}
          >
            <div className="text-[11px] mb-1.5 tracking-wider" style={{ color, fontFamily: "'Nanum Myeongjo', serif", fontWeight: 700 }}>
              {it.label}
            </div>
            <div className="text-[13px] leading-[1.65]" style={{ color: "#1a0a14", fontFamily: "'Gowun Batang', serif", fontWeight: 500 }}>
              {it.tone}
            </div>
            <div className="text-[11px] mt-1.5" style={{ color: "#1a0a14", fontFamily: "'Gowun Batang', serif" }}>
              {it.hint}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 매력 신살 카드 — 1·2장 보유 신살 색깔 카드
const CHARM_SINSAL_INFO: Record<string, { name: string; charm: string; emoji: string }> = {
  도화: { name: "도화살(桃花)", charm: "사람 모이는 자리에 자연스럽게 시선을 받는 결", emoji: "✿" },
  홍염: { name: "홍염살(紅艶)", charm: "은은한 매력, 말 없이도 끌어당기는 결", emoji: "⌬" },
  천을: { name: "천을귀인(天乙)", charm: "어려울 때 누군가 먼저 손을 내미는 인덕", emoji: "✦" },
  문창: { name: "문창귀인(文昌)", charm: "지식과 학문이 매력으로 작용하는 결", emoji: "文" },
  학당: { name: "학당귀인(學堂)", charm: "평생 배움이 끊이지 않는 결", emoji: "學" },
  화개: { name: "화개살(華蓋)", charm: "예술적 깊이, 고독을 잘 견디는 결", emoji: "華" },
  역마: { name: "역마살(驛馬)", charm: "움직임 많은 자리에서 인연을 만나는 결", emoji: "驛" },
  월덕: { name: "월덕귀인(月德)", charm: "따뜻한 인덕, 사람들이 의지하는 결", emoji: "月" },
  복성: { name: "복성귀인(福星)", charm: "평생 복덕이 따라오는 결", emoji: "福" },
  금여: { name: "금여(金輿)", charm: "재물·배우자 복의 황금 수레", emoji: "金" },
  태극: { name: "태극귀인(太極)", charm: "음양 조화·신비로운 영감의 결", emoji: "極" },
  양인: { name: "양인살(羊刃)", charm: "강한 추진력, 결단의 순간 빛나는 결", emoji: "刃" },
  괴강: { name: "괴강살(魁罡)", charm: "굳건한 신념, 위기에 무너지지 않는 결", emoji: "魁" },
  현침: { name: "현침살(懸針)", charm: "예리한 통찰, 정밀한 손재주의 결", emoji: "針" },
  귀문: { name: "귀문관살(鬼門)", charm: "남이 못 보는 것을 보는 직관의 결", emoji: "鬼" },
};
function CharmSinsalCard({ name, sinsalList, color }: { name: string; sinsalList: string[]; color: string }) {
  const found = sinsalList
    .map((s) => {
      for (const [key, info] of Object.entries(CHARM_SINSAL_INFO)) {
        if (s.includes(key)) return info;
      }
      return null;
    })
    .filter((x): x is { name: string; charm: string; emoji: string } => x !== null);
  if (found.length === 0) return null;
  return (
    <div
      className="rounded-md p-4"
      style={{
        background: `linear-gradient(135deg, ${color}10, ${color}03)`,
        border: `1px solid ${color}55`,
      }}
    >
      <div
        className="text-[14px] mb-3 text-center font-bold"
        style={{ color, fontFamily: "'Nanum Myeongjo', serif", letterSpacing: "0.05em" }}
      >
        {name}님의 매력 신살(神煞)
      </div>
      <div className="space-y-2">
        {found.map((info) => (
          <div
            key={info.name}
            className="flex items-start gap-3 p-3 rounded"
            style={{ background: "rgba(255,251,247,0.6)", border: `1px solid ${color}33` }}
          >
            <div
              className="text-[24px] leading-none flex-shrink-0"
              style={{ color, fontFamily: "'Nanum Myeongjo', serif", fontWeight: 800 }}
            >
              {info.emoji}
            </div>
            <div className="flex-1">
              <div
                className="text-[13px] font-bold mb-0.5"
                style={{ color: "#6b1e3a", fontFamily: "'Nanum Myeongjo', serif" }}
              >
                {info.name}
              </div>
              <div
                className="text-[12px] leading-[1.7]"
                style={{ color: "#1a0a14", fontFamily: "'Gowun Batang', serif" }}
              >
                {info.charm}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// QuadrantChart — 성격 4분면 (외향-내향 × 활동-안정)
function QuadrantChart({
  aName, bName, aPos, bPos, aColor, bColor,
}: {
  aName: string;
  bName: string;
  aPos: { x: number; y: number };  // 0~100
  bPos: { x: number; y: number };
  aColor: string;
  bColor: string;
}) {
  const W = 280, H = 280, P = 30;
  const cx = (p: number) => P + (p / 100) * (W - 2 * P);
  const cy = (p: number) => H - P - (p / 100) * (H - 2 * P);
  return (
    <div
      className="rounded-md p-4"
      style={{
        background: "linear-gradient(180deg, rgba(255,251,247,0.95), rgba(253,243,232,0.85))",
        border: "1px solid rgba(212,169,107,0.35)",
      }}
    >
      <div
        className="text-[12px] mb-3 text-center"
        style={{ color: "#6b1e3a", fontFamily: "'Nanum Myeongjo', serif", fontWeight: 700 }}
      >
        성격 4분면 — 두 분의 결 위치
      </div>
      <div className="flex justify-center">
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          {/* 사분면 배경 */}
          <rect x={P} y={P} width={W - 2 * P} height={H - 2 * P} fill="rgba(212,169,107,0.06)" />
          {/* 축 */}
          <line x1={P} y1={H / 2} x2={W - P} y2={H / 2} stroke="rgba(212,169,107,0.4)" strokeWidth="1" strokeDasharray="3 3" />
          <line x1={W / 2} y1={P} x2={W / 2} y2={H - P} stroke="rgba(212,169,107,0.4)" strokeWidth="1" strokeDasharray="3 3" />
          {/* 축 라벨 — 잘림 차단: 안쪽으로 정렬 */}
          <text x={W / 2} y={P - 10} textAnchor="middle" fontSize="14" fontWeight="700" fill="#6b1e3a" fontFamily="'Nanum Myeongjo',serif">활동</text>
          <text x={W / 2} y={H - P + 22} textAnchor="middle" fontSize="14" fontWeight="700" fill="#6b1e3a" fontFamily="'Nanum Myeongjo',serif">안정</text>
          <text x={P + 4} y={H / 2 + 5} textAnchor="start" fontSize="14" fontWeight="700" fill="#6b1e3a" fontFamily="'Nanum Myeongjo',serif">내향</text>
          <text x={W - P - 4} y={H / 2 + 5} textAnchor="end" fontSize="14" fontWeight="700" fill="#6b1e3a" fontFamily="'Nanum Myeongjo',serif">외향</text>
          {/* 두 점 잇는 선 */}
          <line x1={cx(aPos.x)} y1={cy(aPos.y)} x2={cx(bPos.x)} y2={cy(bPos.y)} stroke="#c8203a" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6" />
          {/* A 점 — 색깔만 (이름 라벨은 차트 밑 범례에) */}
          <circle cx={cx(aPos.x)} cy={cy(aPos.y)} r="11" fill={aColor} stroke="#fff" strokeWidth="3" />
          {/* B 점 — 색깔만 */}
          <circle cx={cx(bPos.x)} cy={cy(bPos.y)} r="11" fill={bColor} stroke="#fff" strokeWidth="3" />
        </svg>
      </div>
      {/* 범례 — 색 ↔ 이름 매칭 (점 겹침 시 가독성 보장) */}
      <div className="flex justify-center gap-5 mt-3 text-[12px] font-bold"
        style={{ color: "#1a0a14", fontFamily: "'Gowun Batang', serif" }}>
        <span className="flex items-center gap-1.5">
          <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: "50%",
            background: aColor, border: "2px solid #fff", boxShadow: "0 0 0 1px rgba(0,0,0,0.15)" }} />
          {aName}
        </span>
        <span className="flex items-center gap-1.5">
          <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: "50%",
            background: bColor, border: "2px solid #fff", boxShadow: "0 0 0 1px rgba(0,0,0,0.15)" }} />
          {bName}
        </span>
      </div>
      <div className="text-[12px] text-center mt-2 font-bold" style={{ color: "#1a0a14", fontFamily: "'Gowun Batang',serif" }}>
        가로 = 외향-내향 / 세로 = 활동-안정
      </div>
    </div>
  );
}

// MonthGrid — 6장 시기궁합 12개월 그리드 (결정론 색깔)
function MonthGrid({ aBranch, bBranch }: { aBranch: string; bBranch: string }) {
  // 양력 월 → 지지 매핑 (음력 절기 근사)
  const MONTH_BRANCH = ["축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해", "자"];
  // 육합: 자축, 인해, 묘술, 진유, 사신, 오미
  const YUKHAP: Record<string, string> = {
    자: "축", 축: "자", 인: "해", 해: "인", 묘: "술", 술: "묘",
    진: "유", 유: "진", 사: "신", 신: "사", 오: "미", 미: "오",
  };
  // 충: 자오, 축미, 인신, 묘유, 진술, 사해
  const CHUNG: Record<string, string> = {
    자: "오", 오: "자", 축: "미", 미: "축", 인: "신", 신: "인",
    묘: "유", 유: "묘", 진: "술", 술: "진", 사: "해", 해: "사",
  };
  function evalMonth(monthBr: string): { color: string; tone: string } {
    const aHap = YUKHAP[aBranch] === monthBr;
    const bHap = YUKHAP[bBranch] === monthBr;
    const aChung = CHUNG[aBranch] === monthBr;
    const bChung = CHUNG[bBranch] === monthBr;
    if (aHap && bHap) return { color: "#c8203a", tone: "가장 가까워질" };
    if (aHap || bHap) return { color: "#e88a8a", tone: "가까워질" };
    if (aChung && bChung) return { color: "#1a0a14", tone: "가장 흔들릴" };
    if (aChung || bChung) return { color: "#2a1722", tone: "흔들릴 수도" };
    return { color: "#d4a96b", tone: "평범한 흐름" };
  }
  const now = new Date();
  const startMonth = now.getMonth(); // 0~11
  const months: { label: string; branch: string; color: string; tone: string }[] = [];
  for (let i = 0; i < 12; i++) {
    const mIdx = (startMonth + i) % 12;
    const br = MONTH_BRANCH[mIdx];
    const { color, tone } = evalMonth(br);
    months.push({ label: `${mIdx + 1}월`, branch: br, color, tone });
  }
  return (
    <div
      className="rounded-md p-4"
      style={{
        background: "linear-gradient(180deg, rgba(255,251,247,0.95), rgba(253,243,232,0.85))",
        border: "1px solid rgba(212,169,107,0.35)",
      }}
    >
      <div
        className="text-[12px] mb-3 text-center"
        style={{ color: "#6b1e3a", fontFamily: "'Nanum Myeongjo', serif", fontWeight: 700 }}
      >
        앞으로 12개월의 결
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {months.map((m, i) => (
          <div
            key={i}
            className="rounded p-2 text-center"
            style={{
              background: `${m.color}1a`,
              border: `1px solid ${m.color}66`,
            }}
          >
            <div className="text-[12px] font-bold" style={{ color: m.color, fontFamily: "'Nanum Myeongjo', serif" }}>
              {m.label}
            </div>
            <div className="text-[9px] mt-0.5" style={{ color: "#1a0a14", fontFamily: "'Cormorant Garamond', serif" }}>
              {m.branch}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-3 mt-3 text-[9px]" style={{ color: "#2a1722", fontFamily: "'Gowun Batang', serif" }}>
        <span style={{ color: "#c8203a" }}>● 가까워질</span>
        <span style={{ color: "#1a0a14" }}>● 흔들릴</span>
        <span style={{ color: "#d4a96b" }}>● 평범</span>
      </div>
    </div>
  );
}

// ChildLuckCard — 8장 부부 자녀운 디테일 카드
function ChildLuckCard({ aName, bName, sikCountA, sikCountB, color }: {
  aName: string; bName: string; sikCountA: number; sikCountB: number; color: string;
}) {
  const totalSik = sikCountA + sikCountB;
  const childCount = totalSik === 0 ? "1명 정도" : totalSik <= 2 ? "1~2명" : totalSik <= 4 ? "2~3명" : "3명 이상";
  const timing = totalSik >= 3 ? "비교적 빠른 시기" : totalSik === 0 ? "기다림이 필요한 결" : "자연스러운 흐름";
  const bond = totalSik >= 2 ? "표현이 풍부한 자녀" : "조용히 깊은 자녀";
  return (
    <div className="grid grid-cols-3 gap-2">
      <MilestoneCard icon="子" label={`자녀 수: ${childCount}`} color={color} />
      <MilestoneCard icon="時" label={`시기: ${timing}`} color={color} />
      <MilestoneCard icon="情" label={`결: ${bond}`} color={color} />
    </div>
  );
}

// BiBar — 양방향 비교 막대 (좌우 채움)
function BiBar({
  leftLabel, rightLabel, leftValue, rightValue, leftColor = "#c8203a", rightColor = "#b88646", topLabel,
}: {
  leftLabel: string; rightLabel: string;
  leftValue: number; rightValue: number;
  leftColor?: string; rightColor?: string;
  topLabel?: string;
}) {
  const total = leftValue + rightValue;
  const leftPct = total > 0 ? (leftValue / total) * 100 : 50;
  const rightPct = 100 - leftPct;
  return (
    <div className="my-4">
      {topLabel && (
        <div className="text-[12px] mb-2 text-center" style={{ color: "#1a0a14", fontFamily: "'Gowun Batang', serif" }}>
          {topLabel}
        </div>
      )}
      <div className="flex justify-between text-[12px] mb-1.5" style={{ fontFamily: "'Gowun Batang', serif" }}>
        <span style={{ color: leftColor, fontWeight: 700 }}>{leftLabel}</span>
        <span style={{ color: rightColor, fontWeight: 700 }}>{rightLabel}</span>
      </div>
      <div
        className="h-3 rounded-full overflow-hidden flex"
        style={{ background: "rgba(212,169,107,0.15)" }}
      >
        <div style={{ width: `${leftPct}%`, background: leftColor, transition: "width 0.6s ease" }} />
        <div style={{ width: `${rightPct}%`, background: rightColor, transition: "width 0.6s ease" }} />
      </div>
      <div className="flex justify-between text-[10px] mt-1" style={{ color: "#2a1722", fontFamily: "'Cormorant Garamond', serif" }}>
        <span>{Math.round(leftPct)}%</span>
        <span>{Math.round(rightPct)}%</span>
      </div>
    </div>
  );
}

// ActionCard — 관계조언 7장 행동 카드
function ActionCard({
  num, title, color = "#c8203a",
}: {
  num: string; title: string; color?: string;
}) {
  return (
    <div
      className="rounded-md p-4 flex items-start gap-3"
      style={{
        background: "linear-gradient(135deg, rgba(255,251,247,0.95), rgba(253,243,232,0.85))",
        border: `1px solid ${color}55`,
        boxShadow: `0 4px 12px -4px ${color}22`,
      }}
    >
      <div
        className="text-[24px] font-black leading-none flex-shrink-0"
        style={{ color, fontFamily: "'Italiana', 'Nanum Myeongjo', serif" }}
      >
        {num}
      </div>
      <div className="flex-1">
        <div
          className="text-[15px] font-bold leading-snug"
          style={{ color: "#1a0a14", fontFamily: "'Nanum Myeongjo', serif" }}
        >
          {title}
        </div>
      </div>
    </div>
  );
}

// MilestoneCard — 8장 미래궁합 마일스톤 카드 (결혼·자녀·신혼·노년)
function MilestoneCard({
  icon, label, color = "#c8203a",
}: {
  icon: string; label: string; color?: string;
}) {
  return (
    <div
      className="rounded-md p-4 text-center flex flex-col items-center gap-2"
      style={{
        background: `linear-gradient(135deg, ${color}10, ${color}03)`,
        border: `1px solid ${color}55`,
      }}
    >
      <div
        className="text-[32px] leading-none"
        style={{ color, fontFamily: "'Nanum Myeongjo', serif", fontWeight: 800 }}
      >
        {icon}
      </div>
      <div
        className="text-[13px] leading-snug font-medium"
        style={{ color: "#1a0a14", fontFamily: "'Gowun Batang', serif" }}
      >
        {label}
      </div>
    </div>
  );
}

// ConflictTagsCard — 5장 갈등 패턴 chip 카드
function ConflictTagsCard({ tags }: { tags: string[] }) {
  return (
    <div
      className="rounded-md p-4"
      style={{
        background: "rgba(255,235,240,0.6)",
        border: "1px dashed rgba(200,32,58,0.4)",
      }}
    >
      <div
        className="text-[13px] mb-3 text-center font-bold"
        style={{ color: "#6b1e3a", fontFamily: "'Nanum Myeongjo', serif", letterSpacing: "0.05em" }}
      >
        우리 갈등 패턴
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {tags.map((t) => (
          <span
            key={t}
            className="text-[12px] px-3 py-1.5 rounded-full"
            style={{
              background: "rgba(200,32,58,0.12)",
              border: "1px solid rgba(200,32,58,0.4)",
              color: "#6b1e3a",
              fontFamily: "'Gowun Batang', serif",
            }}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

// QuoteCard — 9장 마지막 캡처용 인용구 카드 (SNS 공유 친화)
function QuoteCard({
  aName, bName, aChar, bChar, aColor, bColor, pairLabel,
}: {
  aName: string;
  bName: string;
  aChar: string;
  bChar: string;
  aColor: string;
  bColor: string;
  pairLabel: string;
}) {
  return (
    <div
      className="my-6 rounded-md overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse at 30% 0%, rgba(255,225,234,0.95) 0%, transparent 60%),
          radial-gradient(ellipse at 70% 100%, rgba(255,240,214,0.95) 0%, transparent 60%),
          linear-gradient(180deg, #fff7f9 0%, #ffeef3 50%, #fce4d6 100%)
        `,
        border: "1px solid rgba(212,169,107,0.4)",
        boxShadow: "0 16px 40px -16px rgba(178,40,71,0.18)",
      }}
    >
      {/* 상단 라벨 */}
      <div className="px-6 pt-7 text-center">
        <div
          className="text-[10px] tracking-[0.45em] mb-2"
          style={{ color: "#b88646", fontFamily: "'Cormorant Garamond', serif" }}
        >
          紅 絲 · RED THREAD
        </div>
      </div>

      {/* 짝꿍 라벨 — 큰 글씨 */}
      <div className="px-6 py-3 text-center">
        <div
          className="text-[22px] font-bold leading-tight"
          style={{
            fontFamily: "'Nanum Myeongjo', 'Noto Serif KR', serif",
            backgroundImage: "linear-gradient(180deg, #6b1e3a 0%, #c8203a 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          "{pairLabel}"
        </div>
      </div>

      {/* 두 캐릭터 이름 */}
      <div className="flex items-center justify-center gap-6 py-4">
        <div className="text-center">
          <div className="text-[10px]" style={{ color: "#1a0a14", fontFamily: "'Gowun Batang', serif" }}>
            {aName}님
          </div>
          <div
            className="text-[28px] font-black leading-none mt-1"
            style={{ color: aColor, fontFamily: "'Nanum Myeongjo', serif" }}
          >
            {aChar}
          </div>
        </div>
        <div
          className="text-[18px]"
          style={{ color: "#c8203a", fontFamily: "'Nanum Myeongjo', serif", letterSpacing: "0.3em" }}
        >
          ✦
        </div>
        <div className="text-center">
          <div className="text-[10px]" style={{ color: "#1a0a14", fontFamily: "'Gowun Batang', serif" }}>
            {bName}님
          </div>
          <div
            className="text-[28px] font-black leading-none mt-1"
            style={{ color: bColor, fontFamily: "'Nanum Myeongjo', serif" }}
          >
            {bChar}
          </div>
        </div>
      </div>

      {/* 명언 한 줄 */}
      <div className="px-6 py-4 text-center">
        <div
          className="text-[14px] leading-[1.9]"
          style={{ color: "#1a0a14", fontFamily: "'Gowun Batang', serif", fontWeight: 500 }}
        >
          "운명의 두 사람은 보이지 않는 붉은 실로 묶여 있어요.<br />
          시간이 흘러도, 거리가 멀어도, 그 매듭은 끊어지지 않아요."
        </div>
      </div>

      {/* 하단 워터마크 */}
      <div
        className="px-6 py-4 text-center"
        style={{ borderTop: "1px solid rgba(212,169,107,0.3)" }}
      >
        <div
          className="text-[12px] font-bold"
          style={{ color: "#c8203a", fontFamily: "'Nanum Myeongjo', serif", letterSpacing: "0.1em" }}
        >
          paljawon.com / love
        </div>
        <div
          className="text-[9px] mt-1"
          style={{ color: "#b88646", fontFamily: "'Cormorant Garamond', serif", letterSpacing: "0.2em" }}
        >
          사주가 읽어주는 인연
        </div>
      </div>
    </div>
  );
}

// 챕터 사이 안내자 transition — 홍도인 1인칭 한 줄
function TransitionLine({ text }: { text: string }) {
  return (
    <div className="my-8 text-center">
      <div
        className="mx-auto mb-3 h-px"
        style={{
          maxWidth: 100,
          background: "linear-gradient(90deg, transparent, #d4a96b, transparent)",
        }}
      />
      <div
        className="text-[14px] leading-[1.9] px-4"
        style={{ color: "#6b1e3a", fontFamily: "'Gowun Batang', serif", fontWeight: 600 }}
      >
        {text}
      </div>
      <div
        className="mx-auto mt-3 h-px"
        style={{
          maxWidth: 100,
          background: "linear-gradient(90deg, transparent, #d4a96b, transparent)",
        }}
      />
    </div>
  );
}

function InyeonResultInner() {
  const sp = useSearchParams();
  const [chapter, setChapter] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9>(1);
  const TOTAL = 9;
  type Chap = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

  const aName = sp.get("aName") || "A";
  const bName = sp.get("bName") || "B";
  const aBirth = `${sp.get("aYear")}년 ${sp.get("aMonth")}월 ${sp.get("aDay")}일`;
  const bBirth = `${sp.get("bYear")}년 ${sp.get("bMonth")}월 ${sp.get("bDay")}일`;
  const rel = (sp.get("relationship") || "talking") as RelationshipKind;
  const dur = (sp.get("duration") || "1to3m") as MeetDuration;

  const relLabel = RELATIONSHIP_LABEL[rel];
  const durLabel = DURATION_LABEL[dur];

  const [data, setData] = useState<InyeonComputeData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [aiText, setAiText] = useState<Record<number, string>>({});
  const [openingDone, setOpeningDone] = useState(false);
  // ceremony 폐기 (오프닝 영상이 도입·리빌 역할 대체)

  // 스트리밍 마크다운 → ### 소제목별 본문 맵
  const aiBodies = (() => {
    const out: Record<number, Record<string, string>> = {};
    for (const [chStr, md] of Object.entries(aiText)) {
      const ch = Number(chStr);
      const map: Record<string, string> = {};
      // ### Title\n...body... 형식 파싱. 다음 ### 또는 ## 까지 (스트리밍 중 미완 마지막 섹션도 캡처되도록 sentinel 추가).
      const sentineled = md + "\n## __END__\n";
      const re = /^###\s+(.+?)\s*\n([\s\S]*?)(?=^###\s|^##\s)/gm;
      let m: RegExpExecArray | null;
      while ((m = re.exec(sentineled)) !== null) {
        const title = m[1].trim();
        const body = m[2].trim();
        if (title && body) map[title] = body;
      }
      out[ch] = map;
    }
    return out;
  })();
  const bodyOf = (ch: number, title: string, fallback: string): string =>
    aiBodies[ch]?.[title] || fallback;

  // AI 풀이가 들어오면 자동 교체. 일치하는 ### 소제목이 없으면 fallback 그대로.
  // 사용법: <ChSub ch={2} title="우리는 인연일까, 악연일까?" fallback="..." />
  const ChSub = ({ ch, title, fallback }: { ch: number; title: string; fallback: string }) => (
    <SubSection title={title} body={bodyOf(ch, title, fallback)} />
  );

  // AI 풀이 스트림 — compute 끝난 뒤 1회 호출
  useEffect(() => {
    if (!data) return;
    const aYear = parseInt(sp.get("aYear") || "0", 10);
    const aMonth = parseInt(sp.get("aMonth") || "0", 10);
    const aDay = parseInt(sp.get("aDay") || "0", 10);
    const bYear = parseInt(sp.get("bYear") || "0", 10);
    const bMonth = parseInt(sp.get("bMonth") || "0", 10);
    const bDay = parseInt(sp.get("bDay") || "0", 10);
    if (!aYear || !bYear) return;
    const reqBody = {
      a: { name: aName, year: String(aYear), month: String(aMonth), day: String(aDay),
        hour: sp.get("aHour") || "모름",
        calendar: (sp.get("aCalendar") || "양력") as "양력" | "음력",
        gender: (sp.get("aGender") || "여") as "남" | "여" },
      b: { name: bName, year: String(bYear), month: String(bMonth), day: String(bDay),
        hour: sp.get("bHour") || "모름",
        calendar: (sp.get("bCalendar") || "양력") as "양력" | "음력",
        gender: (sp.get("bGender") || "남") as "남" | "여" },
      choice: { relationship: rel, duration: dur },
    };
    const ac = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/inyeon-generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(reqBody),
          signal: ac.signal,
        });
        if (!res.ok || !res.body) return;
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (!raw || raw === "[DONE]") continue;
            try {
              const evt = JSON.parse(raw) as { t: string; ch?: number; v?: string };
              if (evt.t === "x" && evt.ch && evt.v) {
                setAiText(prev => ({
                  ...prev,
                  [evt.ch!]: (prev[evt.ch!] ?? "") + evt.v,
                }));
              }
            } catch {}
          }
        }
      } catch {/* aborted or network */}
    })();
    return () => ac.abort();
  }, [data, sp, aName, bName, rel, dur]);

  useEffect(() => {
    const aYear = parseInt(sp.get("aYear") || "0", 10);
    const aMonth = parseInt(sp.get("aMonth") || "0", 10);
    const aDay = parseInt(sp.get("aDay") || "0", 10);
    const bYear = parseInt(sp.get("bYear") || "0", 10);
    const bMonth = parseInt(sp.get("bMonth") || "0", 10);
    const bDay = parseInt(sp.get("bDay") || "0", 10);
    if (!aYear || !bYear) return;
    const body = {
      a: { name: aName, year: aYear, month: aMonth, day: aDay,
        hour: sp.get("aHour") || "모름",
        isLunar: (sp.get("aCalendar") || "양력") === "음력",
        gender: sp.get("aGender") || "여" },
      b: { name: bName, year: bYear, month: bMonth, day: bDay,
        hour: sp.get("bHour") || "모름",
        isLunar: (sp.get("bCalendar") || "양력") === "음력",
        gender: sp.get("bGender") || "남" },
    };
    fetch("/api/inyeon-compute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then(setData)
      .catch(e => setLoadError(String(e)));
  }, [sp, aName, bName]);

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: BG }}>
        <div className="text-sm text-center" style={{ color: ACCENT }}>
          사주 계산 중 문제가 생겼어요.<br />
          <span className="text-xs opacity-60">{loadError}</span>
        </div>
      </div>
    );
  }
  if (!data || !openingDone) {
    return (
      <OpeningVideo
        dataReady={!!data}
        onComplete={() => setOpeningDone(true)}
        loadingMessage={`${aName}·${bName} 두 분의 사주를 펼치는 중…`}
      />
    );
  }

  // SajuAnalysis pillars → SajuTable Pillar shape
  const toPillar = (p: { stem: string; branch: string } | null, sip: { stem: string; branch: string } | null) =>
    p && sip ? { stem: p.stem, branch: p.branch, stemSipseong: sip.stem, branchSipseong: sip.branch } : null;
  const pA = {
    year: toPillar(data.a.pillars.year, data.a.sipseong.year)!,
    month: toPillar(data.a.pillars.month, data.a.sipseong.month)!,
    day: { stem: data.a.pillars.day.stem, branch: data.a.pillars.day.branch,
      stemSipseong: "일간", branchSipseong: data.a.sipseong.day.branch },
    hour: toPillar(data.a.pillars.hour, data.a.sipseong.hour),
  };
  const pB = {
    year: toPillar(data.b.pillars.year, data.b.sipseong.year)!,
    month: toPillar(data.b.pillars.month, data.b.sipseong.month)!,
    day: { stem: data.b.pillars.day.stem, branch: data.b.pillars.day.branch,
      stemSipseong: "일간", branchSipseong: data.b.sipseong.day.branch },
    hour: toPillar(data.b.pillars.hour, data.b.sipseong.hour),
  };

  const ratioOf = (e: typeof data.a.elements) => {
    const total = e.목 + e.화 + e.토 + e.금 + e.수;
    const f = (n: number) => total > 0 ? Math.round((n / total) * 1000) / 10 : 0;
    return { 목: f(e.목), 화: f(e.화), 토: f(e.토), 금: f(e.금), 수: f(e.수) };
  };

  const JIJANGGAN_MAP: Record<string, string[]> = {
    자: ["壬", "癸"], 축: ["癸", "辛", "己"], 인: ["戊", "丙", "甲"],
    묘: ["甲", "乙"], 진: ["乙", "癸", "戊"], 사: ["戊", "庚", "丙"],
    오: ["丙", "己", "丁"], 미: ["丁", "乙", "己"], 신: ["戊", "壬", "庚"],
    유: ["庚", "辛"], 술: ["辛", "丁", "戊"], 해: ["戊", "甲", "壬"],
  };
  const jjA = JIJANGGAN_MAP[data.a.pillars.day.branch] || [];
  const jjB = JIJANGGAN_MAP[data.b.pillars.day.branch] || [];

  // SipseongRow는 hour pillar 필수 — 모름이면 day로 대체 (시각 자리 채움용)
  const sipHourA = pA.hour ?? pA.day;
  const sipHourB = pB.hour ?? pB.day;

  return (
    <>
    <ChapterShell
      chapterNo={chapter}
      chapterTitle={
        chapter === 1 ? "나는 — 사주가 펼치는 나의 결"
        : chapter === 2 ? "그 사람은 — 사주가 펼치는 그의 결"
        : chapter === 3 ? "우리는 — 인연의 시작과 결"
        : chapter === 4 ? "성격궁합 - 함께 있을 때 우리는"
        : chapter === 5 ? "감정궁합 - 마음이 닿는 방식"
        : chapter === 6 ? "깊은궁합 - 체질·시기·본능"
        : chapter === 7 ? "관계조언 - 지금 우리에게 필요한 것"
        : chapter === 8 ? "미래궁합 - 결혼·자녀·노년"
        : "홍도인의 마지막 편지"
      }
      totalChapters={TOTAL}
      chapters={[
        { no: 1, label: "나는" },
        { no: 2, label: "그 사람은" },
        { no: 3, label: "우리는 (인연)" },
        { no: 4, label: "성격궁합" },
        { no: 5, label: "감정궁합" },
        { no: 6, label: "깊은궁합" },
        { no: 7, label: "관계조언" },
        { no: 8, label: "미래궁합" },
        { no: 9, label: "홍도인의 편지" },
      ]}
      onPrev={chapter > 1 ? () => setChapter((chapter - 1) as Chap) : undefined}
      onNext={chapter < TOTAL ? () => setChapter((chapter + 1) as Chap) : undefined}
      onSelect={(no) => setChapter(no as Chap)}
      backHref="/inyeon/form"
    >
      {/* Page 1 — 당신은 (ME) */}
      {chapter === 1 && (
        <>
          <Section title={`${aName}님의 사주 — "나"`}>
            <SajuTable name={aName} birthLine={aBirth}
              hour={pA.hour} day={pA.day} month={pA.month} year={pA.year} />
            <OhaengChart name={aName} counts={data.a.elements} ratios={ratioOf(data.a.elements)} />
            <YongsinCards yongsin={data.a.yongsin} huisin="" gisin="" />
            <SinKangBar ilgan={data.a.ilgan} stage={data.a.shinkang} />
            {data.a.sinsal.length > 0 && data.character?.a.color && (
              <CharmSinsalCard name={aName} sinsalList={data.a.sinsal} color={data.character.a.color} />
            )}
            <AttractionStyleBar name={aName} sipseong={data.a.sipseong as { year: { stem: string; branch: string }; month: { stem: string; branch: string }; day: { branch: string }; hour: { stem: string; branch: string } | null }} color={data.character?.a.color ?? "#c8203a"} />
            {data.character && (
              <CharacterIntroCard
                aName={aName} bName={bName}
                character={data.character}
                aGender={(sp.get("aGender") || "여") === "남" ? "남" : "여"}
                bGender={(sp.get("bGender") || "남") === "여" ? "여" : "남"}
              />
            )}
            <ChSub ch={1} title="나의 타고난 성격"
              fallback={`${aName}님의 일간 ${data.a.ilgan}(${data.a.shinkang}) — ${data.a.ohaengTop} 기운이 강한 결을 풀어드려요.`} />
            <ChSub ch={1} title="연애할 때 드러나는 나의 매력"
              fallback={`${aName}님이 연애 자리에서 자연스럽게 드러내는 매력의 결을 풀어드려요.`} />
            <ChSub ch={1} title="내가 끌리는 이상형"
              fallback={`${aName}님이 마음을 흔드는 결을 풀어드려요.`} />
          </Section>

          <TransitionLine text={`당신을 펼쳐봤어요. 이제 ${bName}님 ─ 그 사람을 살펴볼게요.`} />
        </>
      )}

      {/* Page 2 — 그 사람은 (THEM) */}
      {chapter === 2 && (
        <>
          <Section title={`${bName}님의 사주 — "그 사람"`}>
            <SajuTable name={bName} birthLine={bBirth}
              hour={pB.hour} day={pB.day} month={pB.month} year={pB.year} />
            <OhaengChart name={bName} counts={data.b.elements} ratios={ratioOf(data.b.elements)} />
            <YongsinCards yongsin={data.b.yongsin} huisin="" gisin="" />
            <SinKangBar ilgan={data.b.ilgan} stage={data.b.shinkang} />
            {data.b.sinsal.length > 0 && data.character?.b.color && (
              <CharmSinsalCard name={bName} sinsalList={data.b.sinsal} color={data.character.b.color} />
            )}
            <AttractionStyleBar name={bName} sipseong={data.b.sipseong as { year: { stem: string; branch: string }; month: { stem: string; branch: string }; day: { branch: string }; hour: { stem: string; branch: string } | null }} color={data.character?.b.color ?? "#b88646"} />
            <ChSub ch={1} title="그 사람의 타고난 성격"
              fallback={`${bName}님의 일간 ${data.b.ilgan}(${data.b.shinkang}) — ${data.b.ohaengTop} 기운이 강한 결을 풀어드려요.`} />
            <ChSub ch={1} title="그 사람이 연애할 때 보이는 모습"
              fallback={`${bName}님이 연애 자리에서 어떻게 다가가는지 풀어드려요.`} />
            <ChSub ch={1} title="그 사람이 끌리는 이상형"
              fallback={`${bName}님이 어떤 결의 사람에게 끌리는지 풀어드려요.`} />
          </Section>

          <TransitionLine text="두 분의 결을 모두 펼쳤어요. 이제 두 분의 만남을 그려드릴게요." />
        </>
      )}

      {/* Page 3 — 우리는 (US 시작 — 첫인상 + 인연궁합) */}
      {chapter === 3 && (
        <>
          <Section title="우리의 첫인상">
            <ChSub ch={1} title="그 사람이 나에게 받은 첫인상"
              fallback={`${bName}님이 ${aName}님을 처음 마주했을 때의 결을 풀어드려요.`} />
            <ChSub ch={1} title="내가 그 사람에게 받은 첫인상"
              fallback={`${aName}님이 ${bName}님을 처음 만났을 때 마음에 남은 결을 풀어드려요.`} />
          </Section>

          <Section title="인연 궁합 점수">
            <ScoreGauge score={data.scores.inyeon} label={data.scores.labels.inyeon} caption="In-yeon Score" />
          </Section>

          <Section title="두 사주의 결합">
            <ChemistryDiagram
              aIlgan={data.a.ilgan}
              bIlgan={data.b.ilgan}
              aDayBranch={data.a.pillars.day.branch}
              bDayBranch={data.b.pillars.day.branch}
              aColor={data.character?.a.color ?? "#c8203a"}
              bColor={data.character?.b.color ?? "#b88646"}
            />
          </Section>

          <Section title="우리 인연의 결">
            <ChSub ch={2} title="우리 인연을 한 줄로 정의하면"
              fallback={`${aName}님과 ${bName}님 인연의 본질을 한 줄로 정리해 드려요.`} />
            <ChSub ch={2} title="우리는 어떤 결로 만난 인연일까"
              fallback="두 분이 만나서 자라가는 결을 풀어드려요." />
          </Section>

          <Section title="끌림의 정체">
            <ChSub ch={2} title="우리가 끌린 진짜 이유"
              fallback={`${aName}님과 ${bName}님이 서로에게 끌린 사주의 깊은 결을 풀어드려요.`} />
            <ChSub ch={2} title="이 인연이 우리에게 주는 의미"
              fallback="이 인연이 두 분에게 어떤 결을 더해주는지 풀어드려요." />
          </Section>

          <TransitionLine text="인연의 시작이 보이시나요? 함께 있을 때 두 분의 케미를 따라가봐요." />
        </>
      )}

      {/* Page 4 — 성격궁합 (LLM ch3) */}
      {chapter === 4 && (
        <>
          <NoticeBubble>
            성격궁합은 두 분의 일간(日干)을 중심으로 봐요. 일간이 어떻게 만나는지가 일상의 결을 결정해요.
          </NoticeBubble>

          <Section title="성격 궁합 점수">
            <ScoreGauge score={data.scores.seonggyeok} label={data.scores.labels.seonggyeok} caption="Personality Score" />
          </Section>

          {/* QuadrantChart — 성격 4분면 */}
          {(() => {
            const STEM_ELEM_LOCAL: Record<string, string> = {
              갑: "목", 을: "목", 병: "화", 정: "화", 무: "토", 기: "토",
              경: "금", 신: "금", 임: "수", 계: "수",
            };
            const sipScore = (sip: typeof data.a.sipseong, kw: string[]) => {
              const all = [sip.year?.stem, sip.year?.branch, sip.month?.stem, sip.month?.branch, sip.day?.branch, sip.hour?.stem, sip.hour?.branch].filter(Boolean) as string[];
              return all.filter(s => kw.some(k => s.includes(k))).length;
            };
            const aSik = sipScore(data.a.sipseong, ["식신", "상관"]);
            const aJae = sipScore(data.a.sipseong, ["정재", "편재"]);
            const aIn = sipScore(data.a.sipseong, ["정인", "편인", "효신"]);
            const aBi = sipScore(data.a.sipseong, ["비견", "겁재"]);
            const aGwan = sipScore(data.a.sipseong, ["정관", "편관", "칠살"]);
            const bSik = sipScore(data.b.sipseong, ["식신", "상관"]);
            const bJae = sipScore(data.b.sipseong, ["정재", "편재"]);
            const bIn = sipScore(data.b.sipseong, ["정인", "편인", "효신"]);
            const bBi = sipScore(data.b.sipseong, ["비견", "겁재"]);
            const bGwan = sipScore(data.b.sipseong, ["정관", "편관", "칠살"]);
            // 외향(0~100): 식상+재성 강도. 내향: 인성 강도.
            const aExt = Math.min(100, Math.max(0, 50 + (aSik + aJae) * 8 - aIn * 8));
            const bExt = Math.min(100, Math.max(0, 50 + (bSik + bJae) * 8 - bIn * 8));
            // 활동(0~100): 비겁+식상 강도. 안정: 인성+관성 강도.
            const aAct = Math.min(100, Math.max(0, 50 + (aBi + aSik) * 7 - (aIn + aGwan) * 7));
            const bAct = Math.min(100, Math.max(0, 50 + (bBi + bSik) * 7 - (bIn + bGwan) * 7));
            return (
              <Section title="성격 4분면 위치">
                <QuadrantChart
                  aName={aName}
                  bName={bName}
                  aPos={{ x: aExt, y: aAct }}
                  bPos={{ x: bExt, y: bAct }}
                  aColor={data.character?.a.color ?? "#c8203a"}
                  bColor={data.character?.b.color ?? "#b88646"}
                />
              </Section>
            );
          })()}

          <Section title="우리의 성격 케미">
            <ChSub ch={3} title="우리 성격이 만났을 때의 큰 그림"
              fallback={`${aName}님과 ${bName}님 일간이 만나는 큰 그림을 풀어드려요.`} />
            <ChSub ch={3} title="함께 있을 때 자연스럽게 나뉘는 역할"
              fallback="두 분이 함께 있을 때 자연스럽게 자리잡는 역할 분담을 풀어드려요." />
          </Section>

          <Section title="우리의 끌림 포인트">
            <ChSub ch={3} title="그 사람이 나에게 느끼는 매력"
              fallback={`${bName}님이 ${aName}님에게서 느끼는 매력의 결을 풀어드려요.`} />
            <ChSub ch={3} title="내가 그 사람에게 느끼는 매력"
              fallback={`${aName}님이 ${bName}님에게서 느끼는 매력의 결을 풀어드려요.`} />
          </Section>

          <Section title="함께 오래갈 수 있을까">
            <ChSub ch={3} title="시간이 지나도 단단할 수 있을까"
              fallback="합과 충, 원진과 해의 흔적을 종합해 풀어드려요." />
            {(() => {
              const STAGE_LEVEL: Record<string, number> = { 극약: 1, 태약: 2, 신약: 3, 중화: 4, 신강: 5, 태강: 6, 극왕: 7 };
              const aLv = STAGE_LEVEL[data.a.shinkang] ?? 4;
              const bLv = STAGE_LEVEL[data.b.shinkang] ?? 4;
              return (
                <BiBar
                  topLabel="신강·신약으로 본 두 분의 결"
                  leftLabel={`${aName}님 (${data.a.shinkang})`}
                  rightLabel={`${bName}님 (${data.b.shinkang})`}
                  leftValue={aLv}
                  rightValue={bLv}
                  leftColor={data.character?.a.color ?? "#c8203a"}
                  rightColor={data.character?.b.color ?? "#b88646"}
                />
              );
            })()}
            <ChSub ch={3} title="누가 주도하고 누가 양보하는가"
              fallback="신강신약과 일간 강약을 토대로 풀어드려요." />
          </Section>

          <Section title="성격 궁합을 보완하는 법">
            <ChSub ch={3} title="그 사람이 나를 더 좋아하게 만드는 법"
              fallback={`${aName}님이 ${bName}님 사주를 어떻게 채워줄 수 있는지 풀어드려요.`} />
            <ChSub ch={3} title="우리가 함께할 때 가장 잘 맞는 활동"
              fallback="두 분의 결이 가장 잘 살아나는 활동을 풀어드려요." />
          </Section>

          <TransitionLine text="성격은 봤어요. 두 분의 마음은 어떻게 닿을까요?" />
        </>
      )}

      {/* Page 5 — 감정궁합 (LLM ch4) */}
      {chapter === 5 && (
        <>
          <NoticeBubble>
            감정궁합은 일간 기준 천간 3개와 일지 지장간을 봐요. 십성을 통해 두 분의 내면 심리·감정 결을 살펴봐요.
          </NoticeBubble>

          <Section title="감정·심리 궁합 점수">
            <ScoreGauge score={data.scores.emotion} label={data.scores.labels.emotion} caption="Emotion Score" />
          </Section>

          <Section title={`${aName}님의 십성과 지장간`}>
            <SipseongRow
              name={aName}
              hour={sipHourA}
              day={pA.day}
              month={pA.month}
              year={pA.year}
              jijanggan={jjA}
            />
          </Section>

          <Section title={`${bName}님의 십성과 지장간`}>
            <SipseongRow
              name={bName}
              hour={sipHourB}
              day={pB.day}
              month={pB.month}
              year={pB.year}
              jijanggan={jjB}
            />
          </Section>

          <Section title="우리의 감정 표현">
            <ChSub ch={4} title="우리가 마음을 주고받는 방식"
              fallback={`${aName}님과 ${bName}님이 감정을 어떻게 표현하고 받아들이는지 풀어드려요.`} />
            <ChSub ch={4} title="서로에게 안정감을 주는 포인트"
              fallback="두 분이 서로에게서 어떤 결로 안정감을 받는지 풀어드려요." />
          </Section>

          <Section title="그 사람 행동 통역">
            <BehaviorTranslator
              targetName={bName}
              ilgan={data.b.ilgan}
              shinkang={data.b.shinkang}
              sipseong={data.b.sipseong as { year: { stem: string; branch: string }; month: { stem: string; branch: string }; day: { branch: string }; hour: { stem: string; branch: string } | null }}
              color={data.character?.b.color ?? "#b88646"}
            />
            <BehaviorTranslator
              targetName={aName}
              ilgan={data.a.ilgan}
              shinkang={data.a.shinkang}
              sipseong={data.a.sipseong as { year: { stem: string; branch: string }; month: { stem: string; branch: string }; day: { branch: string }; hour: { stem: string; branch: string } | null }}
              color={data.character?.a.color ?? "#c8203a"}
            />
          </Section>

          <Section title="갈등과 화해의 결">
            {(() => {
              // 갈등 패턴 chip — 사주 기반 결정론
              const tags: string[] = [];
              const aSip = (data.a.sipseong as Record<string, { stem: string; branch: string } | null>);
              const bSip = (data.b.sipseong as Record<string, { stem: string; branch: string } | null>);
              const allA = [aSip.year?.stem, aSip.year?.branch, aSip.month?.stem, aSip.month?.branch, aSip.day?.branch, aSip.hour?.stem, aSip.hour?.branch].filter(Boolean) as string[];
              const allB = [bSip.year?.stem, bSip.year?.branch, bSip.month?.stem, bSip.month?.branch, bSip.day?.branch, bSip.hour?.stem, bSip.hour?.branch].filter(Boolean) as string[];
              const sikA = allA.filter(s => s.includes("식신") || s.includes("상관")).length;
              const sikB = allB.filter(s => s.includes("식신") || s.includes("상관")).length;
              const inA = allA.filter(s => s.includes("정인") || s.includes("편인") || s.includes("효신")).length;
              const inB = allB.filter(s => s.includes("정인") || s.includes("편인") || s.includes("효신")).length;
              const gwanA = allA.filter(s => s.includes("정관") || s.includes("편관") || s.includes("칠살")).length;
              const gwanB = allB.filter(s => s.includes("정관") || s.includes("편관") || s.includes("칠살")).length;
              if (sikA >= 3 || sikB >= 3) tags.push("#잔소리");
              if (sikA <= 1 && sikB <= 1) tags.push("#침묵");
              if (inA >= 3 || inB >= 3) tags.push("#회피");
              if (gwanA >= 2 || gwanB >= 2) tags.push("#통제");
              if (sikA >= 2 && inB >= 2) tags.push("#엇갈림");
              if (data.a.ohaengTop === data.b.ohaengWeak || data.b.ohaengTop === data.a.ohaengWeak) tags.push("#오해");
              if (tags.length === 0) tags.push("#일상의 결");
              return <ConflictTagsCard tags={tags} />;
            })()}
            <ChSub ch={4} title="우리가 자주 부딪히는 갈등 패턴"
              fallback={`${aName}님과 ${bName}님 사이에 반복될 결의 갈등을 풀어드려요.`} />
            <ChSub ch={4} title="화해의 길을 여는 한 마디"
              fallback="두 분이 다툰 후 마음을 푸는 한 마디의 결을 풀어드려요." />
            <ChSub ch={4} title="권태기를 슬기롭게 넘기는 법"
              fallback="두 분만의 권태기 처방을 풀어드려요." />
          </Section>

          <TransitionLine text="마음 깊이까지 들어왔어요. 이제 더 내밀한 결 — 체질·시기·본능을 펼쳐드릴게요." />
        </>
      )}

      {/* Page 6 — 깊은궁합 (LLM ch5) */}
      {chapter === 6 && (
        <>
          <NoticeBubble>
            두 분의 깊은 결을 오행 체질·시기 흐름·본능으로 살펴드려요. 본능궁합은 {relLabel} 단계에 맞춰 풀이의 결을 조정했어요.
          </NoticeBubble>

          <Section title="체질 궁합 점수">
            <ScoreGauge score={data.scores.physical} label={data.scores.labels.physical} caption="Physical Score" />
          </Section>

          <Section title="우리의 체질궁합">
            <ChSub ch={5} title="두 사람의 오행 체질"
              fallback={`${aName}님과 ${bName}님 각자의 오행 체질을 풀어드려요.`} />
            <ChSub ch={5} title="함께할 때 건강의 보완과 주의점"
              fallback="두 분이 함께할 때 서로의 결을 어떻게 보완하는지 풀어드려요." />
          </Section>

          <Section title="우리의 시기궁합">
            <MonthGrid aBranch={data.a.pillars.day.branch} bBranch={data.b.pillars.day.branch} />
            <ChSub ch={5} title="가장 가까워질 시기"
              fallback="두 분 결이 가장 가까워질 시기를 대운 흐름으로 풀어드려요." />
            <ChSub ch={5} title="흔들릴 수 있는 시기"
              fallback="결이 흔들릴 수 있는 시기와 함께 통과할 결을 풀어드려요." />
            <ChSub ch={5} title="향후 1년의 흐름"
              fallback="이번 한 해 두 분 인연의 흐름을 짚어드려요." />
          </Section>

          <Section title="우리의 본능궁합">
            {rel === "crush" && (
              <>
                <ChSub ch={5} title="그 사람의 숨겨진 이성적 매력"
                  fallback={`${bName}님 사주 깊은 곳에 숨겨진 이성적 매력의 결을 풀어드려요.`} />
                <ChSub ch={5} title="가까워진다면 어떤 스킨십이 잘 맞을까"
                  fallback="두 분이 가까워졌을 때 자연스럽게 흐를 결을 풀어드려요." />
              </>
            )}
            {rel === "talking" && (
              <>
                <ChSub ch={5} title="우리 사이에 흐르는 이성적 끌림"
                  fallback="아직 표면화되지 않았지만 흐르는 결의 끌림을 풀어드려요." />
                <ChSub ch={5} title="스킨십이 시작될 때 잘 맞는 결"
                  fallback="첫 스킨십이 시작될 때 자연스럽게 흐를 결을 풀어드려요." />
              </>
            )}
            {rel === "dating_short" && (
              <>
                <ChSub ch={5} title="우리 둘의 잠자리 케미"
                  fallback="처음 함께하는 자리에서 만들어지는 결의 케미를 풀어드려요." />
                <ChSub ch={5} title="우리에게 잘 맞는 스킨십의 결"
                  fallback="두 분 사주에 잘 맞는 스킨십의 결을 풀어드려요." />
                <ChSub ch={5} title="잠자리에서 주도하는 쪽은 누구일까"
                  fallback="자연스러운 주도·받음의 결을 풀어드려요." />
              </>
            )}
            {rel === "dating_long" && (
              <>
                <ChSub ch={5} title="안정된 관계에서 깊어지는 잠자리 케미"
                  fallback="안정기 두 분의 깊어지는 결을 풀어드려요." />
                <ChSub ch={5} title="우리에게 잘 맞는 스킨십의 결"
                  fallback="안정기 두 분에게 잘 맞는 스킨십의 결을 풀어드려요." />
                <ChSub ch={5} title="잠자리에서 주도하는 쪽은 누구일까"
                  fallback="자연스러운 주도·받음의 결을 풀어드려요." />
                <ChSub ch={5} title="잠자리에서 부딪힐 수 있는 지점"
                  fallback="친밀의 자리에서 부딪힐 수 있는 결과 풀어가는 한 가지를 풀어드려요." />
              </>
            )}
            {rel === "married" && (
              <>
                <ChSub ch={5} title="오랜 부부의 잠자리 케미"
                  fallback="오래 함께한 두 분의 친밀의 결을 풀어드려요." />
                <ChSub ch={5} title="노년까지 이어지는 부부의 친밀"
                  fallback="노년기로 가면서 변하는 친밀의 결을 풀어드려요." />
                <ChSub ch={5} title="잠자리 주도권의 변화"
                  fallback="시간이 흐르며 변하는 주도·받음의 결을 풀어드려요." />
              </>
            )}
            {rel === "exboyfriend" && (
              <>
                <ChSub ch={5} title="다시 만났을 때의 이성적 끌림"
                  fallback="재회 후 다시 마주했을 때 흐르는 결의 끌림을 풀어드려요." />
                <ChSub ch={5} title="재회 후 깊어질 잠자리 케미"
                  fallback="다시 만난 두 분이 친밀해질 때의 결을 풀어드려요." />
                <ChSub ch={5} title="잠자리에서 다시 부딪힐 수 있는 지점"
                  fallback="다시 만난 두 분이 친밀의 자리에서 다시 부딪힐 수 있는 결을 풀어드려요." />
              </>
            )}
          </Section>

          <TransitionLine text="그래서, 지금 두 분에게 필요한 건 뭘까요?" />
        </>
      )}

      {/* Page 7 — 관계조언 (LLM ch6) */}
      {chapter === 7 && (
        <>
          <NoticeBubble>
            지금 두 분에게 가장 필요한 결을 풀어드려요. {relLabel} 단계에 맞춰 풀이의 결을 조정했어요.
          </NoticeBubble>

          {(() => {
            const ch6Map: Record<RelationshipKind, { sectionTitle: string; subs: string[] }> = {
              crush: {
                sectionTitle: "그 마음을 풀어가는 길",
                subs: ["그 사람의 마음을 여는 열쇠", "다가갈 때 피해야 할 행동", "고백의 타이밍과 방법", "이 마음, 정리해야 할 신호"],
              },
              talking: {
                sectionTitle: "관계가 깊어지는 길",
                subs: ["호감을 키우는 우리만의 방법", "관계가 진전될 결정적 순간", "잘 안 될 신호와 조기 판단법"],
              },
              dating_short: {
                sectionTitle: "초반을 단단히 다지는 길",
                subs: ["초반에 단단해질 우리만의 방법", "콩깍지 너머의 진짜 모습", "지금 가장 조심해야 할 갈등"],
              },
              dating_long: {
                sectionTitle: "더 깊어지는 길",
                subs: ["권태기를 넘고 더 깊어지는 법", "다음 단계로 가야 할 신호"],
              },
              married: {
                sectionTitle: "평생 함께 가는 길",
                subs: ["평생 함께 깊어지는 우리만의 결", "가장 흔들릴 수 있는 시기"],
              },
              exboyfriend: {
                sectionTitle: "어긋난 인연을 다시 보다",
                subs: ["우리가 어긋난 진짜 이유", "다시 이어질 가능성과 조건", "결정의 골든타임", "반복되지 않을 방법"],
              },
            };
            const plan = ch6Map[rel];
            return (
              <>
                {/* 행동 지도 카드 미리 보기 */}
                <Section title="행동 지도 — 한눈에 보기">
                  <div className="grid grid-cols-2 gap-2">
                    {plan.subs.map((title, i) => (
                      <ActionCard
                        key={title}
                        num={String(i + 1).padStart(2, "0")}
                        title={title}
                        color={data.character?.a.color ?? "#c8203a"}
                      />
                    ))}
                  </div>
                </Section>
                <Section title={plan.sectionTitle}>
                  {plan.subs.map(title => (
                    <ChSub key={title} ch={6} title={title}
                      fallback={`${relLabel} 단계에 맞춰 두 분에게 지금 필요한 결을 풀어드리고 있어요.`} />
                  ))}
                </Section>
              </>
            );
          })()}

          <TransitionLine text="지금을 정리했어요. 이제 두 분의 미래를 봅시다." />
        </>
      )}

      {/* Page 8 — 미래궁합 (LLM ch7) */}
      {chapter === 8 && (
        <>
          <NoticeBubble>
            결혼·미래의 결을 풀어드려요. {relLabel} 단계에 맞춰 풀이의 결을 조정했어요.
          </NoticeBubble>

          <Section title="결혼·미래 가능성">
            <ScoreGauge score={data.scores.marriage} label={data.scores.labels.marriage} caption="Marriage Score" />
          </Section>

          {(() => {
            const ch7Map: Record<RelationshipKind, { sectionTitle: string; subs: string[] }> = {
              crush: {
                sectionTitle: "만약 함께한다면",
                subs: ["이 사람과 결혼까지 갈 가능성", "함께한다면 펼쳐질 미래의 모습"],
              },
              talking: {
                sectionTitle: "이 인연이 닿을 수 있는 곳",
                subs: ["이 사람과 미래까지 갈 가능성", "멀리 봤을 때 우리 인연이 닿을 수 있는 곳"],
              },
              dating_short: {
                sectionTitle: "멀리 봤을 때 우리의 미래",
                subs: ["이 사람과 결혼까지 갈 가능성", "함께한다면 펼쳐질 미래의 모습", "길게 가기 위해 지금 챙겨야 할 것"],
              },
              dating_long: {
                sectionTitle: "결혼·미래궁합",
                subs: [
                  "결혼까지 이어질 결인지",
                  "결혼의 장애물",
                  "좋은 결혼 시기",
                  "신혼생활을 시작하기 좋은 자리",
                  "우리 둘의 자녀운",
                ],
              },
              married: {
                sectionTitle: "가정과 함께 가는 길",
                subs: [
                  "우리 둘의 자녀운 — 사주에 담긴 자녀 인연",
                  "자녀운이 부족할 때 보완하는 길",
                  "우리의 노년기 결 — 60대 이후 우리는 어떤 모습일까",
                  "평생 흔들리지 않는 우리만의 결",
                  "가정의 재물·생활의 큰 흐름",
                ],
              },
              exboyfriend: {
                sectionTitle: "다시 함께한다면",
                subs: [
                  "다시 만나서 결혼까지 갈 결인지",
                  "다시 함께한다면 펼쳐질 미래의 모습",
                  "재회 후 길게 함께 가기 위한 한 가지",
                ],
              },
            };
            const plan = ch7Map[rel];
            // MilestoneCard 아이콘 매핑
            const ICON: Record<string, string> = {
              "결혼까지": "婚", "결혼의 장애물": "難", "좋은 결혼 시기": "時", "신혼생활": "新",
              "자녀운": "子", "자녀 인연": "子", "보완하는 길": "養",
              "노년기": "老", "60대 이후": "老", "평생": "永", "흔들리지 않는": "永",
              "재물": "財", "생활": "財",
              "결혼까지 갈 가능성": "婚", "함께한다면": "夢", "미래의 모습": "夢",
              "닿을 수 있는 곳": "境", "지금 챙겨야": "備",
              "다시 만나서": "再", "재회": "再", "함께 가기": "永",
            };
            const iconFor = (title: string) => {
              for (const [k, v] of Object.entries(ICON)) if (title.includes(k)) return v;
              return "緣";
            };
            const aColor = data.character?.a.color ?? "#c8203a";
            const bColor = data.character?.b.color ?? "#b88646";
            // 자녀운 카드용 데이터
            const sipScoreLocal = (sip: typeof data.a.sipseong, kw: string[]) => {
              const all = [sip.year?.stem, sip.year?.branch, sip.month?.stem, sip.month?.branch, sip.day?.branch, sip.hour?.stem, sip.hour?.branch].filter(Boolean) as string[];
              return all.filter(s => kw.some(k => s.includes(k))).length;
            };
            const sikA = sipScoreLocal(data.a.sipseong, ["식신", "상관"]);
            const sikB = sipScoreLocal(data.b.sipseong, ["식신", "상관"]);
            return (
              <>
                {/* MilestoneCard 미리 보기 */}
                <Section title="미래의 결 — 한눈에 보기">
                  <div className="grid grid-cols-3 gap-2">
                    {plan.subs.map((title, i) => (
                      <MilestoneCard
                        key={title}
                        icon={iconFor(title)}
                        label={title.length > 14 ? title.slice(0, 13) + "…" : title}
                        color={i % 2 === 0 ? aColor : bColor}
                      />
                    ))}
                  </div>
                </Section>
                {/* 자녀운 디테일 카드 — 부부 또는 연인길어짐 시에만 */}
                {(rel === "married" || rel === "dating_long") && (
                  <Section title="자녀운의 결">
                    <ChildLuckCard
                      aName={aName} bName={bName}
                      sikCountA={sikA} sikCountB={sikB}
                      color={aColor}
                    />
                  </Section>
                )}
                <Section title={plan.sectionTitle}>
                  {plan.subs.map(title => (
                    <ChSub key={title} ch={7} title={title}
                      fallback={`${relLabel} 단계에 맞춰 결혼·미래의 결을 풀어드리고 있어요.`} />
                  ))}
                </Section>
              </>
            );
          })()}

          <TransitionLine text="두 분의 결을 모두 살펴봤어요. 마지막으로 한 마디 남겨드릴게요." />
        </>
      )}

      {/* Page 9 — 편지 (LLM ch8) */}
      {chapter === 9 && (
        <>
          <NoticeBubble>
            홍도인이 두 분께 드리는 마지막 편지예요. {relLabel} 단계에 맞춰 톤을 조정했어요.
          </NoticeBubble>

          {(() => {
            const ch8SectionTitleMap: Record<RelationshipKind, string> = {
              crush: "다가갈 용기 또는 정리의 지혜를 전하는 편지",
              talking: "이 시작이 가는 길을 비춰주는 편지",
              dating_short: "초반의 단단함을 만들어가는 편지",
              dating_long: "더 깊은 사랑으로 가는 편지",
              married: "평생 함께 가는 동반자에게 보내는 편지",
              exboyfriend: "어긋난 인연 앞에서 길을 찾는 편지",
            };
            return (
              <Section title={ch8SectionTitleMap[rel]}>
                <ChSub ch={8} title="이렇게 만나주신 두 분께"
                  fallback={`${aName}님과 ${bName}님께 드리는 편지를 정리하고 있어요…`} />
                <ChSub ch={8} title="두 분의 결, 잊지 마세요"
                  fallback="1~7장의 결을 한 흐름으로 묶어드려요." />
                <ChSub ch={8} title="마지막으로 드리는 한 마디"
                  fallback="두 분께 보내는 진심 어린 짧은 응원의 한 마디." />
              </Section>
            );
          })()}

          {/* QuoteCard — 캡처용 큰 인용구 (9:16 비율) */}
          {data.character?.pair && (
            <QuoteCard
              aName={aName}
              bName={bName}
              aChar={data.character.a.name}
              bChar={data.character.b.name}
              aColor={data.character.a.color}
              bColor={data.character.b.color}
              pairLabel={data.character.pair.label}
            />
          )}

          <NoticeBubble>
            <strong style={{ color: "#c8203a" }}>마지막까지 함께해 주세요</strong> 🙏<br />
            궁합은 단지 방향을 알려주는 나침반일 뿐이에요. 결국 인연은 두 분이 함께 만들어가는 거예요.
          </NoticeBubble>
        </>
      )}
      <div className="text-center mt-6 text-[10px] tracking-[0.05em] leading-[1.6]"
        style={{ color: "rgba(58,37,48,0.55)", fontFamily: "'Cormorant Garamond', 'Gowun Batang', serif" }}>
        본 풀이는 청나라 자평명리 <strong style={{ color: "#b88646" }}>자평진전(子平眞詮)</strong>·적천수(滴天髓)·명리정종(命理正宗) 정통 framework 기준입니다.
        <br />격국·공망·십이운성·신살×십성 결합·천간 합화 결정론 적용.
      </div>
    </ChapterShell>
    </>
  );
}

export default function InyeonResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
          <div
            className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: `${ACCENT}33`, borderTopColor: ACCENT }}
          />
        </div>
      }
    >
      <InyeonResultInner />
    </Suspense>
  );
}
