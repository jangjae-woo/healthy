-- ============================================
-- 인플루언서별 할인 유효기간
-- 2026-05-14
-- ============================================
-- Supabase 대시보드 → palja 프로젝트 → SQL Editor 에서 실행

-- influencers 테이블에 할인 유효일수 컬럼 추가
ALTER TABLE influencers
  ADD COLUMN IF NOT EXISTS discount_days INTEGER NOT NULL DEFAULT 1;

COMMENT ON COLUMN influencers.discount_days IS
  '이 인플루언서 추적 URL로 유입된 고객에게 할인이 유지되는 일수. 추적 쿠키(pjw_ref) 수명을 결정. 기본 1일 = 유입 당일만 할인/실적 인정';

-- 기존 인플루언서는 모두 1일로 세팅됨 (DEFAULT 1). 더 길게 주고 싶으면 개별 UPDATE:
--   UPDATE influencers SET discount_days = 3 WHERE slug = 'kang';
