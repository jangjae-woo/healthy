import { NextRequest, NextResponse } from 'next/server';
import { createAdminSession, ADMIN_COOKIE_NAME } from '@/lib/affiliate-auth';

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    const expected = process.env.ADMIN_PASSWORD;
    if (!expected) {
      return NextResponse.json({ error: 'ADMIN_PASSWORD 미설정' }, { status: 500 });
    }
    if (!password || password !== expected) {
      return NextResponse.json({ error: '비밀번호가 일치하지 않습니다' }, { status: 401 });
    }
    const session = await createAdminSession();
    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_COOKIE_NAME, session, {
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    return res;
  } catch {
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
