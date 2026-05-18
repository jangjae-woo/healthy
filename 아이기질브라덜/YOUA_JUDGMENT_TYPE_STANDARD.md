# 아이기질과 부모양육 판단 타입 표준
작성일: 2026-05-18

## 원칙

아이기질과 부모양육도 평생사주와 같은 구조로 간다.

```text
엔진 = 사주 판단
LLM = 문장화
캐시 = 실제 서비스 출력
검수 = 모순 제거
```

LLM은 사주를 판단하지 않는다. 엔진이 계산한 아이 요인, 부모 축, 일간 관계, 조합 원인을 받아서 원본 폼의 톤으로 문장화만 한다.

## 판단 타입 계층

### 아이 단독

- `childTemperamentPattern`
  - 아이 전체 기질의 중심 패턴
  - 예: `active_expression`, `cautious_stability`, `sensitive_recovery`, `social_attachment`, `persistent_rhythm`, `balanced_moderate`

- `factorExpressionPattern`
  - 6요인이 밖으로 드러나는 방식
  - 예: `factor_high_direct`, `factor_low_inner`, `factor_mid_contextual`, `factor_very_high_overflow`, `factor_very_low_reserved`

- `factorCausePattern`
  - 해당 요인을 만드는 사주 원인 조합
  - 예: `maker_johu_imbalance__suppressor_chilsal_sinyak`

- `dailyCarePattern`
  - 일상에서 어떤 조건을 맞춰야 안정되는지
  - 예: `needs_recovery_rhythm`, `needs_preview_and_boundary`, `needs_expression_channel`, `needs_safe_observation`

- `emotionRegulationPattern`
  - 감정 회복 방식
  - 예: `slow_recovery`, `quick_reactive`, `stable_with_routine`, `needs_co_regulation`

- `attachmentPattern`
  - 관계/애착 흐름
  - 예: `warm_close`, `selective_slow`, `social_open`, `independent_space`

### 부모 단독

- `parentCarePattern`
  - 부모가 아이에게 주는 양육 결
  - 예: `warm_support`, `stable_boundary`, `consistent_routine`, `autonomy_space`, `expressive_feedback`, `result_guidance`

- `parentCausePattern`
  - 부모 축을 만드는 사주 원인
  - 예: `axis_jungsim__cause_gwanseong`, `axis_ongi__cause_inseong`

### 부모-아이 조합

- `parentChildSynergyPattern`
  - 부모 결이 아이 결을 잘 받쳐주는 방식
  - 예: `structure_supports_emotion`, `warmth_supports_caution`, `routine_supports_persistence`

- `parentChildConflictPattern`
  - 충돌이 생길 수 있는 방식
  - 예: `expectation_pressures_sensitivity`, `expression_overruns_caution`, `result_pushes_pace`

- `disciplineRiskPattern`
  - 기준/통제/결과 요구가 아이에게 부담이 되는 방식
  - 예: `boundary_helps`, `boundary_overpressure`, `speed_mismatch`, `low_discipline_risk`

- `learningStylePattern`
  - 아이가 배우고 따라오는 방식
  - 예: `learns_by_routine`, `learns_by_modeling`, `learns_by_expression`, `learns_by_choice`, `learns_by_result`

## 캐시 키 원칙

숫자 원값은 계산과 정렬에만 쓴다. 캐시 키에는 구간과 판단 타입만 넣는다.

예:

```text
youa.factor
| factor=heundeullim
| factorBand=높음
| childTemperamentPattern=sensitive_recovery
| factorExpressionPattern=factor_high_direct
| factorCausePattern=maker_johu_imbalance__suppressor_chilsal_sinyak
| dailyCarePattern=needs_recovery_rhythm
| tone=brother-index
| variant=03
```

```text
youa.matrix
| parentRole=mother
| parentCarePattern=stable_boundary
| parentChildSynergyPattern=structure_supports_emotion
| parentChildConflictPattern=low_conflict
| disciplineRiskPattern=boundary_helps
| parentAxis=jungsim
| childFactor=heundeullim
| tone=brother-index
| variant=02
```

## 검수 기준

- 없는 요인을 만들지 않는다.
- 아이와 부모의 역할을 뒤집지 않는다.
- 점수 원값을 본문에 노출하지 않는다.
- 계산표 말투를 쓰지 않는다.
- 과장, 단정, 공포 문장을 쓰지 않는다.
- 원본 폼의 문단 수와 리스트 수를 깨지 않는다.
- 충돌 카드가 아닐 때 `이렇게 풀어보세요`를 출력하지 않는다.
- 시간 모름을 결핍처럼 말하지 않는다.
