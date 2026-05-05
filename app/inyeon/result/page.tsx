"use client";
import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ChapterShell from "@/components/inyeon/ChapterShell";
import SajuTable from "@/components/inyeon/SajuTable";
import OhaengChart from "@/components/inyeon/OhaengChart";
import YongsinCards from "@/components/inyeon/YongsinCards";
import SinKangBar from "@/components/inyeon/SinKangBar";
import ScoreGauge from "@/components/inyeon/ScoreGauge";
import SeasonGrid from "@/components/inyeon/SeasonGrid";
import {
  RELATIONSHIP_LABEL, DURATION_LABEL, DEPTH_LABEL,
  RelationshipKind, MeetDuration, Depth,
} from "@/lib/inyeon/types";

const ACCENT = "#f0a8b8";
const BG = "#2a1a1d";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2
        className="text-base font-bold mb-3 pl-3"
        style={{
          color: "#fef3c7",
          fontFamily: "'Noto Serif KR', serif",
          borderLeft: `3px solid ${ACCENT}`,
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
      className="rounded-2xl p-5"
      style={{
        background: "rgba(240,168,184,0.04)",
        border: `1px solid ${ACCENT}22`,
      }}
    >
      <div
        className="text-sm font-bold mb-2"
        style={{ color: "#fef3c7", fontFamily: "'Noto Serif KR', serif" }}
      >
        {title}
      </div>
      <div className="text-[13px] leading-7" style={{ color: "#d6cdb8" }}>
        {body}
      </div>
    </div>
  );
}

function NoticeBubble({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl px-5 py-3 text-[12px] leading-6 mb-4"
      style={{
        background: `${ACCENT}11`,
        border: `1px dashed ${ACCENT}55`,
        color: "#d6cdb8",
      }}
    >
      {children}
    </div>
  );
}

