'use client';

import { useState, useEffect } from 'react';

const GOLD = '#c9960c';
const GOLD_LIGHT = '#e4b840';
const FOREST = '#0d1a0f';

interface Props {
  open: boolean;
  onClose: () => void;
  price: number;          // 정가
  goodsName: string;
  // 정상 결제 경로 — 할인 후 가격을 받아 PortOne 호출에 사용 (서버에서 다시 검증)
  onSubmit: (finalPrice: number) => Promise<void>;
  // 무료 쿠폰 경로 — 쿠폰 코드 받아 free-unlock API 호출
  onFreeUnlock: (code: string) => Promise<void>;
}

interface DiscountInfo {
  slug: string | null;
  discount_amount: number;
  base_price: number;
  final_price: number;
}

interface CouponInfo {
  valid: true;
  code: string;
  discount_type: string;
  base_price: number;
  final_price: number;
  remaining: number;
}

export default function PaymentModal({ open, onClose, price, goodsName, onSubmit, onFreeUnlock }: Props) {
  const [agree1, setAgree1] = useState(false);
  const [agree2, setAgree2] = useState(false);
  const [agree3, setAgree3] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 인플루언서 자동 할인 (쿠키 기반)
  const [discount, setDiscount] = useState<DiscountInfo | null>(null);

  // 쿠폰 입력 상태
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponInfo, setCouponInfo] = useState<CouponInfo | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponOpen, setCouponOpen] = useState(false);

  const allAgreed = agree1 && agree2 && agree3;

  // 진입 시 인플루언서 할인 조회
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch('/api/influencer/discount')
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setDiscount(data);
      })
      .catch(() => {
        if (cancelled) return;
        setDiscount({ slug: null, discount_amount: 0, base_price: price, final_price: price });
      });
    return () => { cancelled = true; };
  }, [open, price]);

  useEffect(() => {
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (open) {
      document.addEventListener('keydown', onEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', onEsc);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  function toggleAll(v: boolean) {
    setAgree1(v); setAgree2(v); setAgree3(v);
  }

  async function applyCoupon() {
    const code = couponInput.trim();
    if (!code) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await fetch('/api/coupon/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (data.valid) {
        setCouponInfo(data);
      } else {
        setCouponInfo(null);
        setCouponError(data.reason || '쿠폰을 적용할 수 없습니다');
      }
    } catch {
      setCouponError('쿠폰 검증 중 오류가 발생했습니다');
    } finally {
      setCouponLoading(false);
    }
  }

  function clearCoupon() {
    setCouponInfo(null);
    setCouponInput('');
    setCouponError('');
  }

  // 최종 결제액 (쿠폰 우선 적용, 없으면 인플루언서 할인)
  const isFree = !!couponInfo;
  const finalPrice = isFree ? 0 : (discount?.final_price ?? price);
  const discountAmount = isFree ? price : (discount?.discount_amount ?? 0);
  const hasDiscount = discountAmount > 0;

  async function handleSubmit() {
    setError('');
    if (!allAgreed) {
      setError('필수 약관에 모두 동의해 주세요.');
      return;
    }
    try {
      setSubmitting(true);
      try {
        localStorage.setItem(
          'paljawon_payer',
          JSON.stringify({ agreedAt: new Date().toISOString(), couponCode: couponInfo?.code ?? null })
        );
      } catch {}
      if (isFree && couponInfo) {
        await onFreeUnlock(couponInfo.code);
      } else {
        await onSubmit(finalPrice);
      }
    } catch (e: any) {
      setError(e?.message || '결제 요청에 실패했습니다.');
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.75)', padding: 16, backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 420, maxHeight: '92vh', overflowY: 'auto',
          background: 'linear-gradient(180deg, #132419 0%, #0a1408 100%)',
          border: `1px solid ${GOLD}55`, borderRadius: 18,
          boxShadow: `0 0 48px ${GOLD}33, 0 8px 24px rgba(0,0,0,0.5)`,
          padding: 24, fontFamily: "'Gowun Batang', 'Noto Serif KR', serif",
          color: '#e7e2d8', position: 'relative',
        }}
      >
        {/* 닫기 */}
        <button onClick={onClose} aria-label="닫기"
          style={{
            position: 'absolute', top: 12, right: 12,
            background: 'none', border: 'none', color: GOLD,
            fontSize: 22, cursor: 'pointer', padding: 4, lineHeight: 1,
          }}>✕</button>

        {/* 제목 */}
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div style={{
            fontSize: 11, letterSpacing: '0.4em',
            color: `${GOLD}aa`, fontFamily: "'Cormorant Garamond', serif",
            textTransform: 'uppercase', marginBottom: 6,
          }}>Payment</div>
          <h2 style={{
            fontSize: 18, fontWeight: 700,
            color: '#fef3c7', fontFamily: "'Noto Serif KR', serif",
            letterSpacing: '0.05em', margin: 0,
          }}>{isFree ? '무료 풀이 받기' : '결제 진행'}</h2>
        </div>

        {/* 상품·금액 — 빗금·할인 표시 */}
        <div style={{
          background: `${GOLD}0d`, border: `1px solid ${GOLD}33`,
          borderRadius: 12, padding: 14, marginBottom: 18, textAlign: 'center',
        }}>
          <div style={{ fontSize: 11, color: '#a39068', marginBottom: 6 }}>{goodsName}</div>
          {hasDiscount && (
            <div style={{
              fontSize: 14, color: '#a39068',
              textDecoration: 'line-through', marginBottom: 4,
            }}>
              ₩{price.toLocaleString()}
            </div>
          )}
          <div style={{
            fontSize: 28, fontWeight: 700,
            color: isFree ? '#7ad07a' : GOLD_LIGHT,
            fontFamily: "'Noto Serif KR', serif",
          }}>
            {isFree ? '무료' : `₩${finalPrice.toLocaleString()}`}
          </div>
          {hasDiscount && !isFree && (
            <div style={{ fontSize: 11, color: '#7ad07a', marginTop: 6, fontWeight: 700 }}>
              ✨ ₩{discountAmount.toLocaleString()} 할인 적용됨
              {discount?.slug && <span style={{ color: '#a39068', fontWeight: 400 }}>{` (${discount.slug} 추천)`}</span>}
            </div>
          )}
          {isFree && couponInfo && (
            <div style={{ fontSize: 11, color: '#7ad07a', marginTop: 6, fontWeight: 700 }}>
              ✨ 쿠폰 {couponInfo.code} 적용됨 (남은 횟수 {couponInfo.remaining - 1}/{couponInfo.remaining + couponInfo.remaining - 1})
            </div>
          )}
        </div>

        {/* 쿠폰 입력 */}
        <div style={{ marginBottom: 18 }}>
          {!couponOpen && !couponInfo ? (
            <button onClick={() => setCouponOpen(true)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: `${GOLD}aa`, fontSize: 12, textDecoration: 'underline',
                padding: 0, fontFamily: "'Gowun Batang', serif",
              }}>
              쿠폰 코드가 있으신가요?
            </button>
          ) : couponInfo ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 12px', background: '#1a3a1a', border: '1px solid #4a7a4a',
              borderRadius: 8,
            }}>
              <span style={{ fontSize: 12, color: '#a3e0a3' }}>
                ✓ 쿠폰 적용됨: <strong>{couponInfo.code}</strong>
              </span>
              <button onClick={clearCoupon}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#a3e0a3', fontSize: 11, textDecoration: 'underline',
                }}>해제</button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') applyCoupon(); }}
                  placeholder="쿠폰 코드 입력"
                  disabled={couponLoading}
                  style={{
                    flex: 1, padding: '10px 12px', borderRadius: 8,
                    background: '#0a1408', border: `1px solid ${GOLD}33`,
                    color: '#fef3c7', fontSize: 13, outline: 'none',
                    fontFamily: "'Gowun Batang', 'Noto Serif KR', serif",
                  }}
                />
                <button onClick={applyCoupon} disabled={couponLoading || !couponInput.trim()}
                  style={{
                    padding: '10px 16px', borderRadius: 8, border: 'none',
                    background: couponLoading || !couponInput.trim() ? '#444' : GOLD,
                    color: FOREST, fontWeight: 700, fontSize: 12,
                    cursor: couponLoading ? 'wait' : 'pointer',
                  }}>
                  {couponLoading ? '확인…' : '적용'}
                </button>
              </div>
              {couponError && (
                <div style={{ fontSize: 11, color: '#e89a8a', marginTop: 6 }}>{couponError}</div>
              )}
            </div>
          )}
        </div>

        {/* 약관 */}
        <div>
          <CheckRow checked={allAgreed} onChange={(v) => toggleAll(v)}
            label="모두 동의합니다 (전체)" bold />
          <CheckRow checked={agree1} onChange={setAgree1}
            label="이용약관 (필수)" href="/terms" />
          <CheckRow checked={agree2} onChange={setAgree2}
            label="개인정보 수집·이용 동의 (필수)" href="/privacy" />
          <CheckRow checked={agree3} onChange={setAgree3}
            label="환불 정책 안내 확인 (필수)" href="/refund" />
        </div>

        {/* 에러 */}
        {error && (
          <div style={{
            marginTop: 12, padding: '8px 12px', borderRadius: 8,
            background: '#3a1010', border: '1px solid #c97a5e44',
            color: '#e89a8a', fontSize: 12,
          }}>{error}</div>
        )}

        {/* 결제·무료 풀이 버튼 */}
        <button onClick={handleSubmit} disabled={submitting}
          style={{
            marginTop: 16, width: '100%', padding: '14px 20px',
            border: 'none', borderRadius: 999,
            cursor: submitting ? 'not-allowed' : 'pointer',
            background: submitting
              ? '#444'
              : (isFree
                  ? 'linear-gradient(135deg, #4a8a4a 0%, #7ad07a 100%)'
                  : `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_LIGHT} 100%)`),
            color: isFree ? '#0a1a0a' : FOREST,
            fontWeight: 700, fontSize: 15, letterSpacing: '0.05em',
            fontFamily: "'Noto Serif KR', serif",
            boxShadow: submitting
              ? 'none'
              : (isFree ? '0 0 24px #7ad07a66' : `0 0 24px ${GOLD}66`),
          }}>
          {submitting
            ? (isFree ? '풀이 준비 중…' : '결제창으로 이동 중…')
            : (isFree
                ? '무료 풀이 받기 →'
                : `${finalPrice.toLocaleString()}원 결제하기 →`)}
        </button>

        <p style={{
          marginTop: 12, fontSize: 10, color: '#78350f99',
          textAlign: 'center', lineHeight: 1.6,
        }}>결제 완료 후 사주 풀이가 즉시 진행됩니다.</p>
      </div>
    </div>
  );
}

function CheckRow({
  checked, onChange, label, href, bold,
}: {
  checked: boolean; onChange: (v: boolean) => void;
  label: string; href?: string; bold?: boolean;
}) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '6px 0', cursor: 'pointer',
    }}>
      <input type="checkbox" checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: 16, height: 16, accentColor: GOLD, cursor: 'pointer' }}
      />
      <span style={{
        flex: 1, fontSize: 12,
        color: bold ? '#fef3c7' : '#d6cdb8',
        fontWeight: bold ? 700 : 400,
      }}>{label}</span>
      {href && (
        <a href={href} target="_blank" rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          style={{ fontSize: 11, color: `${GOLD}cc`, textDecoration: 'underline' }}>
          보기
        </a>
      )}
    </label>
  );
}
