import type { SajuAnalysisCore } from "@/lib/saju-core";
import { REPETITION_TONE_GUIDE } from "@/lib/hongsil/prompts/refinement/repetition-tone";

const GEMINI_MODEL = "gemini-2.5-flash";
const GUARD_TIMEOUT_MS = 45_000;

type GuardService = "hongsil" | "inyeon" | "parent-child" | "saju";

export interface GuardPersonContext {
  name: string;
  saju: SajuAnalysisCore;
}

export interface GuardInput {
  service: GuardService;
  chapter: number | string;
  text: string;
  prompt: string;
  people: GuardPersonContext[];
  apiKey: string;
  /**
   * Cross-chapter accumulator. Same Map instance passed across chapter calls.
   * Key = normalized token (e.g. "재성(財星)" regardless of whether the body
   * wrote "재성(財星)" or "재성(財星, 내가 극하는 기운)"). Value = appearance
   * count across the whole 풀이. Tokens stay verbatim until count == 2, then
   * the 3rd appearance is replaced with a 생활어 pronoun from a rotating pool.
   * The user-facing rule: 한자 병기·근거명은 풀이 전체에서 2회까지 그대로,
   * 3회째부터 짧은 대명사로.
   */
  usedTokens?: Map<string, number>;
  /**
   * ⭐ F3 (2026-05-14): parent-child 전용 — 자녀 연령대 (영아·유아·학령전·초등·중등·고등)
   * 영유아 케이스에서 학령기·성인 어휘 후처리 strip 위해.
   */
  childAgeStage?: "infant" | "toddler" | "preschool" | "elementary" | "middle" | "high" | "adult";
  /**
   * ⭐ G1 (2026-05-14): 자녀 이름 호칭 변형(양→상) strip 가드용.
   * LLM이 "이금희양" 끝의 "양"을 "상"으로 변형 출력하는 케이스 (캐릭터 패턴 학습 부작용).
   * stripUserNameSangSuffix(${name}상)는 ${name}이 풀네임("이금희양")이라 못 잡음.
   * 별도 가드에서 ${stem}+상 → ${stem}+${honorific} 복원.
   */
  childNameStem?: string;     // 호칭 제외한 자녀 이름 (예: "이금희")
  childHonorific?: string;    // 자녀 호칭 ("양" 또는 "군")
  /**
   * ⭐ G16/G17 (2026-05-14): parent-child 전용 — 시각 카드 dominant 값.
   * 본문이 차트 dominant와 반대 방향 묘사하면 fixChartFactsMismatch가 자동 치환.
   */
  chartFacts?: {
    leaderDom?: string; aloneDom?: string; depthDom?: string;
    writeDom?: string; slowDom?: string;
    friendDom?: string; thinkingDom?: string; jobTop1?: string;
    weakestElem?: string; strongestElem?: string;
    shineGroup?: string; shineAge?: number; shineGanji?: string;
    childAge?: number; childAgeStage?: string;
  };
}

interface GuardIssue {
  type: string;
  sentence: string;
  reason: string;
}

interface GuardResult {
  pass: boolean;
  issues: GuardIssue[];
  reason?: string;
}

interface RepeatedEvidence {
  label: string;
  count: number;
  aliases: string[];
}

const SEMANTIC_CLUSTER_GUIDE = `
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

판정 방식:
- 같은 클러스터 안의 문장이 2개 이상이면 의미 중복 후보로 본다.
- 같은 사주근거명만 반복되지 않아도, 결론 의미가 같으면 중복이다.
- 중복 후보는 삭제가 아니라 병합한다.
- 병합 후 남은 문장은 독자가 바로 이해할 수 있는 직관적인 문장이어야 한다.
`;

type SipseongGroup = "bigyeop" | "siksang" | "jaeseong" | "gwanseong" | "inseong";

type SipseongCounts = Record<SipseongGroup, number>;

const GROUP_LABEL: Record<SipseongGroup, string> = {
  bigyeop: "비겁(비견·겁재)",
  siksang: "식상(식신·상관)",
  jaeseong: "재성(정재·편재)",
  gwanseong: "관성(정관·편관)",
  inseong: "인성(정인·편인)",
};

const SIPS = {
  bigyeop: ["비견", "겁재", "鍮꾧껄", "寃곸옱"],
  siksang: ["식신", "상관", "?앹떊", "?곴?"],
  jaeseong: ["정재", "편재", "?뺤옱", "?몄옱"],
  gwanseong: ["정관", "편관", "칠살", "?뺢?", "?멸?"],
  inseong: ["정인", "편인", "효신", "?뺤씤", "?몄씤"],
} satisfies Record<SipseongGroup, string[]>;

const HARD_BAN_PATTERNS: Array<{ re: RegExp; label: string }> = [
  { re: /혼자\s*모든\s*것을\s*짊어/g, label: "단일 근거 과장: 혼자 모든 것을 짊어짐" },
  { re: /혼자\s*짊어/g, label: "단일 근거 과장: 혼자 짊어짐" },
  { re: /혼자\s*[^.!?\n]{0,15}짊어/g, label: "단일 근거 과장: 혼자 ○○ 짊어짐 (변형)" },
  { re: /벽처럼\s*느[껴낄낀끼지꼈겠]/g, label: "관계 불안 유발 표현: 벽처럼 느낌(활용형)" },
  { re: /감정[을은]?\s*[^.!?\n]{0,24}삭이/g, label: "감정 억압 단정: 감정을 삭임" },
  { re: /감정을\s*솔직하게\s*표현하지\s*못/g, label: "감정 표현 불능 단정" },
  { re: /사랑을\s*못\s*하/g, label: "연애 불능 단정" },
  { re: /관계가\s*무너/g, label: "관계 파국 단정" },
  { re: /부족해서\s*보완/g, label: "부족-보완식 결핍 표현" },
  { re: /약해서\s*채워/g, label: "약함-채움식 결핍 표현" },
  { re: /반드시\s*(헤어|무너|불행|실패)/g, label: "미래 사건 단정" },
  { re: /(비겁|식상|재성|관성|인성)\([^)]*\)[^.!?\n]{0,40}\d+\.\d/g, label: "기준 없는 십성 원점수 노출" },
  { re: /(비겁|식상|재성|관성|인성)[^.!?\n]{0,24}\d+\.\d/g, label: "기준 없는 십성 원점수 노출" },
  { re: /(쥐|소|호랑이|토끼|용|뱀|말|양|원숭이|닭|개|돼지)처럼/g, label: "일반 독자에게 어색한 지지 동물 상징 직역" },
  { re: /(쥐|소|호랑이|토끼|용|뱀|말|양|원숭이|닭|개|돼지)같/g, label: "일반 독자에게 어색한 지지 동물 상징 직역" },
  { re: /닭[^.!?\n]{0,24}(정결|예리|직관)/g, label: "닭 상징을 성향으로 직역한 표현" },
  { re: /이슬처럼[^.!?\n]{0,80}(고요|부드럽|차분)/g, label: "자연 상징 직역 과다" },
];

const SOFT_REPLACEMENTS: Array<[RegExp, string]> = [
  [/신약\(身弱\)한\s*사주에\s*비겁\(比劫\)이\s*없어\s*혼자\s*모든\s*것을\s*짊어지려는\s*경향이\s*있을\s*수\s*있어요\.?/g, "비겁의 힘이 얇게 잡히면 관계 안에서 자기 리듬을 바로 밀기보다 상대 흐름을 먼저 살피는 결로 나타날 수 있어요."],
  [/신약한\s*사주에\s*비겁이\s*없어\s*혼자\s*모든\s*것을\s*짊어지려는\s*경향이\s*있을\s*수\s*있어요\.?/g, "비겁의 힘이 얇게 잡히면 관계 안에서 자기 리듬을 바로 밀기보다 상대 흐름을 먼저 살피는 결로 나타날 수 있어요."],
  [/혼자\s*모든\s*것을\s*짊어지려는\s*경향/g, "상대 흐름을 먼저 살피며 자기 리듬을 천천히 세우려는 경향"],
  [/혼자\s*모든\s*것을\s*짊어/g, "자기 리듬을 천천히 세워"],
  [/혼자\s*짊어지/g, "자기 리듬을 천천히 세우"],
  [/혼자\s*[^.!?\n]{0,15}짊어지려\s*하면/g, "자기 리듬을 먼저 세우려 하면"],
  [/혼자\s*[^.!?\n]{0,15}짊어지/g, "자기 리듬을 천천히 세우"],
  // ⭐ 2026-05-14 — 평생사주 cross-section 결론 변형형 차단 (Section Direction Matrix 보완)
  // LLM이 "혼자 모든 X" → "협력/지지" 결론 패턴으로 수렴. 동사·문맥 다양해서 broad catch-all + 명시 case
  // Broad: "혼자 모든 (것을|결정을) X" 류 통째 흡수 — 의미 보존하며 결론 톤 분산
  [/혼자\s*모든\s*것을\s*[가-힣]{1,3}하고\s*[가-힣]{1,3}(하|지|이|이끌|책임)[가-힣]{0,4}\s*(것을?\s*)?보다는?/g, "자기 호흡을 따라가기보다"],
  [/혼자\s*모든\s*것을\s*[가-힣]{1,3}하기?\s*보다는?/g, "자기 호흡을 따라가기보다"],
  [/혼자\s*모든\s*것을\s*[가-힣]{1,3}하려는?\s*(경향|결|편|모습)/g, "자기 결을 묵묵히 안고 가는 $1"],
  [/혼자\s*모든\s*것을\s*[가-힣]{2,4}(어가는|아가는|어\s*가는)/g, "자기 색을 끌고 가는"],
  [/혼자\s*모든\s*결정을?\s*내리고\s*책임을\s*지는/g, "자기 결정과 책임이 무거워지는"],
  [/혼자\s*모든\s*결정을?\s*내리는?/g, "자기 결정의 무게가 큰"],
  [/혼자서\s*결정하지\s*마(세요|시고|시면)/g, "자기 결정의 무게가 클 때는 잠시 쉬어가셔도 좋아요"],
  // "지혜를 모으" 류 변형형 차단
  [/주변과\s*함께\s*지혜를\s*모으[는고]?/g, "자기 호흡을 따라가"],
  [/사람들과\s*함께\s*지혜를\s*모으[는고]?/g, "곁의 사람과 호흡을 맞추"],
  [/지혜를\s*모으고\s*의견을\s*나누는?/g, "마음을 천천히 펼쳐 보이는"],
  [/기댈\s*수\s*있는\s*사람들과\s*함께\s*지혜를\s*모으/g, "기댈 자리를 두고 자기 호흡을 따라가"],
  // ⭐ 결혼 기정사실 톤 — 미혼·이혼 케이스에도 통하도록 조건 어조로 변환
  [/결혼\s*생활에서\s*([가-힣]+님)/g, "곁의 사람과 함께하는 자리에서 $1"],
  [/결혼\s*생활에서\s*주의할\s*점은/g, "곁의 사람과 함께 만들어가는 결에서 주의할 점은"],
  [/결혼\s*생활(\s*중\s*[가-힣]+님이?|에서|에는|이|을|은)/g, "곁의 사람과 함께하는 자리$1"],
  [/배우자와\s*함께\s*([가-힣]+)/g, "곁의 사람과 함께 $1"],
  // ⭐ G12 보완 — 풀 대명사 + 한자 직결 비문 ("본인 결 己(기)토" 류). 한자만 남기고 풀 대명사 strip
  [/(본인\s*결|타고난\s*결|중심\s*기운|관계의\s*자리|마음\s*안쪽의\s*자리|내면의\s*자리)\s+([甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥]\()/g, "$2"],
  [/자신의\s*감정을\s*솔직하게\s*표현하지\s*못하고\s*안으로\s*삭이는\s*모습/g, "감정을 바로 꺼내기보다 한 번 정리한 뒤 전하려는 모습"],
  [/감정을\s*솔직하게\s*표현하지\s*못하고\s*안으로\s*삭이/g, "감정을 바로 꺼내기보다 한 번 정리한 뒤 전하"],
  [/감정[을은]?\s*안으로\s*삭이/g, "감정을 한 번 정리하"],
  [/벽처럼\s*느껴질\s*수도\s*있답니다/g, "거리감처럼 보이지 않도록 말의 온도를 조금 더 보여주는 편이 좋아요"],
  [/벽처럼\s*느[껴낄낀끼지꼈겠]/g, "거리감처럼 보일"],
  [/벽처럼\s*다가/g, "거리감처럼 다가"],
  [/부족해서\s*보완해야\s*합니다/g, "얇게 잡힌 부분은 관계 안에서 천천히 키워가면 좋아요"],
  [/약해서\s*채워줘야\s*합니다/g, "얇게 잡힌 부분은 관계 안에서 천천히 키워가면 좋아요"],
  [/겉은\s*이슬처럼\s*고요하고\s*부드러우면서도,\s*속으로는\s*닭처럼\s*정결하고\s*예리한\s*직관력을\s*가지고\s*있어요\.?/g, "겉으로는 차분하고 부드러워 보이지만, 가까워질수록 말투와 분위기 변화를 섬세하게 알아차리는 편이에요."],
  [/닭처럼\s*정결하고\s*예리한\s*직관력/g, "말투와 분위기 변화를 섬세하게 알아차리는 감각"],
  [/이슬처럼\s*고요하고\s*부드러/g, "차분하고 부드러"],
];

function flattenSipseong(saju: SajuAnalysisCore): string[] {
  const rows = [saju.sipseong.year, saju.sipseong.month, saju.sipseong.day, saju.sipseong.hour].filter(Boolean);
  return rows.flatMap((row) => row ? [row.stem, row.branch] : []);
}

function countSipseongGroups(saju: SajuAnalysisCore): SipseongCounts {
  const counts: SipseongCounts = { bigyeop: 0, siksang: 0, jaeseong: 0, gwanseong: 0, inseong: 0 };
  for (const sip of flattenSipseong(saju)) {
    for (const group of Object.keys(SIPS) as SipseongGroup[]) {
      if (SIPS[group].some((needle) => sip.includes(needle))) {
        counts[group] += 1;
        break;
      }
    }
  }
  return counts;
}

function isWeakShinkang(level: string): boolean {
  return /신약|약/.test(level);
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?。]|요\.|다\.|죠\.|요|다)\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countMatches(text: string, aliases: string[]): number {
  return splitSentences(text).filter((sentence) =>
    aliases.some((alias) => sentence.includes(alias)),
  ).length;
}

