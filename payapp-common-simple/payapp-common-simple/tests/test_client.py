"""클라이언트 및 콜백 파싱 테스트."""

from payapp_common_simple.client import parse_callback_payload


def test_parse_callback_with_service():
    payload = {
        "pay_state": "4",
        "mul_no": "12345",
        "var1": "main:shop_001",
        "var2": "pa_abc123",
        "price": "9900",
        "goodname": "크레딧 100건",
        "pay_type": "1",
    }
    event = parse_callback_payload(payload)
    assert event.service_name == "main"
    assert event.shop_id == "shop_001"
    assert event.order_id == "pa_abc123"
    assert event.pay_state == 4
    assert event.pay_state_label == "completed"
    assert event.price == 9900
    assert event.pay_method == "신용카드"


def test_parse_callback_without_service():
    payload = {
        "pay_state": "8",
        "mul_no": "99999",
        "var1": "shop_002",
        "var2": "pa_xyz",
        "price": "29900",
        "goodname": "프리미엄 플랜",
        "pay_type": "15",
    }
    event = parse_callback_payload(payload)
    assert event.service_name == ""
    assert event.shop_id == "shop_002"
    assert event.pay_state_label == "cancelled"
    assert event.pay_method == "카카오페이"


def test_parse_callback_unknown_pay_type():
    payload = {
        "pay_state": "4",
        "mul_no": "11111",
        "var1": "mobile:shop_003",
        "var2": "pa_zzz",
        "price": "5000",
        "goodname": "테스트",
        "pay_type": "99",
    }
    event = parse_callback_payload(payload)
    assert event.pay_method == "payapp_99"
