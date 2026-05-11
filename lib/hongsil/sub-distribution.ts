// 나의 홍실 sub별 PRIMARY 인자 분배표 + 자연 비유 1회 룰
// LLM이 매 sub마다 같은 자연 비유 + 동일 PRIMARY 인자 반복하는 문제 차단.

type HongsilChapterScope = "ch1" | "ch2" | "ch3" | "ch4" | "ch5" | "ch6";

const CADENCE_OVERRIDE = `
[★★★★ 첫 줄 cadence 강제 — sub guide의 "구성: ① 단정 한 줄" 보다 이 룰이 우선]
이 챕터의 sub들 첫 줄 cadence는 모두 다름. "${"${name}"}님은 [○○]이에요" 같은 단정 헤드라인 패턴 사용은 챕터 내 1 sub만.
나머지 sub은 6 cadence 풀에서 다른 cadence 사용:
1) 단정 헤드라인 — 챕터 내 1 sub만
2) 질문 던지기 ("${"${name}"}님에게 사랑은 어떤 결일까요?")
3) 일상 한 컷 시작 ("카페에서 그 사람 앞에 앉을 때 — …")
4) 자연 비유 시작 (홍실 1-1만 OK)
5) 시간 묘사 ("이별 직후 마음엔 …", "20대 끝에서 …")
6) 짧은 단정 + 호명 ("${"${name}"}님 — 솔직한 직진의 결.")

★ 첫 줄 cadence 같은 챕터 내 두 번 X.
★ sub guide의 "구성: ① 단정 한 줄" 패턴은 1 sub만 적용.
`;

const DISTRIBUTIONS: Record<HongsilChapterScope, string> = {
  ch1: `
[★★★ 1장 sub별 PRIMARY 분배 — 같은 인자 두 번 메인 X]
- 1-1 내 매력은? (PRIMARY: 일간·매력 신살(도화·홍염·천을귀인)) — **자연 비유 등장 OK 1회**
- 1-2 썸 단계 결정적 매력 (PRIMARY: 식상·도화살 + 일주 외격) — 일간 메인 X (1-1에서 다룸)
- 1-3 사랑하면 변하는 나 (PRIMARY: 일주 합·충 + 관성·비겁)
- 1-4 밀당녀 vs 직진녀 (PRIMARY: 관성·일주 음양 + 비겁·신강신약)

★ 자연 비유 ("단단한 강철", "옥토 같은", "큰 강처럼 흐르는") 등장: 1-1 단 1회만. 1-2~1-4는 비유 자체 인용 X — 인자 명사만 ("일간 경(庚)의 결" OK).
★ 같은 PRIMARY 인자 다른 sub 메인 X.
`,

  ch2: `
[★★★ 2장 sub별 PRIMARY 분배]
- 2-1 인생 전체 사랑 큰 흐름 (PRIMARY: 대운 + 일주 합·정관·편관)
- 2-2 솔로 탈출은 언제? (PRIMARY: 세운 + 일주 활성도 + 기신·도화살) — 대운 메인 X (2-1에서 다룸)

★ 자연 비유 X — 1장에서 끝남. 인자 명사만.
`,

  ch3: `
[★★★ 3장 sub별 PRIMARY 분배]
- 3-1 내 짝꿍은 누구일까 (PRIMARY: 일주 합·정관·편관/정재·편재 + 약한 오행)
- 3-2 운명을 알아보는 단서 (PRIMARY: 신살(천을귀인·역마살·도화살) + 세운) — 합 시점 메인 X (3-1에서 다룸)
- 3-3 운명을 잡는 한 수 (PRIMARY: 본인 강점 십성·용신)

★ 자연 비유 X.
`,

  ch4: `
[★★★ 4장 sub별 PRIMARY 분배]
- 4-1 자꾸 끌리는 가짜 인연 (PRIMARY: 약점·결핍 십성 + 충·해 일주)
- 4-2 매번 같은 결말의 이유 / 첫 연애 조심 (PRIMARY: 충 시점·기신 + 관성 흐름) — 약점 메인 X (4-1에서 다룸)
- 4-3 이 굴레 어떻게 벗어날까 (PRIMARY: 용신·자기개선·세운) — 약점·기신 메인 X

★ 자연 비유 X. 부정 어조 X — 자각·해방 톤.
`,

  ch5: `
[★★★ 5장 sub별 PRIMARY 분배]
- 5-1 감춰진 야한 매력 (PRIMARY: 일지 도화살·홍염살)
- 5-2 본능이 원하는 욕구 (PRIMARY: 재성·관성 + 일간 음양) — 도화 메인 X (5-1에서 다룸)
- 5-3 둘이 깊어지는 분위기 (PRIMARY: 합 시점 + 정관/편관·식상)

★ 자연 비유 X. 노골 묘사 절대 X — 결·기운·온도·리듬 비유.
`,

  ch6: `
[★★★ 6장 편지 — 1~5장 결 회상]
- 1~5장 키워드 1~2개만 자연 인용 (자연 비유 1회 회상 OK)
- 같은 인자 두 번 회상 X
`,
};

export function hongsilSubDistribution(scope: HongsilChapterScope): string {
  return (DISTRIBUTIONS[scope] ?? "") + CADENCE_OVERRIDE;
}