function getGanjiLabel(saju: SajuAnalysisCore): string | null {
  const stem = saju.pillars.day.stem;
  const branch = saju.pillars.day.branch;
  if (!stem || !branch) return null;
  return `${stem}${branch}`;
}

function buildEvidenceCandidates(people: GuardPersonContext[]): Array<{ label: string; aliases: string[] }> {
  const base: Array<{ label: string; aliases: string[] }> = [
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

  const dynamic: Array<{ label: string; aliases: string[] }> = [];
  for (const person of people) {
    const ganji = getGanjiLabel(person.saju);
    if (ganji) {
      dynamic.push({ label: `${person.name} 일주 ${ganji}`, aliases: [ganji, `일주 ${ganji}`, `일주(日柱) ${ganji}`] });
    }
    if (person.saju.ilgan) {
      dynamic.push({ label: `${person.name} 일간 ${person.saju.ilgan}`, aliases: [`일간 ${person.saju.ilgan}`, `일간(日干) ${person.saju.ilgan}`] });
    }
  }
  return [...base, ...dynamic];
}

function findRepeatedEvidence(text: string, people: GuardPersonContext[]): RepeatedEvidence[] {
  return buildEvidenceCandidates(people)
    .map((candidate) => ({
      ...candidate,
      count: countMatches(text, candidate.aliases),
    }))
    .filter((item) => item.count >= 2)
    .sort((a, b) => b.count - a.count);
}

function buildRepeatedEvidenceBlock(repeated: RepeatedEvidence[]): string {
  if (repeated.length === 0) return "없음";
  return repeated
    .map((item) => `- ${item.label}: ${item.count}회 반복. 대표 표현: ${item.aliases.slice(0, 4).join(", ")}`)
    .join("\n");
}

function findStyleIssues(text: string): GuardIssue[] {
  const issues: GuardIssue[] = [];
  const metaphorCount = (text.match(/마치/g) ?? []).length;
  const simileCount = (text.match(/같(?:아|은|지만|고|죠|습니다|아요)/g) ?? []).length;
  if (metaphorCount >= 3 || metaphorCount + simileCount >= 7) {
    issues.push({
      type: "metaphor-overuse",
      sentence: "챕터 전체",
      reason: "비유·은유가 연속으로 많아 핵심 풀이의 직관성과 몰입을 떨어뜨림",
    });
  }

  // Fix 5: 자연 비유 (1장 sub2~sub6 / ch2~ch6) 검출 — judge가 잡아 rewrite로 자연 표현으로 교체
  const naturalSimilePattern = /(마치\s*)?(?:[가-힣]{1,10}\s*)?(나무|물|불|꽃|돌|구름|강|바다|산|새|이슬|호수|연못|바람)(?:처럼|같이|하듯|듯이?)/g;
  const natMatches = [...text.matchAll(naturalSimilePattern)];
  if (natMatches.length > 0) {
    for (const m of natMatches.slice(0, 3)) {
      issues.push({
        type: "natural-simile-overuse",
        sentence: m[0],
        reason: "1장 첫 sub 외에는 자연 비유 최소화 — 행동·반응·관찰력·말투·속도 같은 연애 장면 어휘로 풀어쓰기",
      });
    }
  }

  const factorPatterns = [
    { re: /태약[^.!?\n]{0,80}비겁[^.!?\n]{0,80}(식상|재성)/g, label: "태약+비겁+식상/재성" },
    { re: /신약[^.!?\n]{0,80}비겁[^.!?\n]{0,80}(식상|재성)/g, label: "신약+비겁+식상/재성" },
    { re: /비겁[^.!?\n]{0,80}(식상|재성)[^.!?\n]{0,80}약/g, label: "비겁+식상/재성 약함" },
  ];
  for (const pattern of factorPatterns) {
    const hits = text.match(pattern.re) ?? [];
    if (hits.length >= 2) {
      issues.push({
        type: "factor-repetition",
        sentence: hits[1].slice(0, 180),
        reason: `같은 사주 근거(${pattern.label})가 같은 챕터 안에서 반복되어 독자 피로를 만들 수 있음`,
      });
    }
  }

  return issues;
}

function findDeterministicIssues(text: string, people: GuardPersonContext[]): GuardIssue[] {
  const issues: GuardIssue[] = findStyleIssues(text);
  const repeatedEvidence = findRepeatedEvidence(text, people);
  for (const item of repeatedEvidence) {
    issues.push({
      type: "evidence-repetition",
      sentence: item.label,
      reason: `같은 사주 근거명이 ${item.count}회 반복됨. 첫 1회만 직접 노출하고 이후는 이 흐름/이 결/이 리듬으로 받아야 함`,
    });
  }
  for (const pattern of HARD_BAN_PATTERNS) {
    if (!pattern.re.test(text)) continue;
    pattern.re.lastIndex = 0;
    const sentence = splitSentences(text).find((s) => pattern.re.test(s)) ?? pattern.label;
    pattern.re.lastIndex = 0;
    issues.push({ type: "hard-ban", sentence, reason: pattern.label });
  }

  for (const person of people) {
    const counts = countSipseongGroups(person.saju);
    const weakNoBigyeop = isWeakShinkang(String(person.saju.shinkang)) && counts.bigyeop === 0;
    if (weakNoBigyeop && /(혼자\s*모든\s*것을\s*짊어|혼자\s*짊어|벽처럼\s*느껴|감정[을은]?\s*[^.!?\n]{0,24}삭이)/.test(text)) {
      issues.push({
        type: "unsupported-inference",
        sentence: `${person.name}: 신약 + 비겁 0 관련 문장`,
        reason: "신약 + 비겁 0만으로 혼자 짊어짐, 감정 억압, 벽 같은 거리감을 단정할 수 없음",
      });
    }
    if (counts.siksang === 0 && /감정을\s*솔직하게\s*표현하지\s*못|감정\s*표현을\s*못/.test(text)) {
      issues.push({
        type: "unsupported-inference",
        sentence: `${person.name}: 식상 0 관련 문장`,
        reason: "식상 0만으로 감정 표현 불능을 단정할 수 없음",
      });
    }
  }
  return issues;
}

function applyDeterministicRepair(text: string): string {
  let result = text;
  for (const [pattern, replacement] of SOFT_REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

const HONGSIL_LIFESTYLE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/회복기를\s*거치는\s*결이에요\.?\s*다음\s*인연이\s*가까워져요\.?/g, "마음을 정리하면서 다음 만남을 준비하는 시기에 가까워요. 무리하지 않아도 새 인연의 문이 열리기 쉬워요."],
  [/현실적인\s*문제에\s*대한\s*부담감을\s*자기\s*리듬을\s*천천히\s*세우려\s*하는\s*경향이\s*있어요/g, "현실적인 부담이 커지면 마음을 정리한 뒤 움직이려는 편이에요"],
  [/부담감을\s*자기\s*리듬을\s*천천히\s*세우려\s*하는/g, "부담이 커질수록 마음을 정리한 뒤 움직이려는"],
  [/상대\s*반응을\s*살피는\s*흐름한\s*결/g, "상대 반응을 살피는 태도"],
  [/흐름한\s*결/g, "흐름"],
  [/다만,\s*끌리는\s*감정만을\s*좇다\s*보면/g, "주의할 점은, 끌리는 감정만 좇다 보면"],
  // ── 룰북 명시 금지 패턴의 변형형 캡처 (정확 매칭 regex가 놓치는 우회 표현) ──
  [/신약한\s*사주/g, "기운이 얇은 결"],
  [/신약한\s*구조/g, "기운이 얇은 결"],
  [/신약한\s*흐름/g, "기운이 얇은 흐름"],
  [/관계의\s*모든\s*짐을\s*짊어/g, "한쪽이 너무 많은 짐을 지"],
  [/관계의\s*모든\s*부담[감을]?\s*짊어/g, "한쪽이 너무 많은 부담을 지"],
  [/모든\s*짐을\s*짊어지/g, "혼자 많은 짐을 지"],
  [/관성[이가]?\s*부족한\s*경향/g, "기준감이 천천히 단단해지는 결"],
  [/(재성|식상|관성|인성|비겁|비견|식신|상관|정재|편재|정관|편관|정인|편인)\s*기운[을를]\s*보완/g, "그 결을 관계 안에서 천천히 키워"],
  [/약한\s*(재성|식상|관성|인성|비겁|비견|식신|상관|정재|편재|정관|편관|정인|편인)\s*기운[을를]\s*보완/g, "얇게 잡힌 부분을 관계 안에서 천천히 키워"],
  [/식상[이가]?\s*약한\s*편/g, "표현이 천천히 풀리는 편"],
  // ── Fix E: 변형 결핍·낙인 표현 ──
  // "비겁이 5.6개로 강하게 드러나기 때문이에요" / "식상이 1.2개로 약하게 드러나기"
  // (수치 strip 후에도 남는 "약하게 드러나기" 류)
  [/(재성|식상|관성|인성|비겁|비견|식신|상관|정재|편재|정관|편관|정인|편인)\s*[이가]?\s*약하게\s*드러나/g, "$1의 결이 천천히 풀리는 편으로 드러나"],
  [/(재성|식상|관성|인성|비겁|비견|식신|상관|정재|편재|정관|편관|정인|편인)\s*[이가]?\s*(?:다소|약간)?\s*부족하기\s*때문/g, "$1의 결이 천천히 단단해지기 때문"],
  [/(재성|식상|관성|인성|비겁|비견|식신|상관|정재|편재|정관|편관|정인|편인)\s*[이가]?\s*사주에?\s*드러나(?:\s*있지)?\s*않(?:으므로|아서|기에)/g, "$1의 결이 비교적 옅게 자리하기에"],
  [/(재성|식상|관성|인성|비겁|비견|식신|상관|정재|편재|정관|편관|정인|편인)\s*기운[이가]?\s*약한\s*편/g, "$1의 결이 옅게 자리한 편"],
  [/감정[을은]?\s*삭이/g, "감정을 한 번 정리하"],
  [/혼자(?:서)?\s*[^.!?\n]{0,8}짊어/g, "혼자 많이 떠안"],
  // ── Fix E2: 오행 결핍 표현을 양반사주 톤으로 (부정 → 부드러움) ──
  // "부족한 화의 기운" / "약한 수 기운" / "약하게 드러나는 목 오행" 같은 결핍 낙인 변환
  [/부족한\s*(목|화|토|금|수)(?:\([木火土金水]\))?\s*(?:의\s*)?(기운|오행|결)?/g, "옅게 자리한 $1의 결"],
  [/약한\s*(목|화|토|금|수)(?:\([木火土金水]\))?\s*(?:의\s*)?(기운|오행|결)?/g, "얇게 잡힌 $1의 결"],
  [/(목|화|토|금|수)(?:\([木火土金水]\))?\s*(?:의\s*)?(?:기운|오행)이?\s*(?:다소|약간)?\s*부족(?:하기|한|하)/g, "$1의 결이 옅게 자리한 편"],
  [/(목|화|토|금|수)(?:\([木火土金水]\))?\s*(?:의\s*)?(?:기운|오행)이?\s*약하게\s*드러나/g, "$1의 결이 천천히 풀리는 편으로 드러나"],
];

// ── Fix D2: 십성·오행 원점수 우회 변형도 같이 캡처 ──
// "수 기운이 2.8로" / "인성 또한 2.2로" 같이 부사·명사 끼어있는 패턴.
// 기본 stripSipseongScoreLeakage가 못 잡는 변형을 추가로 잡는다.
const SOFT_REPLACEMENTS_SCORE_VARIANTS: Array<[RegExp, string]> = [
  // "(십성) 또한 2.2로" / "(십성) 역시 1.5로"
  [/((?:비겁|비견|겁재|식상|식신|상관|재성|정재|편재|관성|정관|편관|인성|정인|편인)(?:\([^)]*\))?)\s*(?:또한|역시|마저)\s*\d+(?:\.\d+)?\s*(?:로|이|가)?\s*/g, "$1 또한 "],
  // "수 기운이 2.8로" / "화 기운 1.2가" — 오행 + "기운이" 패턴
  [/((?:목|화|토|금|수)(?:\([木火土金水]\))?)\s*(?:기운[이가]?|오행[이가]?)\s*\d+(?:\.\d+)?\s*(?:로|이|가|는)?\s*/g, "$1의 결이 "],
  // "(십성) 기운이 5.6개로 강하게" 같이 띄어쓰기 변형
  [/((?:비겁|비견|겁재|식상|식신|상관|재성|정재|편재|관성|정관|편관|인성|정인|편인)(?:\([^)]*\))?)\s*(?:의\s*)?(?:기운[이가]?\s*)\d+(?:\.\d+)?\s*개?\s*(?:로|가|는|이)?\s*/g, "$1의 결이 "],
];

