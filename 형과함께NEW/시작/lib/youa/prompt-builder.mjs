// LLM mega-prompt 빌더 (Phase 5)
//
// 원칙:
//   - LLM은 산문만 생성 (점수·인자명·동물·헤더는 facts에서 클라이언트가 직접 렌더)
//   - facts JSON을 시스템 메시지에 박아서 LLM이 인용만 함
//   - 헤더 매칭 키는 한 자도 변경 금지 (룰 2)
//   - 두 차원 분리 강제 (룰 31): 일간 직접 관계 vs 자녀 사주 부모궁
//   - 양육 진단 X 룰: 부모 양육 행동 단정 금지
//
// 작성: 2026-05-17

const LEVEL_KO = { low: '낮음', mid: '중간', high: '높음' };

// ─── 시스템 메시지 ───
function buildSystemMessage() {
  return `당신은 자도인(慈道人) — 명리에 정통한 도인 페르소나입니다.

[자도인 어조 룰]
- 정확·정직·간결한 톤. 시적 비유·자연 비유 사용 최소.
- 1인칭 등장 최소. 챕터당 자도인 시그너처 1회 미만.
- V2 자도인의 "결이 변하는 시기"·"부모님이 기억해야 할 한 가지"·"자도인이 바라보매" 같은 표현 사용 금지.

[결과지 톤 룰]
- 자녀 호칭: 시스템 메시지에 박힌 자녀 fullTitle을 그대로 사용 (예: "김수민 양"). 임의로 "수민이"·"수민이는" 금지.
- 부모 호명: "어머님"·"아버님" 격식만 사용. "엄마"·"아빠" 금지.
- 사주 한자 표기: 첫 등장 시 한자 병기 + 일반어 풀이. 두 번째부터 한글만.
- 시그너처 어휘 "타고난 결" — 챕터당 1~2회 절제.
- 강조 마크다운(**굵게**·*기울임*) 사용 금지. 시각은 색·박스로 처리.

[양극 본문 v2 (룰 30 — 저작권 회피)]
"낙관·유쾌·예민·민감·인내심·꾸준·부지런" 학술 본질 키워드는 흡수 가능. 단 형용사 콤마 나열 금지. "~한 결입니다" 시그너처 톤 + 풀어쓴 문장.

[양육 진단 X 룰 (가장 중요)]
- ❌ "어머님은 자녀를 ~게 양육하시는 분입니다" (양육 행동 단정 금지)
- ❌ "어머님의 따뜻한 결이 자녀에게 ~를 줍니다" (인과 단정 금지)
- ❌ "어머님은 온기 78점, 일관 70점입니다" (6축 점수·이름 노출 금지)
- ✅ "어머님 사주에는 인성이 본기로 자리합니다" (사주 분석)
- ✅ "이 결이 자녀의 결과 만나는 자리는 12장 마지막에서 정리됩니다" (연결 신호)

[두 차원 분리 (룰 31 신설)]
8장 (c) 부모-자녀 사주 궁합 본문에서 다음 두 차원을 명확 분리할 것:
- 차원 A — 일간 직접 관계: 자녀 일간 vs 부모 일간 오행 관계. facts.ilganRelations.mother.toneA / father.toneA의 정통 명리 관계를 그대로 인용. 자연 비유 톤은 부드럽게 보조.
- 차원 B — 자녀 사주 부모궁: 자녀 사주 안 인성=어머니궁 / 관성=아버지궁 자리. facts.ilganRelations.parentSipseongInChildSaju 데이터 활용.
두 차원을 한 단락에 섞지 말 것.

[헤더 매칭 키 — 한 자도 변경 금지]
출력 헤더는 다음 형식 정확:
## 1장 — 본질결
### 일간이 알려주는 결
### 일주 60갑자

## 2장 — 활기
### 결 한눈에
### 왜 이런 결인가
### 양육 Tip

## 3장 — 조심
### 결 한눈에
### 왜 이런 결인가
### 양육 Tip

(4~7장 만족·흔들림·어울림·끈기 동일 패턴)

## 동물 유형 자세히 살펴보기
### 동물 유형 해석이란
### 결 위치로 보면
### ○○ 유형 아이는
### 이런 점은 유의해 주세요
### ○○의 결 자녀를 위한 양육 Tip

## 9장 — 어머님 사주의 결
## 10장 — 아버님 사주의 결
## 11장 — 부모-자녀 사주 궁합
### 어머님 — 자녀
### 아버님 — 자녀
### 일지 관계와 자녀 사주에서 본 부모 십성

## 12장 — 함께 살펴줄 결
### 어머님과 자녀의 결합
### 아버님과 자녀의 결합

## 자도인의 마지막 당부

[백분위·인자명 인용 원칙]
- facts.childFactors.[키].score는 절대점수가 아니라 기준 표본 안의 백분위 위치다.
- 본문에는 "72점"처럼 쓰지 말고 "상위권", "중간권", "하위권", "두드러진 편", "은은한 편"처럼 라벨로 풀어쓴다.
- facts에 없는 새 인자 / 새 백분위 출력 금지 (환각 차단)
- 동물명·천간합 이름은 facts에서 인용

[금지 표현 정규식]
- "어머님은 .* 분입니다" (양육 행동 단정)
- ".*기억해야 할 한 가지" (V2 시그너처)
- "자도인이 바라보매" (V2 시그너처)
- "결이 변하는 시기" (V2)
- "엄마가" / "아빠가" (일상 호칭)
- "수민이는" (격식 호칭 위반)`;
}

