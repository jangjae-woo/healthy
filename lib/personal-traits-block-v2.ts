// ════════════════════════════════════════════════════════════════════
// 1인 사주용 traits-block — 평생사주(type:"saju") + 연애사주(type:"saju-love") 공용
// 자도인 V2 cell framework 재활용 + 본인 톤으로 후처리.
// ════════════════════════════════════════════════════════════════════

import { deriveChildTraitsV2, type ChildTraitsV2 } from "./parent-child-traits-block-v2";
import type { SajuAnalysis } from "./saju-calculator";

// ─── 톤 변환 — 부모 처방 → 본인 자기인식 ─────────────────────
const TONE_SWAPS: Array<[RegExp, string]> = [
  [/부모가 받쳐주면/g, "주변의 도움이 있으면"],
  [/부모님/g, "주변 사람들"],
  [/기댈 어른 한 분/g, "기댈 자리 한 곳"],
  [/기댈 어른/g, "기댈 자리"],
  [/기댈 자리\b/g, "기댈 자리"],
  [/받아주고 품어주는 어른/g, "받아주는 사람"],
  [/단정 짓지 않는 사람/g, "단정 짓지 않는 환경"],
  [/유연성 가르치기/g, "유연성 의식하기"],
  [/감정 풀 자리 만들어주기/g, "감정 풀 자리 자주 만들기"],
  [/감정 묻고 기다려주기/g, "감정 표현 미루지 않기"],
  [/표현 자리 만들어주기/g, "표현 자리 자주 만들기"],
  [/약속 단순히/g, "약속은 단순하게"],
  [/혼자 두지 말고 받쳐주기/g, "혼자 짊어지지 않기"],
  [/혼자 두지 않기/g, "혼자 짊어지지 않기"],
  [/큰 그림 함께 짜주기/g, "큰 그림 직접 짜기"],
  [/큰 그림 함께 짜기/g, "큰 그림 직접 짜기"],
  [/큰 그림 함께/g, "큰 그림 직접"],
  [/작은 시도 함께/g, "작은 시도 자주"],
  [/작은 시도부터/g, "작은 시도부터"],
  [/작은 성공 함께/g, "작은 성공 모으기"],
  [/작은 성공 함께 만들기/g, "작은 성공 모으기"],
  [/작은 실천 함께/g, "작은 실천부터"],
  [/작은 실천 함께 해주기/g, "작은 실천부터 시작"],
  [/스스로 결정 경험 만들기/g, "스스로 결정하는 자리 늘리기"],
  [/자기 의견 자주 묻기/g, "자기 의견 분명히 하기"],
  [/자기 의견 자주 물어주기/g, "자기 의견 분명히 하기"],
  [/자기 의견 자주 물어주기/g, "자기 의견 분명히 하기"],
  [/책임 지는 작은 약속 필요/g, "책임 지는 작은 약속 정해두기"],
  [/책임 지는 작은 약속/g, "책임 지는 작은 약속"],
  [/감정 묻기·기다려주기/g, "감정 미루지 않기"],
  [/표현 자리·기다려주기/g, "표현 자리 자주 만들기"],
  [/구체 목표 정해주면/g, "구체 목표 정해두면"],
  [/구체 목표 함께 짜기/g, "구체 목표 직접 정하기"],
  [/구체 목표·작은 성공 함께 만들기/g, "구체 목표·작은 성공 모으기"],
  [/조용한 시간 만들어주기/g, "조용한 시간 자주 갖기"],
  [/사색 시간 필요/g, "사색 시간 자주 갖기"],
  [/조용한 사색 시간 필요/g, "조용한 사색 시간 갖기"],
  [/조용한 사색 시간 갖기/g, "조용한 사색 시간 갖기"],
  [/표현 자리 만들어주고 기다려주기/g, "표현 자리 자주 만들기"],
  [/유연성 가르치기/g, "유연성 의식하기"],
];

function applyTone(s: string): string {
  let out = s;
  for (const [re, repl] of TONE_SWAPS) out = out.replace(re, repl);
  return out;
}

// ─── derive — 자도인 V2 derive 그대로 사용 ─────────────────────
export function derivePersonalTraits(saju: SajuAnalysis): ChildTraitsV2 {
  return deriveChildTraitsV2(saju);
}

// ─── promptBlock — 1인 사주용 텍스트 블록 ─────────────────────
export type PersonalKind = "saju" | "saju-love";