// ── Fix #5: 십성 원점수·수치 노출 strip ─────────────────────
// traits-block의 "비겁 5.6 / 식상 1.2" 가중 카운트는 LLM 내부 판단용인데
// 완성본3-1 L4·L11·L47에서 "비겁 5.6개", "식상 1.2개", "화 오행 0.147" 식으로
// 본문에 그대로 노출되는 사례 발견. 룰북 명시 금지 + 사용자 미감 결함.
// HARD_BAN_PATTERNS가 detect는 했지만 hongsil은 rewrite OFF라 통과 → 정규식 강제 strip.
function stripSipseongScoreLeakage(text: string): string {
  let out = text;
  // "비겁 5.6개로 강하게" / "식상이 1.2개로 약하게" / "비겁(比劫) 기운이 5.6개로"
  out = out.replace(
    /((?:비겁|비견|겁재|식상|식신|상관|재성|정재|편재|관성|정관|편관|인성|정인|편인)(?:\([^)]*\))?\s*(?:의|이|가)?\s*(?:기운[이가]?\s*)?)\d+(?:\.\d+)?\s*개?(?:로|가|는|이)?\s*/g,
    "$1",
  );
  // "화(火) 오행이 0.147로 약하게" / "수 오행 0.5"
  out = out.replace(
    /((?:목|화|토|금|수)(?:\([木火土金水]\))?\s*오행이?\s*)\d+(?:\.\d+)?\s*(?:로|가|이|개)?\s*/g,
    "$1",
  );
  // Fix D2: 부사 끼어있는 변형 ("(십성) 또한 2.2로", "수 기운이 2.8로")
  for (const [pattern, replacement] of SOFT_REPLACEMENTS_SCORE_VARIANTS) {
    out = out.replace(pattern, replacement);
  }
  // 공백 정리
  out = out.replace(/[ \t]+([,.!?])/g, "$1");
  out = out.replace(/[ \t]{2,}/g, " ");
  return out;
}

// ⭐ G1 (2026-05-14) — 자녀 이름 호칭 변형(양→상) 복원
// 발견: 부모와자녀3.txt — "이금희양"이 ch3·ch4 15곳에서 "이금희상"으로 출력됨.
// LLM이 hongsil 캐릭터 호칭 패턴("○○상")을 학습해서 자녀 이름 honorific 자리에 박음.
// stripUserNameSangSuffix는 ${풀이름}상 패턴이라 못 잡음 (이름이 "이금희양"인데 출력은 "이금희상").
// 별도 가드: childNameStem("이금희")+상 → childNameStem+honorific("이금희양") 복원.
function fixChildHonorificCorruption(text: string, stem?: string, honorific?: string): string {
  if (!stem || !honorific) return text;
  // 정규식 특수문자 escape (이름에 특수문자 있는 케이스 안전)
  const escaped = stem.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // "이금희상" → "이금희양" (lookahead로 한글 단어 안에서 잘리지 않게)
  const re = new RegExp(`${escaped}상(?![가-힣])`, "g");
  return text.replace(re, `${stem}${honorific}`);
}

// ⭐ G12 v2 (2026-05-14) — 풀 phrase + 한자 잘못 합성 strip
// 발견 사례 (555 이미지): "사주의 결(균화)한 구조" — 풀 phrase("사주의 결") 뒤에 한자 괄호("(균화)") 직접 결합 어색.
// 풀 phrase 뒤 즉시 한자 괄호가 오면 괄호 제거. (정상 한자 토큰은 풀 phrase 없이 단독)
function stripPhraseHanjaMisbinding(text: string): string {
  const PHRASES = [
    "사주의 결", "그 균형", "타고난 결", "본인 결", "그 기운",
    "관계의 자리", "마음 안쪽의 자리", "내면의 자리", "중심 기운",
    "그 결의 흐름", "시기 흐름", "운의 흐름", "그 시기",
    "타고난 신살", "그 신살의 결", "앞서 본 신살",
    "앞서 본 결", "그 흐름",
    "받쳐주는 결", "나를 살리는 결", "주의할 결",
  ];
  let out = text;
  for (const p of PHRASES) {
    const esc = p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // phrase + 공백? + (한자/한글 1~12자) 괄호 → phrase (괄호 제거)
    out = out.replace(new RegExp(`${esc}\\s*\\([^)]{1,12}\\)`, "g"), p);
  }
  return out;
}

// ⭐ G18 (2026-05-14) — 부모가 자녀 직접 부르는 인용 호칭 분기
// 발견 사례 (333 이미지): 본문 인용에 "동희양/동희군" → 어색. 정답은 "동희야".
// 패턴: 따옴표 안 인용에 ${cnh} 등장 시 → ${childName}야로 자동 변환.
// narrator 시점 cnh 사용은 그대로 (어색하지 않음).
function fixParentDirectAddress(text: string, childName?: string, cnh?: string): string {
  if (!childName || !cnh || childName === cnh) return text;
  const escapedCnh = cnh.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // 따옴표 안 첫 cnh 등장 → childName + 야
  // 본문에 "...어머님께서는 '동희양' 라고..." / `"동희양, ~"` 등 인용 안 호명 케이스만 swap.
  let out = text;
  out = out.replace(new RegExp(`(["'“‘])([^"'“”‘’]{0,200}?)${escapedCnh}(?=[은는이가을를도아야!?,.\\s])`, "g"), `$1$2${childName}야`);
  return out;
}

// ⭐ G17 (2026-05-14) — 차트 dominant ↔ 본문 키워드 결정론 치환
// 발견 사례: 333 이미지 — 차트=리더형이지만 본문 "전문가의 결" / 5살 preset 차트=전문가형인데 본문에 "리더형/여러 사람 이끄는" 3건
// 원인: prompt 강제 룰 박았는데도 LLM이 무시. 5종 dominant 모두 충돌 발생.
// fix: 본문의 dominant 반대 키워드를 dominant 키워드 또는 양면 표현으로 자동 치환.
// 양면(균형형·둘 다·중간 속도) 케이스는 skip — LLM에 양면 묘사 위임.
interface ChartFactsForGuard {
  leaderDom?: string; aloneDom?: string; depthDom?: string;
  writeDom?: string; slowDom?: string;
  shineGroup?: string; // ⭐ G7 — ShineAgeTimeline 최고 시기 (10대/20대/30대/40대 이후)
}

