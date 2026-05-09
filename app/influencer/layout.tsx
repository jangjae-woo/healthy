// 인플루언서 영역 — 시스템 sans-serif (가독성 우선)
const FONT_STACK = `'Pretendard', 'Apple SD Gothic Neo', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', 'Malgun Gothic', sans-serif`;

export default function InfluencerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: FONT_STACK, fontFeatureSettings: '"tnum"' }}>
      {children}
    </div>
  );
}
