# 보안 가이드

결제 콜백은 위변조·재전송·중복 처리 공격의 표적이 된다.
이 라이브러리는 4계층 방어(linkval / HMAC / IP / 중복처리)를 제공하며,
**운영 환경에서는 4개 모두 활성화할 것을 권장**한다.

---

## 목차

1. [다층 방어 개요](#다층-방어-개요)
2. [linkval 검증](#1-linkval-검증-기본)
3. [HMAC-SHA256 서명](#2-hmac-sha256-서명-권장)
4. [IP 허용 목록](#3-ip-허용-목록-선택)
5. [중복 처리 방지](#4-중복-처리-방지-선택)
6. [권장 조합](#권장-조합)
7. [비밀키 관리](#비밀키-관리)

---

## 다층 방어 개요

| 방어선 | 기본값 | 권장 환경 | 차단 대상 |
|---|:---:|:---:|---|
| linkval 검증 | ⭕ 필수 | 전 환경 | 인증되지 않은 콜백 |
| HMAC-SHA256 서명 | ❌ 선택 | ⭐ 운영 | 금액/shop_id 위변조 |
| IP 허용 목록 | ❌ 선택 | 권장 | 비정상 IP의 콜백 요청 |
| 중복 처리 방지 | ❌ 선택 | ⭐ 운영 | 중복 지급 / 재시도 공격 |

---

## 1. linkval 검증 (기본)

PayApp 연동 VALUE 일치 여부로 콜백 요청의 진위를 검증한다.
타이밍 공격 방지를 위해 `hmac.compare_digest()` 사용.

```python
cb = PayAppCallbackRouter(link_val="your_link_val")
# → linkval 불일치 시 HTTP 400 "FAIL" 응답
```

**주의점**:
- `link_val`이 빈 문자열이면 라이브러리는 **보안을 위해 모든 요청을 거부**한다.
- `.env`에 실제 값이 로드되었는지 앱 부팅 시 검증 권장.

---

## 2. HMAC-SHA256 서명 (권장)

결제 요청 시 `var3`에 HMAC 서명을 저장하고, 콜백 수신 시 검증하여 위변조를 방지한다.

```python
config = PayAppConfig(
    ...,
    secret_key="your_super_secret_key_123",  # HMAC 비밀키 설정
)
client = PayAppClient(config)

# 결제 요청 시 자동으로 var3에 HMAC 서명 포함
order = await client.create_payment(...)

# 콜백 수신 시 자동으로 서명 검증
cb = PayAppCallbackRouter(
    link_val="...",
    secret_key="your_super_secret_key_123",  # 같은 키
)
# → 서명 불일치 시 HTTP 400 "FAIL" 응답
# → var3 누락 시에도 거부 (SIGNATURE_REQUIRED)
```

**서명 대상**: `"{mul_no}|{price}|{shop_id}"` → `HMAC-SHA256(secret_key, ...)`

**왜 HMAC이 필요한가**:
- linkval만으로는 **금액/상품 식별자의 무결성**을 보장할 수 없음.
- 공격자가 linkval을 알아내지 못해도 **콜백 payload의 price 필드를 변조**할 가능성에 대비.
- secret_key는 PayApp과 공유되지 않는 **내부 전용 비밀키**이므로 HMAC 서명은 우리 서버만 생성 가능.

---

## 3. IP 허용 목록 (선택)

PayApp 서버 IP만 콜백을 허용하도록 제한한다. CIDR 표기법 지원.

```python
cb = PayAppCallbackRouter(
    link_val="...",
    allowed_ips=[
        "211.41.0.0/16",     # PayApp 서버 대역 (예시)
        "127.0.0.1",         # 로컬 테스트
    ],
)
# → 허용되지 않은 IP에서의 요청은 HTTP 400 "FAIL" 응답
```

**리버스 프록시 뒤에서 운영 시**:
- `X-Forwarded-For` 헤더로부터 첫 번째 IP를 추출함
- gunicorn/uvicorn 실행 시 `--forwarded-allow-ips` 옵션 필수:
  ```bash
  gunicorn app:app --forwarded-allow-ips="10.0.0.0/8,127.0.0.1"
  ```
- 이 옵션 없이는 `X-Forwarded-For`를 신뢰하지 않으며, 공격자가 헤더를 조작할 수 있음

**IPv6 지원**:
- `::1` 등 네이티브 IPv6 표기, `[::1]` 브라켓 형태 모두 처리

**PayApp 공식 IP 대역**:
- PayApp이 공식적으로 고정 IP를 공개하지 않음 → 실사용 전 PayApp 측에 문의 권장
- 확실하지 않으면 IP 허용 목록을 **생략**하고 linkval + HMAC + dedup에 의존하는 편이 안전

---

## 4. 중복 처리 방지 (선택)

PayApp은 콜백을 여러 번 보낼 수 있다 (`checkretry=y` 설정). `dedup_checker`로 이미 처리된 거래를 건너뛴다.

```python
async def is_already_processed(mul_no: str) -> bool:
    """DB에서 이미 처리된 거래인지 확인."""
    async with db_session() as db:
        purchase = await db.get(Purchase, {"payment_id": mul_no})
        return purchase is not None and purchase.status == "completed"

cb = PayAppCallbackRouter(
    link_val="...",
    dedup_checker=is_already_processed,
)
# → 이미 처리된 mul_no는 SUCCESS 응답하되 핸들러 호출 건너뜀
```

**중요**:
- 중복 감지 시에도 **SUCCESS 응답**을 보내야 함 (그래야 PayApp이 재시도를 멈춤)
- 라이브러리는 `(True, "DUPLICATE_IGNORED")` 반환 → FastAPI 라우터가 자동 처리

**dedup 없는 경우의 위험**:
- 네트워크 지연으로 같은 콜백이 2회 도착 → 크레딧/상품이 2회 지급됨
- Idempotent 처리를 핸들러 로직 내부에 구현하거나, `dedup_checker`로 라이브러리에 위임하거나 둘 중 하나는 반드시 필요

---

## 권장 조합

### 운영 환경 — 4계층 모두 활성화

```python
cb = PayAppCallbackRouter(
    link_val=os.environ["PAYAPP_LINK_VAL"],       # 필수
    secret_key=os.environ["PAYAPP_SECRET_KEY"],   # 권장
    allowed_ips=["211.41.0.0/16"],                # 선택 (PayApp IP 확인 후)
    dedup_checker=is_already_processed,           # 필수
)
```

### 개발 환경 — HMAC 생략 가능

```python
cb = PayAppCallbackRouter(
    link_val="dev_link_val",
    dedup_checker=is_already_processed,
)
```

---

## 비밀키 관리

### Secret Key 관리 원칙

1. **절대 코드/Git에 포함 금지** — `.env` 파일만 사용
2. `.env`는 `.gitignore`에 등록 (이 라이브러리의 `.gitignore`는 이미 포함)
3. `.env.example`은 더미 값으로 작성 후 Git 커밋 OK
4. 서버 `.env` 파일은 권한 `600` (소유자만 읽기/쓰기) 권장
5. 개발/운영 키 분리 권장
6. **비밀키 유출 시 즉시 재발급**

### HMAC secret_key 생성

```bash
# 충분히 긴 랜덤 문자열
python -c "import secrets; print(secrets.token_urlsafe(32))"
# → "abc123...xyz" (43자)
```

이 값은 **PayApp과 공유되지 않으며**, 클라이언트와 콜백 라우터가 같은 값을 사용해야 한다.

---

## 보안 유틸리티 직접 사용

하위 레벨 API도 공개되어 있음:

```python
from payapp_common_simple.security import (
    sign_payment,
    verify_signature,
    verify_linkval,
    check_ip_allowed,
)

# HMAC 서명 생성
sig = sign_payment("secret", mul_no="12345", price=9900, shop_id="shop_001")

# HMAC 서명 검증
is_valid = verify_signature("secret", "12345", 9900, "shop_001", sig)

# linkval 검증
is_valid = verify_linkval("received_value", "expected_value")

# IP 검증
is_allowed = check_ip_allowed("1.2.3.4", ["1.2.3.0/24", "10.0.0.1"])
```

---

## 보안 체크리스트

프로덕션 배포 전 점검:

- [ ] `PAYAPP_LINK_VAL` 환경변수가 실제 값으로 설정됨
- [ ] `PAYAPP_SECRET_KEY` 환경변수가 설정되고 충분히 긴 랜덤 문자열(32자 이상)임
- [ ] `PAYAPP_*` 환경변수가 Git 저장소에 포함되지 않음 (`.gitignore` 검증)
- [ ] 콜백 URL이 HTTPS (PayApp은 HTTP 요청 가능하지만 HTTPS 필수)
- [ ] `dedup_checker`가 DB 기반으로 등록됨
- [ ] 결제 요청 시 서버 측에서 price/goods_name을 결정 (클라이언트 신뢰 금지)
- [ ] 콜백 수신 시 **서버에 저장된 금액**과 `event.price` 비교하여 위변조 추가 검증
- [ ] 리버스 프록시 운영 시 `--forwarded-allow-ips` 설정 확인
- [ ] 로그에 `secret_key`/`link_val`/`link_key`가 기록되지 않도록 확인
