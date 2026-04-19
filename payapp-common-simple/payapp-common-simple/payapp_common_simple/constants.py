"""PayApp 상수 정의."""

PAYAPP_API_URL = "https://api.payapp.kr/oapi/apiLoad.html"

PAY_STATE_MAP: dict[int, str] = {
    1: "requested",
    4: "completed",
    8: "cancelled",
    9: "refunded",
    10: "pending",
    16: "cancelled",
    32: "cancelled",
    64: "refunded",
}

PAY_STATE_COMPLETED = {4}
PAY_STATE_CANCELLED = {8, 16, 32}
PAY_STATE_REFUNDED = {9, 64}
PAY_STATE_PENDING = {1, 10}

PAY_TYPE_LABELS: dict[str, str] = {
    "1": "신용카드",
    "2": "휴대전화",
    "4": "대면결제",
    "6": "계좌이체",
    "7": "가상계좌",
    "15": "카카오페이",
    "16": "네이버페이",
    "21": "스마일페이",
    "23": "애플페이",
    "25": "토스페이",
}
