// 어드민 영역 — 시스템 sans-serif (가독성 우선, 운영자/형 전용)
const FONT_STACK = `'Pretendard', 'Apple SD Gothic Neo', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', 'Malgun Gothic', sans-serif`;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: FONT_STACK, fontFeatureSettings: '"tnum"' }}>
      {children}
    </div>
  );
}