// ⭐ G7 v2 (2026-05-14) — ShineAge 시기 결정론 치환
// 발견 사례: preset1·3·4에서 차트 shineGroup과 다른 시기를 "가장 빛난다"고 단정.
// prompt 강제 룰 박았지만 LLM이 일관되게 무시 (자녀 어린 나이엔 가까운 시기 강조 경향).
// fix: 본문의 "${다른시기}에 가장 빛날/활짝" 패턴을 차트 shineGroup으로 치환.
function fixShineAgeMismatch(text: string, shineGroup?: string): string {
  if (!shineGroup || shineGroup === "—") return text;
  const ALL = ["10대", "20대", "30대", "40대 이후"];
  if (!ALL.includes(shineGroup)) return text;
  let out = text;
  const others = ALL.filter((g) => g !== shineGroup && g !== "40대 이후");
  for (const g of others) {
    const esc = g.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // "${g}(에|무렵|시기에) ... (가장 빛/환하/활짝/크게 펼)" → g를 shineGroup으로 swap
    const re = new RegExp(`${esc}((?:에|에는|에서|부터|무렵|시기에|시기엔)?\\s*[가-힣\\s,]{0,15}(?:가장\\s*(?:환하|빛|크게)|결이?\\s*활짝|크게\\s*펼쳐))`, "g");
    out = out.replace(re, `${shineGroup}$1`);
  }
  return out;
}
function fixChartFactsMismatch(text: string, facts?: ChartFactsForGuard): string {
  if (!facts) return text;
  let out = text;
  // Rule format: [regex, 이 표현의 방향, dominant가 반대일 때 치환할 표현]
  // dominant === 표현 방향: no-op (정합)
  // dominant !== 표현 방향: 본문 표현을 dominant 쪽으로 swap
  // dominant가 양면(균형형/둘 다/중간 속도): skip
  type Rule = { dom?: string; valid: [string, string]; swaps: Array<[RegExp, "first" | "second", string]> };
  const rules: Rule[] = [
    { dom: facts.leaderDom, valid: ["리더형", "전문가형"], swaps: [
      [/리더형/g,                       "first",  "전문가형"],
      [/여러\s*사람을\s*이끄(?:는|며|고|어)/g, "first",  "한 분야에 깊이 파고드"],
      [/사람을\s*동원(?:하(?:는|여|며|고)|해)?/g, "first", "한 분야를 깊이 파고드"],
      [/큰\s*그림을\s*그리(?:는|며|고)/g, "first",  "깊이 있는 전문성을 만들"],
      [/리더십을?\s*발휘/g,             "first",  "전문성을 발휘"],
      [/전문가형/g,                     "second", "리더형"],
      [/전문가의\s*결/g,                "second", "리더의 결"],
      [/한\s*분야에\s*깊이\s*파고드(?:는|며|고)/g, "second", "여러 사람을 이끄"],
      [/전문성을\s*발휘/g,              "second", "리더십을 발휘"],
    ]},
    { dom: facts.aloneDom, valid: ["혼자형", "같이형"], swaps: [
      [/혼자만의\s*시간/g,              "first",  "친구와 함께하는 시간"],
      [/혼자서\s*깊이\s*파고드는/g,      "first",  "친구와 함께 배우는"],
      [/같이형/g,                       "second", "혼자형"],
      [/함께\s*어울리며\s*배우/g,        "second", "혼자 차분히 배우"],
    ]},
    { dom: facts.depthDom, valid: ["깊이 사색형", "즉각 행동형"], swaps: [
      [/깊이\s*사색하며/g,              "first",  "즉각적으로 행동하며"],
      [/내면에서\s*곱씹/g,              "first",  "외부와 부딪치며 배우"],
      [/즉각적으로\s*행동/g,             "second", "깊이 사색"],
      [/몸으로\s*직접\s*부딪/g,         "second", "마음으로 깊이 사색하"],
    ]},
    { dom: facts.writeDom, valid: ["글형", "말형"], swaps: [
      [/글로\s*정리하는\s*결/g,         "first",  "말로 표현하는 결"],
      [/글로\s*정리(?!된|되어)/g,       "first",  "말로 표현"],
      [/글로\s*옮기/g,                  "first",  "말로 표현하"],
      [/글로\s*쏟아내/g,                "first",  "말로 쏟아내"],
      [/글로\s*담아/g,                  "first",  "말로 풀어"],
      [/말로\s*표현하는\s*결/g,         "second", "글로 정리하는 결"],
      [/말로\s*풀어내는\s*결/g,         "second", "글로 풀어내는 결"],
      [/말로\s*표현/g,                  "second", "글로 표현"],
      [/말로\s*쏟아내/g,                "second", "글로 쏟아내"],
    ]},
    { dom: facts.slowDom, valid: ["천천히형", "빠르게형"], swaps: [
      [/마음\s*천천히\s*여는/g,          "first",  "빨리 마음 여는"],
      [/시간이\s*걸리는\s*결/g,         "first",  "바로 친해지는 결"],
      [/빨리\s*마음\s*여는/g,           "second", "천천히 마음 여는"],
      [/바로\s*친해지는/g,              "second", "천천히 친해지는"],
    ]},
  ];
  for (const r of rules) {
    if (!r.dom) continue;
    if (!r.valid.includes(r.dom)) continue; // 양면 skip
    for (const [re, direction, swap] of r.swaps) {
      const expressionMatchesDom = (direction === "first" && r.dom === r.valid[0]) || (direction === "second" && r.dom === r.valid[1]);
      if (expressionMatchesDom) continue; // 표현 방향이 dominant와 일치 → no-op
      // dominant와 충돌 → swap
      out = out.replace(re, swap);
    }
  }
  return out;
}

// ⭐ F3 (2026-05-14) — 영유아·유아 케이스에서 학령기·성인 어휘 strip
// 발견 사례: 부모와자녀2.txt L99 "콘텐츠 제작" / L133 "연구자, 전문 기술자" / L135 "5명 이내 팀"
// 0~4살 자녀에 부적합. interpretation-plan의 prompt 룰을 LLM이 일부만 따름 → 결정론 후처리 strip.
function stripAgeInappropriateWords(text: string, ageStage?: string): string {
  if (!ageStage) return text;
  const isVeryYoung = ageStage === "infant" || ageStage === "toddler" || ageStage === "preschool";
  if (!isVeryYoung) return text;

  let out = text;
  // 직업명·성인 진로 어휘 → 미래형 또는 strip
  // "콘텐츠 제작자, 기획자" → "자기만의 결로 표현하는 어른"
  // ⭐ G5 (2026-05-14) — 같은 문장 내 리스트("X, Y, 혹은 Z")가 모두 동일 phrase로 치환되면 중복.
  // 분산 풀 회전: 3가지 표현으로 순환 (등장순)
  const occRotate = ["자기 결로 빛나는 어른", "한 분야의 깊이를 만드는 어른", "자기 길을 단단히 다지는 어른"];
  let occIdx = 0;
  out = out.replace(/(연구자|전문\s*기술자|기획자|콘텐츠\s*제작자|핵심\s*콘텐츠\s*제작자|교육자|교수|디자이너|개발자|작가|아티스트|핵심\s*기술\s*개발팀의\s*리더)/g, () => occRotate[occIdx++ % occRotate.length]);
  // "5명 이내의 작고 긴밀한 관계" → "훗날 작은 팀에서"
  out = out.replace(/5명\s*이내의?\s*작고?\s*긴밀한\s*관계\s*속에서/g, "훗날 작은 자리에서");
  out = out.replace(/5명\s*이내의?\s*작고?\s*신뢰가?\s*깊은\s*팀에서?/g, "훗날 작은 자리에서");
  // 영유아엔 "조별 활동·발표·진로·전공" 같은 학령기 어휘
  out = out.replace(/조별\s*활동/g, "함께하는 놀이");
  // ⭐ G13-ext (2026-05-14) — 뒤 lookahead 제거 ("발표를/발표보다/발표가" 모두 매치)
  out = out.replace(/(?<![가-힣])발표/g, "표현");
  // 학교 운동장 직접 언급 (영유아엔 어울리지 않음)
  out = out.replace(/학교\s*운동장에서/g, "자라면서 또래와 어울리는 자리에서");
  return out;
}

