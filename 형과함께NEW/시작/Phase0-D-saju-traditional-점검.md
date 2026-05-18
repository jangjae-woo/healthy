# Phase 0-D: 기존 saju 모듈 활용 범위 점검

> **작성**: 2026-05-16
> **점검 대상**: `C:/Users/new/Desktop/saju/lib/` saju 관련 모듈

---

## 활용 가능 (재사용)

### `saju-calculator.ts` (847줄)

**기반 데이터·상수**:
- `STEMS`, `BRANCHES`, `STEM_HANJA`, `BRANCH_HANJA`
- `JIJANGAN` (지지장간 본기·중기·여기 + 가중치) ← 통근 산출 핵심
- `CHEONGAN_HAP` (천간합 5쌍)
- `JIJI_SAMHAP` (삼합 4그룹)
- `JIJI_YUKHAP` (육합 6쌍)
- `JIJI_YUKCHUNG` (육충 6쌍)
- 천간/지지 오행·음양 매핑

**핵심 함수**:
- ✅ `getSipseong(ilgan, target, isBranch)` — 십성 산출 (정인·편관 등 정/편 구분)
- ✅ `calcYearPillar`, `calcMonthPillar` (절기 보정)
- ✅ `calcElements` (오행 분포 — 천간합·삼합·육합·충 보정 포함)
- ✅ `calcSinsal` (천을귀인·문창귀인·양인살·도화살·역마살·괴강 등 15+ 신살)
- ✅ `calcDaeun` (대운)
- ✅ `getDayMasterStrength` (신강 7단계: 극약·태약·신약·중화·신강·태강·극왕)
- ✅ `inferCrisisTiming` (대운 변환점)

### `saju-traditional.ts` (1013줄)

**기반 데이터**:
- `BRANCH_MAIN_STEM` (지지 본기)
- `BRANCH_HIDDEN_STEMS` (지지장간 본기·중기·여기 단순화 버전)
- `ELEM_GENERATE`, `ELEM_OVERCOME` (오행 상생·상극)

**핵심 함수**:
- ✅ `getSipseong(ilgan, otherStem)` — 천간 한정 십성 (saju-calculator의 것과 중복, 천간 전용)
- ✅ `calcGyeokguk` (격국 — 정관격·편인격 등 + 부모 양육 팁)
- ✅ `calcGongmang` (공망)
- ✅ `calcGisin` (기신)
- ✅ `calcGaeun` (개운)
- ✅ `calcChildTiming` (자녀 시기)
- ✅ `calcIljiRelation` (일지 관계 — 육합·육충·형·해·파·비화)
- ✅ `calcParentSipseong` (부모 십성 — 자녀 사주의 어머니궁·아버지궁)
- ✅ `calcCheonganHap` (천간합 부모-자녀)
- ✅ `calcChildBranchHarmony` (자녀 지지 합)
- ✅ `calcShipiShinsal` (12신살)
- ✅ `calcUnseong` (12운성)
- ✅ `calcSharedSinsal` (부모-자녀 공유 신살)
- ✅ `calcFamilyTrio` (3인 가족 사주)

### `saju-core.ts` (222줄)

- ✅ `computeFullSajuCore(input)` — 입력 → SajuAnalysisCore 통합 변환
- ✅ `parseHourSelection` (시지 파싱)
- ✅ `resolveSolarDate` (음력→양력)
- ✅ `topElement`, `weakElement`

→ **새 SKU의 입력 폼 → 사주 8자 변환 = 그대로 활용**.

### `saju-symbols.ts` (94줄)
- 천간·지지·오행 정적 매핑 (시각 컴포넌트용)

### `samhap.ts` (136줄)
- 삼합 계산 별도 모듈

---

## 신규 구현 필요 (`lib/youa/` 안)

### 점수 산출 핵심

