"""PayApp 응답 파서.

PayApp REST API는 application/x-www-form-urlencoded 형식으로 응답한다.
JSON이 아니므로 parse_qs()로 파싱해야 한다.
"""

from urllib.parse import parse_qs


def parse_response(text: str) -> dict[str, str]:
    """PayApp URL-encoded 응답을 dict로 변환.

    각 키의 첫 번째 값만 추출 (PayApp 응답은 중복 키 없음).
    """
    parsed = parse_qs(text, keep_blank_values=True)
    return {k: v[0] if v else "" for k, v in parsed.items()}