function InyeonResultInner() {
  const sp = useSearchParams();
  const router = useRouter();
  const [chapter, setChapter] = useState<1 | 2 | 3>(1);

  const aName = sp.get("aName") || "A";
  const bName = sp.get("bName") || "B";
  const aBirth = `${sp.get("aYear")}년 ${sp.get("aMonth")}월 ${sp.get("aDay")}일`;
  const bBirth = `${sp.get("bYear")}년 ${sp.get("bMonth")}월 ${sp.get("bDay")}일`;
  const rel = (sp.get("relationship") || "talking") as RelationshipKind;
  const dur = (sp.get("duration") || "1to3m") as MeetDuration;
  const depth = (sp.get("depth") || "detail") as Depth;

  const relLabel = RELATIONSHIP_LABEL[rel];
  const durLabel = DURATION_LABEL[dur];
  const depthLabel = DEPTH_LABEL[depth];

  // ── 임시 mock 데이터 (실제 사주 계산 wire-up은 다음 단계) ──
  const mockPillarA = {
    hour: { stem: "癸", branch: "酉", stemHanja: "癸", branchHanja: "酉",
      stemSipseong: "정인", branchSipseong: "정관", element: "水" },
    day: { stem: "甲", branch: "辰", stemHanja: "甲", branchHanja: "辰",
      stemSipseong: "일간", branchSipseong: "편재", element: "木" },
    month: { stem: "己", branch: "巳", stemHanja: "己", branchHanja: "巳",
      stemSipseong: "정재", branchSipseong: "식신", element: "土" },
    year: { stem: "甲", branch: "戌", stemHanja: "甲", branchHanja: "戌",
      stemSipseong: "비견", branchSipseong: "편재", element: "木" },
  };
  const mockPillarB = {
    hour: { stem: "癸", branch: "丑", stemHanja: "癸", branchHanja: "丑",
      stemSipseong: "비견", branchSipseong: "편관", element: "水" },
    day: { stem: "癸", branch: "卯", stemHanja: "癸", branchHanja: "卯",
      stemSipseong: "일간", branchSipseong: "식신", element: "水" },
    month: { stem: "壬", branch: "午", stemHanja: "壬", branchHanja: "午",
      stemSipseong: "겁재", branchSipseong: "편재", element: "水" },
    year: { stem: "庚", branch: "午", stemHanja: "庚", branchHanja: "午",
      stemSipseong: "정인", branchSipseong: "편재", element: "金" },
  };

  return (
    <ChapterShell
      chapterNo={chapter}
      chapterTitle={
        chapter === 1 ? "기본 사주분석 - 우린 어떤 사람일까?"
        : chapter === 2 ? "인연궁합 - 사주에 적힌 우리의 인연"
        : "성격궁합 - 사주로 보는 성격의 조화"
      }
      totalChapters={3}
      onPrev={chapter > 1 ? () => setChapter((chapter - 1) as 1 | 2 | 3) : undefined}
      onNext={chapter < 3 ? () => setChapter((chapter + 1) as 1 | 2 | 3) : undefined}
      onTOC={() => router.push("/inyeon/form")}
    >
      {/* 진입 선택값 표시 */}
      <NoticeBubble>
        <strong style={{ color: ACCENT }}>이번 풀이</strong> · {relLabel} · {durLabel} · {depthLabel}<br />
        선택하신 관계와 기간에 맞춰 풀이의 결을 조정했어요
      </NoticeBubble>

      {chapter === 1 && (
        <>
          <NoticeBubble>
            궁합을 보기 전에, 두 분의 사주를 한 분씩 펼쳐볼게요. 본질·매력·이상형까지 차례로 살펴봐요.
          </NoticeBubble>

          <Section title={`${aName}님의 사주`}>
            <SajuTable
              name={aName}
              birthLine={aBirth}
              hour={mockPillarA.hour}
              day={mockPillarA.day}
              month={mockPillarA.month}
              year={mockPillarA.year}
            />
            <SubSection title="기본 사주분석"
              body={`${aName}님의 본질·기질을 풀어드리는 자리에요. (실제 사주 계산이 연결되면 여기에 일간(${mockPillarA.day.stem})에 맞춘 풀이가 나타나요.)`} />
            <SubSection title="나만의 매력은?" body="신살·도화·문창귀인 등을 토대로 본 매력 포인트를 풀어드려요." />
            <SubSection title="내가 꿈꾸는 이상형은?" body="부족한 오행과 강한 기운을 토대로 어떤 사람에게 끌리는지 살펴봐요." />
          </Section>

          <Section title={`${aName}님의 오행과 용신`}>
            <OhaengChart
              name={aName}
              counts={{ 목: 2, 화: 1, 토: 3, 금: 1, 수: 1 }}
              ratios={{ 목: 18.2, 화: 27.3, 토: 31.8, 금: 13.6, 수: 9.1 }}
            />
            <YongsinCards yongsin="수" huisin="금" gisin="토" />
            <SinKangBar ilgan={mockPillarA.day.stem} stage="태약" />
            <SubSection title="오행 풀이" body="토 기운이 사주 전체를 누르고 있는 결이에요. 자세한 풀이는 곧 연결될 예정이에요." />
          </Section>

          <Section title={`${bName}님의 사주`}>
            <SajuTable
              name={bName}
              birthLine={bBirth}
              hour={mockPillarB.hour}
              day={mockPillarB.day}
              month={mockPillarB.month}
              year={mockPillarB.year}
            />
            <SubSection title="기본 사주분석"
              body={`${bName}님의 일간(${mockPillarB.day.stem}) 결을 풀어드릴 자리에요.`} />
          </Section>

          <Section title={`${bName}님의 오행과 용신`}>
            <OhaengChart
              name={bName}
              counts={{ 목: 1, 화: 2, 토: 0, 금: 1, 수: 4 }}
              ratios={{ 목: 13.6, 화: 36.4, 토: 0, 금: 9.1, 수: 40.9 }}
            />
            <YongsinCards yongsin="수" huisin="목" gisin="금" />
            <SinKangBar ilgan={mockPillarB.day.stem} stage="중화" />
          </Section>
        </>
      )}

      {chapter === 2 && (
        <>
          <NoticeBubble>
            인연궁합은 두 분의 일지(배우자궁)를 핵심으로 풀어요. 점수는 일간·일지·합·충·신살을 종합해 산출돼요.
          </NoticeBubble>

          <Section title="인연 궁합 점수">
            <ScoreGauge score={53} label="합이 나쁘지 않아요!" caption="In-yeon Score" />
          </Section>

          <Section title="인연의 붉은 실">
            <SubSection title="우리는 인연일까, 악연일까?"
              body={`${aName}님과 ${bName}님은 서로 부족한 부분을 채워주는 결이에요. 자세한 풀이는 곧 연결돼요.`} />
            <SubSection title="전생에서 우리는 어떤 관계였을까?"
              body="합과 충의 흔적으로 본 전생의 인연을 부드럽게 풀어드려요." />
          </Section>

          <Section title="인연과 관계의 열쇠">
            <SubSection title="서로가 느꼈던 첫인상은 어땠을까?" body="첫 만남의 결을 풀어드려요." />
            <SubSection title="고백은 누가 먼저 하는 게 좋을까?" body={`${relLabel} 단계에 맞춰 조언을 드려요.`} />
            <SeasonGrid items={[
              { season: "봄", hanja: "春", place: "갈대밭과 함께 걷는 너른 정원" },
              { season: "여름", hanja: "夏", place: "바닷바람이 시원한 해변 산책로" },
              { season: "가을", hanja: "秋", place: "고즈넉한 단풍길 사찰" },
              { season: "겨울", hanja: "冬", place: "따뜻한 실내 미술관·전시" },
            ]} />
            <SubSection title="기념일은 어떻게 챙기는 게 좋을까?"
              body={`${aName}님은 실용적 가치, ${bName}님은 정성 어린 분위기에 감동해요.`} />
            <SubSection title="서로 어떤 점에서 서운함을 느낄까?" body="현실적 태도와 감정 표현의 차이가 핵심이에요." />
            <SubSection title="화해는 어떻게 하면 좋을까?" body="논리보다 따뜻한 체온을 나누는 스킨십이 빨라요." />
            <SubSection title="장기적인 관계 유지를 위한 조언"
              body={`${durLabel} 시점에 어울리는 결로 조언을 드려요.`} />
          </Section>
        </>
      )}

      {chapter === 3 && (
        <>
          <NoticeBubble>
            성격궁합은 두 분의 일간(日干)을 중심으로 봐요. 일간이 어떻게 만나는지가 일상의 결을 결정해요.
          </NoticeBubble>

          <Section title="성격 궁합 점수">
            <ScoreGauge score={100} label="합이 정말 좋은 편이에요!" caption="Personality Score" />
          </Section>

          <Section title="우리의 성격, 잘 맞을까?">
            <SubSection title="일간을 통해 보는 성격의 조화"
              body={`${aName}님 갑(甲)과 ${bName}님 계(癸)가 만나면 수생목(水生木)의 결이 흘러요.`} />
            <SubSection title="서로가 연애를 할 때 달라지는 모습은?" body="평소와 연애 시의 결이 어떻게 달라지는지 풀어드려요." />
            <SubSection title="둘이 함께 있을 때, 자연스럽게 역할이 나눠지는 부분은?" body="누가 결정하고 누가 분위기를 맡는지 살펴봐요." />
          </Section>

          <Section title="우리의 끌림 포인트는?">
            <SubSection title="서로에게 느끼는 매력 포인트는?" body={`${aName}님과 ${bName}님 각자의 매력을 짧게 두 단락으로.`} />
          </Section>

          <Section title="이 커플, 오래 갈 수 있을까?">
            <SubSection title="오래 만날 수 있는 성격일까?" body="합과 충, 원진과 해의 흔적을 종합해 풀어드려요." />
            <SubSection title="더 많이 양보해야 될 사람은?" body="신강신약과 일간 강약을 토대로." />
            <SubSection title="연애 주도권, 누구에게 있을까?" body="일간의 추진력으로 살펴봐요." />
            <SubSection title="미래를 그릴 때 두 사람이 상상하는 그림은 비슷할까?" body="재성·식상·관성 분포로 본 미래 가치관." />
          </Section>

          <Section title="성격 궁합을 보완하는 방법">
            <SubSection title="서로를 더 좋아하게 만들려면?" body="구체적 행동 두세 가지를 제안해드려요." />
            <SubSection title="어떤 커플 아이템이 좋을까요?" body="용신을 보강하는 색·재료·소품 한 가지." />
            <SubSection title="같이 즐기면 좋은 취미가 있을까요?" body="에너지를 건설적으로 배출할 정적인 취미." />
            <SubSection title="상대방을 더 이해하기 위한 대화 질문은?" body="서로에게 던질 수 있는 질문 4가지를 드려요." />
          </Section>
        </>
      )}
    </ChapterShell>
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
