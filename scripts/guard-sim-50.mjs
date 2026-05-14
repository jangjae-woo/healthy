import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const envPath = path.join(root, ".env.local");
const envText = fs.readFileSync(envPath, "utf8");
const keyLine = envText.split(/\r?\n/).find((line) => line.startsWith("GOOGLE_API_KEY="));
const apiKey = keyLine?.replace(/^GOOGLE_API_KEY=/, "").trim().replace(/^"|"$/g, "");
if (!apiKey) {
  throw new Error("GOOGLE_API_KEY not found in .env.local");
}

const MODEL = "gemini-2.5-flash";

const clusterGuide = `
의미 중복 클러스터 기준:
- 속도/신중함: 천천히 세움, 바로 말하지 않음, 정리 후 전함, 상대 반응을 살핌, 안정되면 드러남.
- 수용/조율: 상대 흐름을 받아들임, 맞춰줌, 협력형, 자기 주장보다 상대 의견 존중.
- 표현 방식: 감정 표현, 말투, 솔직함, 안으로 정리함, 대화 타이밍.
- 현실/결과: 현실감, 목표 지향, 결과를 만듦, 실용성, 꾸준함.
- 책임/안정: 책임감, 안정적 관계, 신뢰, 약속, 오래 가는 구조.
- 내면/일주 이미지: 겉모습과 속마음, 포부, 의지, 일주 비유, 내면 힘.
- 외부 받침/환경: 외부의 지지, 받쳐주는 관계, 편안한 분위기, 안정적인 환경.
- 매력/끌림: 상대가 느끼는 매력, 호기심, 끌림, 인상.
- 미래/관계 단계: 결혼, 장기 관계, 다음 단계, 시기.
- 양육/아이 환경: 부모 반응, 아이의 안정, 학습/감정/생활 환경.
`;

const evidenceAliases = [
  { label: "신약/태약", aliases: ["신약", "태약", "身弱", "太弱"] },
  { label: "신강", aliases: ["신강", "身强", "身強"] },
  { label: "비겁", aliases: ["비겁", "비견", "겁재", "比劫", "比肩", "劫財"] },
  { label: "식상", aliases: ["식상", "식신", "상관", "食傷", "食神", "傷官"] },
  { label: "재성", aliases: ["재성", "정재", "편재", "財星", "正財", "偏財"] },
  { label: "관성", aliases: ["관성", "정관", "편관", "官星", "正官", "偏官"] },
  { label: "인성", aliases: ["인성", "정인", "편인", "印星", "正印", "偏印"] },
  { label: "용신", aliases: ["용신", "用神"] },
  { label: "희신", aliases: ["희신", "喜神"] },
  { label: "기신", aliases: ["기신", "忌神"] },
  { label: "일주", aliases: ["일주", "日柱"] },
  { label: "일간", aliases: ["일간", "日干"] },
];

const banned = [
  "혼자 모든 것을 짊어",
  "벽처럼 느껴",
  "감정을 삭",
  "부족해서 보완",
  "약해서 채워",
];

const replacementRepeats = [
  "자기 리듬",
  "이 흐름",
  "이 결",
  "이 리듬",
  "앞에서 본 구조",
];

