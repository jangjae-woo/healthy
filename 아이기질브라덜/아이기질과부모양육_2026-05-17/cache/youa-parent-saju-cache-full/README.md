# 아이기질과부모양육 부모 사주 결 캐시

생성일: 2026-05-17T08:35:37.964Z

## 목적

아이 기본 보고서 캐시와 결합하기 위한 부모 쪽 사주 결 백데이터입니다.
어머님/아버님 생년월일과 출생시간별로 사주 기둥, 일간, 부모 6축 결을 미리 저장합니다.

중요: 이 파일은 아이 x 어머님 x 아버님 전체 완성 HTML을 모두 곱한 캐시가 아닙니다.
전체 가족 조합은 경우의 수가 너무 커지므로, 운영에서는 아래 3단계로 조립하는 방식이 맞습니다.

1. 아이 기본 보고서 캐시에서 아이 결과를 찾기
2. 부모 사주 결 캐시에서 어머님/아버님 결과를 찾기
3. 부모-자녀 관계/궁합 부분만 결정론 규칙으로 즉시 조립하기

## 입력 범위

- 부모 생년월일: 1950-01-01 ~ 2010-12-31
- 역할: 어머님, 아버님
- 시간: 12지시 + 시간 모름
- 전체 조합: 579,254건

## 출력 파일

- `index.json`: key별 연도 파일/라인 위치
- `summary.json`: 생성 통계
- `parent-saju-cache-1950.jsonl`: 9,490건, 74.96MB
- `parent-saju-cache-1951.jsonl`: 9,490건, 73.66MB
- `parent-saju-cache-1952.jsonl`: 9,516건, 75.13MB
- `parent-saju-cache-1953.jsonl`: 9,490건, 75.11MB
- `parent-saju-cache-1954.jsonl`: 9,490건, 75.34MB
- `parent-saju-cache-1955.jsonl`: 9,490건, 74.98MB
- `parent-saju-cache-1956.jsonl`: 9,516건, 75.26MB
- `parent-saju-cache-1957.jsonl`: 9,490건, 73.8MB
- `parent-saju-cache-1958.jsonl`: 9,490건, 74.83MB
- `parent-saju-cache-1959.jsonl`: 9,490건, 75.09MB
- `parent-saju-cache-1960.jsonl`: 9,516건, 73.78MB
- `parent-saju-cache-1961.jsonl`: 9,490건, 74.93MB
- `parent-saju-cache-1962.jsonl`: 9,490건, 75.11MB
- `parent-saju-cache-1963.jsonl`: 9,490건, 73.7MB
- `parent-saju-cache-1964.jsonl`: 9,516건, 75.04MB
- `parent-saju-cache-1965.jsonl`: 9,490건, 75.09MB
- `parent-saju-cache-1966.jsonl`: 9,490건, 75.18MB
- `parent-saju-cache-1967.jsonl`: 9,490건, 75.13MB
- `parent-saju-cache-1968.jsonl`: 9,516건, 75.33MB
- `parent-saju-cache-1969.jsonl`: 9,490건, 73.84MB
- `parent-saju-cache-1970.jsonl`: 9,490건, 74.72MB
- `parent-saju-cache-1971.jsonl`: 9,490건, 74.94MB
- `parent-saju-cache-1972.jsonl`: 9,516건, 74.02MB
- `parent-saju-cache-1973.jsonl`: 9,490건, 75.01MB
- `parent-saju-cache-1974.jsonl`: 9,490건, 75.23MB
- `parent-saju-cache-1975.jsonl`: 9,490건, 73.83MB
- `parent-saju-cache-1976.jsonl`: 9,516건, 74.95MB
- `parent-saju-cache-1977.jsonl`: 9,490건, 75.28MB
- `parent-saju-cache-1978.jsonl`: 9,490건, 75.28MB
- `parent-saju-cache-1979.jsonl`: 9,490건, 75.05MB
- `parent-saju-cache-1980.jsonl`: 9,516건, 75.38MB
- `parent-saju-cache-1981.jsonl`: 9,490건, 73.83MB
- `parent-saju-cache-1982.jsonl`: 9,490건, 74.86MB
- `parent-saju-cache-1983.jsonl`: 9,490건, 75.05MB
- `parent-saju-cache-1984.jsonl`: 9,516건, 73.84MB
- `parent-saju-cache-1985.jsonl`: 9,490건, 74.95MB
- `parent-saju-cache-1986.jsonl`: 9,490건, 75.06MB
- `parent-saju-cache-1987.jsonl`: 9,490건, 73.88MB
- `parent-saju-cache-1988.jsonl`: 9,516건, 75.02MB
- `parent-saju-cache-1989.jsonl`: 9,490건, 75.22MB
- `parent-saju-cache-1990.jsonl`: 9,490건, 75.17MB
- `parent-saju-cache-1991.jsonl`: 9,490건, 74.86MB
- `parent-saju-cache-1992.jsonl`: 9,516건, 75.51MB
- `parent-saju-cache-1993.jsonl`: 9,490건, 73.81MB
- `parent-saju-cache-1994.jsonl`: 9,490건, 74.8MB
- `parent-saju-cache-1995.jsonl`: 9,490건, 75MB
- `parent-saju-cache-1996.jsonl`: 9,516건, 73.7MB
- `parent-saju-cache-1997.jsonl`: 9,490건, 75.06MB
- `parent-saju-cache-1998.jsonl`: 9,490건, 75.05MB
- `parent-saju-cache-1999.jsonl`: 9,490건, 73.82MB
- `parent-saju-cache-2000.jsonl`: 9,516건, 74.94MB
- `parent-saju-cache-2001.jsonl`: 9,490건, 75.14MB
- `parent-saju-cache-2002.jsonl`: 9,490건, 75.31MB
- `parent-saju-cache-2003.jsonl`: 9,490건, 74.89MB
- `parent-saju-cache-2004.jsonl`: 9,516건, 75.39MB
- `parent-saju-cache-2005.jsonl`: 9,490건, 73.68MB
- `parent-saju-cache-2006.jsonl`: 9,490건, 74.77MB
- `parent-saju-cache-2007.jsonl`: 9,490건, 75.1MB
- `parent-saju-cache-2008.jsonl`: 9,516건, 73.82MB
- `parent-saju-cache-2009.jsonl`: 9,490건, 75.01MB
- `parent-saju-cache-2010.jsonl`: 9,464건, 74.77MB

## 캐시 key 형식

```
role_YYYY-MM-DD_hour
```

예:

```
mother_1988-04-12_unknown-hour
father_1985-10-03_인시-03-30-05-29-
```

## 레코드 구조

```json
{
  "key": "...",
  "input": {
    "role": "mother",
    "birthDate": "1988-04-12",
    "hour": "시간 모름",
    "calendar": "solar"
  },
  "summary": {
    "ilgan": "정",
    "ilju": "정축",
    "topAxes": ["온기", "중심", "일관"]
  },
  "parentSaju": {},
  "axes": {}
}
```

## 생성 결과

- 생성 성공: 579,254건
- 실패: 0건
- 소요 시간: 124.458초
- 평균 속도: 4654.2건/초
- 총 용량: 4560.3MB
