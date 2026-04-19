"""PayApp 데이터 모델."""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class PayAppConfig:
    """PayApp 연동 설정.

    Attributes:
        user_id: PayApp 판매자 회원 아이디.
        link_key: PayApp 연동 KEY.
        link_val: PayApp 연동 VALUE (콜백 검증용).
        callback_url: feedbackurl 전체 URL.
        secret_key: HMAC 서명용 비밀키 (빈 문자열이면 서명 비활성화).
        service_name: 서비스 식별자 (예: "main", "mobile").
            콜백 라우팅의 var1에 "{service_name}:{shop_id}" 형태로 저장됨.
        allowed_ips: 콜백 허용 IP 목록 (빈 리스트면 IP 검증 비활성화).
    """

    user_id: str
    link_key: str
    link_val: str
    callback_url: str
    secret_key: str = ""
    service_name: str = ""
    allowed_ips: list[str] = field(default_factory=list)


@dataclass
class PaymentEvent:
    """파싱 및 검증 완료된 콜백 이벤트.

    콜백 핸들러가 수신하는 데이터 객체.
    """

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
    raw_payload: dict = field(default_factory=dict)


@dataclass
class PayAppOrder:
    """create_payment() 결과."""

    order_id: str
    mul_no: str
    pay_url: str
