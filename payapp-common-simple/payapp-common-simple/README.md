# payapp-common-simple

PayApp 결제 API 통합 라이브러리.

하나의 PayApp 계정으로 여러 서비스의 결제를 통합 관리할 수 있는 경량 Python 라이브러리.
결제 요청, 콜백 수신, 서비스별 라우팅, 보안 검증을 단일 패키지로 제공한다.
특정 프로젝트에 종속되지 않는 순수 PayApp 연동 라이브러리.

---

## 주요 기능

- **PayApp REST API 클라이언트** — 결제 요청/조회/취소
- **콜백 라우터** — FastAPI 자동 연동 + 비동기 핸들러 등록
- **멀티 서비스 라우팅** — 하나의 feedbackurl로 여러 서비스의 결제를 동시 처리
- **보안 다층 방어** — linkval 검증 / HMAC-SHA256 서명 / IP 허용 목록 / 중복 처리 방지
- **타입 힌트 완비** — `py.typed` 포함, mypy/pyright 지원

---

## 설치

```bash
# PyPI (배포 예정)
pip install payapp-common-simple

# FastAPI 콜백 라우터 사용 시
pip install "payapp-common-simple[fastapi]"

# 로컬 개발 (editable)
pip install -e /path/to/payapp-common-simple
```

**요구사항**: Python 3.11+, httpx >= 0.28

---

## 빠른 시작

### 1단계: 설정 생성

```python
from payapp_common_simple import PayAppConfig

config = PayAppConfig(
    user_id="your_payapp_id",         # PayApp 로그인 아이디
    link_key="your_link_key",         # PayApp 설정 > 연동정보 > 연동 KEY
    link_val="your_link_val",         # PayApp 설정 > 연동정보 > 연동 VALUE
    callback_url="https://example.com/api/payment/callback",
    service_name="main",              # (선택) 콜백 라우팅용 서비스 식별자
)
```

### 2단계: 결제 요청

```python
from payapp_common_simple import PayAppClient

client = PayAppClient(config)

order = await client.create_payment(
    shop_id="shop_001",
    goods_name="프리미엄 플랜",
    price=29900,
    return_url="https://example.com/payment/complete",
)

print(order.pay_url)   # 고객에게 전달할 결제창 URL
print(order.mul_no)    # PayApp 거래번호
print(order.order_id)  # 내부 주문 ID (자동 생성)
```

### 3단계: 콜백 수신 (FastAPI)

```python
from fastapi import FastAPI
from payapp_common_simple import PayAppCallbackRouter, PaymentEvent

app = FastAPI()

cb = PayAppCallbackRouter(link_val="your_link_val")

@cb.on_completed()
async def handle_payment(event: PaymentEvent):
    print(f"결제 완료! 거래번호={event.mul_no}, 금액={event.price}원")

app.include_router(cb.fastapi_router())
```

이것만으로 결제 요청 → 결제창 → 콜백 수신까지 동작한다.

---

## 문서

상세 문서는 [`docs/`](./docs/) 폴더에 있음:

- [`docs/usage_guide.md`](./docs/usage_guide.md) — 전체 사용법 가이드 (설정/결제/콜백/멀티서비스)
- [`docs/security_guide.md`](./docs/security_guide.md) — 보안 모범 사례 (HMAC/IP/linkval/중복처리)
- [`docs/api_reference.md`](./docs/api_reference.md) — 데이터 모델 및 API 레퍼런스
- [`docs/architecture.md`](./docs/architecture.md) — 아키텍처 설계

---

## 테스트

```bash
pip install -e ".[dev]"
pytest tests/ -v
```

---

## 라이선스

MIT License

---

*PayApp 공식 문서: https://www.payapp.kr/dev_center/dev_center01.html*