export function personalTraitsToPromptBlock(
  t: ChildTraitsV2,
  name: string,
  kind: PersonalKind,
): string {
  const lines: string[] = [];
  lines.push(`【${name}님 본인 사주 결정론 키워드 풀 — 이 단어들에서만 인용. 임의 통설 금지】`);
  lines.push(`▸ 일간 본질 (${t.ilgan.name} · ${t.ilgan.nature}): ${t.ilgan.keywords.join(" / ")}`);
  lines.push(`▸ 신강신약 (${t.shinkang.label}): ${t.shinkang.keywords.join(" / ")} · ${t.shinkang.advice}`);
  lines.push(`▸ 일주 (${t.iljuInnerOuter.gapja}): 겉 ${t.iljuInnerOuter.outer} / 속 ${t.iljuInnerOuter.inner} / 결합 ${t.iljuInnerOuter.combo}${t.iljuInnerOuter.keywords.length ? " · " + t.iljuInnerOuter.keywords.join("·") : ""}`);
  if (t.charms.length > 0) {
    lines.push(`▸ 신살 매력: ${t.charms.map(c => `${c.name}(${c.charm})`).join(" / ")}`);
  }
  if (t.sipStrong.length > 0) {
    lines.push(`▸ 강한 십성: ${t.sipStrong.map(s => `${s.sip}(${s.count}) — ${s.keywords.join("·")}`).join(" / ")}`);
  }
  if (t.sipWeak.length > 0) {
    lines.push(`▸ 부족 십성: ${t.sipWeak.map(s => `${s.sip} — ${s.meaning} / 보충: ${s.needs.join("·")}`).join(" // ")}`);
  }
  if (t.weakElem) {
    lines.push(`▸ 부족 오행 (${t.weakElem.label}): ${t.weakElem.lacking} — 끌림: ${t.weakElem.attractKey.join("·")}`);
  }
  lines.push(`▸ 일간 매력: ${t.ilganCharm.charmKeys.join(" / ")}`);
  if (t.combinationKeywords && t.combinationKeywords.length > 0) {
    lines.push(`▸ 결합 매핑 (${t.combinationKey}): ${t.combinationKeywords.join(" / ")}`);
  }
  // ─── V2.5 정밀화 결합 (5가지 진짜 명리 결합) ─────
  const wsc = t.weightedSipCounts;
  lines.push(`▸ 가중 십성 카운트 (위치·충합·합화 반영): 비겁 ${wsc.비겁?.toFixed(1) ?? "0"} / 식상 ${wsc.식상?.toFixed(1) ?? "0"} / 재성 ${wsc.재성?.toFixed(1) ?? "0"} / 관성 ${wsc.관성?.toFixed(1) ?? "0"} / 인성 ${wsc.인성?.toFixed(1) ?? "0"} — 단순 카운트보다 이 수치 기반 풀이`);
  if (t.combinedTransformations.length > 0) {
    lines.push(`▸ 천간 합화: ${t.combinedTransformations.map(c => `${c.pair}→${c.element}(${c.sipName})`).join(" / ")}`);
  }
  if (t.sipShinkangCombos.length > 0) {
    lines.push(`▸ 십성×신강 결합 (카운트만으로 단정 X):`);
    for (const c of t.sipShinkangCombos) {
      lines.push(`  · ${c.sip}(${c.level}) + ${c.shinkangBucket}: ${c.keywords.join("·")}`);
    }
  }
  if (t.jaeBigCombo) {
    lines.push(`▸ 재성×비겁: 재성 ${t.jaeBigCombo.jaeLevel} × 비겁 ${t.jaeBigCombo.bigLevel} — ${t.jaeBigCombo.keywords.join("·")}`);
  }
  if (t.gwanInCombo) {
    lines.push(`▸ 관성×인성: 관성 ${t.gwanInCombo.gwanLevel} × 인성 ${t.gwanInCombo.inLevel} — ${t.gwanInCombo.keywords.join("·")}`);
  }
  if (t.sikJaeCombo) {
    lines.push(`▸ 식상→재성: 식상 ${t.sikJaeCombo.sikLevel} × 재성 ${t.sikJaeCombo.jaeLevel} — ${t.sikJaeCombo.keywords.join("·")}`);
  }
  // ─── V2.6 자평진전 격국·공망 ─────
  lines.push(`▸ 격국(格局) — ${t.gyeokGuk.label} (${t.gyeokGuk.type}) · ${t.gyeokGuk.meaning}`);
  lines.push(`  · 활약 무대: ${t.gyeokGuk.stage}`);
  if (t.gyeokGuk.keywords.length > 0) lines.push(`  · 키워드: ${t.gyeokGuk.keywords.join("·")}`);
  lines.push(`  · 판별: ${t.gyeokGuk.detail}`);
  if (t.gongmang.hasGongmang) {
    lines.push(`▸ 공망(空亡) — ${t.gongmang.detail}`);
    for (const p of t.gongmang.positions) lines.push(`  · ${p.effect}`);
  }
  // V2.6 십이운성·신살×십성
  lines.push(`▸ 십이운성: 年 ${t.sibiUnseong.year.unseong}(${t.sibiUnseong.year.strength}) / 月 ${t.sibiUnseong.month.unseong}(${t.sibiUnseong.month.strength}) / 日 ${t.sibiUnseong.day.unseong}(${t.sibiUnseong.day.strength}) ${t.sibiUnseong.hour ? `/ 時 ${t.sibiUnseong.hour.unseong}(${t.sibiUnseong.hour.strength})` : ""}`);
  if (t.sinsalSipCombos.length > 0) {
    lines.push(`▸ 신살×십성 결합:`);
    for (const c of t.sinsalSipCombos) lines.push(`  · ${c.combo}: ${c.keywords.join("·")}`);
  }
  // V2.7 자평진전 후반
  lines.push(`▸ 격국 변화·진가: ${t.gyeokChange.changeType} — ${t.gyeokChange.detail}`);
  lines.push(`▸ 통근(通根): ${t.tonggeun.level} (총점 ${t.tonggeun.totalScore}) — ${t.tonggeun.recommendation}`);
  if (t.hapResults.length > 0) {
    lines.push(`▸ 지지 합국:`);
    for (const h of t.hapResults) lines.push(`  · ${h.type} ${h.name} (${h.element}국)`);
  }
  lines.push(`▸ 세운(${t.seun.year}년 ${t.seun.ganji}): ${t.seun.tone} — ${t.seun.cheongan_sip}, 점수 ${t.seun.net_score}`);
  if (kind === "saju-love") {
    lines.push(`▸ 적용 톤: 연애·인연 풀이 — 본인의 끌리는 상대 결, 만남 자리 결, 인연 시기에 위 키워드 풀 활용. "당신에게 끌리는 결은…" 어조`);
  } else {
    lines.push(`▸ 적용 톤: 평생사주 풀이 — 본인 자기인식 톤, "${name}님은 ~결의 사람입니다" 어조. 부모 처방 어조 X`);
  }
  return applyTone(lines.join("\n")) + "\n";
}
