// 본문 강조 마커 공용 렌더러
// [[텍스트]] → 골드 강조 (한 색깔만 — 절제 사용)
// 안전망: LLM이 가끔 출력하는 **bold** / *italic* / `code` 마크다운 마커는 마커만 제거하고 평문으로.
// 자도인 V2의 ParentChildSlideResultV2.tsx에 박혀 있던 동일 패턴을 공용화.
import type { ReactNode } from "react";

export function renderInlineEmphasis(text: string, goldColor: string): ReactNode[] {
  // ❶ 안전망: 마크다운 강조 마커 sanitize (마커만 제거)
  // ❷ 프롬프트 지시문 echo 방지: LLM이 가끔 [메인:·[시그너처:·구성:·[★·※ 라인을 출력에 echo함 → 라인 통째 제거
  const sanitized = text
    // 프롬프트 지시문 라인 통째 제거 (LLM echo 방어)
    .replace(/^\s*\[메인:[^\n]*$/gm, "")
    .replace(/^\s*\[서브:[^\n]*$/gm, "")
    .replace(/^\s*\[시그너처:[^\n]*$/gm, "")
    .replace(/^\s*구성:[^\n]*$/gm, "")
    .replace(/^\s*\[★[^\n]*$/gm, "")
    .replace(/^\s*\[★★★[^\n]*$/gm, "")
    .replace(/^\s*※[^\n]*$/gm, "")
    .replace(/^\s*\[Q[1-9][^\n]*$/gm, "")
    // 인라인 지시 패턴(문장 시작 이외 위치)도 제거
    .replace(/\[메인:[^\]]+\]/g, "")
    .replace(/\[시그너처:[^\]]+\]/g, "")
    // 빈 줄 정리(연속 빈 줄 1개로)
    .replace(/\n{3,}/g, "\n\n")
    // 마크다운 강조 마커 sanitize (마커만 제거)
    .replace(/\*\*\*([^\n*]+?)\*\*\*/g, "$1")     // ***bold-italic***
    .replace(/\*\*([^\n*]+?)\*\*/g, "$1")         // **bold**
    .replace(/(?<!\*)\*([^\n*]+?)\*(?!\*)/g, "$1") // *italic*
    .replace(/`([^`\n]+?)`/g, "$1")               // `code`
    .replace(/~~([^~\n]+?)~~/g, "$1");            // ~~strike~~

  // ❷ 우리 마커 [[...]] → 골드
  const parts: ReactNode[] = [];
  const regex = /\[\[([^\]]+)\]\]/g;
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = regex.exec(sanitized)) !== null) {
    if (m.index > lastIdx) parts.push(sanitized.slice(lastIdx, m.index));
    parts.push(
      <span key={key++} style={{ color: goldColor, fontWeight: 700 }}>{m[1]}</span>
    );
    lastIdx = regex.lastIndex;
  }
  if (lastIdx < sanitized.length) parts.push(sanitized.slice(lastIdx));
  return parts.length > 0 ? parts : [sanitized];
}

export function renderParagraphs(text: string, goldColor: string) {
  return text.split(/\n\n+/).map((p, i) => (
    <p key={i} className="my-2 whitespace-pre-wrap">{renderInlineEmphasis(p, goldColor)}</p>
  ));
}