function count(text, needle) {
  return (text.match(new RegExp(escapeRegExp(needle), "g")) ?? []).length;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function evidenceCounts(text) {
  const sentences = splitSentences(text);
  return evidenceAliases
    .map((item) => ({
      label: item.label,
      count: sentences.filter((sentence) => item.aliases.some((alias) => sentence.includes(alias))).length,
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);
}

function splitSentences(text) {
  return text
    .split(/(?<=[.!?。]|요\.|다\.|죠\.|요|다)\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function maxEvidenceRepeat(text) {
  return evidenceCounts(text).reduce((max, item) => Math.max(max, item.count), 0);
}

function hasDecimalScore(text) {
  return /(비겁|식상|재성|관성|인성)[^.!?\n]{0,35}\d+\.\d/.test(text);
}

function buildPrompt(sample) {
  return `
아래 사주 리포트 본문을 검수/재작성 단계에서 정리하라. 원 프롬프트를 고치는 것이 아니라 생성 후 결과물을 편집하는 상황이다.

[절대 조건]
- 결과 본문만 반환. 설명, 표, JSON, 코드블록 금지.
- 새로운 사주 해석 추가 금지.
- 원문에 없던 제목, 번호, 목록, 새 섹션을 추가하지 말 것.
- 원문이 문단이면 문단으로만 반환할 것.
- 원문의 정보량은 유지하되, 반복된 사주근거명과 반복된 의미를 병합.
- 사주근거명은 첫 1회만 직접 노출.
- 이후 같은 의미는 대체어를 반복하지 말고 자연문으로 병합.
- "이 흐름", "이 결", "이 리듬", "자기 리듬" 같은 대체어도 반복 금지.
- 비유·은유는 1회 이하.
- 1.1, 2.2 같은 기준 없는 원점수는 낮음/보통/강함 같은 체감 표현으로 변경.
- 아래 클러스터 기준으로 내부 중복 문장표를 만든다고 가정하고, 출력에는 최종 본문만 반환.

[의미 중복 클러스터 기준]
${clusterGuide}

[샘플 메타]
서비스: ${sample.service}
패턴: ${sample.pattern}

[원문]
${sample.text}
`;
}

async function callGemini(prompt) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 1600,
          temperature: 0,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    });
    if (res.ok) {
      const json = await res.json();
      return json.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim() ?? "";
    }
    const body = await res.text().catch(() => "");
    if (res.status === 429 && attempt < 4) {
      const waitMs = 65_000;
      console.log(`rate limited; waiting ${waitMs}ms before retry ${attempt + 1}/4`);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      continue;
    }
    throw new Error(`Gemini ${res.status}: ${body.slice(0, 300)}`);
  }
  throw new Error("Gemini retry exhausted");
}

const baseSamples = [
  {
    pattern: "신약+비겁0 속도/수용 반복",
    text: "장재형님은 신약(身弱)한 사주에 비겁(比劫)이 없어 상대 흐름을 받아들이는 협력형이라 자기 리듬을 천천히 세우는 데 시간이 필요한 결이에요.\n다만 신약(身弱) 사주이기에 자기 리듬을 천천히 세우는 것이 좋아요.\n특히 장재형님에게 비겁(比劫)이 없다는 것은 자기 주장을 내세우기보다 상대방의 결을 받아들이고 맞춰주는 협력적인 성향이 강하다는 의미예요.\n자기 리듬을 천천히 세우는 신약 사주이기에, 안정적인 관계는 장재형님에게 큰 힘이 되어줄 것이에요.",
  },
  {
    pattern: "식상0 표현 반복",
    text: "민서님은 식상(食傷)이 약해 감정을 바로 표현하기보다 안에서 정리하는 편이에요.\n식상(食傷)이 부족한 사주는 말보다 생각이 먼저 움직여 감정 표현이 늦어질 수 있어요.\n그래서 민서님은 감정을 바로 꺼내기보다 한 번 더 정리하고 전하는 리듬이 강해요.\n표현의 기운이 얇기 때문에 상대가 기다려주는 분위기에서 말문이 편해져요.",
  },
  {
    pattern: "재성강 현실/결과 반복",
    text: "도윤님은 재성(財星)이 강해 현실 감각이 먼저 작동하는 편이에요.\n재성(財星)이 강한 사주는 관계에서도 말보다 결과와 책임을 중요하게 봐요.\n현실적인 감각이 강하다 보니 목표를 세우고 꾸준히 결과를 만들어내는 면이 있어요.\n재성의 힘이 커서 사랑에서도 실제 행동과 약속을 신뢰의 기준으로 삼아요.",
  },
  {
    pattern: "관성강 책임/안정 반복",
    text: "하린님은 관성(官星)이 강해 관계에서 책임과 기준을 중요하게 여겨요.\n관성(官星)이 강한 사주는 쉽게 흔들리기보다 약속과 질서를 지키려는 힘이 커요.\n책임감 있는 만남을 선호하고, 안정적인 관계 안에서 마음이 깊어지는 편이에요.\n관성의 기운이 강하기 때문에 상대가 가볍게 행동하면 신뢰가 흔들릴 수 있어요.",
  },
  {
    pattern: "인성과다 생각/정리 반복",
    text: "서아님은 인성(印星)이 강해 생각을 깊게 정리한 뒤 움직이는 편이에요.\n인성(印星)이 많은 사주는 마음을 바로 드러내기보다 속으로 충분히 받아들이고 판단해요.\n그래서 관계에서도 혼자 오래 생각하고, 상대의 말을 곱씹는 시간이 필요해요.\n생각이 깊은 만큼 확신이 생기면 오래 지켜보는 힘도 강해요.",
  },
  {
    pattern: "비겁과다 자기주장 반복",
    text: "준호님은 비겁(比劫)이 강해 자기 기준이 분명하고 쉽게 밀리지 않는 편이에요.\n비겁(比劫)이 많은 사주는 관계에서도 자기 의견을 선명하게 내세우는 힘이 있어요.\n자기주장이 강한 만큼 상대와 속도를 맞추는 연습이 필요해요.\n비겁의 힘이 커서 같은 방향을 바라볼 때는 든든한 동료처럼 움직여요.",
  },
  {
    pattern: "일주 이미지 반복",
    text: "유진님은 일주(日柱)가 갑진(甲辰)으로, 겉으로는 곧게 뻗은 큰 나무처럼 보이지만 안에는 큰 포부가 숨어 있어요.\n일주(日柱) 갑진(甲辰)은 겉은 곧고 속은 깊은 의지를 품은 구조예요.\n갑진의 결은 조용하지만 쉽게 꺾이지 않는 태도로 드러나요.\n이 일주는 관계에서도 한 번 마음을 정하면 오래 지켜보는 힘을 줘요.",
  },
  {
    pattern: "비유 과다",
    text: "수아님은 마치 고요한 호수 같아요. 겉으로는 맑지만 안에는 깊이를 알 수 없는 풍요가 있어요.\n마치 갓 피어나는 꽃봉오리처럼 아직 다 드러나지 않았지만 고유한 향기가 응축되어 있어요.\n실제 관계에서는 마치 조용히 흐르는 물결 같지만 사랑하는 사람을 위해 바위를 뚫고 나아가는 강물처럼 보여요.",
  },
  {
    pattern: "원점수 노출",
    text: "인성(印星)은 받쳐주는 자리의 기운을 의미하며 지우님에게는 1.1이라는 중간 정도의 강함으로 나타나요.\n재성(財星)이 2.2로 강하고 관성(官星)이 1.8로 강한 편이라, 실제적인 결과나 책임감 있는 만남을 추구하는 경향이 있어요.\n이 숫자들은 지우님의 관계 방식에서 현실감과 안정감을 함께 보여줘요.",
  },
  {
    pattern: "부모자녀 양육 반복",
    text: "아이의 신약한 사주는 안정적인 환경에서 더 편하게 자기 모습을 드러내요.\n신약한 아이는 부모의 반응이 안정적일수록 마음을 열기 쉬워요.\n그래서 부모님은 아이가 자기 리듬을 천천히 세울 수 있도록 기다려주는 것이 좋아요.\n안정적인 환경은 아이에게 큰 힘이 되고, 부모의 일관된 반응이 아이를 편하게 해줘요.",
  },
];

const services = ["hongsil", "inyeon", "parent-child"];
const samples = Array.from({ length: 50 }, (_, idx) => {
  const base = baseSamples[idx % baseSamples.length];
  return {
    id: idx + 1,
    service: services[idx % services.length],
    pattern: base.pattern,
    text: base.text.replaceAll("님", `${idx + 1}님`),
  };
});

const reportPath = path.join(root, "룰북", "LLM 출력 검수 50개 시뮬레이션 보고서.md");
const jsonPath = path.join(root, "룰북", "LLM 출력 검수 50개 시뮬레이션 결과.json");
const results = [];
let consecutiveQuotaErrors = 0;

function writeReports(final = false) {
  const passed = results.filter((r) => r.pass).length;
  const failed = results.length - passed;
  const completed = results.filter((r) => r.ok).length;
  const errors = results.filter((r) => !r.ok).length;
  const avgMs = Math.round(results.filter((r) => r.elapsedMs).reduce((sum, r) => sum + r.elapsedMs, 0) / Math.max(1, results.filter((r) => r.elapsedMs).length));
  const avgCompression = Number((results.filter((r) => r.compressionRatio).reduce((sum, r) => sum + r.compressionRatio, 0) / Math.max(1, results.filter((r) => r.compressionRatio).length)).toFixed(2));

  const report = `# LLM 출력 검수 50개 시뮬레이션

작성일: ${new Date().toISOString()}

## 요약

- 상태: ${final ? "완료" : "부분 실행"}
- 총 목표 샘플: ${samples.length}
- 실행된 샘플: ${results.length}
- Gemini 응답 완료: ${completed}
- 오류: ${errors}
- PASS: ${passed}
- CHECK: ${failed}
- 평균 호출 시간: ${avgMs}ms
- 평균 압축 비율: ${avgCompression}
- 방식: 원 프롬프트가 아니라 검수/재작성 단계의 의미 클러스터 압축 프롬프트를 Gemini API로 직접 테스트

## 판정 기준

- 같은 사주근거명 최대 1회
- 금지 표현 없음
- 대체어 반복 없음
- 기준 없는 원점수 노출 없음
- "마치" 비유 1회 이하
- 원문에 없던 새 제목/목록/섹션 추가 없음

## 상세

${results.map((r) => {
  if (!r.ok) {
    return `### ${r.id}. ${r.service} / ${r.pattern}

- 결과: ERROR
- 오류: ${r.error}
`;
  }
  return `### ${r.id}. ${r.service} / ${r.pattern}

- 결과: ${r.pass ? "PASS" : "CHECK"}
- 호출 시간: ${r.elapsedMs}ms
- 압축 비율: ${r.compressionRatio}
- 근거 카운트: ${r.evidenceCounts.map((x) => `${x.label} ${x.count}`).join(", ") || "없음"}
- 금지어: ${r.badHits.join(", ") || "없음"}
- 대체어 반복: ${r.replacementRepeatHits.map((x) => `${x.word} ${x.count}`).join(", ") || "없음"}

출력:
${r.output}
`;
}).join("\n")}
`;

  fs.writeFileSync(reportPath, report, "utf8");
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2), "utf8");
}

