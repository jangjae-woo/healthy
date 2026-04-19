# 아키텍처

`payapp-common-simple` 내부 구조와 데이터 흐름.

---

## 모듈 구조

```
payapp_common_simple/
├── __init__.py       # 공개 API (PayAppClient, PayAppCallbackRouter 등)
├── client.py         # PayApp REST API 클라이언트
├── callback.py       # 콜백 라우터 (핸들러 등록/디스패치)
├── security.py       # HMAC, linkval, IP 검증
├── models.py         # 데이터 모델 (PayAppConfig, PaymentEvent 등)
├── parser.py         # URL-encoded 응답 파서
├── constants.py      # API URL, pay_state/pay_type 상수
└── py.typed          # 타입 힌트 마커
```

**설계 원칙**:
- 특정 프로젝트/프레임워크에 종속되지 않음
- FastAPI 의존성은 `fastapi_router()` 메서드 내부에서만 import (optional)
- 모든 공개 API에 타입 힌트 포함

---

## 결제 플로우

```
┌─────────────┐     ┌────────────────┐     ┌──────────┐
│  서비스 서버  │────→│ PayAppClient  │────→│ PayApp   │
│ (FastAPI)   │     │ (라이브러리)    │     │ REST API │
└─────────────┘     └────────────────┘     └──────────┘
       │                                         │
       │  1. create_payment()                    │
       │     → payrequest API 호출                │
       │     ← pay_url (결제창 URL)               │
       │                                         │
       │  2. 고객에게 pay_url 전달                │
       │     → 고객이 결제창에서 결제              │
       │                                         │
       │  3. feedbackurl 콜백                     │
       │     ← POST /api/payment/callback         │
       │                                         │
       ▼                                         │
┌─────────────────────┐                          │
│ PayAppCallbackRouter│◀─────────────────────────┘
│ (라이브러리)         │
├─────────────────────┤
│ 1. Content-Type 검증│
│ 2. IP 검증          │
│ 3. linkval 검증     │
│ 4. HMAC 서명 검증    │
│ 5. 중복 처리 방지     │
│ 6. 입력값 범위 검증   │
│ 7. 서비스별 라우팅    │
│ 8. 핸들러 호출        │
│ 9. "SUCCESS" 응답    │
└─────────────────────┘
       │
       ▼
  서비스별 핸들러
  (DB 업데이트 등)
```

---

## 멀티 서비스 라우팅 구조

```
PayApp 계정 (1개)
    │
    │  공통 통보 URL: https://example.com/api/payment/callback
    │
    ▼
┌──────────────────────────────┐
│     PayAppCallbackRouter     │
│     (콜백 게이트웨이)          │
├──────────────────────────────┤
│ var1 파싱: "main:shop1"      │
│          → service=main      │
│            shop_id=shop1     │
└──────────┬───────────────────┘
           │
     ┌─────┼──────┐
     ▼     ▼      ▼
   main   mobile  enterprise
  핸들러   핸들러    핸들러
```

**var1 인코딩 규칙**:
- `service_name=""` (미지정): `var1 = shop_id`
- `service_name="main"`: `var1 = "main:shop_id"`

**콜백 시 디스패치 우선순위**:
1. `(state, service_name)` 일치 핸들러
2. `(state, "*")` 와일드카드 핸들러
3. 없으면 로그만 남기고 `SUCCESS` 반환

---

## 보안 파이프라인

`handle_callback()` 내부의 검증 순서 (실패 시 즉시 중단):

