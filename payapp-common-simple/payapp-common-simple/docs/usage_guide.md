# 사용법 가이드

`payapp-common-simple` 라이브러리의 전체 사용법을 다룬다.
빠른 시작은 [루트 README](../README.md)를 참조.

---

## 목차

1. [설정 (PayAppConfig)](#설정-payappconfig)
2. [결제 요청 (PayAppClient)](#결제-요청-payappclient)
3. [콜백 수신 (PayAppCallbackRouter)](#콜백-수신-payappcallbackrouter)
4. [멀티 서비스 라우팅](#멀티-서비스-라우팅)
5. [오류 처리](#오류-처리)
6. [실전 통합 예시](#실전-통합-예시)

---

## 설정 (PayAppConfig)

```python
from payapp_common_simple import PayAppConfig

config = PayAppConfig(
    # 필수
    user_id="your_payapp_id",         # PayApp 판매자 아이디
    link_key="your_link_key",         # PayApp 설정 > 연동정보 > 연동 KEY
    link_val="your_link_val",         # PayApp 설정 > 연동정보 > 연동 VALUE
    callback_url="https://example.com/api/payment/callback",

    # 선택
    secret_key="your_hmac_secret",    # HMAC 서명용 비밀키 (빈 문자열=비활성화)
    service_name="main",              # 서비스 식별자 (멀티 서비스 라우팅에 사용)
    allowed_ips=["211.41.0.0/16"],    # 콜백 허용 IP (빈 리스트=비활성화)
)
```

### 설정값 발급 방법

1. [payapp.kr](https://payapp.kr) 로그인
2. **설정 > 연동정보** 메뉴에서 확인:
   - `user_id`: 로그인 아이디
   - `link_key`: 연동 KEY
   - `link_val`: 연동 VALUE
3. **공통 통보 URL**에 `callback_url`과 동일한 주소 입력

### 환경변수로 관리 권장

보안상 실제 값은 `.env` 파일에 두고 `pydantic-settings` 등으로 로드:

```python
# .env (gitignore에 포함시킬 것)
PAYAPP_USER_ID=your_payapp_id
PAYAPP_LINK_KEY=xxxxxxxxxxxx
PAYAPP_LINK_VAL=xxxxxxxxxxxx
PAYAPP_SECRET_KEY=xxxxxxxxxxxx
PAYAPP_CALLBACK_URL=https://example.com/api/payment/callback
```

```python
import os
from payapp_common_simple import PayAppConfig

config = PayAppConfig(
    user_id=os.environ["PAYAPP_USER_ID"],
    link_key=os.environ["PAYAPP_LINK_KEY"],
    link_val=os.environ["PAYAPP_LINK_VAL"],
    secret_key=os.environ.get("PAYAPP_SECRET_KEY", ""),
    callback_url=os.environ["PAYAPP_CALLBACK_URL"],
)
```

---

## 결제 요청 (PayAppClient)

### 결제 생성

```python
from payapp_common_simple import PayAppClient, PayAppError

client = PayAppClient(config)

try:
    order = await client.create_payment(
        shop_id="shop_001",           # 쇼핑몰/판매자 고유 ID
        goods_name="크레딧 100건",     # 상품명 (결제창에 표시)
        price=9900,                   # 결제 금액 (원)
        return_url="https://example.com/complete",  # 결제 후 돌아갈 URL
        order_id="my_order_123",      # 주문 ID (미지정 시 자동 생성)
    )
    # order.pay_url  → 결제창 URL (고객에게 전달)
    # order.mul_no   → PayApp 거래번호 (콜백에서 이 번호로 매칭)
    # order.order_id → 내부 주문 ID
except PayAppError as e:
    print(f"결제 요청 실패: {e}")
```

### 결제 상태 조회

```python
result = await client.check_status(mul_no="12345")
# result = {"pay_state": "4", "goodname": "...", "price": "9900", ...}

if result.get("pay_state") == "4":
    print("결제 완료")
```

### 결제 취소

```python
success = await client.cancel_payment(mul_no="12345")
if success:
    print("취소 성공")
```

### 타임아웃 설정

```python
client = PayAppClient(config, timeout=30.0)  # 기본값: 15초
```

---

## 콜백 수신 (PayAppCallbackRouter)

PayApp은 결제 완료/취소/환불 시 등록된 URL로 POST 요청을 보낸다.
`PayAppCallbackRouter`가 이 요청을 수신하고, 등록된 핸들러에 전달한다.

### 기본 사용법 (FastAPI)

```python
from payapp_common_simple import PayAppCallbackRouter, PaymentEvent

cb = PayAppCallbackRouter(link_val="your_link_val")

@cb.on_completed()
async def on_payment_done(event: PaymentEvent):
    """결제 완료 (pay_state=4)"""
    print(f"결제 완료: {event.mul_no}, {event.price}원, {event.pay_method}")
    # event.shop_id    → 쇼핑몰 ID
    # event.order_id   → 주문 ID (var2)
    # event.mul_no     → PayApp 거래번호
    # event.price      → 결제 금액
    # event.pay_method → "신용카드", "카카오페이" 등

@cb.on_cancelled()
async def on_payment_cancelled(event: PaymentEvent):
    """결제 취소 (pay_state=8/16/32)"""
    print(f"결제 취소: {event.mul_no}")

@cb.on_refunded()
async def on_payment_refunded(event: PaymentEvent):
    """결제 환불 (pay_state=9/64)"""
    print(f"결제 환불: {event.mul_no}")

# FastAPI 앱에 라우터 등록
app.include_router(cb.fastapi_router())
# 기본 경로: POST /api/payment/callback
```

### 콜백 경로 변경

```python
app.include_router(cb.fastapi_router(path="/webhook/payapp"))
# → POST /webhook/payapp
```

### FastAPI 없이 사용 (수동 처리)

```python
cb = PayAppCallbackRouter(link_val="your_link_val")

@cb.on_completed()
async def handle(event):
    ...

payload = {"pay_state": "4", "mul_no": "12345", "linkval": "...", ...}
success, message = await cb.handle_callback(payload, client_ip="1.2.3.4")
# success=True이면 PayApp에 "SUCCESS" 응답 반환
```

---

## 멀티 서비스 라우팅

하나의 PayApp 계정(= 하나의 공통 통보 URL)으로 여러 서비스의 결제를 처리할 때 사용.

### 작동 원리

1. 결제 요청 시 `var1`에 `"{service_name}:{shop_id}"` 형태로 자동 인코딩
2. 콜백 수신 시 `var1`을 파싱하여 `service_name` 추출
3. 해당 서비스에 등록된 핸들러에 이벤트 전달

```
결제 요청: var1="main:shop_001"
                     ↓
콜백 수신: service_name="main", shop_id="shop_001"
                     ↓
          @cb.on_completed("main") 핸들러 호출
```

### 서비스별 핸들러 등록

```python
cb = PayAppCallbackRouter(link_val="your_link_val")

@cb.on_completed("main")
async def handle_main(event: PaymentEvent):
    async with db_session() as db:
        await complete_main_purchase(db, event.mul_no)

@cb.on_completed("mobile")
async def handle_mobile(event: PaymentEvent):
    async with db_session() as db:
        await complete_mobile_purchase(db, event.mul_no)

@cb.on_completed("enterprise")
async def handle_enterprise(event: PaymentEvent):
    async with db_session() as db:
        await complete_enterprise_purchase(db, event.mul_no)

app.include_router(cb.fastapi_router())
```

### 와일드카드 핸들러 (폴백)

서비스별 핸들러가 없으면 와일드카드 핸들러가 호출된다.

```python
# service 인자 생략 = 와일드카드 (모든 서비스에 매칭)
@cb.on_completed()
async def handle_all(event: PaymentEvent):
    print(f"서비스={event.service_name}, 쇼핑몰={event.shop_id}")
```

우선순위: **서비스별 핸들러 > 와일드카드 핸들러**

### 각 서비스의 PayAppClient 설정

```python
# 메인 서비스
main_config = PayAppConfig(
    user_id="your_payapp_id",
    link_key="...", link_val="...",
    callback_url="https://example.com/api/payment/callback",
    service_name="main",
)
main_client = PayAppClient(main_config)

# 모바일 서비스 (같은 PayApp 계정)
mobile_config = PayAppConfig(
    user_id="your_payapp_id",                   # 같은 PayApp 계정
    link_key="...", link_val="...",
    callback_url="https://example.com/api/payment/callback",  # 같은 콜백 URL
    service_name="mobile",                      # 다른 서비스 식별자
)
mobile_client = PayAppClient(mobile_config)
```

---

## 오류 처리

### 클라이언트 오류

`PayAppClient`의 모든 API 호출은 `PayAppError`를 발생시킬 수 있음:

```python
from payapp_common_simple import PayAppError

try:
    order = await client.create_payment(...)
except PayAppError as e:
    # 네트워크 오류 / PayApp API 오류 응답 (state != "1")
    logger.error("PayApp 호출 실패: %s", e)
```

### 콜백 핸들러 오류

핸들러 내부에서 예외가 발생하면 라우터는 `FAIL` 응답을 반환하여 PayApp의
재시도 로직을 유도한다 (`checkretry=y` 설정 시).

```python
@cb.on_completed()
async def handle(event):
    try:
        await update_database(event)
    except DatabaseError:
        raise  # 그대로 전파 → 라우터가 "FAIL" 응답 → PayApp 재시도
```

### 콜백 응답 규약

| `handle_callback()` 반환 | HTTP 응답 | PayApp 동작 |
|---|---|---|
| `(True, "OK")` | 200 `SUCCESS` | 완료 처리 |
| `(True, "DUPLICATE_IGNORED")` | 200 `SUCCESS` | 완료 처리 (중복 감지) |
| `(False, "LINKVAL_MISMATCH")` | 400 `FAIL` | 재시도 안 함 |
| `(False, "IP_DENIED")` | 400 `FAIL` | 재시도 안 함 |
| `(False, "SIGNATURE_MISMATCH")` | 400 `FAIL` | 재시도 안 함 |
| `(False, "HANDLER_ERROR")` | 400 `FAIL` | **재시도** (`checkretry=y`) |

---

## 실전 통합 예시

### FastAPI + SQLAlchemy + 멀티 서비스

```python
import os
from fastapi import FastAPI, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from payapp_common_simple import (
    PayAppConfig, PayAppClient, PayAppCallbackRouter, PaymentEvent,
)

app = FastAPI()

# 설정 로드
config = PayAppConfig(
    user_id=os.environ["PAYAPP_USER_ID"],
    link_key=os.environ["PAYAPP_LINK_KEY"],
    link_val=os.environ["PAYAPP_LINK_VAL"],
    secret_key=os.environ["PAYAPP_SECRET_KEY"],
    callback_url=os.environ["PAYAPP_CALLBACK_URL"],
    allowed_ips=["211.41.0.0/16"],
)
client = PayAppClient(config)


async def is_already_processed(mul_no: str) -> bool:
    """DB에서 이미 처리된 거래인지 확인."""
    async with db_session() as db:
        purchase = await db.get(Purchase, {"payment_id": mul_no})
        return purchase is not None and purchase.status == "completed"


cb = PayAppCallbackRouter(
    link_val=config.link_val,
    secret_key=config.secret_key,
    allowed_ips=config.allowed_ips,
    dedup_checker=is_already_processed,
)


@app.post("/api/payment/create")
async def create_payment_order(
    body: dict,
    user: User = Depends(require_login),
    db: AsyncSession = Depends(get_db),
):
    """결제 요청 생성."""
    pending = Purchase(
        user_id=user.id,
        amount=body["price"],
        status="pending",
    )
    db.add(pending)
    await db.flush()

    order = await client.create_payment(
        shop_id=str(user.id),
        goods_name=body["goods_name"],
        price=body["price"],
        return_url=f"{PUBLIC_URL}/payment/complete",
        order_id=f"ord_{pending.id}",
    )

    pending.payment_id = order.mul_no
    await db.commit()

    return {"pay_url": order.pay_url, "mul_no": order.mul_no}


@cb.on_completed()
async def on_payment_completed(event: PaymentEvent):
    """결제 완료 콜백."""
    async with db_session() as db:
        purchase = await db.scalar(
            select(Purchase).where(Purchase.payment_id == event.mul_no)
        )
        if purchase and purchase.status == "pending":
            purchase.status = "completed"
            purchase.completed_at = datetime.utcnow()
            await db.commit()


@cb.on_cancelled()
async def on_payment_cancelled(event: PaymentEvent):
    """결제 취소 콜백."""
    async with db_session() as db:
        purchase = await db.scalar(
            select(Purchase).where(Purchase.payment_id == event.mul_no)
        )
        if purchase:
            purchase.status = "cancelled"
            await db.commit()


app.include_router(cb.fastapi_router())
```

---

## 관련 문서

- [보안 가이드](./security_guide.md) — HMAC/IP/linkval 보안 모범 사례
- [API 레퍼런스](./api_reference.md) — 데이터 모델 및 API 상세
- [아키텍처](./architecture.md) — 내부 구조 및 데이터 흐름
