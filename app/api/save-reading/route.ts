import { NextRequest, NextResponse } from 'next/server';

// ⭐ V2.2.3 (2026-05-15) — 4개 서비스 분리 저장
// service 값 (default: "saju" = 평생사주, 기존 동작 호환)에 따라 GAS가 시트 탭 분기:
//   - "saju"        → 평생사주 탭
//   - "parentchild" → 부모와자녀 탭
//   - "inyeon"      → 인연궁합 탭
//   - "hongsil"     → 연애사주 탭
// payload는 서비스별로 자유 형태 (GAS는 한 셀에 JSON 통째 저장).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { key, service = 'saju', aiContent, qaHistory, payload } = body;
    const scriptUrl = process.env.GOOGLE_SCRIPT_URL!;

    await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'save_reading',
        service,
        key,
        // 기존 호환: 평생사주는 aiContent + qaHistory 그대로
        aiContent,
        qaHistory,
        // 신규: 다른 서비스는 자유 형태 payload
        payload,
      }),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
