// Supabase 서버 전용 헬퍼 — service_role 키 사용 (RLS 우회).
// 클라이언트 코드에서 import 금지. API 라우트 / 서버 컴포넌트에서만.

// 어필리에이트 전용 Supabase 프로젝트 — 기존 (쿠폰/이지비디오) DB와 격리.
const SUPABASE_URL = process.env.PALJAWON_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.PALJAWON_SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL) console.warn('[supabase-admin] PALJAWON_SUPABASE_URL 미설정');

interface RestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  prefer?: string;
  query?: string;
}

export async function sbRest<T = unknown>(table: string, opts: RestOptions = {}): Promise<T> {
  if (!SERVICE_ROLE_KEY) {
    throw new Error('PALJAWON_SUPABASE_SERVICE_ROLE_KEY 미설정 — Supabase 대시보드에서 service_role 키 가져와 환경변수에 박을 것');
  }
  const { method = 'GET', body, prefer, query } = opts;
  const url = `${SUPABASE_URL}/rest/v1/${table}${query ?? ''}`;
  const headers: Record<string, string> = {
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  };
  if (prefer) headers.Prefer = prefer;
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Supabase ${method} ${table} ${res.status}: ${text.slice(0, 300)}`);
  }
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

// 마스킹 헬퍼
export function maskName(name?: string | null): string {
  if (!name) return '';
  const trimmed = name.trim();
  if (trimmed.length <= 1) return trimmed;
  if (trimmed.length === 2) return trimmed[0] + '*';
  // 3자 이상: 첫 자 + * 가운데 + 마지막 자
  return trimmed[0] + '*'.repeat(trimmed.length - 2) + trimmed[trimmed.length - 1];
}

export function lastFourPhone(phone?: string | null): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  return digits.slice(-4);
}

// IP 익명화 — SHA256(ip + salt) 의 16자
export async function hashIp(ip: string): Promise<string> {
  const salt = process.env.AFFILIATE_IP_SALT || 'paljawon-default-salt';
  const buf = new TextEncoder().encode(ip + salt);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash))
    .slice(0, 8)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// 비밀번호 해시 — sha256(pw + salt)
export async function hashPassword(password: string, salt: string): Promise<string> {
  const buf = new TextEncoder().encode(password + salt);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function generateSalt(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}
