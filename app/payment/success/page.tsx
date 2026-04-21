'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function SuccessInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'verifying' | 'ok' | 'fail'>('verifying');
  const [message, setMessage] = useState('결제 승인 중...');

  useEffect(() => {
    const authResultCode = params.get('authResultCode');
    const tid = params.get('tid');
    const amount = params.get('amount');
    const returnUrl = params.get('returnUrl') || '/saju/result';

    if (authResultCode && authResultCode !== '0000') {
      setStatus('fail');
      setMessage(params.get('authResultMsg') || '결제 인증 실패');
      return;
    }

    if (!tid || !amount) {
      setStatus('fail');
      setMessage('결제 정보 누락');
      return;
    }

    (async () => {
      try {
        const res = await fetch('/api/payment/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tid, amount: Number(amount) }),
        });
        const data = await res.json();
        if (data.success) {
          setStatus('ok');
          setMessage('결제 완료! 결과 페이지로 이동합니다...');
          const dest = returnUrl.includes('?')
            ? `${returnUrl}&unlocked=1&paid=1`
            : `${returnUrl}?unlocked=1&paid=1`;
          setTimeout(() => router.replace(dest), 800);
        } else {
          setStatus('fail');
          setMessage(data.error || '결제 승인 실패');
        }
      } catch (e: any) {
        setStatus('fail');
        setMessage(e?.message || '서버 오류');
      }
    })();
  }, [params, router]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0d1a0f',
        color: '#e7e2d8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'serif',
        padding: 24,
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div style={{ fontSize: 64, color: '#c9960c', marginBottom: 24 }}>
          {status === 'verifying' ? '☯' : status === 'ok' ? '✓' : '✕'}
        </div>
        <div style={{ fontSize: 20, marginBottom: 12 }}>{message}</div>
        {status === 'fail' && (
          <button
            onClick={() => router.back()}
            style={{
              marginTop: 16,
              padding: '10px 20px',
              background: '#c9960c',
              color: '#0d1a0f',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            돌아가기
          </button>
        )}
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div />}>
      <SuccessInner />
    </Suspense>
  );
}