| 모듈 | 구현 내용 | 비고 |
|---|---|---|
| `lib/youa/factors.ts` | 자녀 6요인 점수 (활기·조심·만족·흔들림·어울림·끈기) | 본기·상조·여기 등급 + 위치 가중치 + 정규화 |
| `lib/youa/parent-axes.ts` | 부모 6축 (온기·중심·일관·자율·표현·바람) | 내부 로직만, 결과지 노출 X |
| `lib/youa/matrix.ts` | 36셀 매트릭스 MATRIX_36 데이터 + 매칭 함수 | `4_matrix_36.md` 데이터 그대로 import |
| `lib/youa/animal.ts` | 7동물 매칭 + 케이스 분기 (A/B/C) | 6요인 점수 → 동물 |
| `lib/youa/ilgan-relation.ts` | 부모-자녀 일간 5유형 (천간합 우선) | `calcIljiRelation`·`calcCheonganHap` 활용 |
| `lib/youa/facts-builder.ts` | 모든 결정론 결과 → 단일 facts JSON | 클라이언트·프롬프트 인터페이스 |
| `lib/youa/prompt-builder.ts` | mega-prompt 조립 | 30개 톤 룰 + facts |

### 헬퍼 신규 (기존에 없거나 일부만 있음)

| 함수 | 구현 필요? | 기존 보강 |
|---|---|---|
| `getMyeongriStrength(인자, saju)` — 0~100 명리 강도 | **신규** | `calcElements` 결과 + `JIJANGAN` 가중치 조합 |
| `getJjingeunStrength` (통근 강도 0~100) | **신규** | `JIJANGAN` 가중치 기반 |
| `getTuchulStrength` (투출 강도) | **신규** | 지지장간 → 천간 매칭 |
| `getWangSangHyuSuSa` (왕상휴수사 보정) | **신규** | 오행·계절 매트릭스 |
| `getJohuBalance` (한열조습 균형 0~100) | **신규** | `calcElements` 결과 + 계절 보정 |
| `getInjaCategoryStrength` (인성·식상·관성·재성·비겁 통칭 강도) | **신규** | 통칭 6셋용 |
| `getSpecialFactor` (양인·천을귀인·도화 등 동적 6번 슬롯 선택) | **신규** | `calcSinsal` 결과 → 우선순위 매핑 |

### 컴포넌트 신규

`components/youa/` 안 17개 (이미 메모에 정리됨)

---

## 의사결정 — V2 자도인 코드 import 정책

`6_rules.md` V2 배제 룰에 따라 다음 V2 모듈은 **import 금지**:
- `parent-child-charts-v2.ts`
- `parent-child-compat-v2.ts`
- `parent-child-observation-v2.ts`
- `parent-child-traits-block-v2.ts`
- `parent-child-traits-v2.ts`
- `inyeon-traits-block-v2.ts`
- `inyeon-traits.ts`
- 기타 V2 자도인 절대원칙 A~L 관련 코드

다만 **사주 표준 계산 모듈**(saju-calculator·saju-traditional·saju-core·saju-symbols·samhap)은 **재사용 OK**. 명리 표준 계산은 V2 자산이 아닌 공용.

---

## 형의 작업 분담 영향

형이 v2.1 index.html 수정 시 다음 데이터를 코드에서 받아야 함:
1. 어머님 사주 戊辰·乙卯·丁亥·丙午 → 6셋 통칭 강도 (인성·식상·관성·재성·비겁·특수)
2. 아버님 사주 戊午·乙酉·庚申·丙子... 잠깐 다시 확인: 아버님 사주는 시안 = 乙丑年 乙酉月 庚申日 丙子時
3. 자녀 사주 壬子年 庚申月 乙亥日 戊寅時 → 6요인 점수

→ Phase 1-B 완료 시점에 점수 데이터를 형에게 전달. 형이 시안 점수 영역만 갱신.

---

## Phase 0-D 결론

- 기반 모듈 약 **80% 구비**. 새 SKU의 신규 구현 = 점수 산출 로직 + 매트릭스 + 동물 매칭 + 6셋 통칭 + 동적 특수 슬롯.
- 사주 8자 변환·십성·신살·합충·일지 관계·천간합·12운성·격국·기신은 **재사용**.
- 통근/투출/왕상휴수사/조후/통칭 강도/특수 슬롯 = 신규 구현.

---

## 다음 작업

1. **Phase 0-C** — 자녀 사주 `壬子年 庚申月 乙亥日 戊寅時` facts JSON 작성 (검증용 fixture)
2. **Phase 1-A** — `lib/youa/factors.ts` 활기·끈기 함수 작성 시작

→ Phase 0-C·1-A 동시 진행 가능. 0-C에서 자녀 facts JSON 잠그고 1-A에서 점수 함수가 그 facts로 활기·끈기 계산.
