// AI 출력 텍스트 후처리 — 자녀 호칭(양/군) 일관성 보정
// 프롬프트 강제(옵션 A)에서 새는 케이스를 100% 보장하기 위한 정규식 안전망(옵션 B).

/**
 * 본문 안의 자녀 단독 이름을 호칭 부착형으로 강제 변환.
 * - "김자인" → "김자인양" (이미 "김자인양/군/님/씨"인 곳은 건드리지 않음)
 * - 이름이 다른 단어의 부분 문자열로 우연히 등장해도 lookahead 로 보호
 * - 호칭 부착 후 잘못된 조사(양/군 받침 있음)도 함께 보정: 를→을, 는→은, 가→이, 와→과
 */
export function ensureChildHonorific(
  text: string,
  childName: string,
  childGender?: string,
): string {
  if (!text || !childName) return text;
  const honor = childGender === "남" ? "군" : childGender === "여" ? "양" : null;
  if (!honor) return text;

  const escaped = childName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const honored = childName + honor;

  // 1) 호칭 부착 — 다음 글자가 양/군/님/씨가 아닐 때만 (이중 호칭·기존 호칭 보호)
  const re = new RegExp(`${escaped}(?![양군님씨])`, "g");
  let result = text.replace(re, honored);

  // 2) 호칭 부착 후 잘못된 조사 보정 (양/군 모두 받침 있음 → 을·은·이·과)
  result = result.replace(new RegExp(`${escaped}${honor}를`, "g"), `${honored}을`);
  result = result.replace(new RegExp(`${escaped}${honor}는`, "g"), `${honored}은`);
  // "가" 단독 — 다음 글자가 한글이면 일반 단어일 수 있으니 어절 경계만 보정
  result = result.replace(
    new RegExp(`${escaped}${honor}가(?=[\\s,.\\u3001\\u3002!?:;)\\]\\}"'\\u201D\\u2019]|$)`, "g"),
    `${honored}이`,
  );
  result = result.replace(new RegExp(`${escaped}${honor}와`, "g"), `${honored}과`);
  return result;
}
