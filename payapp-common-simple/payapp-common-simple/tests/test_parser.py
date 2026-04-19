"""응답 파서 테스트."""

from payapp_common_simple.parser import parse_response


def test_parse_basic():
    text = "state=1&mul_no=12345&payurl=https%3A%2F%2Fpay.com%2F123"
    result = parse_response(text)
    assert result["state"] == "1"
    assert result["mul_no"] == "12345"
    assert result["payurl"] == "https://pay.com/123"


def test_parse_empty_values():
    text = "state=0&errorMessage=&mul_no="
    result = parse_response(text)
    assert result["state"] == "0"
    assert result["errorMessage"] == ""
    assert result["mul_no"] == ""


def test_parse_error_response():
    text = "state=0&errorMessage=%EC%98%A4%EB%A5%98+%EB%B0%9C%EC%83%9D"
    result = parse_response(text)
    assert result["state"] == "0"
    assert "오류" in result["errorMessage"]
