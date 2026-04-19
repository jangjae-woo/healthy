"""보안 유틸리티 테스트."""

from payapp_common_simple.security import (
    check_ip_allowed,
    sign_payment,
    verify_linkval,
    verify_signature,
)


def test_sign_and_verify():
    secret = "test_secret_key_123"
    sig = sign_payment(secret, "12345", 9900, "shop_001")
    assert verify_signature(secret, "12345", 9900, "shop_001", sig)
    assert verify_signature(secret, "12345", "9900", "shop_001", sig)


def test_verify_wrong_signature():
    secret = "test_secret_key_123"
    sig = sign_payment(secret, "12345", 9900, "shop_001")
    assert not verify_signature(secret, "12345", 9900, "shop_002", sig)
    assert not verify_signature(secret, "99999", 9900, "shop_001", sig)
    assert not verify_signature(secret, "12345", 1000, "shop_001", sig)


def test_verify_empty_signature():
    assert not verify_signature("secret", "12345", 9900, "shop", "")
    assert not verify_signature("", "12345", 9900, "shop", "abc")


def test_verify_linkval():
    assert verify_linkval("abc123", "abc123")
    assert not verify_linkval("abc123", "xyz789")


def test_verify_linkval_empty_expected_rejects():
    """expected_linkval이 비어있으면 보안을 위해 거부해야 한다."""
    assert not verify_linkval("anything", "")
    assert not verify_linkval("", "")


def test_verify_linkval_empty_received():
    """received_linkval이 비어있으면 거부."""
    assert not verify_linkval("", "expected_value")


def test_check_ip_single():
    assert check_ip_allowed("1.2.3.4", ["1.2.3.4"])
    assert not check_ip_allowed("1.2.3.5", ["1.2.3.4"])


def test_check_ip_cidr():
    assert check_ip_allowed("192.168.1.50", ["192.168.1.0/24"])
    assert not check_ip_allowed("192.168.2.50", ["192.168.1.0/24"])


def test_check_ip_empty_list():
    assert check_ip_allowed("1.2.3.4", [])


def test_check_ip_multiple():
    allowed = ["10.0.0.1", "192.168.0.0/16"]
    assert check_ip_allowed("10.0.0.1", allowed)
    assert check_ip_allowed("192.168.5.5", allowed)
    assert not check_ip_allowed("172.16.0.1", allowed)


def test_check_ip_ipv6_brackets():
    """IPv6 브라켓 형태 ([::1])도 올바르게 처리."""
    assert check_ip_allowed("[::1]", ["::1"])
    assert check_ip_allowed("::1", ["::1"])


def test_check_ip_empty_or_too_long():
    """빈 IP 또는 비정상 길이 거부."""
    assert not check_ip_allowed("", ["1.2.3.4"])
    assert not check_ip_allowed("x" * 46, ["1.2.3.4"])
