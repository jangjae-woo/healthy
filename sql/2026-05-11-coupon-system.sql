-- ============================================
-- 쿠폰 시스템 + 인플루언서 자동 할인
-- 2026-05-11
-- ============================================
-- Supabase 대시보드 → palja 프로젝트 → SQL Editor 에서 한 번에 실행
-- 실행 전: 다른 마이그레이션 없는지 확인

-- 1) influencers 테이블에 자동 할인액 컬럼 추가
ALTER TABLE influencers
  ADD COLUMN IF NOT EXISTS discount_amount INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN influencers.discount_amount IS
  '이 인플루언서 추적 URL로 들어온 고객 결제 시 자동 차감 금액 (원). 0이면 할인 없음';

-- 2) coupons 테이블 신설 — 무료 쿠폰 발급용
CREATE TABLE IF NOT EXISTS coupons (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code         TEXT NOT NULL UNIQUE,
  influencer_id UUID REFERENCES influencers(id) ON DELETE SET NULL,
  discount_type TEXT NOT NULL DEFAULT 'free' CHECK (discount_type IN ('free')),
  max_uses     INTEGER NOT NULL DEFAULT 50,
  used_count   INTEGER NOT NULL DEFAULT 0,
  active       BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_influencer ON coupons(influencer_id);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- service_role 만 접근 (서버 API 경유). 클라이언트 직접 접근 막음.
DROP POLICY IF EXISTS "coupons service_role only" ON coupons;
CREATE POLICY "coupons service_role only" ON coupons
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 3) payments 테이블 확장 — 어느 할인 받았는지 기록
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS coupon_code TEXT,
  ADD COLUMN IF NOT EXISTS discount_amount INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN payments.coupon_code IS '결제 시 사용된 무료 쿠폰 코드 (인플루언서 자동 할인이 아닌, 입력된 쿠폰만)';
COMMENT ON COLUMN payments.discount_amount IS '결제 시 적용된 할인 금액 (원). 인플루언서 자동 할인 또는 쿠폰 할인';

-- 4) 쿠폰 사용 횟수 원자적 증가 함수 (race condition 방어)
CREATE OR REPLACE FUNCTION increment_coupon_use(coupon_code_param TEXT)
RETURNS TABLE(success BOOLEAN, message TEXT, coupon_id UUID, influencer_id UUID) AS $$
DECLARE
  v_row coupons%ROWTYPE;
BEGIN
  -- 락 걸고 조회
  SELECT * INTO v_row FROM coupons
   WHERE code = coupon_code_param
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, '존재하지 않는 쿠폰입니다', NULL::UUID, NULL::UUID;
    RETURN;
  END IF;

  IF NOT v_row.active THEN
    RETURN QUERY SELECT false, '비활성화된 쿠폰입니다', NULL::UUID, NULL::UUID;
    RETURN;
  END IF;

  IF v_row.expires_at IS NOT NULL AND v_row.expires_at < now() THEN
    RETURN QUERY SELECT false, '만료된 쿠폰입니다', NULL::UUID, NULL::UUID;
    RETURN;
  END IF;

  IF v_row.used_count >= v_row.max_uses THEN
    RETURN QUERY SELECT false, '사용 한도를 초과했습니다', NULL::UUID, NULL::UUID;
    RETURN;
  END IF;

  -- 사용 횟수 증가
  UPDATE coupons SET used_count = used_count + 1 WHERE id = v_row.id;

  RETURN QUERY SELECT true, 'OK', v_row.id, v_row.influencer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- service_role 에서만 호출
REVOKE EXECUTE ON FUNCTION increment_coupon_use(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION increment_coupon_use(TEXT) TO service_role;

-- ============================================
-- 운영용 SQL (참고)
-- ============================================

-- ▶ 인플루언서 자동 할인 설정 (예: 강 = 20,000원)
--   UPDATE influencers SET discount_amount = 20000 WHERE slug = 'kang';

-- ▶ 무료 쿠폰 발급 (예: 강에게 50회 무료)
--   1) 인플루언서 id 조회:
--      SELECT id FROM influencers WHERE slug = 'kang';
--   2) 쿠폰 INSERT:
--      INSERT INTO coupons (code, influencer_id, max_uses)
--        VALUES ('KANG-FREE-50', 'xxx-influencer-uuid', 50);

-- ▶ 쿠폰 사용 현황 조회
--   SELECT c.code, i.slug, c.used_count, c.max_uses, c.active
--     FROM coupons c LEFT JOIN influencers i ON i.id = c.influencer_id
--    ORDER BY c.created_at DESC;

-- ▶ 결제 + 쿠폰 통계
--   SELECT
--     i.slug,
--     COUNT(*) FILTER (WHERE p.amount > 0) AS paid_count,
--     COUNT(*) FILTER (WHERE p.amount = 0) AS free_count,
--     SUM(p.amount) AS revenue,
--     SUM(p.discount_amount) AS total_discount
--   FROM payments p LEFT JOIN influencers i ON i.id = p.influencer_id
--   GROUP BY i.slug
--   ORDER BY revenue DESC;
