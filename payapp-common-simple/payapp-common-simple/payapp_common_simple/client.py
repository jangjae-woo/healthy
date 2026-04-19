"""PayApp REST API 클라이언트.

결제 요청, 상태 조회, 취소 등 PayApp API 호출을 담당한다.
"""

import logging
import uuid

import httpx

from .constants import PAYAPP_API_URL, PAY_STATE_MAP, PAY_TYPE_LABELS
from .models import PayAppConfig, PayAppOrder, PaymentEvent
from .parser import parse_response
from .security import sign_payment

logger = logging.getLogger(__name__)


class PayAppError(Exception):
    """PayApp API 오류."""


class PayAppClient:
    """PayApp REST API 클라이언트.

    Usage::

        config = PayAppConfig(user_id="...", link_key="...", ...)
        client = PayAppClient(config)
        order = await client.create_payment(
            shop_id="shop123",
            goods_name="프리미엄 플랜",
            price=9900,
            return_url="https://example.com/complete",
        )
        # order.pay_url → 고객에게 결제창 URL 전달
    """

    def __init__(self, config: PayAppConfig, timeout: float = 15.0):
        self.config = config
        self.timeout = timeout

    async def create_payment(
        self,
        shop_id: str,
        goods_name: str,
        price: int,
        return_url: str,
        order_id: str | None = None,
    ) -> PayAppOrder:
        """PayApp 결제 요청 생성.

        Args:
            shop_id: 쇼핑몰/판매자 고유 ID.
            goods_name: 상품명.
            price: 결제 금액 (원).
            return_url: 결제 완료 후 돌아갈 URL.
            order_id: 주문 ID (미지정 시 자동 생성).

        Returns:
            PayAppOrder: mul_no, pay_url 포함.

        Raises:
            PayAppError: API 호출 실패.
        """
        if order_id is None:
            order_id = f"pa_{uuid.uuid4().hex[:12]}"

        service = self.config.service_name
        var1 = f"{service}:{shop_id}" if service else shop_id

        data = {
            "cmd": "payrequest",
            "userid": self.config.user_id,
            "goodname": goods_name,
            "price": str(price),
            "recvphone": "01000000000",
            "smsuse": "n",
            "feedbackurl": self.config.callback_url,
            "returnurl": return_url,
            "var1": var1,
            "var2": order_id,
            "checkretry": "y",
            "skip_cstpage": "y",
        }

        if self.config.secret_key:
            data["var3"] = sign_payment(
                self.config.secret_key, order_id, price, shop_id,
            )

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as http:
                resp = await http.post(PAYAPP_API_URL, data=data)
                resp.raise_for_status()
        except httpx.HTTPError as e:
            raise PayAppError(f"PayApp API 호출 실패: {e}") from e

        result = parse_response(resp.text)

        if result.get("state") != "1":
            error_msg = result.get("errorMessage", "알 수 없는 오류")
            raise PayAppError(f"PayApp 결제 요청 실패: {error_msg}")

        mul_no = result.get("mul_no", order_id)
        pay_url = result.get("payurl", "")

        logger.info(
            "PayApp 결제 요청 성공: mul_no=%s shop=%s price=%s",
            mul_no, shop_id, price,
        )

        return PayAppOrder(order_id=order_id, mul_no=mul_no, pay_url=pay_url)

    async def check_status(self, mul_no: str) -> dict:
        """결제 상태 조회.

        Returns:
            파싱된 PayApp 응답 dict. pay_state 키 포함.
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as http:
                resp = await http.post(PAYAPP_API_URL, data={
                    "cmd": "payCheck",
                    "userid": self.config.user_id,
                    "linkkey": self.config.link_key,
                    "mul_no": mul_no,
                })
                resp.raise_for_status()
        except httpx.HTTPError as e:
            raise PayAppError(f"PayApp 상태 조회 실패: {e}") from e

        return parse_response(resp.text)

    async def cancel_payment(self, mul_no: str) -> bool:
        """결제 취소 요청.

        Returns:
            True: 취소 성공, False: 취소 실패.
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as http:
                resp = await http.post(PAYAPP_API_URL, data={
                    "cmd": "cancelPayment",
                    "userid": self.config.user_id,
                    "linkkey": self.config.link_key,
                    "mul_no": mul_no,
                })
                resp.raise_for_status()
        except httpx.HTTPError as e:
            logger.error("PayApp 결제 취소 실패: %s", e)
            return False

        result = parse_response(resp.text)
        return result.get("state") == "1"


def parse_callback_payload(payload: dict) -> PaymentEvent:
    """콜백 POST 데이터를 PaymentEvent로 변환.

    var1 형식: "{service_name}:{shop_id}" 또는 "{shop_id}" (service 미지정).
    """
    var1 = payload.get("var1", "")
    if ":" in var1:
        service_name, shop_id = var1.split(":", 1)
    else:
        service_name = ""
        shop_id = var1

    pay_state_raw = payload.get("pay_state", "0")
    try:
        pay_state = int(pay_state_raw)
    except (ValueError, TypeError):
        logger.warning("pay_state 파싱 실패: %r → 0 처리", pay_state_raw)
        pay_state = 0

    pay_type = payload.get("pay_type", "")
    price_raw = payload.get("price", "0")
    try:
        price = int(price_raw)
    except (ValueError, TypeError):
        logger.warning("price 파싱 실패: %r → 0 처리", price_raw)
        price = 0

    return PaymentEvent(
        mul_no=payload.get("mul_no", ""),
        pay_state=pay_state,
        pay_state_label=PAY_STATE_MAP.get(pay_state, "unknown"),
        service_name=service_name,
        shop_id=shop_id,
        order_id=payload.get("var2", ""),
        price=price,
        goods_name=payload.get("goodname", ""),
        pay_type=pay_type,
        pay_method=PAY_TYPE_LABELS.get(pay_type, f"payapp_{pay_type}"),
        raw_payload=payload,
    )
