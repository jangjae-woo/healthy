// sub08 — 3장 2nd "내 짝꿍 미리 보기" (후킹형 + 룰 10 남자 캐릭터 직접 노출)
// 페이지 8/22 — 사이트 두 번째 후킹
import { HONGSIL_V3_SYSTEM } from "../system";
import { getVariantInstruction } from "../variant-dispatcher";
import { buildFactorGuide } from "../factor-compression";
import { type HongsilV3Context, buildSajuContextBlock, buildCharacterBlock } from "../shared-context";

export function buildSub08Prompt(ctx: HongsilV3Context): string {
  return `${HONGSIL_V3_SYSTEM(ctx.name)}

${buildSajuContextBlock(ctx)}

${buildCharacterBlock(ctx, false)}

${getVariantInstruction("hooking")}

${buildFactorGuide(8)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[★ sub08 페이지 정체성 — "내 짝꿍 미리 보기" (후킹형)]

이 페이지는 ${ctx.name}님의 운명 짝꿍이 어떤 결의 사람인지 단언하는 자리. 사이트 두 번째 후킹.
페이지 결론: 짝꿍 캐릭터 단언으로 강한 인상.

【후킹형 캐릭터 단언 — 룰 10 적용】
운명 짝꿍 캐릭터: ${ctx.destinyCharacter.name}
짝꿍 내적 이미지: ${ctx.destinyCharacter.innerImage}
끌림 신호: ${ctx.destinyCharacter.signal}

→ Lead 첫 문장에 "${ctx.name}님의 운명 짝꿍은 [[${ctx.destinyCharacter.name}상의 결]]을 가진 분이에요" 단언.
→ 두 번째 문장에 짝꿍 내적 이미지("${ctx.destinyCharacter.innerImage}") 결 부연.
→ ${ctx.destinyCharacter.name} 이름은 Lead·Close에만 노출. ②③④⑤엔 X.

【본문 풀이 방향】
부족 오행 + 약한 십성 + 일지(배우자궁)로 ${ctx.name}님을 채워줄 짝꿍의 결.
짝꿍이 가진 결을 자연 비유 한 컷으로. 일상에서 어떤 사람으로 비치는지 장면 2~3개.

【사주 인자 우선 노출】
${ctx.destinyCharacter.signal}의 1차 인자 + ${ctx.name}님 부족 오행 (${ctx.ohaengWeak}) + 일지(${ctx.iljuHanja[1]}).
한자 괄호 1회씩.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[★ 출력]
- 본문만. 슬롯 헤더 X.
- 6단락 빈 줄 분리.
- 분량 440~630자.
- [[ ${ctx.destinyCharacter.name}상의 결 ]] 골드 강조 Lead에 1회만.
- "${ctx.name}님" 자연 호명.
- 마지막 줄: 다음 페이지(짝꿍 첫인상)로 미끼.

이제 ${ctx.name}님의 sub08을 후킹형으로 작성하세요.
`;
}
