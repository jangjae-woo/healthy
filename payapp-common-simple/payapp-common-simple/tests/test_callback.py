"""콜백 라우터 테스트."""

import pytest

from payapp_common_simple.callback import PayAppCallbackRouter


@pytest.fixture
def router():
    return PayAppCallbackRouter(link_val="test_link_val")


@pytest.mark.asyncio
async def test_callback_completed(router):
    results = []

    @router.on_completed()
    async def handle(event):
        results.append(event)

    payload = {
        "pay_state": "4",
        "mul_no": "12345",
        "linkval": "test_link_val",
        "var1": "main:shop_001",
        "var2": "pa_abc",
        "price": "9900",
        "goodname": "크레딧",
        "pay_type": "1",
    }
    success, msg = await router.handle_callback(payload)
    assert success
    assert msg == "OK"
    assert len(results) == 1
    assert results[0].shop_id == "shop_001"


@pytest.mark.asyncio
async def test_callback_linkval_mismatch(router):
    payload = {
        "pay_state": "4",
        "mul_no": "12345",
        "linkval": "wrong_value",
        "var1": "shop_001",
        "var2": "pa_abc",
        "price": "9900",
    }
    success, msg = await router.handle_callback(payload)
    assert not success
    assert msg == "LINKVAL_MISMATCH"


@pytest.mark.asyncio
async def test_callback_linkval_missing(router):
    """linkval 필드 누락 시 거부."""
    payload = {
        "pay_state": "4",
        "mul_no": "12345",
        "var1": "shop_001",
        "price": "9900",
    }
    success, msg = await router.handle_callback(payload)
    assert not success
    assert msg == "LINKVAL_MISMATCH"


@pytest.mark.asyncio
async def test_callback_ip_denied():
    router = PayAppCallbackRouter(
        link_val="test",
        allowed_ips=["10.0.0.1"],
    )
    payload = {
        "pay_state": "4",
        "mul_no": "12345",
        "linkval": "test",
        "var1": "shop_001",
        "price": "9900",
    }
    success, msg = await router.handle_callback(payload, client_ip="1.2.3.4")
    assert not success
    assert msg == "IP_DENIED"


@pytest.mark.asyncio
async def test_callback_dedup():
    async def already_processed(mul_no: str) -> bool:
        return True

    router = PayAppCallbackRouter(
        link_val="test",
        dedup_checker=already_processed,
    )
    payload = {
        "pay_state": "4",
        "mul_no": "12345",
        "linkval": "test",
        "var1": "shop_001",
        "price": "9900",
    }
    success, msg = await router.handle_callback(payload)
    assert success
    assert msg == "DUPLICATE_IGNORED"


@pytest.mark.asyncio
async def test_callback_service_routing():
    main_results = []
    mobile_results = []

    router = PayAppCallbackRouter(link_val="test")

    @router.on_completed("main")
    async def handle_main(event):
        main_results.append(event)

    @router.on_completed("mobile")
    async def handle_mobile(event):
        mobile_results.append(event)

    base = {"pay_state": "4", "linkval": "test", "price": "9900", "pay_type": "1"}

    await router.handle_callback({**base, "mul_no": "1", "var1": "main:s1"})
    await router.handle_callback({**base, "mul_no": "2", "var1": "mobile:m1"})

    assert len(main_results) == 1
    assert main_results[0].shop_id == "s1"
    assert len(mobile_results) == 1
    assert mobile_results[0].shop_id == "m1"


@pytest.mark.asyncio
async def test_callback_wildcard_fallback():
    results = []
    router = PayAppCallbackRouter(link_val="test")

    @router.on_completed()
    async def handle_all(event):
        results.append(event)

    base = {"pay_state": "4", "linkval": "test", "price": "9900"}
    await router.handle_callback({**base, "mul_no": "1", "var1": "unknown:shop1"})
    assert len(results) == 1


@pytest.mark.asyncio
async def test_callback_cancelled_handler():
    results = []
    router = PayAppCallbackRouter(link_val="test")

    @router.on_cancelled()
    async def handle(event):
        results.append(event)

    payload = {
        "pay_state": "8",
        "mul_no": "99",
        "linkval": "test",
        "var1": "shop",
        "price": "0",
    }
    success, _ = await router.handle_callback(payload)
    assert success
    assert len(results) == 1


@pytest.mark.asyncio
async def test_callback_hmac_signature_required():
    """secret_key 설정 시 var3 누락이면 거부."""
    router = PayAppCallbackRouter(
        link_val="test",
        secret_key="my_secret",
    )
    payload = {
        "pay_state": "4",
        "mul_no": "12345",
        "linkval": "test",
        "var1": "main:shop_001",
        "price": "9900",
    }
    success, msg = await router.handle_callback(payload)
    assert not success
    assert msg == "SIGNATURE_REQUIRED"


@pytest.mark.asyncio
async def test_callback_hmac_signature_mismatch():
    """secret_key 설정 시 서명 불일치면 거부."""
    router = PayAppCallbackRouter(
        link_val="test",
        secret_key="my_secret",
    )
    payload = {
        "pay_state": "4",
        "mul_no": "12345",
        "linkval": "test",
        "var1": "main:shop_001",
        "var3": "wrong_signature",
        "price": "9900",
    }
    success, msg = await router.handle_callback(payload)
    assert not success
    assert msg == "SIGNATURE_MISMATCH"


@pytest.mark.asyncio
async def test_callback_handler_error_returns_fail():
    """핸들러 예외 시 FAIL 반환 → PayApp 재시도 유도."""
    router = PayAppCallbackRouter(link_val="test")

    @router.on_completed()
    async def handle(event):
        raise RuntimeError("DB connection failed")

    payload = {
        "pay_state": "4",
        "mul_no": "12345",
        "linkval": "test",
        "var1": "main:shop_001",
        "price": "9900",
    }
    success, msg = await router.handle_callback(payload)
    assert not success
    assert msg == "HANDLER_ERROR"


@pytest.mark.asyncio
async def test_callback_negative_price_rejected():
    """음수 금액 거부."""
    router = PayAppCallbackRouter(link_val="test")

    @router.on_completed()
    async def handle(event):
        pass

    payload = {
        "pay_state": "4",
        "mul_no": "12345",
        "linkval": "test",
        "var1": "main:shop_001",
        "price": "-1000",
    }
    success, msg = await router.handle_callback(payload)
    assert not success
    assert msg == "INVALID_PRICE"


@pytest.mark.asyncio
async def test_callback_oversized_shop_id_rejected():
    """shop_id 길이 초과 거부."""
    router = PayAppCallbackRouter(link_val="test")

    payload = {
        "pay_state": "4",
        "mul_no": "12345",
        "linkval": "test",
        "var1": "svc:" + "x" * 300,
        "price": "9900",
    }
    success, msg = await router.handle_callback(payload)
    assert not success
    assert msg == "INVALID_PAYLOAD"