```
┌─────────────────────────────┐
│ 1. Content-Type 검증         │ ← application/x-www-form-urlencoded
│    (fastapi_router만 해당)    │
└─────────────────────────────┘
              ↓
┌─────────────────────────────┐
│ 2. IP 허용 목록              │ ← allowed_ips 설정 시에만
└─────────────────────────────┘
              ↓
┌─────────────────────────────┐
│ 3. linkval 검증              │ ← hmac.compare_digest()
└─────────────────────────────┘
              ↓
┌─────────────────────────────┐
│ 4. payload 파싱              │ ← parse_callback_payload()
└─────────────────────────────┘
              ↓
┌─────────────────────────────┐
│ 5. HMAC 서명 검증            │ ← secret_key 설정 시에만
│    (var3 누락도 거부)        │
└─────────────────────────────┘
              ↓
┌─────────────────────────────┐
│ 6. 중복 처리 방지             │ ← dedup_checker 설정 시에만
└─────────────────────────────┘
              ↓
┌─────────────────────────────┐
│ 7. 입력값 범위 검증            │ ← price 0~999_999_999
│                             │ ← shop_id ≤255, service_name ≤64
└─────────────────────────────┘
              ↓
┌─────────────────────────────┐
│ 8. 핸들러 디스패치            │
└─────────────────────────────┘
```

---

## 핵심 설계 결정

### payment_id 컬럼 오버로드 패턴

사용자 측 DB에서 결제 식별을 단일 컬럼으로 처리하는 패턴 권장:

| 단계 | `payment_id` 값 | 용도 |
|---|---|---|
| pending (주문 생성) | `order_id` (`pa_xxxxxxxx`) | PayApp이 아직 mul_no 발급 전 |
| 결제 완료 | `mul_no` | 취소/환불 API 호출 시 사용 |

라이브러리는 이 패턴을 강제하지 않음 — 사용자가 자유롭게 DB 스키마 설계 가능.

### 핸들러 실패 시 FAIL 반환

```
핸들러 내 예외 → (False, "HANDLER_ERROR") → HTTP 400 FAIL
```

PayApp은 `checkretry=y` 설정 시 FAIL 응답을 받으면 최대 10회 재시도.
DB 쓰기 실패 등 복구 가능한 오류에 대해 자동 재시도가 작동.

### linkval 빈 값 방어

```python
def verify_linkval(received, expected):
    if not expected:
        return False   # ← 미설정이면 무조건 거부
```

개발 중 `.env` 로드 누락 등으로 `link_val`이 빈 문자열이 되는 경우를 대비.
"빈 문자열 == 빈 문자열"로 우회되는 것을 차단.

### Content-Type 검증

```python
if "application/x-www-form-urlencoded" not in content_type:
    return PlainTextResponse("FAIL", 400)
```

PayApp은 form-urlencoded만 보내므로, 다른 Content-Type은 일단 거부.
JSON payload로 위장한 공격 요청 차단.

### 입력값 범위 검증

| 필드 | 제한 | 이유 |
|---|---|---|
| `price` | 0 ~ 999,999,999 | 음수/오버플로우 방지 |
| `shop_id` | ≤ 255자 | DB `VARCHAR(255)` 대응 |
| `service_name` | ≤ 64자 | 라우팅 키 안정성 |

---

## 의존성

### 필수
- `httpx >= 0.28` — PayApp REST API 호출

### 선택 (`fastapi` extras)
- `fastapi >= 0.115` — `fastapi_router()` 메서드용

### 개발 (`dev` extras)
- `pytest >= 8.0`
- `pytest-asyncio >= 0.24`
- `respx >= 0.22` (HTTP mock)
- `fastapi`, `httpx`

### Python 버전
- 3.11 이상 — `X | Y` 타입 문법, `asyncio.TaskGroup` 등 사용

---

## 확장성

### 다른 결제 게이트웨이로 확장

`PayAppCallbackRouter`의 패턴은 다른 PG사에도 적용 가능:
- 서명 검증 로직만 교체 (`verify_signature`)
- `parse_callback_payload`를 PG사별로 구현
- 핸들러 디스패치/라우팅 구조는 재사용

이 라이브러리는 PayApp 전용이지만, 참고 구조로 유용.

### 비동기 태스크 큐 연동

콜백 핸들러에서 바로 비즈니스 로직을 처리하는 대신,
Celery/Arq/RQ에 작업을 등록하고 바로 SUCCESS 응답하는 패턴:

```python
@cb.on_completed()
async def handle(event):
    await task_queue.enqueue("process_payment", event.mul_no)
    # 즉시 SUCCESS → PayApp 타임아웃 방지
```

대량 트래픽 환경에서 권장.
