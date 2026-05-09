import { NextRequest, NextResponse } from 'next/server';
import { sbRest, hashPassword } from '@/lib/supabase-admin';
import { createInfluencerSession, INFLUENCER_COOKIE_NAME } from '@/lib/affiliate-auth';

export async function POST(req: NextRequest) {
  try {
    const { slug, password } = await req.json();
    if (!slug || !password) {
      return NextResponse.json({ error: 'slug, password 필수' }, { status: 400 });
    }
    const cleanSlug = String(slug).toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 64);
    const rows = await sbRest<Array<{ slug: string; password_hash: string; password_salt: string }>>(
      'influencers',
      { query: `?slug=eq.${encodeURIComponent(cleanSlug)}&select=slug,password_hash,password_salt&limit=1` }
    );
    const row = rows?.[0];
    if (!row) {
      return NextResponse.json({ error: '존재하지 않는 슬러그' }, { status: 401 });
    }
    const hash = await hashPassword(String(password), row.password_salt);
    if (hash !== row.password_hash) {
      return NextResponse.json({ error: '비밀번호가 일치하지 않습니다' }, { status: 401 });
    }
    const session = await createInfluencerSession(row.slug);
    const res = NextResponse.json({ ok: true, slug: row.slug });
    res.cookies.set(INFLUENCER_COOKIE_NAME, session, {
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    return res;
  } catch (e) {
    const msg = e instanceof Error ? e.message : '서버 오류';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
