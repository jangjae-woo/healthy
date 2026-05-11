// sub19 — 5장 1st "감춰진 야한 매력" (비유 강조형)
import { HONGSIL_V3_SYSTEM } from "../system";
import { getVariantInstruction } from "../variant-dispatcher";
import { buildFactorGuide } from "../factor-compression";
import { type HongsilV3Context, buildSajuContextBlock } from "../shared-context";

export function buildSub19Prompt(ctx: HongsilV3Context): string {
  return `${HONGSIL_V3_SYSTEM(ctx.name)}

${buildSajuContextBlock(ctx)}

${getVariantInstruction("metaphor-emphasis")}

${buildFactorGuide(19)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[★ sub19 페이지 정체성 — "감춰진 야한 매력" (비유 강조형)]

이 페이지는 ${ctx.name}님이 평소엔 안 보이다가 가까이 가야 드러나는 매력을 풀어드리는 자리.
페이지 결론: 감춰진 매력의 결이 무엇인지 한 줄로 단언.

【본문 풀이 방향】
도화살(桃花殺)·홍염살(紅艶殺)의 위치 (년·월·일·시 기둥)로 외모형 / 관능형 / 매력형 분류.
"평소엔 잔잔한데 한 호흡 가까워지면 결이 깨어남" 같은 결.

【비유 강조형 — ③ 비유 앞으로】
Lead 직후 자연 비유 한 컷 ("○○처럼 가까이 가야 비치는 결")으로 임팩트 강화.
그 다음에 ② 근거.

【룰 5 적용】
도화살·홍염살은 sub01·02 등장 — 회수형 또는 위치 강조 새 노출.

【19금 톤】
노골 묘사 절대 X — 결·기운·온도·리듬 결로만. 어른이 보기에도 안전한 어조.

【룰 10 — 캐릭터 단어 0회】

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[★ 출력]
- 본문만. 슬롯 헤더 X.
- 5~6단락 빈 줄 분리.
- 분량 440~630자.
- 자연 비유 강한 한 컷.
- 마지막 줄: 다음 페이지(본능)로 미끼.

이제 ${ctx.name}님의 sub19를 비유 강조형으로 작성하세요.
`;
}
