import { NextRequest, NextResponse } from 'next/server';
import { sbRest, hashIp } from '@/lib/supabase-admin';

// 인플루언서 추적 URL — paljawon.com/r/{slug}
// 동작:
//   1. slug → influencers 조회. 존재하면 influencer_id 획득
//   2. visits 테이블에 1행 INSERT (ip_hash, ua, landing_path)
//   3. 쿠키 pjw_ref={slug} 30일 저장
//   4. 메인 사이트 (또는 ?to= 쿼리로 지정한 경로)로 302 리다이렉트
//
// 잘못된 slug여도 메인으로 리다이렉트 (404 안 띄움 — 사용자 경험)

const COOKIE_NAME = 'pjw_ref';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30일

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const url = new URL(req.url);
  const to = url.searchParams.get('to') || '/';

  const targetUrl = new URL(to, url.origin);
  const response = NextResponse.redirect(targetUrl, 302);

  try {
    // slug 정규화
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 64);
    if (!cleanSlug) return response;

    // influencer 조회
    const rows = await sbRest<Array<{ id: string }>>(`influencers`, {
      query: `?slug=eq.${encodeURIComponent(cleanSlug)}&select=id&limit=1`,
    });
    const influencerId = rows?.[0]?.id;
    if (!influencerId) return response; // 존재 안 하면 그냥 리다이렉트

    // 쿠키 저장
    response.cookies.set(COOKIE_NAME, cleanSlug, {
      maxAge: COOKIE_MAX_AGE,
      path: '/',
      sameSite: 'lax',
      httpOnly: false, // 클라이언트에서도 확인 가능 (디버깅 편의)
    });

    // 방문 기록 (실패해도 사용자 경험 영향 없게 silent)
    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
    const ua = req.headers.get('user-agent') || '';
    const ipHash = await hashIp(ip);

    // 봇 필터 — 단순 UA 패턴 차단
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
    console.error('[/r/slug] error', e);
  }

  return response;
}
