# API 레퍼런스

`payapp-common-simple`의 모든 공개 API.

---

## 목차

1. [데이터 모델](#데이터-모델)
2. [PayAppClient](#payappclient)
3. [PayAppCallbackRouter](#payappcallbackrouter)
4. [보안 유틸리티](#보안-유틸리티)
5. [파서/콜백 유틸](#파서-콜백-유틸)
6. [상수](#상수)

---

## 데이터 모델

### `PayAppConfig`

```python
@dataclass
class PayAppConfig:
    user_id: str
    link_key: str
    link_val: str
    callback_url: str
    secret_key: str = ""
    service_name: str = ""
    allowed_ips: list[str] = field(default_factory=list)
```

| 필드 | 타입 | 필수 | 설명 |
|---|---|:---:|---|
| `user_id` | str | O | PayApp 판매자 아이디 |
| `link_key` | str | O | PayApp 연동 KEY |
| `link_val` | str | O | PayApp 연동 VALUE |
| `callback_url` | str | O | feedbackurl 전체 URL |
| `secret_key` | str | - | HMAC 비밀키 (빈 문자열=비활성화) |
| `service_name` | str | - | 서비스 식별자 (멀티 서비스 라우팅) |
| `allowed_ips` | list[str] | - | 콜백 허용 IP 목록 (빈 리스트=비활성화) |

### `PaymentEvent`

콜백 핸들러가 수신하는 이벤트 데이터.

```python
@dataclass
class PaymentEvent:
    mul_no: str
    pay_state: int
    pay_state_label: str
    service_name: str
    shop_id: str
    order_id: str
    price: int
    goods_name: str
    pay_type: str
    pay_method: str
    raw_payload: dict
```

| 필드 | 타입 | 설명 |
|---|---|---|
| `mul_no` | str | PayApp 거래번호 |
| `pay_state` | int | 결제 상태 코드 (1/4/8/9/10/16/32/64) |
| `pay_state_label` | str | 상태 라벨 ("completed", "cancelled" 등) |
| `service_name` | str | 서비스 식별자 (var1에서 추출) |
| `shop_id` | str | 쇼핑몰/판매자 ID (var1에서 추출) |
| `order_id` | str | 주문 ID (var2) |
| `price` | int | 결제 금액 (원) |
| `goods_name` | str | 상품명 |
| `pay_type` | str | 결제수단 코드 ("1", "15" 등) |
| `pay_method` | str | 결제수단 한글명 ("신용카드", "카카오페이" 등) |
| `raw_payload` | dict | PayApp 원본 POST 데이터 |

### `PayAppOrder`

`create_payment()` 결과.

```python
@dataclass
class PayAppOrder:
    order_id: str  # 내부 주문 ID
    mul_no: str    # PayApp 거래번호
    pay_url: str   # 결제창 URL (고객에게 전달)
```

---

## PayAppClient

### `__init__(config, timeout=15.0)`

```python
client = PayAppClient(config, timeout=15.0)
```

### `async create_payment(shop_id, goods_name, price, return_url, order_id=None) -> PayAppOrder`

결제 요청 생성.

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `shop_id` | str | 쇼핑몰/판매자 고유 ID |
| `goods_name` | str | 상품명 |
| `price` | int | 결제 금액 (원) |
| `return_url` | str | 결제 후 돌아갈 URL |
| `order_id` | str \| None | 주문 ID (None이면 `pa_xxxxxxxx` 자동 생성) |

**Raises**: `PayAppError` (API 호출 실패 또는 state != "1")

### `async check_status(mul_no) -> dict`

결제 상태 조회. PayApp 응답을 파싱한 dict 반환.

### `async cancel_payment(mul_no) -> bool`

결제 취소 요청. 성공 시 `True`, 실패 시 `False`.

### `PayAppError(Exception)`

PayApp API 오류.

---

## PayAppCallbackRouter

### `__init__(link_val, secret_key="", allowed_ips=None, dedup_checker=None)`

```python
cb = PayAppCallbackRouter(
    link_val="your_link_val",
    secret_key="",                 # 빈 값=HMAC 검증 비활성화
    allowed_ips=None,              # None=IP 검증 비활성화
    dedup_checker=None,            # None=중복 검사 비활성화
)
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `link_val` | str | PayApp 연동 VALUE (필수) |
| `secret_key` | str | HMAC 비밀키 (빈 문자열=비활성화) |
| `allowed_ips` | list[str] \| None | 허용 IP 목록 (CIDR 지원) |
| `dedup_checker` | `async (mul_no) -> bool` | 중복 처리 방지 함수 |

### 데코레이터 — 핸들러 등록

```python
@cb.on_completed(service=None)     # pay_state=4
@cb.on_cancelled(service=None)     # pay_state=8/16/32
@cb.on_refunded(service=None)      # pay_state=9/64
```

`service=None` → 와일드카드, `service="main"` → 특정 서비스 전용.

### `register_handler(state, service, handler)`

프로그래밍 방식 핸들러 등록.

- `state`: `"completed"` | `"cancelled"` | `"refunded"`
- `service`: 서비스명 또는 `"*"` (와일드카드)
- `handler`: `async callable(PaymentEvent) -> None`

### `async handle_callback(payload, client_ip="") -> tuple[bool, str]`

콜백 요청 수동 처리. 프레임워크 없이 사용할 때.

**반환값**:

| 반환 | 의미 |
|---|---|
| `(True, "OK")` | 정상 처리 |
| `(True, "DUPLICATE_IGNORED")` | 중복 감지, 핸들러 건너뜀 |
| `(False, "IP_DENIED")` | IP 거부 |
| `(False, "LINKVAL_MISMATCH")` | linkval 불일치 |
| `(False, "SIGNATURE_REQUIRED")` | HMAC 설정됐으나 var3 누락 |
| `(False, "SIGNATURE_MISMATCH")` | HMAC 서명 불일치 |
| `(False, "INVALID_PRICE")` | price 범위 초과 |
| `(False, "INVALID_PAYLOAD")` | shop_id / service_name 길이 초과 |
| `(False, "HANDLER_ERROR")` | 핸들러 내부 예외 |

### `fastapi_router(path="/api/payment/callback")`

FastAPI APIRouter 생성. `app.include_router()`로 등록.

**Raises**: `ImportError` (fastapi 미설치)

---

## 보안 유틸리티

`payapp_common_simple.security` 모듈.

### `sign_payment(secret_key, mul_no, price, shop_id) -> str`

HMAC-SHA256 서명 생성. 서명 대상: `"{mul_no}|{price}|{shop_id}"`.

### `verify_signature(secret_key, mul_no, price, shop_id, received_signature) -> bool`

서명 검증. `price`는 str 또는 int 허용.

### `verify_linkval(received_linkval, expected_linkval) -> bool`

linkval 일치 여부. 상수 시간 비교. `expected_linkval`이 빈 값이면 **무조건 False**.

### `check_ip_allowed(client_ip, allowed_ips) -> bool`

IP 허용 여부. CIDR 지원. `allowed_ips`가 빈 리스트면 **무조건 True** (검증 비활성화).

---

## 파서 / 콜백 유틸

### `parse_callback_payload(payload: dict) -> PaymentEvent`

PayApp feedbackurl POST 데이터를 `PaymentEvent`로 변환.

```python
from payapp_common_simple import parse_callback_payload

event = parse_callback_payload({
    "pay_state": "4",
    "mul_no": "12345",
    "var1": "main:shop_001",
    "var2": "pa_abc",
    "price": "9900",
    "goodname": "프리미엄 플랜",
    "pay_type": "1",
})
# event.service_name == "main"
# event.shop_id == "shop_001"
# event.price == 9900
# event.pay_method == "신용카드"
```

### `payapp_common_simple.parser.parse_response(text: str) -> dict[str, str]`

PayApp URL-encoded 응답을 dict로 변환 (내부 사용).

---

## 상수

`payapp_common_simple.constants` 모듈.

### `PAYAPP_API_URL`

```python
"https://api.payapp.kr/oapi/apiLoad.html"
```

### `PAY_STATE_MAP`

| 코드 | 라벨 | 그룹 |
|:---:|---|---|
| 1 | `"requested"` | pending |
| 4 | `"completed"` | completed |
| 8 | `"cancelled"` | cancelled |
| 9 | `"refunded"` | refunded |
| 10 | `"pending"` | pending |
| 16 | `"cancelled"` | cancelled |
| 32 | `"cancelled"` | cancelled |
| 64 | `"refunded"` | refunded |

### `PAY_TYPE_LABELS`

| 코드 | 결제수단 |
|:---:|---|
| 1 | 신용카드 |
| 2 | 휴대전화 |
| 4 | 대면결제 |
| 6 | 계좌이체 |
| 7 | 가상계좌 |
| 15 | 카카오페이 |
| 16 | 네이버페이 |
| 21 | 스마일페이 |
| 23 | 애플페이 |
| 25 | 토스페이 |

### 상태 그룹 set

```python
PAY_STATE_COMPLETED = {4}
PAY_STATE_CANCELLED = {8, 16, 32}
PAY_STATE_REFUNDED = {9, 64}
PAY_STATE_PENDING = {1, 10}
```
