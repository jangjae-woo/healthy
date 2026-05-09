-- 인플루언서 어필리에이트 시스템
-- 실행: Supabase Dashboard → SQL Editor → 전체 붙여넣기 → Run

-- ── 1. 인플루언서 ────────────────────────────────────────────
create table if not exists public.influencers (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,           -- /r/{slug} URL용. 영숫자 소문자만 권장
  name text not null,                   -- 표시명 (대시보드용)
  password_hash text not null,          -- sha256(password + salt) hex
  password_salt text not null,          -- 인플루언서별 random salt
  created_at timestamptz default now()
);

create index if not exists influencers_slug_idx on public.influencers(slug);

-- ── 2. 방문 기록 ─────────────────────────────────────────────
create table if not exists public.visits (
  id bigserial primary key,
  influencer_id uuid not null references public.influencers(id) on delete cascade,
  ip_hash text,                         -- 익명화된 IP (SHA256(ip+secret))
  user_agent text,
  landing_path text,
  ts timestamptz default now()
);

create index if not exists visits_influencer_ts_idx on public.visits(influencer_id, ts desc);

-- ── 3. 결제 기록 ─────────────────────────────────────────────
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  influencer_id uuid references public.influencers(id) on delete set null,
  portone_payment_id text unique not null,
  amount integer not null,
  status text not null default 'PAID',  -- PAID / REFUNDED / PARTIAL_REFUND
  product_name text,
  customer_name_masked text,            -- "장*우" 형식
  customer_phone_last4 text,            -- "5698" (마지막 4자리)
  paid_at timestamptz,
  refunded_at timestamptz,
  refund_amount integer default 0,
  created_at timestamptz default now()
);

create index if not exists payments_influencer_paid_idx on public.payments(influencer_id, paid_at desc);
create index if not exists payments_status_idx on public.payments(status);
create index if not exists payments_paid_at_idx on public.payments(paid_at desc);

-- ── 4. RLS — 서버(service_role)만 쓰고, 익명 클라이언트는 읽기 차단 ─
alter table public.influencers enable row level security;
alter table public.visits enable row level security;
alter table public.payments enable row level security;

-- 익명 클라이언트는 못 읽음. 모든 접근은 server-side service_role 키로만.
-- (서비스 롤 키는 RLS를 우회하므로 별도 정책 필요 없음)