// ⭐ F1 (2026-05-14) — ### sub 헤더 줄바꿈 강제
// 발견 사례: 부모와자녀2.txt L159~165 — ### sub 헤더가 본문과 같은 줄에 박혀서
// 클라이언트 매핑(`startsWith("### ")` 또는 `^###\s+/m`)이 실패하고 본문 통째 흡수.
// 가드: 줄 중간에 ### 박혀있으면 그 앞에 강제 \n\n 삽입.
function forceSubHeaderNewlines(text: string): string {
  // "...본문. ### 헤더" → "...본문.\n\n### 헤더"
  // 줄 시작 위치(\n 직후 또는 문자열 시작) 외에 ### 박힌 케이스만 fix
  return text.replace(/([^\n])(\s*)(###\s+)/g, "$1\n\n$3");
}

// ⭐ Step E (2026-05-14) — 미완 인용구 strip
// 발견 사례: `" 하고 먼저 그 마음을 들어주려는 대화법"` (시작 따옴표 짝 안 맞음)
// LLM 출력이 LLM truncation 또는 가드 strip 후 잔존된 미완 인용구.
// 보수적 적용 — 줄 시작 따옴표 직후 인용 접속어("하고"·"라고"·"이라며") 패턴만 strip.
function stripBrokenQuotes(text: string): string {
  let out = text;
  // 줄 시작 `" 하고/라고/이라고/이라며/하며` 패턴 — 시작 따옴표만 빠진 잔존
  out = out.replace(/^[ \t]*"[ \t]+(하고|라고|이라고|이라며|하며|이라며)/gm, "$1");
  // ⭐ G2 (2026-05-14) — 줄 중간·문장 시작 위치에도 같은 패턴 적용 (L79 부모와자녀3 케이스)
  // 예: "이때 마음이 부담스러워질 수 있습니다.\n\n\" 하고 먼저 이유를 들어주는..."
  // 줄 시작 + 문장 시작 (이전 줄 끝 + 새 줄) 모두 잡기
  out = out.replace(/(^|\n|\.\s+)["“”]\s+(하고|라고|이라고|이라며|하며)\s+/g, "$1$2 ");
  // 줄 시작에 따옴표 + 한글 + 본문 패턴 (인용 접속어 없이 단독)
  out = out.replace(/(^|\n)\s*["“”][ \t]+([가-힣]{1,30})/g, "$1$2");
  // 줄 끝에 단독 따옴표만 잔존 (앞에 공백·문장부호 없이 끝 따옴표만)
  out = out.replace(/[ \t]+"$/gm, "");
  // 본문 따옴표 갯수가 홀수면 마지막 외톨이 따옴표 strip (매우 보수적 — 짝 검사)
  const quoteCount = (out.match(/"/g) ?? []).length;
  if (quoteCount > 0 && quoteCount % 2 === 1) {
    // 마지막 따옴표 위치 + 그 이후 한글 거의 없으면 strip
    const lastQuoteIdx = out.lastIndexOf('"');
    const tail = out.slice(lastQuoteIdx + 1).trim();
    if (tail.length < 3) {
      out = out.slice(0, lastQuoteIdx) + out.slice(lastQuoteIdx + 1);
    }
  }
  return out;
}

// ⭐ Step D (2026-05-14) — 풀 대명사 치환 후 중복 단어 충돌 strip
// 발견 사례: "따뜻한 그 기운 기운의 지혜" (suppressRepeatedHongsilEvidence가 "수의 기운" → "그 기운"으로 치환했는데,
// 이미 본문에 "기운" 단어가 따라오면 "그 기운 기운" 중복 발생)
// 또: "이 흐름이 발달한" (지시어 컨텍스트 부족) — 풀 대명사 치환의 부작용.
// 단순한 같은 명사 연속 중복(2회+)을 1회로 압축.
function stripPronounDuplication(text: string): string {
  let out = text;
  // 풀 대명사 다음에 같은 명사 — "그 기운 기운" → "그 기운"
  out = out.replace(/(그|이|그러한|이러한|저)\s+(기운|결|흐름|리듬|호흡|구조|페이스|에너지)\s+\2(?![가-힣])/g, "$1 $2");
  // "그 흐름 흐름" 같은 일반 한글 명사 2회 연속 (3~4글자 명사 한정) — 보수적 적용
  out = out.replace(/(그|이)\s+([가-힣]{2,4})\s+\2(?![가-힣])/g, "$1 $2");
  // 일반 명사 즉시 2회 연속 ("기운 기운" 단독) — 첫 번째만 남김
  out = out.replace(/(?<![가-힣])(기운|결|흐름|리듬)\s+\1(?![가-힣])/g, "$1");
  return out;
}

// ⭐ Step C (2026-05-14) — 차트 수치 노출 strip (부모자녀 본문 발견)
// 발견 사례: "사고 유형 도미넌트 깊이 사색형 70%", "아침 시간대(45%)"
// charts helper 결과를 prompt context로 넣었더니 LLM이 본문에 % 그대로 박음.
// 일반 독자에겐 어색·UX 손상. strip.
// Parent-child outputs can overuse vague bridge phrases even after prompt bans.
// Keep this deterministic and mild: remove template smell without changing chart meaning.
function softenParentChildRepetitivePhrases(text: string): string {
  let out = text;
  out = out.replace(/그 결 기운/g, "해당 인자");
  out = out.replace(/그 흐름 기운/g, "해당 흐름");
  out = out.replace(/앞서 본 결/g, "이 결");
  out = out.replace(/앞서 본 신살/g, "이 신살");
  out = out.replace(/본인 결이 옅게 자리하고 있어/g, "자기 기준을 세우는 데 시간이 들어");
  out = out.replace(/타고난 결이 옅게 자리하고 있어/g, "혼자 밀어붙이는 힘이 천천히 켜져");
  out = out.replace(/옅게 자리해 있어/g, "천천히 작동해");
  out = out.replace(/옅게 자리하고 있어/g, "천천히 작동해");
  out = out.replace(/옅게 자리하고 있으며/g, "천천히 작동하며");
  out = out.replace(/옅게 자리하여/g, "천천히 작동해");
  out = out.replace(/옅게 자리한 편이라/g, "천천히 작동하는 편이라");
  out = out.replace(/옅게 자리한/g, "천천히 작동하는");
  return out;
}

function stripChartScoreLeakage(text: string): string {
  let out = text;
  // "도미넌트 ... 70%" / "사고 유형 도미넌트 깊이 사색형 70%"
  out = out.replace(/(도미넌트[^.\n!?]{0,30})\s*\d+\s*%/g, "$1");
  // "아침 시간대(45%)" / "오후 시간대 (30%)"
  out = out.replace(/(아침|오전|점심|오후|저녁|밤|새벽)\s*시간대\s*[\(（]?\s*\d+\s*%\s*[\)）]?/g, "$1 시간대");
  // 그 외 "○○ 유형 75%" / "○○ 결 60%" 패턴 (한글 + 숫자%만)
  out = out.replace(/([가-힣]{2,12}\s*(?:유형|타입|결|기운|성향)\s*)\(?\d+\s*%\)?/g, "$1");
  // 단독 "(N%)" 잔존 — 보수적으로 제거 (앞에 공백 있으면)
  out = out.replace(/\s*\(\s*\d+\s*%\s*\)/g, "");
  // ⭐ G10 (2026-05-14) — "결이 N%로" 같이 조사 사이에 끼인 수치 (앞 패턴이 못 잡음)
  // 그리고 숫자 strip 후 잔존한 orphan % (앞에 숫자 없는 %)
  out = out.replace(/(\s*)\d+\s*%(로|에서|만큼|에|가|이|는|은)?/g, "$1");
  out = out.replace(/(?<!\d)%(로|에서|만큼|에|가|이|는|은)?\s*/g, "");
  // 공백·콤마 정리
  out = out.replace(/[ \t]+([,.!?])/g, "$1");
  out = out.replace(/[ \t]{2,}/g, " ");
  return out;
}

// ── ch6 캐릭터 한자 표기 정상화 ───────────────────────────
// 완성본11 L174에서 발견: "영자(英子) 같고", "영수(永洙) 같은 인연"
// → "영자상", "영수상" 정답. 룰북상 캐릭터는 항상 "○○상" 형태.
// rewrite 비활성인 ch6에선 결정론 가드로만 잡을 수 있음.
const CHARACTER_NAMES = ["옥순", "현숙", "정숙", "순자", "영숙", "영자", "영철", "영호", "광수", "영수", "상철", "정수"];
function normalizeCharacterName(text: string): string {
  let out = text;
  // 1. "캐릭터명(한자)" 형태 → 한자 괄호 제거 ("영자(英子)" → "영자")
  for (const name of CHARACTER_NAMES) {
    const reHanja = new RegExp(`${name}\\([^)]{1,8}\\)`, "g");
    out = out.replace(reHanja, name);
  }
  // 2. "캐릭터명 같은 인연" / "캐릭터명 같고" 인격화 → "캐릭터명상의 결" 패턴으로
  //    "영자 같고" → "영자상 같고" 식으로 "상" 보강
  for (const name of CHARACTER_NAMES) {
    const reBare = new RegExp(`(?<![상가-힣])${name}(?![상가-힣])`, "g");
    out = out.replace(reBare, `${name}상`);
  }
  // 3. "○○상상" 중복 발생 시 1회로
  out = out.replace(/(영자상|영수상|상철상|정수상|영철상|영호상|광수상|옥순상|현숙상|정숙상|순자상|영숙상)상/g, "$1");
  return out;
}

// ── inyeon: 사용자 이름 + "상" 자동 합성 제거 ─────────────
// 완성본2 L196·L201에서 발견: "금명희상과 고길동상, 두 분은..."
// LLM이 캐릭터 패턴("○○상")을 사용자 이름에 잘못 적용. 정상은 "○○님".
// CHARACTER_NAMES(12 캐릭터)에 안 들어가는 이름만 처리.
function stripUserNameSangSuffix(text: string, userNames: string[]): string {
  let out = text;
  for (const name of userNames) {
    if (!name || name.length < 2) continue;
    if (CHARACTER_NAMES.includes(name)) continue;
    const re = new RegExp(`${name}상(?![가-힣])`, "g");
    out = out.replace(re, `${name}님`);
  }
  return out;
}

// ── ch6 자연 비유 strip ───────────────────────────────────
// 완성본11 L174에서 발견: "마치 봄날의 따스한 햇살처럼", "든든한 나무처럼" 2개 등장.
// 양반사주 톤은 보통 비유 1개까지. ch6 본문에서 2개 이상 등장 시 첫 1개만 보존.
function strip2ndNaturalSimile(text: string): string {
  // 자연 비유 패턴: 마치 ○○○○ (나무|물|불|꽃|돌|구름|강|바다|산|새|이슬|호수|연못|바람|햇살|달빛|별빛|꽃잎) (처럼|같이|같은|하듯|듯|같고|같아요)
  const pattern = /(?:마치\s*)?[가-힣\s]{1,15}(나무|물|불|꽃|돌|구름|강|바다|산|새|이슬|호수|연못|바람|햇살|달빛|별빛|꽃잎)(?:\s*)?(처럼|같이|같은|하듯|듯|같고|같아요|같은|같습니다)/g;
  const matches = [...text.matchAll(pattern)];
  if (matches.length < 2) return text;
  // 두 번째 이상 등장 비유는 strip (단 문장 흐름 안 깨지게 비유구만 제거)
  let out = text;
  for (let i = 1; i < matches.length; i++) {
    out = out.replace(matches[i][0], "");
  }
  // 공백·콤마 정리
  out = out.replace(/,\s*,/g, ",");
  out = out.replace(/\s{2,}/g, " ");
  return out;
}

// ── Fix #3: 5장 한자 strip 가드 ───────────────────────────
// 5장 prompt가 명시적으로 "전문용어 금지"라 적어둔 영역인데
// LLM이 한자 병기·괄호 설명을 그대로 출력하는 케이스를 잡는다.
// 한글 십성 용어 자체는 살린다 — cross-chapter 가드가 다음 챕터에서 잡으므로.
function stripChapter5Hanja(text: string): string {
  let out = text;
  // 1. 한자 병기 괄호 strip: "갑목(甲木)" → "갑목"
  out = out.replace(/\(([甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥木火土金水食傷神官財印比劫肩正偏殺桃花紅艶天乙貴人日柱干支大運歲運身弱強喜忌用中和太鬼門關陽刃將星金輿太極德福懸針驛馬華蓋羊]+)\)/g, "");
  // 2. 십성·원국 용어 + 한글 괄호 설명 strip: "정관(규율과 책임)" → "정관"
  out = out.replace(/(비견|비겁|겁재|식상|식신|상관|정재|편재|재성|정관|편관|관성|정인|편인|인성|일간|일주|일지|월지|배우자궁|신약|신강|용신|희신|기신|대운|세운)\(([^)]{2,40})\)/g, "$1");
  // 3. 공백 정리
  out = out.replace(/[ \t]+([,.!?])/g, "$1");
  return out;
}

// ── Fix #4: 환각 방지 가드 ────────────────────────────────
// 단독 풀이(본인 사주만 입력)인데 LLM이 "상대의 비겁 기운이 강하여…"
// 식으로 상대 사주를 단정하는 환각을 잡는다.
// 통째 strip하면 문법이 깨지므로 십성 토큰만 부드럽게 치환.
function stripPartnerHallucination(text: string): string {
  return text
    // "상대의 비겁(比劫) 기운" / "상대가 정관 기운" 류
    .replace(/상대[의가]\s*(비겁|비견|겁재|식상|식신|상관|재성|정재|편재|관성|정관|편관|인성|정인|편인)\([^)]+\)\s*기운/g, "상대의 강한 자기 결")
    .replace(/상대[의가]\s*(비겁|비견|겁재|식상|식신|상관|재성|정재|편재|관성|정관|편관|인성|정인|편인)\s*기운/g, "상대의 결")
    // "상대의 일간/일지/용신/신약/신강" 류
    .replace(/상대[의가]\s*(일간|일주|일지|월지|용신|희신|기신|신약|신강)\([^)]+\)/g, "상대의 결")
    .replace(/상대[의가]\s*(일간|일주|일지|월지|용신|희신|기신|신약|신강)\s*(기운|구조|흐름)/g, "상대의 결");
}

function applyHongsilLifestyleRepair(text: string, chapter: number | string): string {
  const repair = (value: string): string => {
    let result = value;
    for (const [pattern, replacement] of HONGSIL_LIFESTYLE_REPLACEMENTS) {
      result = result.replace(pattern, replacement);
    }
    return result;
  };

  if (String(chapter) !== "1") return repair(text);

  const secondHeading = text.search(/\n###\s+첫인상에서 생기는 오해/);
  if (secondHeading < 0) return text;
  return text.slice(0, secondHeading) + repair(text.slice(secondHeading));
}

// ─── 한자 토큰 + 한글 사주 용어 — 본문 전반에서 카운트 추적 ───
// LLM이 친절 설명까지 같이 박는 패턴(`재성(財星, 내가 극하는 기운)`)도 매치.
// 한자만 패턴(`재성(財星)`)도 그대로 매치.
// ⭐ G5 (2026-05-14) — 한자 닫는 ) 뒤 한글 오행 suffix(목/화/토/금/수) 흡수
// 발견 사례: 부모와자녀4.txt L13 "을(乙)목" → 토큰만 매치돼 "타고난 결"로 치환 → "타고난 결목" 잔존
// 닫는 ) 뒤 오행 한글 한 글자는 함께 매치해 일간 atomic으로 처리.
// ⭐ G8 (2026-05-14) — 한자 토큰 뒤 동사 어미(하/해/한/함/된) 결합형 차단
// 발견 사례: "신약(身弱)하다는" → "그 결의 흐름하다는" 문법 붕괴
// 한자 토큰이 형용사 어간으로 쓰일 때(신약하다·신강하여·태강한) phrase 치환하면 어미가 떠버림.
// negative lookahead로 동사 결합형은 토큰 매치 자체 차단 → 원형 보존.
const HANJA_TOKEN_REGEX = /[가-힣A-Za-z]+?\([甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥木火土金水食傷神官財印比劫肩正偏殺桃花紅艶天乙貴人日柱干支大運歲運身弱強喜忌用中和太鬼門關陽刃將星金輿太極德福懸針驛馬華蓋羊]+(?:[,，:：][^)]+)?\)(?:[목화토금수])?(?!하|해|한|함|되|된)/g;

// 한글 \b가 한국어에서 작동 안 함 → lookbehind/lookaround로 한글 단어 경계 구현.
const KOREAN_TERM_REGEX = /(?<![가-힣])(일간|일주|일지|월지|배우자궁|식상|식신|상관|재성|정재|편재|관성|정관|편관|비겁|비견|겁재|인성|정인|편인|신약|신강|용신|희신|기신|대운|세운|도화살|홍염살|천을귀인|역마살|양인살|장성살|귀문관살|현침살|금여|태극귀인)(?![가-힣])/g;

// 정규화: "재성(財星, 내가 극하는 기운)" → "재성(財星)" 으로 통일.
// LLM이 친절 설명을 매번 다르게 박아도 같은 토큰으로 카운트.
function normalizeHanjaToken(raw: string): string {
  const m = raw.match(/^([가-힣A-Za-z]+?)\(([甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥木火土金水食傷神官財印比劫肩正偏殺桃花紅艶天乙貴人日柱干支大運歲運身弱強喜忌用中和太鬼門關陽刃將星金輿太極德福懸針驛馬華蓋羊]+)/);
  return m ? `${m[1]}(${m[2]})` : raw;
}

// ⭐ G5 (2026-05-14) — 풀 대명사 치환 후 조사 자동 보정
// 발견 사례: 부모와자녀4.txt L93 "내면의 자리이 을목" / L101 "관계의 자리은 태강"
// 받침 없는 풀 phrase("자리"·"시기"·"흐름"X→ㅁ 받침) 뒤에 LLM이 원래 받침어 기준 조사를 그대로 둠.
// 풀 phrase 사전화 → 받침 여부로 은/는·이/가·을/를·과/와 swap.
const POOL_PHRASES = [
  "타고난 결", "본인 결", "그 기운",
  "관계의 자리", "마음 안쪽의 자리", "내면의 자리",
  "중심 기운",
  "그 결의 흐름", "사주의 결", "그 균형",
  "시기 흐름", "운의 흐름", "그 시기",
  "타고난 신살", "그 신살의 결", "앞서 본 신살",
  "앞서 본 결", "그 결", "그 흐름",
  "받쳐주는 결", "나를 살리는 결", "주의할 결",
];
function hasJongseong(ch: string): boolean {
  const code = ch.charCodeAt(0);
  if (code < 0xAC00 || code > 0xD7A3) return false;
  return (code - 0xAC00) % 28 !== 0;
}
function fixJosaAfterPronouns(text: string): string {
  let out = text;
  for (const word of POOL_PHRASES) {
    const lastCh = word[word.length - 1];
    const batchim = hasJongseong(lastCh);
    const esc = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (batchim) {
      out = out.replace(new RegExp(`${esc}는(?![가-힣])`, "g"), `${word}은`);
      out = out.replace(new RegExp(`${esc}가(?![가-힣])`, "g"), `${word}이`);
      out = out.replace(new RegExp(`${esc}를(?![가-힣])`, "g"), `${word}을`);
      out = out.replace(new RegExp(`${esc}와(?![가-힣])`, "g"), `${word}과`);
    } else {
      out = out.replace(new RegExp(`${esc}은(?![가-힣])`, "g"), `${word}는`);
      out = out.replace(new RegExp(`${esc}이(?![가-힣])`, "g"), `${word}가`);
      out = out.replace(new RegExp(`${esc}을(?![가-힣])`, "g"), `${word}를`);
      out = out.replace(new RegExp(`${esc}과(?![가-힣])`, "g"), `${word}와`);
    }
  }
  // ⭐ G5-ext (2026-05-14) — 받침 없는 phrase + "이나/이라도/이며" 이중 "이"
  // 발견 사례: "함께하는 놀이이나 팀 프로젝트" (F3 strip 잔존)
  out = out.replace(/이이(나|라도|라서|며|면서)(?![가-힣])/g, "이$1");
  return out;
}

// ⭐ G14 (2026-05-14) — 토큰별 해시 슬롯 매핑
// 발견 사례: 999·000 모순 — "그 결 기운이 옅게" + "그 결 또한 없기에" / "타고난 결의 기운이 강하게" + "타고난 결의 기운은 가장 옅게"
// 원인: 다른 한자 토큰(목/화/금)이 모두 같은 풀의 [0] 슬롯에 매핑 → 같은 phrase가 정반대 인자 가리킴
// fix: 토큰 키 해시로 풀 회전 시작점 고정 → 같은 토큰은 항상 같은 슬롯, 다른 토큰은 분산
function simpleHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function rotatedPool(base: string[], key: string): string[] {
  const start = simpleHash(key) % base.length;
  return base.map((_, i) => base[(start + i) % base.length]);
}

// 대명사 풀 — 풀이 전체에서 같은 토큰이 3회째 등장할 때 사용.
// 토큰 해시로 시작점 고정 → 다른 토큰은 다른 슬롯에서 시작 (모순 차단).
function poolForHanja(key: string): string[] {
  if (/正官|偏官|官星|正財|偏財|財星|正印|偏印|印星|比肩|比劫|劫財|食神|傷官|食傷/.test(key)) {
    return rotatedPool(["그 결", "앞서 본 결", "그 흐름"], key);
  }
  if (/天乙貴人|桃花|紅艶|陽刃殺|將星|貴人|金輿|懸針殺|鬼門關殺|太極貴人|驛馬/.test(key)) {
    return rotatedPool(["타고난 신살", "그 신살의 결", "앞서 본 신살"], key);
  }
  if (/身弱|身強|身强|太弱|太强|太強|喜神|忌神|用神/.test(key)) {
    return rotatedPool(["그 결의 흐름", "사주의 결", "그 균형"], key);
  }
  if (/大運|歲運/.test(key) || /[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]運/.test(key)) {
    return rotatedPool(["시기 흐름", "운의 흐름", "그 시기"], key);
  }
  if (/日干|日支|月支|年支|時支|月柱|日柱|配偶者宮/.test(key)) {
    return rotatedPool(["관계의 자리", "마음 안쪽의 자리", "내면의 자리"], key);
  }
  // 오행 글자 + 일간 글자 (甲木, 乙木, ..., 壬水, 癸水) — 본인 결 풀
  return rotatedPool(["타고난 결", "본인 결", "그 기운"], key);
}

function poolForKorean(term: string): string[] {
  // ⭐ G14 — 한글 사주 용어도 토큰 해시 분산
  if (term === "일간" || term === "일주") return rotatedPool(["중심 기운", "본인 결", "타고난 결"], term);
  if (term === "일지" || term === "월지" || term === "배우자궁") return rotatedPool(["관계의 자리", "마음 안쪽의 자리", "내면의 자리"], term);
  if (term === "대운" || term === "세운") return rotatedPool(["시기 흐름", "운의 흐름", "그 시기"], term);
  if (term === "신약" || term === "신강") return rotatedPool(["그 결의 흐름", "사주의 결", "그 균형"], term);
  if (term === "용신" || term === "희신" || term === "기신") return rotatedPool(["나를 살리는 결", "받쳐주는 결", "주의할 결"], term);
  if (["도화살", "홍염살", "천을귀인", "역마살", "양인살", "장성살", "귀문관살", "현침살", "금여", "태극귀인"].includes(term)) {
    return rotatedPool(["타고난 신살", "그 신살의 결", "앞서 본 신살"], term);
  }
  return rotatedPool(["그 결", "앞서 본 결", "그 흐름"], term);
}

function suppressRepeatedHongsilEvidence(
  text: string,
  externalCounts?: Map<string, number>,
): string {
  const counts = externalCounts ?? new Map<string, number>();
  const headings = [...text.matchAll(/^###\s+(.+)$/gm)];
  if (headings.length === 0) return text;

  // ⚠️ 첫 ### 헤더 이전 본문(preamble) 보존
  // hongsil/inyeon은 클라이언트가 챕터 인덱스로 매핑해서 preamble 잘려도 영향 0이었지만,
  // parent-child는 클라이언트가 ## N장 헤더로 챕터 매핑 강제 → preamble 잘리면 fallback
  const firstHeadIdx = headings[0].index ?? 0;
  const preamble = firstHeadIdx > 0 ? text.slice(0, firstHeadIdx) : "";

  const segments = headings.map((match, index) => {
    const start = match.index ?? 0;
    const end = index + 1 < headings.length ? headings[index + 1].index ?? text.length : text.length;
    return { title: match[1].trim(), start, end, body: text.slice(start, end) };
  });

  return preamble + segments.map((segment) => {
    // "내 매력은?" sub은 ch1 신뢰 페이지 — 한자 자주 등장해도 본문 그대로 두고,
    // 등장한 토큰은 카운터에 +1만 기록 (sub 내 다중 등장은 1회로 압축).
    // 이래야 다른 sub에서 같은 토큰이 등장했을 때 풀이 전체 2회 허용 룰이 작동.
    if (segment.title === "내 매력은?") {
      const localSeen = new Set<string>();
      for (const match of segment.body.matchAll(HANJA_TOKEN_REGEX)) {
        const key = normalizeHanjaToken(match[0]);
        if (!localSeen.has(key)) {
          localSeen.add(key);
          counts.set(key, (counts.get(key) ?? 0) + 1);
        }
      }
      for (const match of segment.body.matchAll(KOREAN_TERM_REGEX)) {
        const key = match[0];
        if (!localSeen.has(key)) {
          localSeen.add(key);
          counts.set(key, (counts.get(key) ?? 0) + 1);
        }
      }
      return segment.body;
    }

    // 그 외 sub — 등장마다 카운트, 3회째부터 풀 대명사로 치환.
    let body = segment.body.replace(HANJA_TOKEN_REGEX, (raw) => {
      const key = normalizeHanjaToken(raw);
      const count = (counts.get(key) ?? 0) + 1;
      counts.set(key, count);
      if (count <= 2) return raw;
      const pool = poolForHanja(key);
      return pool[(count - 3) % pool.length];
    });

    body = body.replace(KOREAN_TERM_REGEX, (term) => {
      const count = (counts.get(term) ?? 0) + 1;
      counts.set(term, count);
      if (count <= 2) return term;
      const pool = poolForKorean(term);
      return pool[(count - 3) % pool.length];
    });

    return body;
  }).join("");
}

function buildGuardContext(people: GuardPersonContext[]): string {
  return people.map((person) => {
    const counts = countSipseongGroups(person.saju);
    const countLine = (Object.keys(counts) as SipseongGroup[])
      .map((key) => `${GROUP_LABEL[key]} ${counts[key]}`)
      .join(", ");
    return [
      `이름: ${person.name}`,
      `일간: ${person.saju.ilgan}`,
      `신강신약: ${person.saju.shinkang}`,
      `십성 분포: ${countLine}`,
      `용신/보조 기운: ${person.saju.supportElement}`,
    ].join("\n");
  }).join("\n\n");
}

function extractJsonObject(raw: string): GuardResult | null {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]) as Partial<GuardResult>;
    return {
      pass: Boolean(parsed.pass),
      issues: Array.isArray(parsed.issues) ? parsed.issues.map((issue) => ({
        type: String(issue?.type ?? "llm-judge"),
        sentence: String(issue?.sentence ?? ""),
        reason: String(issue?.reason ?? ""),
      })) : [],
      reason: typeof parsed.reason === "string" ? parsed.reason : undefined,
    };
  } catch {
    return null;
  }
}

async function callGeminiText(apiKey: string, prompt: string, maxOutputTokens: number): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens,
          temperature: 0,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
      signal: AbortSignal.timeout(GUARD_TIMEOUT_MS),
    },
  );
  if (!res.ok) throw new Error(`guard HTTP ${res.status}`);
  const data = await res.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  return data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
}

async function judgeOutput(input: GuardInput, deterministicIssues: GuardIssue[], repeatedEvidence: RepeatedEvidence[]): Promise<GuardResult> {
  const prompt = `
너는 사주 리포트 검수자다. 아래 출력이 제공된 사주 근거와 서비스 룰을 위반하는지 판정한다.

[서비스]
${input.service} ch${input.chapter}

[사주 근거]
${buildGuardContext(input.people)}

[검수 룰]
1. 단일 요소만으로 성격 문제, 연애 문제, 미래 사건을 단정하면 FAIL.
2. 신약 + 비겁 0만으로 "혼자 모든 것을 짊어짐", "감정을 삭임", "벽처럼 느껴짐"을 말하면 FAIL.
3. 식상 0만으로 "감정 표현을 못함", "사랑 표현을 못함"을 단정하면 FAIL.
4. 관성/재성/인성/비겁/식상 부족을 "보완해야 한다", "상대가 채워준다"는 결핍 구조로 쓰면 FAIL.
5. 사용자가 불안해질 수 있는 파국/불행/이별 단정은 FAIL.
6. 한 챕터에서 비유·은유가 3회 이상 연속되거나 핵심 풀이보다 비유가 길어지면 FAIL.
7. 같은 사주 근거를 같은 챕터에서 반복 설명하면 FAIL. 첫 설명 뒤에는 결과/장면으로 이어가야 한다.
8. 1.1, 2.2 같은 기준 없는 원점수를 본문에 노출하면 FAIL. 낮음/보통/강함 또는 퍼센트/게이지 표현으로 바꿔야 한다.
9. 사주근거명이 달라도 같은 의미 클러스터의 문장이 2개 이상 반복되면 FAIL.
10. 치환어("이 흐름", "이 결", "이 리듬", "자기 리듬을 천천히 세움" 등) 자체가 반복되어도 FAIL.
11. 문장 구조와 말맛은 보존하되, 근거 없는 부정 확장과 독자 피로 요소만 잡는다.
12. 지지 동물 상징이나 자연 상징을 일반 독자가 어색하게 받아들일 방식으로 직역하면 FAIL.
13. "닭처럼 정결하다", "용처럼 크다", "쥐처럼 빠르다", "이슬처럼 고요하다" 같은 상징 직역은 생활어로 바꿔야 한다.
14. ⭐ **의미 충돌 — 같은 phrase가 한 단락 안에서 정반대 의미로 쓰이면 FAIL.** 예: "타고난 결의 기운이 강하게 자리하고" + "타고난 결의 기운은 가장 옅게 드러납니다" — "타고난 결"이 가장 강한 오행과 가장 약한 오행 둘을 동시에 가리킴. 두 인자를 명시 분리해 다시 써야 한다 (강한 오행 한자 / 옅은 오행 한자를 직접 명시).
15. ⭐ **일간 = 기신 모순 FAIL.** "본인 결은 기신(忌神)이기도 하여" — 본인 결(일간) 자체는 기신이 될 수 없다. 일간을 극하는 오행이 기신이지 일간 자체가 아님.
16. ⭐ **풀 대명사 모호 FAIL.** "그 결 또한 없기에" / "앞서 본 결이 강하여" 같이 그 결·앞서 본 결이 무엇을 가리키는지 단락 내 명시 안 되면 FAIL. 추상 대명사 단독으로 새 인자 도입 금지.
17. ⭐ **희신 = 기신 동치 FAIL.** 한 챕터 안에서 같은 오행을 "채워줄 결(用神/喜神)" + "살펴줄 결(忌神)" 둘 다로 묘사하면 FAIL. 정반대 역할이라 같을 수 없다.

[의미 중복 클러스터 기준]
${SEMANTIC_CLUSTER_GUIDE}

[코드 1차 감지]
${deterministicIssues.length ? deterministicIssues.map((x) => `- ${x.reason}: ${x.sentence}`).join("\n") : "없음"}

[반복 사주근거 카운트]
${buildRepeatedEvidenceBlock(repeatedEvidence)}

[출력]
${input.text}

JSON만 반환:
{
  "pass": true 또는 false,
  "issues": [
    { "type": "unsupported-inference|hard-ban|tone-risk|contradiction", "sentence": "문제 문장", "reason": "이유" }
  ],
  "reason": "전체 판단"
}
`;
  const raw = await callGeminiText(input.apiKey, prompt, 2048);
  return extractJsonObject(raw) ?? {
    pass: deterministicIssues.length === 0,
    issues: deterministicIssues,
    reason: "judge JSON parse failed",
  };
}

async function rewriteOutput(input: GuardInput, issues: GuardIssue[], repeatedEvidence: RepeatedEvidence[]): Promise<string> {
  const prompt = `
아래 사주 리포트 본문을 검수 이슈만 반영해서 고쳐라.

[★★★★★ 마크다운 헤더 구조 보존 절대 룰 — 클라이언트 매핑의 생명선]
- 원문에 있던 모든 마크다운 헤더(\`## N장 — ...\`, \`### sub 제목\`)는 결과 본문에도 **반드시 동일 위치·동일 텍스트로 유지**.
- 헤더 라인 자체를 strip·변형·생략·번역·축약하지 말 것. 단 한 글자도.
- ### sub 헤더 사이 본문만 재작성하라.
- 헤더 누락 시 클라이언트가 본문 통째 매핑 실패해서 사용자에게 "(이 소제목 본문이 아직 없어요)" 표시됨. 출력 자체가 폐기되니 반드시 보존.

[절대 조건]
- 마크다운 제목, 섹션 순서, 전체 분량, 말투는 최대한 유지.
- 기존 내용의 장점과 구체성은 보존.
- 새로운 사주 해석을 추가하지 말 것.
- 원문에 있는 정보량은 유지하되, 반복된 근거명과 반복된 의미를 병합할 것.
- 원문에 없던 제목, 번호, 표, 목록, 새 섹션을 추가하지 말 것.
- 원문이 문단이면 문단으로만 반환하고, 원문이 목록이면 기존 목록 구조만 유지할 것.
- 신약 + 비겁 0은 결핍 낙인 표현 대신 협력형·신중함 톤의 일상 문장으로 풀어쓸 것.
- 감정 표현 문제는 식상/인성/관성 조합 근거가 없으면 결핍 단정 대신 신중함 톤으로 풀어쓸 것.
- 결핍 낙인·관계 파국 단정·동물 직역 표현 금지.
- 비유·은유는 꼭 필요한 경우만 1회 이하로 줄이고, 풀이를 직관적인 문장으로 바꿀 것.
- 같은 사주 근거가 반복되면 첫 언급만 남기고 이후의 사주근거명은 제거하거나 문장을 병합할 것.
- 짧은 대체 어구를 반복하지 말 것. 반복이 필요하면 일상 장면·행동으로 풀어쓸 것.
- 반복 근거에서 파생된 설명은 삭제하지 말고 한 문단으로 합쳐라.
- 새로운 사주 해석을 추가하지 말고, 아래 반복 사주근거 카운트에 있는 근거명 반복만 줄여라.
- 원점수(숫자) 노출은 본문에서 제거하고 강도 체감 표현으로 바꿀 것.
- 먼저 내부적으로 "중복 문장표"를 만든다고 가정하고, 같은 클러스터 문장이 2개 이상이면 하나의 문단으로 압축하라.
- 지지 동물 상징과 자연 상징 직역을 삭제하고, 일반 독자가 바로 이해하는 행동·반응·관찰력·거리감·말투·속도 언어로 바꿀 것.
- 결과에는 중복 문장표를 출력하지 말고 최종 본문만 출력하라.
- 결과 본문만 반환. 설명, JSON, 코드블록 금지.
- 이 prompt에 인용된 예시 표현은 본문에 절대 그대로 박지 말 것. prompt 안내 어휘가 본문에 새어들면 풀이 톤이 깨진다.

[★★★★★ 캐릭터 이름 보존 절대 룰 — 양반사주 톤의 정체성]
- 원문에 등장한 캐릭터 이름(예: "상철상", "정숙상", "영자상", "영철상", "영수상", "광수상", "정수상", "옥순상", "현숙상", "순자상", "영숙상", "영자상")은 절대 strip·일반화하지 말 것.
- 특히 ch1 "내 매력은?" 첫 문장의 "${"${name}"}님은 ○○상의 결을 가진 사람이에요" 구문은 반드시 보존.
- ch3 "내 짝꿍 미리 보기" 첫 문장의 "${"${name}"}님의 운명 짝꿍은 ○○상의 결을 가진 사람이에요" 구문도 보존.
- ch6 "마지막 편지" 마무리의 "○○상과 ○○상의 결" 종합 한 문장도 보존.
- 캐릭터 이름을 "솔직하고 진취적인 매력", "꾸밈없는 태도를 가진 사람" 같은 일반 묘사로 대체하지 말 것 — 양반사주 풀이의 정체성을 잃는다.

[의미 중복 클러스터 기준]
${SEMANTIC_CLUSTER_GUIDE}

${(input.service === "hongsil" || input.service === "inyeon" || input.service === "parent-child" || input.service === "saju") ? REPETITION_TONE_GUIDE : ""}

[사주 근거]
${buildGuardContext(input.people)}

[검수 이슈]
${issues.map((x) => `- ${x.type}: ${x.sentence}\n  이유: ${x.reason}`).join("\n")}

[반복 사주근거 카운트]
${buildRepeatedEvidenceBlock(repeatedEvidence)}

[원문]
${input.text}
`;
  return callGeminiText(input.apiKey, prompt, 8192);
}

export async function guardGeneratedText(input: GuardInput): Promise<{ text: string; changed: boolean; issues: GuardIssue[] }> {
  const deterministicIssues = findDeterministicIssues(input.text, input.people);
  let text = applyDeterministicRepair(input.text);

  if (input.service === "hongsil") {
    // ── Phase 1: 결정론 가드 (regex 기반) ─────────────────────
    text = applyHongsilLifestyleRepair(text, input.chapter);
    text = stripPartnerHallucination(text);
    text = stripSipseongScoreLeakage(text);
    if (String(input.chapter) === "5") {
      text = stripChapter5Hanja(text);
    }
    // Cross-chapter 한자 가드는 rewrite 전에 돌려 LLM judge에 깨끗한 본문을 넘김.
    text = suppressRepeatedHongsilEvidence(text, input.usedTokens);
    text = fixJosaAfterPronouns(text); // ⭐ G5 — 받침 기반 조사 보정

    // ── ch6 마지막 편지 — judge/rewrite 비활성 ─────────────────
    // ch6 본문은 캐릭터 회상 위주라 한자·결핍·합성 어색 결함 거의 0.
    // rewrite 단계가 ch6 빈 응답 사건의 잠재 원인 — 안전망으로 결정론 가드만 적용.
    if (String(input.chapter) === "6") {
      // ch6 전용 후처리 — 캐릭터 한자 표기·자연 비유 2개 이상 strip
      text = normalizeCharacterName(text);
      text = strip2ndNaturalSimile(text);
      return {
        text,
        changed: text !== input.text,
        issues: deterministicIssues,
      };
    }

    // ── Phase 2: LLM judge + rewrite (재활성화) ────────────────
    // 2026-05-12에 속도 개선으로 OFF했던 검수 호출을 다시 켠다.
    // regex로 못 잡는 환각(사주 데이터 거짓말)·합성 어색·일관성 결함을 LLM이 잡음.
    // 비용: 챕터당 +3~5초 로딩. 양반사주급 풀이 품질 확보가 우선.
    // ch6 빈 응답 사건을 피하기 위해 judge 본문에 한자 정의 등 모순 룰 박지 않도록 주의.
    const repeatedEvidence = findRepeatedEvidence(text, input.people);
    let judge: GuardResult;
    try {
      judge = await judgeOutput({ ...input, text }, deterministicIssues, repeatedEvidence);
    } catch (e) {
      judge = {
        pass: deterministicIssues.length === 0,
        issues: deterministicIssues,
        reason: `judge failed: ${String(e)}`,
      };
    }
    const mergedIssues = [...deterministicIssues, ...judge.issues].filter((issue, index, arr) =>
      arr.findIndex((x) => x.sentence === issue.sentence && x.reason === issue.reason) === index,
    );
    if (!judge.pass || mergedIssues.length > 0) {
      try {
        const rewritten = await rewriteOutput({ ...input, text }, mergedIssues.length ? mergedIssues : judge.issues, repeatedEvidence);
        if (rewritten.trim()) {
          // rewrite 결과에도 결정론 가드 한 번 더 (LLM이 새로 박은 어색한 표현 잡기).
          text = applyHongsilLifestyleRepair(applyDeterministicRepair(rewritten.trim()), input.chapter);
          text = stripPartnerHallucination(text);
          text = stripSipseongScoreLeakage(text);
          if (String(input.chapter) === "5") text = stripChapter5Hanja(text);
          // suppressRepeatedHongsilEvidence는 rewrite 후엔 안 돌림 — counts가 이미 누적돼
          // 이중 카운트되면 멀쩡한 표현까지 치환할 위험. rewrite 본문은 그대로 stream.
        }
      } catch {
        // rewrite 실패는 무시 — Phase 1 결과 그대로 반환.
      }
    }
    return {
      text,
      changed: text !== input.text,
      issues: mergedIssues,
    };
  }

  // ════════════════════════════════════════════════════════════
  // inyeon (인연궁합) 분기 — hongsil 가드 패턴 정합 (Phase 1)
  // 차이점: 2 캐릭터 normalize / ch8 마지막 편지 (hongsil ch6 위치)
  // ════════════════════════════════════════════════════════════
  if (input.service === "inyeon") {
    // ── Phase 1: 결정론 가드 (hongsil 패턴) ───────────────────
    text = applyHongsilLifestyleRepair(text, input.chapter);
    text = stripPartnerHallucination(text);
    text = stripSipseongScoreLeakage(text);
    // Cross-chapter 한자 가드 — usedTokens Map 받으면 챕터 경계 넘어 작동
    text = suppressRepeatedHongsilEvidence(text, input.usedTokens);
    text = fixJosaAfterPronouns(text); // ⭐ G5 — 받침 기반 조사 보정
    // 사용자 이름 + "상" 자동 합성 제거 (전 챕터 적용)
    text = stripUserNameSangSuffix(text, input.people.map(p => p.name));

    // ── ch8 마지막 편지 — judge/rewrite 비활성 + 캐릭터 normalize + 자연 비유 strip
    // hongsil ch6과 같은 위치/역할
    if (String(input.chapter) === "8") {
      text = normalizeCharacterName(text);
      text = strip2ndNaturalSimile(text);
      return {
        text,
        changed: text !== input.text,
        issues: deterministicIssues,
      };
    }

    // ── Phase 2: LLM judge + rewrite (ch1~ch7만) ────────────
    const repeatedEvidenceInyeon = findRepeatedEvidence(text, input.people);
    let judgeInyeon: GuardResult;
    try {
      judgeInyeon = await judgeOutput({ ...input, text }, deterministicIssues, repeatedEvidenceInyeon);
    } catch (e) {
      judgeInyeon = {
        pass: deterministicIssues.length === 0,
        issues: deterministicIssues,
        reason: `judge failed: ${String(e)}`,
      };
    }
    const mergedIssuesInyeon = [...deterministicIssues, ...judgeInyeon.issues].filter((issue, index, arr) =>
      arr.findIndex((x) => x.sentence === issue.sentence && x.reason === issue.reason) === index,
    );
    if (!judgeInyeon.pass || mergedIssuesInyeon.length > 0) {
      try {
        const rewritten = await rewriteOutput({ ...input, text }, mergedIssuesInyeon.length ? mergedIssuesInyeon : judgeInyeon.issues, repeatedEvidenceInyeon);
        if (rewritten.trim()) {
          // rewrite 결과에도 결정론 가드 한 번 더 (LLM이 새로 박은 어색한 표현 잡기)
          text = applyHongsilLifestyleRepair(applyDeterministicRepair(rewritten.trim()), input.chapter);
          text = stripPartnerHallucination(text);
          text = stripSipseongScoreLeakage(text);
        }
      } catch {
        // rewrite 실패는 무시 — Phase 1 결과 그대로 반환
      }
    }
    return {
      text,
      changed: text !== input.text,
      issues: mergedIssuesInyeon,
    };
  }

  // ════════════════════════════════════════════════════════════
  // parent-child (부모자녀궁합) 분기 — hongsil/inyeon 동등 수준 (2026-05-13 Step 1 fix)
  //
  // 회귀 해결 단계:
  //  1) suppressRepeatedHongsilEvidence 함수 안에 preamble 보존 추가 → ## 챕터 헤더 잘리지 않음
  //  2) rewriteOutput prompt에 "마크다운 헤더 구조 보존" 절대 룰 추가 → rewrite가 ### 헤더 strip 안 함
  //  3) 부모자녀 분기에 가드 6종 + judge/rewrite 다 활성
  //
  // 차이점 (hongsil/inyeon 대비):
  //  - 캐릭터 normalize 자도인 1명만 (12 캐릭터 매핑 미적용)
  //  - outro만 rewrite 비활성 (짧은 시적 단락이라 톤 망가뜨릴 위험)
  //  - ch6는 풀이 챕터라 rewrite 살림
  // ════════════════════════════════════════════════════════════
  if (input.service === "parent-child") {
    // ── Phase 1: 결정론 가드 (hongsil 패턴) ───────────────────
    text = applyHongsilLifestyleRepair(text, input.chapter);
    text = stripPartnerHallucination(text);
    text = stripSipseongScoreLeakage(text);
    text = stripChartScoreLeakage(text); // ⭐ Step C — "도미넌트 70%" / "아침 시간대(45%)" 등 차트 수치 strip
    text = suppressRepeatedHongsilEvidence(text, input.usedTokens);
    text = fixJosaAfterPronouns(text); // ⭐ G5 — 풀 phrase 받침에 맞춰 조사 보정 ("자리이"→"자리가", "자리은"→"자리는")
    text = stripPronounDuplication(text); // ⭐ Step D — 풀 대명사 치환 후 "그 기운 기운" 중복 차단 (suppress 직후)
    text = softenParentChildRepetitivePhrases(text); // G20 — "옅게 자리" / "앞서 본 결" 반복 완화
    text = stripBrokenQuotes(text); // ⭐ Step E — 미완 인용구 strip ("" 하고 ... " 같은 잔존)
    text = forceSubHeaderNewlines(text); // ⭐ F1 — ### sub 헤더 줄바꿈 강제 (본문 중간 ### 박힘 fix)
    text = stripAgeInappropriateWords(text, input.childAgeStage); // ⭐ F3 — 영유아 케이스 학령기·성인 어휘 strip
    text = fixChartFactsMismatch(text, input.chartFacts); // ⭐ G17 — 차트 dominant ↔ 본문 키워드 치환
    text = fixShineAgeMismatch(text, input.chartFacts?.shineGroup); // ⭐ G7 v2 — ShineAge 시기 결정론 치환
    text = stripPhraseHanjaMisbinding(text); // ⭐ G12 v2 — "사주의 결(균화)" 같이 풀 phrase + 한자 괄호 잘못 합성 strip
    {
      const _cnh = input.childNameStem && input.childHonorific ? `${input.childNameStem}${input.childHonorific}` : "";
      text = fixParentDirectAddress(text, input.childNameStem, _cnh); // ⭐ G18 — 부모 직접 인용 호칭 동희양→동희야
    }
    text = fixChildHonorificCorruption(text, input.childNameStem, input.childHonorific); // ⭐ G1 — 이름 호칭 변형(양→상) 복원
    text = stripUserNameSangSuffix(text, input.people.map(p => p.name));

    const chStr = String(input.chapter);

    // outro — judge/rewrite 비활성 + 자연 비유 strip
    if (chStr === "outro") {
      text = strip2ndNaturalSimile(text);
      return {
        text,
        changed: text !== input.text,
        issues: deterministicIssues,
      };
    }

    // ch6 — judge/rewrite 살리되 자연 비유 strip
    if (chStr === "ch6") {
      text = strip2ndNaturalSimile(text);
    }

    // ── Phase 2: LLM judge + rewrite (ch1~ch6) ───────────────
    const repeatedEvidencePC = findRepeatedEvidence(text, input.people);
    let judgePC: GuardResult;
    try {
      judgePC = await judgeOutput({ ...input, text }, deterministicIssues, repeatedEvidencePC);
    } catch (e) {
      judgePC = {
        pass: deterministicIssues.length === 0,
        issues: deterministicIssues,
        reason: `judge failed: ${String(e)}`,
      };
    }
    const mergedIssuesPC = [...deterministicIssues, ...judgePC.issues].filter((issue, index, arr) =>
      arr.findIndex((x) => x.sentence === issue.sentence && x.reason === issue.reason) === index,
    );
    if (!judgePC.pass || mergedIssuesPC.length > 0) {
      try {
        const rewritten = await rewriteOutput({ ...input, text }, mergedIssuesPC.length ? mergedIssuesPC : judgePC.issues, repeatedEvidencePC);
        if (rewritten.trim()) {
          text = applyHongsilLifestyleRepair(applyDeterministicRepair(rewritten.trim()), input.chapter);
          text = stripPartnerHallucination(text);
          text = stripSipseongScoreLeakage(text);
          // ⭐ G17 (2026-05-14) — rewrite 후에도 차트-본문 정합 치환 재적용
          text = fixChartFactsMismatch(text, input.chartFacts);
          text = fixShineAgeMismatch(text, input.chartFacts?.shineGroup); // ⭐ G7 v2 rewrite 후 재적용
          text = stripPhraseHanjaMisbinding(text); // ⭐ G12 v2 rewrite 후 재적용
          // ⭐ G18 rewrite 후 호칭 분기 재적용
          {
            const _cnh = input.childNameStem && input.childHonorific ? `${input.childNameStem}${input.childHonorific}` : "";
            text = fixParentDirectAddress(text, input.childNameStem, _cnh);
          }
          text = fixChildHonorificCorruption(text, input.childNameStem, input.childHonorific);
          text = stripAgeInappropriateWords(text, input.childAgeStage);
          text = softenParentChildRepetitivePhrases(text);
        }
      } catch {
        // rewrite 실패는 무시
      }
    }
    return {
      text,
      changed: text !== input.text,
      issues: mergedIssuesPC,
    };
  }

  // ════════════════════════════════════════════════════════════
  // saju (평생사주) 분기 — hongsil 패턴 정합 (2026-05-13)
  // 차이점:
  //  - 캐릭터 normalize 미적용 (묵도인 1명, CHARACTER_NAMES 없음 = noop)
  //  - ## 챕터 헤더 없음 → suppress preamble 잘림 위험 0
  //  - 14 섹션이라 cross-chapter usedTokens 효과 큼
  //  - 모든 섹션 judge/rewrite 활성 (마지막 섹션도 비활성 안 함)
  // ════════════════════════════════════════════════════════════
  if (input.service === "saju") {
    // ── Phase 1: 결정론 가드 (hongsil 패턴) ───────────────────
    text = applyHongsilLifestyleRepair(text, input.chapter);
    text = stripPartnerHallucination(text);
    text = stripSipseongScoreLeakage(text);
    text = suppressRepeatedHongsilEvidence(text, input.usedTokens);
    text = fixJosaAfterPronouns(text); // ⭐ G5 — 받침 기반 조사 보정
    text = stripUserNameSangSuffix(text, input.people.map(p => p.name));

    // ── Phase 2: LLM judge + rewrite (모든 섹션) ───────────────
    const repeatedEvidenceSaju = findRepeatedEvidence(text, input.people);
    let judgeSaju: GuardResult;
    try {
      judgeSaju = await judgeOutput({ ...input, text }, deterministicIssues, repeatedEvidenceSaju);
    } catch (e) {
      judgeSaju = {
        pass: deterministicIssues.length === 0,
        issues: deterministicIssues,
        reason: `judge failed: ${String(e)}`,
      };
    }
    const mergedIssuesSaju = [...deterministicIssues, ...judgeSaju.issues].filter((issue, index, arr) =>
      arr.findIndex((x) => x.sentence === issue.sentence && x.reason === issue.reason) === index,
    );
    if (!judgeSaju.pass || mergedIssuesSaju.length > 0) {
      try {
        const rewritten = await rewriteOutput({ ...input, text }, mergedIssuesSaju.length ? mergedIssuesSaju : judgeSaju.issues, repeatedEvidenceSaju);
        if (rewritten.trim()) {
          text = applyHongsilLifestyleRepair(applyDeterministicRepair(rewritten.trim()), input.chapter);
          text = stripPartnerHallucination(text);
          text = stripSipseongScoreLeakage(text);
        }
      } catch {
        // rewrite 실패는 무시
      }
    }
    return {
      text,
      changed: text !== input.text,
      issues: mergedIssuesSaju,
    };
  }

  const repeatedEvidence = findRepeatedEvidence(input.text, input.people);

  let judge: GuardResult;
  try {
    judge = await judgeOutput({ ...input, text }, deterministicIssues, repeatedEvidence);
  } catch (e) {
    judge = {
      pass: deterministicIssues.length === 0,
      issues: deterministicIssues,
      reason: `judge failed: ${String(e)}`,
    };
  }

  const issues = [...deterministicIssues, ...judge.issues].filter((issue, index, arr) =>
    arr.findIndex((x) => x.sentence === issue.sentence && x.reason === issue.reason) === index,
  );

  if (!judge.pass || issues.length > 0) {
    try {
      const rewritten = await rewriteOutput({ ...input, text }, issues.length ? issues : judge.issues, repeatedEvidence);
      if (rewritten.trim()) text = applyDeterministicRepair(rewritten.trim());
    } catch {
      text = applyDeterministicRepair(text);
    }
  }

  const finalIssues = findDeterministicIssues(text, input.people);
  if (finalIssues.length > 0) {
    text = applyDeterministicRepair(text);
  }

  return {
    text,
    changed: text !== input.text || issues.length > 0 || finalIssues.length > 0,
    issues: [...issues, ...finalIssues],
  };
}
