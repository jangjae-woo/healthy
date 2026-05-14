// ════════════════════════════════════════════════════════════════════
// 나의 홍실 V3 — 1인 인연 풀이용 결정론 매핑 키워드 풀
// 자도인 V2의 M1~M7 cell framework + COMBINATION 250 cell 재활용.
// 솔로 1인칭 + 인연 톤으로 후처리.
//
// 사용:
//   1) deriveHongsilTraits(saju) → 본인 사주 인자 룩업 결과
//   2) hongsilTraitsToPromptBlock(traits, name, scope) → 챕터별 텍스트 블록
//      scope = "ch1" | "ch2" | "ch3" | "ch4" | "ch5" | "ch6"
// ════════════════════════════════════════════════════════════════════

import { deriveChildTraitsV2, type ChildTraitsV2 } from "../parent-child-traits-block-v2";
import type { SajuAnalysis } from "../saju-calculator";

// ─── 톤 변환 — 자도인 양육 처방 → 솔로 인연 자기인식·연애 톤 ─────
const HONGSIL_TONE_SWAPS: Array<[RegExp, string]> = [
  // 양육 가이드 어휘 → 인연·연애 어휘
  [/부모가 받쳐주면/g, "곁에 있는 사람이 받쳐주면"],
  [/부모님/g, "곁의 사람"],
  [/기댈 어른 한 분/g, "기댈 자리 한 곳"],
  [/기댈 어른/g, "기댈 자리"],
  [/받아주고 품어주는 어른/g, "받아주는 사람"],
  [/단정 짓지 않는 사람/g, "단정 짓지 않는 자리"],
  [/유연성 가르치기/g, "유연성 의식하기"],
  [/감정 풀 자리 만들어주기/g, "감정 풀 자리 자주 만들기"],
  [/감정 묻고 기다려주기/g, "감정 표현 미루지 않기"],
  [/표현 자리 만들어주기/g, "표현 자리 자주 만들기"],
  [/혼자 두지 말고 받쳐주기/g, "혼자 짊어지지 않기"],
  [/큰 그림 함께 짜주기/g, "큰 그림 직접 짜기"],
  [/큰 그림 함께 짜기/g, "큰 그림 직접 짜기"],
  [/큰 그림 함께/g, "큰 그림 직접"],
  [/작은 시도 함께/g, "작은 시도 자주"],
  [/작은 성공 함께/g, "작은 성공 모으기"],
  [/작은 성공 함께 만들기/g, "작은 성공 모으기"],
  [/작은 실천 함께/g, "작은 실천부터"],
  [/작은 실천 함께 해주기/g, "작은 실천부터 시작"],
  [/스스로 결정 경험 만들기/g, "스스로 결정하는 자리 늘리기"],
  [/자기 의견 자주 묻기/g, "자기 의견 분명히 하기"],
  [/자기 의견 자주 물어주기/g, "자기 의견 분명히 하기"],
  [/책임 지는 작은 약속 필요/g, "책임 지는 작은 약속 정해두기"],
  [/감정 묻기·기다려주기/g, "감정 미루지 않기"],
  [/표현 자리·기다려주기/g, "표현 자리 자주 만들기"],
  [/구체 목표 정해주면/g, "구체 목표 정해두면"],
  [/구체 목표 함께 짜기/g, "구체 목표 직접 정하기"],
  [/구체 목표·작은 성공 함께 만들기/g, "구체 목표·작은 성공 모으기"],
  [/조용한 시간 만들어주기/g, "조용한 시간 자주 갖기"],
  [/사색 시간 필요/g, "사색 시간 자주 갖기"],
  [/조용한 사색 시간 필요/g, "조용한 사색 시간 갖기"],
  [/표현 자리 만들어주고 기다려주기/g, "표현 자리 자주 만들기"],
  // 자녀 어조 → 본인 어조
  [/자녀가 자라게 함/g, "본인이 단단해짐"],
  [/자녀를 자라게/g, "본인이 단단해지게"],
  [/자녀의/g, "본인의"],
  [/자녀가/g, "본인이"],
  [/자녀를/g, "본인을"],
  [/자녀에게/g, "본인에게"],
  // "사주" 어휘 보존 ("협력형 사주" 등)
];

