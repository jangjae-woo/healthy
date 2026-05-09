import { NextRequest, NextResponse } from 'next/server';
import { sbRest, hashIp } from '@/lib/supabase-admin';

// 인플루언서 추적 URL — paljawon.com/{slug}
// 기존 /r/{slug} 와 동일 로직. Next.js 라우팅 특성상 구체 경로(/admin, /saju 등)가 우선 매칭되므로
// 예약어와 겹치지 않는 slug만 여기로 떨어진다 (예약어는 인플루언서 등록 단계에서도 차단).

const COOKIE_NAME = 'pjw_ref';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

// 보안: 인플루언서 생성 시 차단했지만 혹시 이미 박힌 슬러그가 예약어 충돌하면 처리 안 됨
// (next.js가 specific route 먼저 매칭하므로 도달 자체가 안 됨 → 안전)

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const url = new URL(req.url);
  const to = url.searchParams.get('to') || '/';
  const targetUrl = new URL(to, url.origin);
  const response = NextResponse.redirect(targetUrl, 302);

  try {
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 64);
    if (!cleanSlug) return response;

    const rows = await sbRest<Array<{ id: string }>>(`influencers`, {
      query: `?slug=eq.${encodeURIComponent(cleanSlug)}&select=id&limit=1`,
    });
    const influencerId = rows?.[0]?.id;
    if (!influencerId) {
      // 인플루언서 미존재 — 404 대신 메인으로 redirect (UX)
      return response;
    }

    response.cookies.set(COOKIE_NAME, cleanSlug, {
      maxAge: COOKIE_MAX_AGE,
      path: '/',
      sameSite: 'lax',
      httpOnly: false,
    });

    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
    const ua = req.headers.get('user-agent') || '';
    const ipHash = await hashIp(ip);
    const isBot = /bot|crawler|spider|scrape|preview|fetch/i.test(ua);
    if (!isBot) {
      sbRest('visits', {
        method: 'POST',
        body: {
          influencer_id: influencerId,
          ip_hash: ipHash,
          user_agent: ua.slice(0, 500),
          landing_path: to.slice(0, 200),
        },
        prefer: 'return=minimal',
      }).catch(err => console.error('[visit log]', err));
    }
  } catch (e) {
    console.error('[/{slug}] error', e);
  }
  return response;
}
