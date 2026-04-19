"""PayApp 결제 API 통합 라이브러리.

하나의 PayApp 계정으로 여러 서비스의 결제를 통합 관리한다.
결제 요청, 콜백 수신, 서비스별 라우팅, 보안 검증을 단일 패키지로 제공.

주요 컴포넌트:
- PayAppClient: PayApp REST API 클라이언트
- PayAppCallbackRouter: 콜백 수신 및 핸들러 라우팅
- PayAppConfig: 연동 설정
- PaymentEvent: 콜백 이벤트 데이터
"""

from .callback import PayAppCallbackRouter
from .client import PayAppClient, PayAppError, parse_callback_payload
from .models import PayAppConfig, PayAppOrder, PaymentEvent

__all__ = [
    "PayAppClient",
    "PayAppCallbackRouter",
    "PayAppConfig",
    "PayAppError",
    "PayAppOrder",
    "PaymentEvent",
    "parse_callback_payload",
]

__version__ = "0.1.0"
