// LLM 출력 파서 (Phase 5)
//
// LLM 응답 텍스트를 헤더 매칭 키 기준으로 분할 → 각 섹션 산문 추출
// 헤더 매칭 키는 prompt-builder의 출력 형식과 정확 일치해야 함
//
// 작성: 2026-05-17

const EXPECTED_HEADERS = [
  // 1장
  { level: 2, text: '1장 — 본질결' },
  { level: 3, text: '일간이 알려주는 결' },
  { level: 3, text: '일주 60갑자' },
  // 2~7장
  { level: 2, text: '2장 — 활기' },
  { level: 3, text: '결 한눈에', parent: '2장 — 활기' },
  { level: 3, text: '왜 이런 결인가', parent: '2장 — 활기' },
  { level: 3, text: '양육 Tip', parent: '2장 — 활기' },
  { level: 2, text: '3장 — 조심' },
  { level: 3, text: '결 한눈에', parent: '3장 — 조심' },
  { level: 3, text: '왜 이런 결인가', parent: '3장 — 조심' },
  { level: 3, text: '양육 Tip', parent: '3장 — 조심' },
  { level: 2, text: '4장 — 만족' },
  { level: 3, text: '결 한눈에', parent: '4장 — 만족' },
  { level: 3, text: '왜 이런 결인가', parent: '4장 — 만족' },
  { level: 3, text: '양육 Tip', parent: '4장 — 만족' },
  { level: 2, text: '5장 — 흔들림' },
  { level: 3, text: '결 한눈에', parent: '5장 — 흔들림' },
  { level: 3, text: '왜 이런 결인가', parent: '5장 — 흔들림' },
  { level: 3, text: '양육 Tip', parent: '5장 — 흔들림' },
  { level: 2, text: '6장 — 어울림' },
  { level: 3, text: '결 한눈에', parent: '6장 — 어울림' },
  { level: 3, text: '왜 이런 결인가', parent: '6장 — 어울림' },
  { level: 3, text: '양육 Tip', parent: '6장 — 어울림' },
  { level: 2, text: '7장 — 끈기' },
  { level: 3, text: '결 한눈에', parent: '7장 — 끈기' },
  { level: 3, text: '왜 이런 결인가', parent: '7장 — 끈기' },
  { level: 3, text: '양육 Tip', parent: '7장 — 끈기' },
  // 동물
  { level: 2, text: '동물 유형 자세히 살펴보기' },
  // 9~12장
  { level: 2, text: '9장 — 어머님 사주의 결' },
  { level: 2, text: '10장 — 아버님 사주의 결' },
  { level: 2, text: '11장 — 부모-자녀 사주 궁합' },
  { level: 2, text: '12장 — 함께 살펴줄 결' },
  // outro
  { level: 2, text: '자도인의 마지막 당부' },
];

// LLM 텍스트 → 섹션별 본문 객체
// 결과 예: { sections: { '2장 — 활기/결 한눈에': '...', '2장 — 활기/왜 이런 결인가': '...', ... }, raw: '원문', missingHeaders: [...] }
export function parseLLMOutput(text) {
  const lines = text.split('\n');
  const sections = {};
  const presentHeaders = new Set();

  let currentH2 = null;
  let currentH3 = null;
  let buffer = [];

  function flush() {
    if (currentH2 && buffer.length > 0) {
      const key = currentH3 ? `${currentH2}/${currentH3}` : currentH2;
      const content = buffer.join('\n').trim();
      if (content) sections[key] = content;
    }
    buffer = [];
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('## ')) {
      flush();
      currentH2 = trimmed.slice(3).trim();
      currentH3 = null;
      presentHeaders.add(`## ${currentH2}`);
    } else if (trimmed.startsWith('### ')) {
      flush();
      currentH3 = trimmed.slice(4).trim();
      presentHeaders.add(`### ${currentH3}`);
    } else {
      buffer.push(line);
    }
  }
  flush();

  // 누락 헤더 검출
  const missingHeaders = [];
  for (const h of EXPECTED_HEADERS) {
    const tag = h.level === 2 ? `## ${h.text}` : `### ${h.text}`;
    if (!presentHeaders.has(tag)) {
      // 단 ### 헤더는 부모 h2가 있어야 의미가 있음
      if (h.level === 3 && h.parent && !presentHeaders.has(`## ${h.parent}`)) continue;
      missingHeaders.push(tag + (h.parent ? ` (under ${h.parent})` : ''));
    }
  }

  return {
    sections,
    raw: text,
    presentHeaders: [...presentHeaders],
    missingHeaders,
  };
}

// 파싱 결과를 facts.llmText에 결합
// LLM 본문이 placeholder 자리에 자동 들어가게
export function attachLLMTextToFacts(facts, parsed) {
  return {
    ...facts,
    llmText: parsed.sections,
  };
}
