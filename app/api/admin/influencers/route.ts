import { NextRequest, NextResponse } from 'next/server';
import { sbRest, hashPassword, generateSalt } from '@/lib/supabase-admin';
import { verifyAdminSession, ADMIN_COOKIE_NAME } from '@/lib/affiliate-auth';

// GET — 인플루언서 목록 + 각자 누적 통계 미니
export async function GET(req: NextRequest) {
  const cookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!(await verifyAdminSession(cookie))) {
    return NextResponse.json({ error: '인증 필요' }, { status: 401 });
  }
  try {
    const list = await sbRest<Array<{ id: string; slug: string; name: string; created_at: string }>>(
      'influencers',
      { query: '?select=id,slug,name,created_at&order=created_at.desc' }
    );
    return NextResponse.json({ ok: true, influencers: list ?? [] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '서버 오류';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

// 예약어 — 사이트 다른 라우트와 충돌 방지 (slug = 도메인 직속이라 충돌 위험)
const RESERVED_SLUGS = new Set([
  'admin', 'api', 'influencer', 'matching', 'parent-child', 'parent-child-v2',
  'payment', 'privacy', 'r', 'refund', 'saju', 'saju-love', 'terms',
  'face', 'inyeon', 'moving', 'naming', 'new-year', 'zh-tw',
  '_next', 'public', 'static', 'assets', 'images', 'img',
  'login', 'logout', 'signup', 'signin', 'register', 'dashboard',
  'about', 'contact', 'help', 'support', 'faq', 'home', 'index',
]);

// POST — 신규 인플루언서 생성. body: { slug, name, password }
export async function POST(req: NextRequest) {
  const cookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!(await verifyAdminSession(cookie))) {
    return NextResponse.json({ error: '인증 필요' }, { status: 401 });
  }
  try {
    const { slug, name, password } = await req.json();
    if (!slug || !name || !password) {
      return NextResponse.json({ error: 'slug, name, password 필수' }, { status: 400 });
    }
    const cleanSlug = String(slug).toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 64);
    if (!cleanSlug) {
      return NextResponse.json({ error: 'slug는 영숫자·하이픈만' }, { status: 400 });
    }
    if (RESERVED_SLUGS.has(cleanSlug)) {
      return NextResponse.json({ error: `"${cleanSlug}" 은(는) 사이트 예약어라 사용 불가. 다른 slug로 변경해주세요.` }, { status: 400 });
    }
    const salt = generateSalt();
    const hash = await hashPassword(String(password), salt);
    await sbRest('influencers', {
      method: 'POST',
      body: {
        slug: cleanSlug,
        name: String(name).slice(0, 100),
        password_hash: hash,
        password_salt: salt,
      },
      prefer: 'return=minimal',
    });
    return NextResponse.json({ ok: true, slug: cleanSlug });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '서버 오류';
    if (msg.includes('duplicate') || msg.includes('unique')) {
      return NextResponse.json({ ok: false, error: '이미 존재하는 slug입니다' }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

// DELETE — body: { id }
export async function DELETE(req: NextRequest) {
  const cookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!(await verifyAdminSession(cookie))) {
    return NextResponse.json({ error: '인증 필요' }, { status: 401 });
  }
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'id 누락' }, { status: 400 });
    await sbRest('influencers', {
      method: 'DELETE',
      query: `?id=eq.${encodeURIComponent(id)}`,
      prefer: 'return=minimal',
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '서버 오류';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