function applyHongsilTone(s: string): string {
  let out = s;
  for (const [re, repl] of HONGSIL_TONE_SWAPS) out = out.replace(re, repl);
  return out;
}

// ─── derive — 자도인 V2 derive 재사용 (cell framework 동일) ─────
export function deriveHongsilTraits(saju: SajuAnalysis): ChildTraitsV2 {
  return deriveChildTraitsV2(saju);
}

// ─── 챕터별 scope — 홍실 6 챕터에 맞춰 부분 주입 ─────
export type HongsilChapterScope = "ch1" | "ch2" | "ch3" | "ch4" | "ch5" | "ch6";

function useBriefHongsilTraits(scope: HongsilChapterScope): boolean {
  return scope !== "ch1";
}

export function hongsilTraitsToPromptBlock(
  t: ChildTraitsV2,
  name: string,
  scope: HongsilChapterScope,
): string {
  if (useBriefHongsilTraits(scope)) {
    const chapterPurpose: Record<HongsilChapterScope, string> = {
      ch1: "",
      ch2: "사랑의 시기, 속도, 준비감",
      ch3: "맞는 사람의 태도, 첫인상, 만남 방식",
      ch4: "반복되는 관계 장면과 벗어나는 행동",
      ch5: "끌림의 온도, 거리감, 반응, 분위기",
      ch6: "앞 장에서 본 생활어 결론의 편지식 회상",
    };
    return `【${name}님 사주 계산 결과 내부 반영 (${scope})】
- 이 블록은 LLM 내부 판단용이다. 본문에는 소제목당 사주근거 1~3개까지만 짧게 인용할 수 있다.
- 사주 인자명, 한자, 괄호 한자, 원국 용어를 인용하면 반드시 같은 문단에서 초보자용 자리 설명과 생활어 해석을 붙인다.
- 점수와 원점수는 인용하지 않는다.
- 출력은 ${chapterPurpose[scope]} 중심의 생활어로 바로 연결한다.
- 같은 근거를 반복하지 말고, 앞에서 다룬 내용은 "이런 흐름", "그 지점"처럼 문맥으로만 이어받는다.
`;
  }

  const lines: string[] = [];
  lines.push(`【${name}님 본인 사주 결정론 키워드 풀 (${scope}) — 한문/사주근거는 소제목당 1~3개 제한 인용. 반드시 쉬운 해석 병기】`);

  // 일간 본질 — ch1(매력)에서만 자연 비유 nature 노출. 다른 챕터엔 명사·키워드만.
  if (scope === "ch1") {
    lines.push(`▸ 일간 본질 (${t.ilgan.name} · ${t.ilgan.nature}): ${t.ilgan.keywords.join(" / ")}`);
  } else {
    lines.push(`▸ 일간 본질 ${t.ilgan.name} (자연 비유 ch1에서 등장 — 본 챕터선 비유 인용 X. 인자 명사로만): ${t.ilgan.keywords.join(" / ")}`);
  }

  // 일간 매력 결 — ch1·ch5에 핵심
  if (scope === "ch1" || scope === "ch5") {
    lines.push(`▸ 일간 매력 (${t.ilganCharm.label}): ${t.ilganCharm.charmKeys.join(" / ")}`);
  }

  // 신강신약 — ch2(타이밍)·ch4(패턴) 핵심, ch1에도 짧게
  if (scope === "ch1" || scope === "ch2" || scope === "ch4") {
    lines.push(`▸ 신강신약 (${t.shinkang.label}): ${t.shinkang.keywords.join(" / ")} · 가이드: ${t.shinkang.advice}`);
  }

  // 일주 60갑자 겉/속 — ch1·ch4·ch5 핵심 (성격·반복 패턴·본능)
  if (scope === "ch1" || scope === "ch4" || scope === "ch5") {
    lines.push(`▸ 일주 (${t.iljuInnerOuter.gapja}): 겉 ${t.iljuInnerOuter.outer} / 속 ${t.iljuInnerOuter.inner} / 결합 ${t.iljuInnerOuter.combo}${t.iljuInnerOuter.keywords.length ? " · " + t.iljuInnerOuter.keywords.join("·") : ""}`);
  }

  // 신살 매력 — ch1(매력)·ch3(짝꿍)·ch5(본능) 핵심
  if (t.charms.length > 0 && (scope === "ch1" || scope === "ch3" || scope === "ch5")) {
    lines.push(`▸ 보유 신살 매력: ${t.charms.slice(0, 5).map(c => `${c.name}(${c.charm})`).join(" / ")}`);
  }

  // 강한 십성 — ch1(매력)·ch4(패턴)·ch5(본능)
  if (t.sipStrong.length > 0 && (scope === "ch1" || scope === "ch4" || scope === "ch5")) {
    lines.push(`▸ 강한 십성: ${t.sipStrong.map(s => `${s.sip}(${s.count}개) — ${s.keywords.join("·")}`).join(" / ")}`);
  }

  // 부족 십성 (양면 풀이 강제) — ch3·ch4·ch6 핵심 (짝꿍·패턴·편지)
  if (t.sipWeak.length > 0 && (scope === "ch3" || scope === "ch4" || scope === "ch6")) {
    lines.push(`▸ 부족 십성 — 양면 풀이 필수:`);
    for (const w of t.sipWeak) {
      lines.push(`  · ${w.sip}(0개): ${w.meaning} / 끌리는 결: ${w.needs.join("·")}`);
    }
  }

  // 부족 오행 끌림 — ch3(짝꿍)·ch5(본능) 핵심
  if (t.weakElem && (scope === "ch3" || scope === "ch5" || scope === "ch6")) {
    lines.push(`▸ 부족 오행 (${t.weakElem.label}): ${t.weakElem.lacking} / 끌리는 결: ${t.weakElem.attractKey.join("·")}`);
  }

  // 결합 매핑 250 cell — 모든 챕터 공통 (자녀 결합 의미가 토대)
  if (t.combinationKeywords && t.combinationKeywords.length > 0) {
    lines.push(`▸ 결합 매핑 (${t.combinationKey}): ${t.combinationKeywords.join(" / ")}`);
  }

  // ─── V2.5 정밀화 결합 (5가지 진짜 명리 결합) ─────
  const wsc = t.weightedSipCounts;
  lines.push(`▸ 가중 십성 카운트 (위치·충합·합화 반영): 비겁 ${wsc.비겁?.toFixed(1) ?? "0"} / 식상 ${wsc.식상?.toFixed(1) ?? "0"} / 재성 ${wsc.재성?.toFixed(1) ?? "0"} / 관성 ${wsc.관성?.toFixed(1) ?? "0"} / 인성 ${wsc.인성?.toFixed(1) ?? "0"} — 단순 카운트보다 이 수치가 정통 결합. 본문 풀이는 이 수치 기반.`);
  if (t.combinedTransformations.length > 0) {
    lines.push(`▸ 천간 합화: ${t.combinedTransformations.map(c => `${c.pair}→${c.element}(${c.sipName})`).join(" / ")}`);
  }
  if (t.sipShinkangCombos.length > 0) {
    lines.push(`▸ 십성×신강 결합 (카운트만으로 확정 X — 신강 결합 의미):`);
    for (const c of t.sipShinkangCombos) {
      lines.push(`  · ${c.sip}(${c.level}) + ${c.shinkangBucket}: ${c.keywords.join("·")}`);
    }
  }
  if (t.jaeBigCombo && (scope === "ch1" || scope === "ch3" || scope === "ch5")) {
    lines.push(`▸ 재성×비겁: 재성 ${t.jaeBigCombo.jaeLevel} × 비겁 ${t.jaeBigCombo.bigLevel} — ${t.jaeBigCombo.keywords.join("·")}`);
  }
  if (t.gwanInCombo) {
    lines.push(`▸ 관성×인성: 관성 ${t.gwanInCombo.gwanLevel} × 인성 ${t.gwanInCombo.inLevel} — ${t.gwanInCombo.keywords.join("·")}`);
  }
  if (t.sikJaeCombo && (scope === "ch1" || scope === "ch5")) {
    lines.push(`▸ 식상→재성 흐름: 식상 ${t.sikJaeCombo.sikLevel} × 재성 ${t.sikJaeCombo.jaeLevel} — ${t.sikJaeCombo.keywords.join("·")}`);
  }

  // 격국명은 연애사주 본문과 충돌하기 쉬워 직접 주입하지 않는다.
  // 필요한 뉘앙스는 아래 결합 매핑과 십성/신강 조합에서 흡수한다.

  // 공망 (ch3·ch4·ch6 강조)
  if (scope === "ch3" || scope === "ch4" || scope === "ch6") {
    if (t.gongmang.hasGongmang) {
      lines.push(`▸ 공망(空亡) — ${t.gongmang.detail}`);
      for (const p of t.gongmang.positions) {
        lines.push(`  · ${p.effect}`);
      }
    }
  }

  // ─── V2.6 십이운성 (모든 챕터) ─────
  lines.push(`▸ 십이운성: 年 ${t.sibiUnseong.year.unseong}(${t.sibiUnseong.year.strength}) / 月 ${t.sibiUnseong.month.unseong}(${t.sibiUnseong.month.strength}) / 日 ${t.sibiUnseong.day.unseong}(${t.sibiUnseong.day.strength}) ${t.sibiUnseong.hour ? `/ 時 ${t.sibiUnseong.hour.unseong}(${t.sibiUnseong.hour.strength})` : ""} — 강${t.sibiUnseong.strongCount}/중${t.sibiUnseong.midCount}/약${t.sibiUnseong.weakCount}`);

  // 신살×십성 결합
  if (t.sinsalSipCombos.length > 0) {
    lines.push(`▸ 신살×십성 결합:`);
    for (const c of t.sinsalSipCombos) {
      lines.push(`  · ${c.combo}: ${c.keywords.join("·")}`);
    }
  }

  // ─── V2.7 관계 해석 보조 ─────
  lines.push(`▸ 통근(通根): ${t.tonggeun.level} (총점 ${t.tonggeun.totalScore}) — ${t.tonggeun.recommendation}`);
  if (t.hapResults.length > 0) {
    lines.push(`▸ 지지 합국:`);
    for (const h of t.hapResults) lines.push(`  · ${h.type} ${h.name} (${h.element}국)`);
  }
  if (scope === "ch2" || scope === "ch3" || scope === "ch5") {
    lines.push(`▸ 세운(${t.seun.year}년 ${t.seun.ganji}): ${t.seun.tone} — ${t.seun.cheongan_sip}, 점수 ${t.seun.net_score}`);
  }

  // 챕터별 적용 톤
  const chapterTones: Record<HongsilChapterScope, string> = {
    ch1: "본인 매력·연애 스타일 풀이. '${name}님 매력의 결은 ○○이에요' 어조. 위 풀에서만 인용.",
    ch2: "사랑 타이밍 풀이. 대운·신강 키워드를 시기 흐름과 연결. 외부 키워드 임의 추가 X.",
    ch3: "운명 짝꿍 풀이. 부족 오행·부족 십성·신살 키워드로 '끌리는 결'·'잡을 한 수' 연결.",
    ch4: "반복 패턴·자각 풀이. 부족 십성·신강·일주 키워드로 패턴 풀이. 비난 톤 X — 자각·해방 톤.",
    ch5: "본능 풀이. 일간·일주·신살(도화·홍염) 키워드로 결·기운·온도. 노골 묘사 절대 X.",
    ch6: "마지막 편지. 1~5장 키워드 1~2개만 자연 인용. 명리 강의 톤 X — 진심 어린 글.",
  };
  lines.push(`▸ ${scope} 적용 톤: ${chapterTones[scope].replace(/\$\{name\}/g, name)}`);

  return applyHongsilTone(lines.join("\n")) + "\n";
}
