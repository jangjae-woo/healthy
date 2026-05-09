// 어필리에이트 시스템 인증 — HMAC 기반 stateless 세션 쿠키.
// 어드민(운영자) + 인플루언서 두 종류.

const SESSION_SECRET = process.env.AFFILIATE_SESSION_SECRET || 'paljawon-default-session-secret-change-me';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7일

async function hmacSha256(message: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ── 어드민 세션 ─────────────────────────────────────────────
export const ADMIN_COOKIE_NAME = 'pjw_admin';

export async function createAdminSession(): Promise<string> {
  const ts = Date.now().toString();
  const sig = await hmacSha256(`admin.${ts}`, SESSION_SECRET);
  return `${ts}.${sig}`;
}

export async function verifyAdminSession(cookie: string | undefined | null): Promise<boolean> {
  if (!cookie) return false;
  const parts = cookie.split('.');
  if (parts.length !== 2) return false;
  const [ts, sig] = parts;
  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum) || Date.now() - tsNum > SESSION_TTL_MS) return false;
  const expected = await hmacSha256(`admin.${ts}`, SESSION_SECRET);
  return timingSafeEqual(sig, expected);
}

// ── 인플루언서 세션 ─────────────────────────────────────────
export const INFLUENCER_COOKIE_NAME = 'pjw_inf_session';

export async function createInfluencerSession(slug: string): Promise<string> {
  const ts = Date.now().toString();
  const sig = await hmacSha256(`inf.${slug}.${ts}`, SESSION_SECRET);
  return `${slug}.${ts}.${sig}`;
}

export async function verifyInfluencerSession(cookie: string | undefined | null): Promise<string | null> {
  if (!cookie) return null;
  const parts = cookie.split('.');
  if (parts.length !== 3) return null;
  const [slug, ts, sig] = parts;
  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum) || Date.now() - tsNum > SESSION_TTL_MS) return null;
  const expected = await hmacSha256(`inf.${slug}.${ts}`, SESSION_SECRET);
  if (!timingSafeEqual(sig, expected)) return null;
  return slug;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
