"""PayApp 보안 유틸리티.

- HMAC-SHA256 서명/검증: 결제 요청 위변조 방지
- linkval 검증: PayApp 콜백 인증
- IP 허용 목록: 콜백 소스 검증
"""

import hashlib
import hmac
import ipaddress
import logging

logger = logging.getLogger(__name__)


def sign_payment(
    secret_key: str, mul_no: str, price: int, shop_id: str,
) -> str:
    """결제 요청에 대한 HMAC-SHA256 서명 생성.

    서명 대상: "mul_no|price|shop_id"
    이 서명을 var3에 저장하여 콜백 수신 시 검증.
    """
    message = f"{mul_no}|{price}|{shop_id}"
    return hmac.new(
        secret_key.encode("utf-8"),
        message.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


def verify_signature(
    secret_key: str,
    mul_no: str,
    price: str | int,
    shop_id: str,
    received_signature: str,
) -> bool:
    """콜백 수신 시 HMAC 서명 검증.

    Returns:
        True: 서명 일치 (위변조 없음)
        False: 서명 불일치 또는 서명 없음
    """
    if not secret_key or not received_signature:
        return False
    expected = sign_payment(secret_key, mul_no, int(price), shop_id)
    return hmac.compare_digest(expected, received_signature)


def verify_linkval(received_linkval: str, expected_linkval: str) -> bool:
    """PayApp linkval 일치 여부 확인.

    linkval은 PayApp 설정의 연동 VALUE로, 콜백 요청의 진위를 검증한다.
    상수 시간 비교로 타이밍 공격 방지.
    expected_linkval이 미설정이면 검증 실패 (보안 강제).
    """
    if not expected_linkval:
        logger.error("linkval 검증 실패: expected_linkval 미설정 — 설정 필수")
        return False
    if not received_linkval:
        return False
    return hmac.compare_digest(received_linkval, expected_linkval)


def check_ip_allowed(client_ip: str, allowed_ips: list[str]) -> bool:
    """콜백 요청 IP가 허용 목록에 포함되는지 확인.

    CIDR 표기법 지원 (예: "211.41.0.0/16").
    allowed_ips가 빈 리스트면 모든 IP 허용 (검증 비활성화).
    """
    if not allowed_ips:
        return True

    if not client_ip or len(client_ip) > 45:
        logger.warning("잘못된 IP 주소: 빈 값 또는 길이 초과")
        return False

    if client_ip.startswith("[") and "]" in client_ip:
        client_ip = client_ip[1:client_ip.index("]")]

    try:
        addr = ipaddress.ip_address(client_ip)
    except ValueError:
        logger.warning("잘못된 IP 주소 형식: %s", client_ip)
        return False

    for allowed in allowed_ips:
        try:
            if "/" in allowed:
                if addr in ipaddress.ip_network(allowed, strict=False):
                    return True
            else:
                if addr == ipaddress.ip_address(allowed):
                    return True
        except ValueError:
            logger.warning("허용 목록의 잘못된 IP/CIDR: %s", allowed)
            continue

    return False
