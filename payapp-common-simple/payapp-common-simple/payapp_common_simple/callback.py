"""PayApp 콜백 라우터.

멀티 서비스 환경에서 하나의 feedbackurl로 여러 서비스의 결제 결과를
수신하고, 등록된 핸들러에 라우팅한다.

Usage (단일 서비스)::

    from payapp_common_simple import PayAppCallbackRouter

    cb = PayAppCallbackRouter(link_val="...")

    @cb.on_completed()
    async def handle(event):
        ...

    app.include_router(cb.fastapi_router())

Usage (멀티 서비스)::

    cb = PayAppCallbackRouter(link_val="...", secret_key="...")

    @cb.on_completed("main")
    async def handle_main(event): ...

    @cb.on_completed("mobile")
    async def handle_mobile(event): ...

    app.include_router(cb.fastapi_router())
"""

import logging
from collections.abc import Awaitable, Callable

from .client import parse_callback_payload
from .constants import PAY_STATE_CANCELLED, PAY_STATE_COMPLETED, PAY_STATE_REFUNDED
from .models import PaymentEvent
from .security import check_ip_allowed, verify_linkval, verify_signature

logger = logging.getLogger(__name__)

CallbackHandler = Callable[[PaymentEvent], Awaitable[None]]

_HandlerKey = tuple[str, str]


