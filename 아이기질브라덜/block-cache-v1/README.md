# 아이기질 문장 블록 캐시 v1

이 폴더는 LLM을 제거하기 위한 문장 블록 캐시 실험본이다.

## 생성

```powershell
node generate-youa-block-cache.mjs
```

## 결과

```text
cache/factor-blocks.json
cache/parent-saju-blocks.json
cache/compatibility-blocks.json
cache/parent-palace-blocks.json
cache/matrix-card-blocks.json
cache/index.json
```

총 707개 블록을 생성한다.

## 사용 원칙

사주 엔진이 계산한 key로 블록을 조회하고, 렌더러가 변수만 치환한다.

LLM은 호출하지 않는다.

