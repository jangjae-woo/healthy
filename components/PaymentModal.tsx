'use client';

import { useState, useEffect } from 'react';

const GOLD = '#c9960c';
const GOLD_LIGHT = '#e4b840';
const FOREST = '#0d1a0f';

interface Props {
  open: boolean;
  onClose: () => void;
  price: number;
  goodsName: string;
  onSubmit: (data: { name: string; phone: string }) => Promise<void>;
}

export default function PaymentModal({ open, onClose, price, goodsName, onSubmit }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [agree1, setAgree1] = useState(false);
  const [agree2, setAgree2] = useState(false);
  const [agree3, setAgree3] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const allAgreed = agree1 && agree2 && agree3;

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

  function formatPhone(v: string) {
    const digits = v.replace(/\D/g, '').slice(0, 11);
    if (digits.length < 4) return digits;
    if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }

  async function handleSubmit() {
    setError('');
    if (name.trim().length < 2) {
      setError('이름을 정확히 입력해 주세요.');
      return;
    }
    const phoneDigits = phone.replace(/\D/g, '');
    if (!/^01\d{8,9}$/.test(phoneDigits)) {
      setError('휴대폰 번호 형식을 확인해 주세요.');
      return;
    }
    if (!allAgreed) {
      setError('필수 약관에 모두 동의해 주세요.');
      return;
    }
    try {
      setSubmitting(true);
      try {
        localStorage.setItem(
          'paljawon_payer',
          JSON.stringify({ name: name.trim(), phone: phoneDigits, agreedAt: new Date().toISOString() })
        );
      } catch {}
      await onSubmit({ name: name.trim(), phone: phoneDigits });
    } catch (e: any) {
      setError(e?.message || '결제 요청에 실패했습니다.');
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.75)',
        padding: 16,
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 420,
          maxHeight: '92vh',
          overflowY: 'auto',
          background: 'linear-gradient(180deg, #132419 0%, #0a1408 100%)',
          border: `1px solid ${GOLD}55`,
          borderRadius: 18,
          boxShadow: `0 0 48px ${GOLD}33, 0 8px 24px rgba(0,0,0,0.5)`,
          padding: 24,
          fontFamily: "'Gowun Batang', 'Noto Serif KR', serif",
          color: '#e7e2d8',
          position: 'relative',
        }}
      >
        {/* 닫기 */}
        <button
          onClick={onClose}
          aria-label="닫기"
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'none',
            border: 'none',
            color: GOLD,
            fontSize: 22,
            cursor: 'pointer',
            padding: 4,
            lineHeight: 1,
          }}
        >
          ✕
        </button>

        {/* 제목 */}
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: '0.4em',
              color: `${GOLD}aa`,
              fontFamily: "'Cormorant Garamond', serif",
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            Payment
          </div>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: '#fef3c7',
              fontFamily: "'Noto Serif KR', serif",
              letterSpacing: '0.05em',
              margin: 0,
            }}
          >
            결제 정보 입력
          </h2>
        </div>

        {/* 상품·금액 */}
        <div
          style={{
            background: `${GOLD}0d`,
            border: `1px solid ${GOLD}33`,
            borderRadius: 12,
            padding: 14,
            marginBottom: 18,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 11, color: '#a39068', marginBottom: 4 }}>{goodsName}</div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: GOLD_LIGHT,
              fontFamily: "'Noto Serif KR', serif",
            }}
          >
            ₩{price.toLocaleString()}
          </div>
        </div>

        {/* 이름 */}
        <Field label="이름" required>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="홍길동"
            style={inputStyle}
          />
        </Field>

        {/* 휴대폰 */}
        <Field
          label="휴대폰 번호"
          required
          hint="결제 영수증 발송용, 마케팅 발송 X"
        >
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            placeholder="010-0000-0000"
            inputMode="numeric"
            style={inputStyle}
          />
        </Field>

        {/* 약관 */}
        <div
          style={{
            marginTop: 14,
            paddingTop: 14,
            borderTop: `1px solid ${GOLD}22`,
          }}
        >
          <CheckRow
            checked={allAgreed}
            onChange={(v) => toggleAll(v)}
            label="모두 동의합니다 (전체)"
            bold
          />
          <CheckRow
            checked={agree1}
            onChange={setAgree1}
            label="이용약관 (필수)"
            href="/terms"
          />
          <CheckRow
            checked={agree2}
            onChange={setAgree2}
            label="개인정보 수집·이용 동의 (필수)"
            href="/privacy"
          />
          <CheckRow
            checked={agree3}
            onChange={setAgree3}
            label="환불 정책 안내 확인 (필수)"
            href="/refund"
          />
        </div>

        {/* 에러 */}
        {error && (
          <div
            style={{
              marginTop: 12,
              padding: '8px 12px',
              borderRadius: 8,
              background: '#3a1010',
              border: '1px solid #c97a5e44',
              color: '#e89a8a',
              fontSize: 12,
            }}
          >
            {error}
          </div>
        )}

        {/* 결제 버튼 */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            marginTop: 16,
            width: '100%',
            padding: '14px 20px',
            border: 'none',
            borderRadius: 999,
            cursor: submitting ? 'not-allowed' : 'pointer',
            background: submitting
              ? '#444'
              : `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_LIGHT} 100%)`,
            color: FOREST,
            fontWeight: 700,
            fontSize: 15,
            letterSpacing: '0.05em',
            fontFamily: "'Noto Serif KR', serif",
            boxShadow: submitting ? 'none' : `0 0 24px ${GOLD}66`,
          }}
        >
          {submitting ? '결제창으로 이동 중…' : `${price.toLocaleString()}원 결제하기 →`}
        </button>

        <p
          style={{
            marginTop: 12,
            fontSize: 10,
            color: '#78350f99',
            textAlign: 'center',
            lineHeight: 1.6,
          }}
        >
          결제 완료 후 사주 풀이가 즉시 진행됩니다.
        </p>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: 10,
  background: '#0a1408',
  border: `1px solid ${GOLD}33`,
  color: '#fef3c7',
  fontSize: 14,
  outline: 'none',
  fontFamily: "'Gowun Batang', 'Noto Serif KR', serif",
};

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label
        style={{
          display: 'block',
          fontSize: 12,
          color: GOLD,
          marginBottom: 6,
          fontWeight: 700,
        }}
      >
        {label}
        {required && <span style={{ color: '#e89a8a', marginLeft: 4 }}>*</span>}
      </label>
      {children}
      {hint && (
        <div style={{ fontSize: 11, color: '#c9960ccc', marginTop: 5 }}>{hint}</div>
      )}
    </div>
  );
}

function CheckRow({
  checked,
  onChange,
  label,
  href,
  bold,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  href?: string;
  bold?: boolean;
}) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 0',
        cursor: 'pointer',
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{
          width: 16,
          height: 16,
          accentColor: GOLD,
          cursor: 'pointer',
        }}
      />
      <span
        style={{
          flex: 1,
          fontSize: 12,
          color: bold ? '#fef3c7' : '#d6cdb8',
          fontWeight: bold ? 700 : 400,
        }}
      >
        {label}
      </span>
      {href && (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          style={{
            fontSize: 11,
            color: `${GOLD}cc`,
            textDecoration: 'underline',
          }}
        >
          보기
        </a>
      )}
    </label>
  );
}