class PayAppCallbackRouter:
    """PayApp feedbackurl 콜백 라우터.

    Args:
        link_val: PayApp 연동 VALUE (필수, 콜백 인증).
        secret_key: HMAC 서명 검증용 비밀키 (빈 문자열이면 검증 건너뜀).
        allowed_ips: 콜백 허용 IP 목록 (빈 리스트면 IP 검증 비활성화).
        dedup_checker: 중복 처리 방지 함수. mul_no를 받아 이미 처리된 경우
            True를 반환하는 async callable. None이면 중복 검사 비활성화.
    """

    def __init__(
        self,
        link_val: str,
        secret_key: str = "",
        allowed_ips: list[str] | None = None,
        dedup_checker: Callable[[str], Awaitable[bool]] | None = None,
    ):
        self.link_val = link_val
        self.secret_key = secret_key
        self.allowed_ips = allowed_ips or []
        self.dedup_checker = dedup_checker
        self._handlers: dict[_HandlerKey, CallbackHandler] = {}

    def on_completed(self, service: str | None = None):
        """결제 완료 (pay_state=4) 핸들러 등록."""
        def decorator(fn: CallbackHandler) -> CallbackHandler:
            key = ("completed", service or "*")
            self._handlers[key] = fn
            return fn
        return decorator

    def on_cancelled(self, service: str | None = None):
        """결제 취소 (pay_state=8/16/32) 핸들러 등록."""
        def decorator(fn: CallbackHandler) -> CallbackHandler:
            key = ("cancelled", service or "*")
            self._handlers[key] = fn
            return fn
        return decorator

    def on_refunded(self, service: str | None = None):
        """결제 환불 (pay_state=9/64) 핸들러 등록."""
        def decorator(fn: CallbackHandler) -> CallbackHandler:
            key = ("refunded", service or "*")
            self._handlers[key] = fn
            return fn
        return decorator

    def register_handler(
        self, state: str, service: str, handler: CallbackHandler,
    ) -> None:
        """프로그래밍 방식으로 핸들러 등록.

        Args:
            state: "completed", "cancelled", "refunded"
            service: 서비스 이름 또는 "*" (전체).
            handler: async callable(PaymentEvent).
        """
        self._handlers[(state, service)] = handler

    async def handle_callback(
        self, payload: dict, client_ip: str = "",
    ) -> tuple[bool, str]:
        """콜백 요청 처리.

        Args:
            payload: POST form 데이터 (dict).
            client_ip: 요청자 IP (IP 검증용).

        Returns:
            (success, message) 튜플.
            success=True이면 PayApp에 "SUCCESS" 응답 가능.
        """
        if self.allowed_ips and not check_ip_allowed(client_ip, self.allowed_ips):
            logger.warning("PayApp 콜백 IP 거부: %s", client_ip)
            return False, "IP_DENIED"

        received_linkval = payload.get("linkval", "")
        if not verify_linkval(received_linkval, self.link_val):
            logger.warning("PayApp 콜백 linkval 불일치: %s", received_linkval)
            return False, "LINKVAL_MISMATCH"

        event = parse_callback_payload(payload)

        if self.secret_key:
            received_sig = payload.get("var3", "")
            if not received_sig:
                logger.warning(
                    "PayApp 콜백 HMAC 서명 누락: mul_no=%s", event.mul_no,
                )
                return False, "SIGNATURE_REQUIRED"
            if not verify_signature(
                self.secret_key, event.mul_no, event.price,
                event.shop_id, received_sig,
            ):
                logger.warning(
                    "PayApp 콜백 HMAC 서명 불일치: mul_no=%s", event.mul_no,
                )
                return False, "SIGNATURE_MISMATCH"

        if self.dedup_checker:
            already_processed = await self.dedup_checker(event.mul_no)
            if already_processed:
                logger.info("PayApp 콜백 중복 무시: mul_no=%s", event.mul_no)
                return True, "DUPLICATE_IGNORED"

        if event.price < 0 or event.price > 999_999_999:
            logger.warning("PayApp 콜백 금액 범위 초과: %s", event.price)
            return False, "INVALID_PRICE"

        if len(event.shop_id) > 255 or len(event.service_name) > 64:
            logger.warning("PayApp 콜백 식별자 길이 초과")
            return False, "INVALID_PAYLOAD"

        state_type = self._classify_state(event.pay_state)

        logger.info(
            "PayApp 콜백: state=%s(%s) mul_no=%s service=%s",
            event.pay_state, state_type, event.mul_no, event.service_name,
        )

        handler = self._find_handler(state_type, event.service_name)
        if handler:
            try:
                await handler(event)
            except Exception:
                logger.exception(
                    "PayApp 콜백 핸들러 오류: state=%s mul_no=%s",
                    state_type, event.mul_no,
                )
                return False, "HANDLER_ERROR"
        else:
            logger.info(
                "PayApp 콜백 핸들러 미등록: state=%s service=%s",
                state_type, event.service_name,
            )

        return True, "OK"

    def fastapi_router(self, path: str = "/api/payment/callback"):
        """FastAPI APIRouter 생성.

        Returns:
            FastAPI APIRouter. app.include_router()로 등록.

        Raises:
            ImportError: fastapi 미설치.
        """
        from fastapi import APIRouter, Request
        from fastapi.responses import PlainTextResponse

        router = APIRouter(tags=["payment-callback"])

        @router.post(path)
        async def payapp_callback(request: Request):
            content_type = request.headers.get("content-type", "")
            if "application/x-www-form-urlencoded" not in content_type:
                return PlainTextResponse("FAIL", status_code=400)

            form = await request.form()
            payload = dict(form)

            client_ip = ""
            forwarded = request.headers.get("x-forwarded-for")
            if forwarded:
                raw_ip = forwarded.split(",")[0].strip()
                if raw_ip.startswith("[") and "]" in raw_ip:
                    raw_ip = raw_ip[1:raw_ip.index("]")]
                client_ip = raw_ip
            elif request.client:
                client_ip = request.client.host

            success, message = await self.handle_callback(payload, client_ip)

            if not success:
                return PlainTextResponse("FAIL", status_code=400)

            return PlainTextResponse("SUCCESS")

        return router

    @staticmethod
    def _classify_state(pay_state: int) -> str:
        if pay_state in PAY_STATE_COMPLETED:
            return "completed"
        if pay_state in PAY_STATE_CANCELLED:
            return "cancelled"
        if pay_state in PAY_STATE_REFUNDED:
            return "refunded"
        return "other"

    def _find_handler(
        self, state_type: str, service_name: str,
    ) -> CallbackHandler | None:
        """서비스별 핸들러 우선, 없으면 와일드카드(*) 핸들러."""
        handler = self._handlers.get((state_type, service_name))
        if handler:
            return handler
        return self._handlers.get((state_type, "*"))
