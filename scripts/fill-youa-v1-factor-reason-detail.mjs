import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const youaRoot = path.join(root, "아이기질브라덜");
const sourceRoot = path.join(youaRoot, "claude-code-sample10-package", "output");
const blockRoot = path.join(youaRoot, "claude-code-sample10-package", "output-blocks");
const auditPath = path.join(youaRoot, "cache-schema", "youa-v1-factor-reason-detail-audit.v1.json");
const sampleIds = ["sample-001", "sample-002", "sample-003", "sample-004"];

const levelPhrases = {
  활기: { 낮음: "안으로 흐르는 결", 중간: "상황에 따라 에너지가 달라지는 균형의 결", 높음: "바깥으로 활기가 드러나는 결", 매우높음: "에너지가 강하게 밖으로 흐르는 결" },
  조심: { 낮음: "먼저 다가가는 결", 중간: "살핌과 시도가 함께 있는 균형의 결", 높음: "먼저 살피고 움직이는 결", 매우높음: "안전 확인이 깊은 결" },
  만족: { 낮음: "기쁨을 조용히 받아들이는 결", 중간: "좋음과 아쉬움을 함께 알아차리는 균형의 결", 높음: "기쁨을 잘 발견하는 결", 매우높음: "즐거움이 크게 살아나는 결" },
  흔들림: { 낮음: "감정이 빨리 정리되는 결", 중간: "감정의 깊이와 회복이 함께 있는 균형의 결", 높음: "마음에 오래 머무는 결", 매우높음: "감정을 깊게 받아들이는 결" },
  어울림: { 낮음: "자기 시간을 먼저 지키는 결", 중간: "관계와 자기 자리를 오가는 균형의 결", 높음: "사람 쪽으로 마음이 열리는 결", 매우높음: "관계 감각이 크게 살아나는 결" },
  끈기: { 낮음: "새 자극으로 옮겨가는 결", 중간: "머무름과 전환이 함께 있는 균형의 결", 높음: "끝까지 들고 가는 결", 매우높음: "한 번 잡은 일을 깊게 밀고 가는 결" },
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function hasBatchim(text) {
  const ch = String(text).at(-1);
  const code = ch?.charCodeAt(0) ?? 0;
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
}

function topic(text) {
  return `${text}${hasBatchim(text) ? "은" : "는"}`;
}

function subject(text) {
  return `${text}${hasBatchim(text) ? "이" : "가"}`;
}

function itemText(item) {
  const label = item?.label ?? "사주 인자";
  const raw = item?.raw ? `${item.raw}` : "";
  const position = item?.position ? `${item.position}` : "";
  const strength = item?.strength ? `${item.strength}` : "";
  const meta = [raw, position, strength].filter(Boolean).join(", ");
  return meta ? `${label} (${meta})` : label;
}

function conclusion({ childName, factor, level, makersCount, suppressorsCount }) {
  const phrase = levelPhrases[factor]?.[level] ?? `${level} 결`;
  if (makersCount > suppressorsCount) {
    return `만드는 기운 ${makersCount}가지가 누르는 기운 ${suppressorsCount}가지보다 우세하기 때문에, ${childName}의 ${topic(factor)} 또래보다 ${phrase}로 자리합니다.`;
  }
  if (suppressorsCount > makersCount) {
    return `만드는 기운 ${makersCount}가지보다 누르는 기운 ${suppressorsCount}가지가 우세하기 때문에, ${childName}의 ${topic(factor)} 또래보다 ${subject(phrase)} 됩니다.`;
  }
  return `만드는 기운 ${makersCount}가지와 누르는 기운 ${suppressorsCount}가지가 비슷한 무게로 자리하기 때문에, ${childName}의 ${topic(factor)} 또래보다 한쪽으로 치우치기보다 ${phrase}로 나타납니다.`;
}

const audit = {
  version: "youa-v1-factor-reason-detail-audit-v1",
  generatedAt: new Date().toISOString(),
  ok: true,
  samples: [],
};

for (const sampleId of sampleIds) {
  const source = readJson(path.join(sourceRoot, `${sampleId}.json`));
  const standalonePath = path.join(blockRoot, sampleId, "standalone-blocks.json");
  const manifestPath = path.join(blockRoot, sampleId, "block-manifest.json");
  const standalone = readJson(standalonePath);
  const manifest = readJson(manifestPath);
  const sample = { sampleId, childName: source.facts?.child?.name, factors: [], errors: [] };

  for (const [factorName, factorBlock] of Object.entries(standalone.factors ?? {})) {
    const sourceFactor = source.sections?.factors?.[factorName];
    const why = sourceFactor?.why;
    const scoreInfo = source.sections?.overview?.scores?.find?.((item) => item.factor === factorName)
      ?? { score: source.facts?.scores?.[factorName], level: undefined };

    if (!why) {
      sample.errors.push(`missing-source-why:${factorName}`);
      continue;
    }

    const makerItems = why.makerItems ?? [];
    const suppressorItems = why.suppressorItems ?? [];
    const body = Array.isArray(why.body) ? why.body : [];
    const inferredLevel = scoreInfo.level ?? sourceFactor?.summaryBox?.line1?.match(/, ([^ ]+) 결/)?.[1] ?? "중간";

    factorBlock.whyMakerItems = makerItems.map(itemText);
    factorBlock.whySuppressorItems = suppressorItems.map(itemText);
    factorBlock.whyDetailBody = [
      ...body,
      conclusion({
        childName: source.facts?.child?.name ?? "자녀",
        factor: factorName,
        level: inferredLevel,
        makersCount: makerItems.length,
        suppressorsCount: suppressorItems.length,
      }),
    ];

    sample.factors.push({
      factor: factorName,
      makers: makerItems.length,
      suppressors: suppressorItems.length,
      detailParagraphs: factorBlock.whyDetailBody.length,
    });
  }

  manifest.standalone.factorBlocksPerFactor = [
    ...new Set([...(manifest.standalone.factorBlocksPerFactor ?? []), "whyMakerItems", "whySuppressorItems", "whyDetailBody"]),
  ];
  manifest.standalone.totalBlocks = (Object.keys(standalone.factors ?? {}).length * manifest.standalone.factorBlocksPerFactor.length)
    + ((manifest.standalone.parentBlocks ?? []).length * 2);

  writeJson(standalonePath, standalone);
  writeJson(manifestPath, manifest);
  sample.ok = sample.errors.length === 0;
  audit.samples.push(sample);
}

audit.ok = audit.samples.every((sample) => sample.ok);
writeJson(auditPath, audit);

for (const sample of audit.samples) {
  console.log(`${sample.ok ? "OK" : "FAIL"} ${sample.sampleId} factors=${sample.factors.length}`);
}
console.log(`YOUA_FACTOR_REASON_DETAIL ok=${audit.ok}`);
console.log(path.relative(root, auditPath));

if (!audit.ok) process.exitCode = 1;