for (const sample of samples) {
  const start = Date.now();
  try {
    const output = await callGemini(buildPrompt(sample));
    const elapsedMs = Date.now() - start;
    const maxRepeat = maxEvidenceRepeat(output);
    const badHits = banned.filter((word) => output.includes(word));
    const replacementRepeatHits = replacementRepeats
      .map((word) => ({ word, count: count(output, word) }))
      .filter((item) => item.count >= 2);
    const pass = maxRepeat <= 1 && badHits.length === 0 && replacementRepeatHits.length === 0 && !hasDecimalScore(output) && count(output, "마치") <= 1;
    results.push({
      ...sample,
      ok: true,
      pass,
      elapsedMs,
      inputChars: sample.text.length,
      outputChars: output.length,
      compressionRatio: Number((output.length / sample.text.length).toFixed(2)),
      evidenceCounts: evidenceCounts(output),
      badHits,
      replacementRepeatHits,
      output,
    });
    consecutiveQuotaErrors = 0;
    console.log(`${sample.id}/50 ${pass ? "PASS" : "CHECK"} ${sample.service} ${sample.pattern} ${elapsedMs}ms`);
    writeReports(false);
    await new Promise((resolve) => setTimeout(resolve, 6500));
  } catch (error) {
    if (String(error).includes("Gemini 429")) consecutiveQuotaErrors++;
    results.push({
      ...sample,
      ok: false,
      pass: false,
      error: String(error),
    });
    console.log(`${sample.id}/50 ERROR ${sample.service} ${sample.pattern}: ${String(error).slice(0, 120)}`);
    writeReports(false);
    if (consecutiveQuotaErrors >= 2) {
      console.log("Stopping early after consecutive Gemini 429 quota errors.");
      break;
    }
  }
}

writeReports(results.length === samples.length);

const passed = results.filter((r) => r.pass).length;
const failed = results.length - passed;
const avgMs = Math.round(results.filter((r) => r.elapsedMs).reduce((sum, r) => sum + r.elapsedMs, 0) / Math.max(1, results.filter((r) => r.elapsedMs).length));
const avgCompression = Number((results.filter((r) => r.compressionRatio).reduce((sum, r) => sum + r.compressionRatio, 0) / Math.max(1, results.filter((r) => r.compressionRatio).length)).toFixed(2));

console.log(`\nDONE RUN=${results.length}/50 PASS=${passed} CHECK=${failed} AVG_MS=${avgMs} AVG_COMPRESSION=${avgCompression}`);
console.log(reportPath);
console.log(jsonPath);