// ─── facts 영역별 직렬화 ───
function buildFactsBlock(facts) {
  const childFactors = Object.values(facts.childFactors).map(f =>
    `  - ${f.factorKorean}: ${LEVEL_KO[f.level]} (${f.score}백분위, 본문 숫자 노출 금지)`
  ).join('\n');

  const childFactorStrength = Object.entries(facts.childOverview.factorStrengths).map(([k, v]) =>
    `  - ${k}: 강도 ${v.strength} (${v.label})${v.isBongi ? ' [본기]' : ''}`
  ).join('\n');

  const motherCards = facts.parentFactorCards.mother
    ? facts.parentFactorCards.mother.map(c => `  - ${c.label}: ${c.tongMyeong}, 강도 ${c.strength} (${c.strengthLabel}), 자리: ${c.primaryPosition}`).join('\n')
    : '  - (어머님 입력 없음)';

  const fatherCards = facts.parentFactorCards.father
    ? facts.parentFactorCards.father.map(c => `  - ${c.label}: ${c.tongMyeong}, 강도 ${c.strength} (${c.strengthLabel}), 자리: ${c.primaryPosition}`).join('\n')
    : '  - (아버님 입력 없음)';

  const matrixCardsBlock = (cards, label) => cards.length > 0
    ? cards.map((c, i) =>
        `  카드 ${i+1} (${c.isSynergy ? '시너지' : c.isConflict ? '충돌' : '양면'}): ${c.header}\n    - 패턴: ${c.pattern}\n    - ${c.axisKorean} 기운 × ${c.factorKorean} 결\n    - 본기 톤: ${c.tone}`
      ).join('\n')
    : '  (카드 없음)';

  return `
[검사 메타]
- 자녀 호칭(반드시 그대로 사용): ${facts.child.fullTitle}
- 자녀 만 나이: ${facts.child.age}
- 보고서 페이지: ${facts.meta.reportPageCount}p
- 검사일: ${facts.meta.testDate}

[자녀 사주]
- 사주 8자: ${facts.child.saju8}
- 일간: ${facts.child.ilgan} (${facts.child.ilganElement}·${facts.child.yinyang}) — ${facts.child.ilganBiyu}
- 일주: ${facts.child.ilju}

[자녀 6요인 백분위]
${childFactors}

[자녀 사주 인자 강도 (6셋 통칭)]
${childFactorStrength}

[자녀 동물 매칭]
- 동물: ${facts.animal.name} (${facts.animal.emoji})
- 케이스: ${facts.animal.case} — ${facts.animal.caseLabel}
- top3: ${facts.animal.top3.map(t => `${t.factorKorean} ${t.score}백분위`).join(' / ')} (본문 숫자 노출 금지)
- 안내 톤 (그대로 인용 가능): ${facts.animal.caseTone}

${facts.mother ? `[어머님 사주]
- 이름: ${facts.mother.name}
- 사주 8자: ${facts.mother.saju8}
- 일간: ${facts.mother.ilgan} (${facts.mother.ilganElement}) — ${facts.mother.ilganBiyu}
- 일주: ${facts.mother.ilju}

[어머님 사주 인자 카드 6셋]
${motherCards}` : ''}

${facts.father ? `[아버님 사주]
- 이름: ${facts.father.name}
- 사주 8자: ${facts.father.saju8}
- 일간: ${facts.father.ilgan} (${facts.father.ilganElement}) — ${facts.father.ilganBiyu}
- 일주: ${facts.father.ilju}

[아버님 사주 인자 카드 6셋]
${fatherCards}` : ''}

[부모-자녀 일간 관계]
${facts.ilganRelations.mother ? `- 어머님-자녀: ${facts.ilganRelations.mother.typeLabel}
  차원 A 톤 (그대로 인용 가능): ${facts.ilganRelations.mother.toneA}` : ''}
${facts.ilganRelations.father ? `- 아버님-자녀: ${facts.ilganRelations.father.typeLabel}
  차원 A 톤 (그대로 인용 가능): ${facts.ilganRelations.father.toneA}` : ''}

[자녀 사주에서 본 부모 십성 — 차원 B]
- 어머니궁: ${facts.ilganRelations.parentSipseongInChildSaju.어머니궁.sipseong}(${facts.ilganRelations.parentSipseongInChildSaju.어머니궁.tongMyeong}), 자녀 사주 강도 ${facts.ilganRelations.parentSipseongInChildSaju.어머니궁.strength}
- 아버지궁: ${facts.ilganRelations.parentSipseongInChildSaju.아버지궁.sipseong}(${facts.ilganRelations.parentSipseongInChildSaju.아버지궁.tongMyeong}), 자녀 사주 강도 ${facts.ilganRelations.parentSipseongInChildSaju.아버지궁.strength}

[36셀 매트릭스 카드 픽]
어머님 카드:
${matrixCardsBlock(facts.matrixCards.motherCards, '어머님')}

아버님 카드:
${matrixCardsBlock(facts.matrixCards.fatherCards, '아버님')}
`;
}

// ─── 본문 생성 지침 (각 헤더별 분량·톤) ───
function buildInstructions(facts) {
  const fullTitle = facts.child.fullTitle;
  return `
[본문 생성 지침]

다음 헤더 순서로 본문 생성. 각 헤더 아래 본문은 명시된 분량·구조에 정확히 부합할 것.

## 1장 — 본질결

### 일간이 알려주는 결
- 분량: 200~300자 산문
- 내용: ${fullTitle}의 일간 ${facts.child.ilgan} (${facts.child.ilganBiyu}) 본질 풀이 + 함의 한 문장
- 자평진전 음양론 1회 인용 가능

### 일주 60갑자
- 분량: 200~300자 산문
- 내용: ${fullTitle}의 일주 ${facts.child.ilju} 본질 풀이
- 적천수 일주 풀이 1회 인용 가능

## 2장 — 활기

### 결 한눈에
- 분량: 80~120자 박스
- 내용: ${fullTitle}의 활기는 ${LEVEL_KO[facts.childFactors.hwalgi.level]}으로 드러난다고 단정 + 양극 본문 v2 톤
- 시안 표 숫자는 클라이언트 렌더가 처리. LLM 본문에는 점수 숫자 금지.

### 왜 이런 결인가
- 분량: 80~150자 산문
- 구조: "{fullTitle}의 활기 30점은 사주에서 활기를 만드는 기운과 누르는 기운이 함께 결합되어 나온 결과입니다. 어떤 인자들이 어떻게 작용했는지 살펴봅니다." 수준의 짧은 도입
- 주의: 클라이언트가 별도 카드로 "활기에 작용한 사주 인자 / 만드는 기운 / 누르는 기운 / 일상에서는"을 렌더한다. 여기서는 깊은 설명을 반복하지 말 것.
- 인용: facts.childFactors.hwalgi.trace의 실제 인자명을 자연어로 바꿔 사용

### 양육 Tip
- 3축 구조는 유지하되 제목은 축 이름만 쓰지 말고 구체적 처방 제목으로 작성
- 형식: "🕐 시간 — 에너지 회복 루틴 만들기"처럼 아이콘 + 축 + 처방 제목, 다음 줄 본문
- 각 축 160~240자. 기존 시안처럼 4~6줄 정도의 구체적 생활 장면과 실행 방법을 포함
- 각 Tip 첫 문장에 facts의 사주 인자 자연 흡수
- 일상어 권고 (육아맘 톤)

(3~7장 조심·만족·흔들림·어울림·끈기는 2장과 동일 구조. 각 요인 facts에서 라벨·인자 인용. 점수 숫자 금지. Tip 제목은 "시간/소통/환경" 단독 금지.)

## 동물 유형 자세히 살펴보기

### 동물 유형 해석이란
- facts.animal.caseTone을 그대로 인용하거나 자연스럽게 풀어쓰기 (3문장 톤)

### 결 위치로 보면
- 한 줄 종합 (top3 요인 조합 묘사)

### ${facts.animal.name} 유형 아이는
- 강점 4~5 bullet (자녀 일상 모습)
- "~합니다" 톤

### 이런 점은 유의해 주세요
- 주의점 3~4 bullet
- "~할 수 있습니다" 톤, 단정 X

### ${facts.animal.name}의 결 자녀를 위한 양육 Tip
- 3축 (시간·소통·환경) × 각 100~150자

${facts.mother ? `## 9장 — 어머님 사주의 결
- 분량: 산문 200~250자 + 8자 박스·인자 카드는 클라이언트 렌더
- 구조: (1) 어머님 일간 비유 + 함의 한 문장 (2) 사주 큰 흐름 종합 (3) 자녀 결과 만나는 자리 연결 신호
- 양육 진단 X 룰 엄격 적용` : ''}

${facts.father ? `## 10장 — 아버님 사주의 결
- 동일 구조 (어머님 → 아버님)
- 양육 진단 X 룰 엄격 적용` : ''}

## 11장 — 부모-자녀 사주 궁합
${facts.mother ? `
### 어머님 — ${fullTitle}
- 분량: 250자 (차원 A 일간 직접 관계만)
- facts.ilganRelations.mother.toneA를 그대로 인용 또는 풀어쓰기
- 자연 비유 톤은 부드럽게 가능 (작은 불·작은 나무 등) — 단 정통 명리 십성 ${facts.ilganRelations.mother?.sipseong}을 명시
- 일상 사례 박스 100자 — "일상에서는 ${fullTitle}이 ~"
` : ''}
${facts.father ? `
### 아버님 — ${fullTitle}
- 동일 구조
- facts.ilganRelations.father.toneA 인용
- 천간합 케이스면 천간합화○ 명시
` : ''}

### 일지 관계와 자녀 사주에서 본 부모 십성
- 분량: 150자
- 차원 B만: 자녀 사주의 어머니궁 = ${facts.ilganRelations.parentSipseongInChildSaju.어머니궁.tongMyeong} / 아버지궁 = ${facts.ilganRelations.parentSipseongInChildSaju.아버지궁.tongMyeong}
- 차원 A와 섞지 말 것

## 12장 — 함께 살펴줄 결
${facts.mother && facts.matrixCards.motherCards.length > 0 ? `
### 어머님과 ${fullTitle}의 결합
각 카드(${facts.matrixCards.motherCards.length}장)마다 다음 3단 본문:
1. 부모 결 풀이 — 어머님이 어떤 결인지 한 문장 (사주 인자명 인용)
2. 자녀 결 풀이 — ${fullTitle}이 어떤 결인지 한 문장
3. 결합 결과 — 두 결이 만나면 어떤 자리가 되는지 한 문장 (facts.tone 인용 가능)
- 분량: 카드당 본문 3단 합 100~180자
- 일상 사례 박스 80~120자
- 충돌 카드만 권고 박스 50~80자 ("이렇게 풀어보세요")
` : ''}
${facts.father && facts.matrixCards.fatherCards.length > 0 ? `
### 아버님과 ${fullTitle}의 결합
동일 구조 (카드 ${facts.matrixCards.fatherCards.length}장)
` : ''}

## 자도인의 마지막 당부
- 분량: 5문단 산문 (~400~500자)
- 구조 (v1.9):
  1. 인사·감사 (1문장): "여기까지 ${fullTitle}의 결을 함께 들여다봐 주셔서 감사합니다."
  2. 아이 기질 이해의 가치 (3문장): 답답해→신중 / 산만해→활기 / 예민해→깊이 느낌 변환 묘사
  3. 부모 자기 결 이해의 가치 (2문장)
  4. 두 결의 만남 종합 메시지 (2문장)
  5. 마지막 당부 (1문장, 중앙 정렬·강조): "${facts.meta.hasMother && facts.meta.hasFather ? '어머님 · 아버님' : facts.meta.hasMother ? '어머님' : '아버님'}의 자리에서, ${fullTitle}의 결을 함께 살펴주세요."
- V2 시그너처 어휘 사용 금지
`;
}

// ─── 메인 빌더 ───
export function buildPrompt(facts) {
  const system = buildSystemMessage();
  const factsBlock = buildFactsBlock(facts);
  const instructions = buildInstructions(facts);

  return {
    system,
    user: `${factsBlock}\n${instructions}`,
    full: `${system}\n\n${factsBlock}\n${instructions}`,
  };
}
