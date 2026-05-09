'use client';
import { useEffect, useState } from 'react';

interface PaymentRow {
  paid_at: string;
  status: string;
  amount: number;
  refund_amount: number | null;
  product_name: string | null;
  customer_name_masked: string | null;
  customer_phone_last4: string | null;
  portone_payment_id: string;
}
interface Summary {
  visitCount: number;
  paidCount: number;
  refundCount: number;
  refundRate: number;
  conversionRate: number;
  grossSales: number;
  refundAmount: number;
  netSales: number;
}

export default function InfluencerDashboardPage() {
  const [monthSummary, setMonthSummary] = useState<Summary | null>(null);
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [influencer, setInfluencer] = useState<{ name: string; slug: string } | null>(null);
  const [month, setMonth] = useState<string>(currentMonth());
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [origin, setOrigin] = useState('');

  // 추적 URL은 항상 라이브 도메인 paljawon.com
  useEffect(() => { setOrigin('https://www.paljawon.com'); }, []);

  async function load() {
    setLoading(true); setErr('');
    try {
      const res = await fetch(`/api/influencer/stats?month=${month}`);
      if (res.status === 401) { window.location.href = '/influencer/login'; return; }
      const j = await res.json();
      if (!j.ok) { setErr('조회 실패'); }
      else {
        setMonthSummary(j.summary);
        setRows(j.rows);
        setInfluencer(j.influencer);
      }
    } catch { setErr('네트워크 오류'); }
    setLoading(false);
  }

  useEffect(() => { load(); }, [month]);

  const myUrl = influencer ? `${origin}/${influencer.slug}` : '';

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-[#1a1a1a]">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="text-[12px] tracking-[0.2em] text-gray-400 uppercase">Paljawon</div>
          <h1 className="text-2xl font-bold mt-1">{influencer?.name ?? '...'} 님 대시보드</h1>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* 추적 URL */}
        {influencer && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <div className="text-[11px] text-gray-500 mb-2">내 추적 URL — 팔로워에게 공유</div>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 rounded bg-gray-50 border border-gray-200 text-[12px] font-mono break-all">{myUrl}</code>
              <button onClick={() => { navigator.clipboard.writeText(myUrl); alert('복사됨'); }} className="px-3 py-2 rounded text-sm font-bold bg-[#1a1a1a] text-white hover:bg-[#333] transition">
                복사
              </button>
            </div>
          </div>
        )}

        {err && <div className="rounded-lg p-3 mb-4 bg-red-50 border border-red-200 text-red-700 text-sm">{err}</div>}

        {/* 월별 */}
        <Section
          title="월별 통계"
          subtitle={month}
          right={
            <div className="flex items-center gap-2">
              <select value={month} onChange={(e) => setMonth(e.target.value)} className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 bg-white">
                {lastNMonths(24).map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <a href={`/api/influencer/export?month=${month}`} className="text-sm px-3 py-1.5 rounded-lg bg-[#1a1a1a] text-white hover:bg-[#333] transition">
                CSV 다운
              </a>
            </div>
          }
        >
          <StatGrid>
            <Stat label="방문" value={monthSummary ? monthSummary.visitCount.toLocaleString() : '—'} />
            <Stat label="결제" value={monthSummary ? monthSummary.paidCount.toLocaleString() : '—'} />
            <Stat label="전환율" value={monthSummary ? (monthSummary.conversionRate * 100).toFixed(2) + '%' : '—'} />
            <Stat label="환불" value={monthSummary ? monthSummary.refundCount.toLocaleString() : '—'} />
            <Stat label="순매출" value={monthSummary ? '₩' + monthSummary.netSales.toLocaleString() : '—'} highlight />
          </StatGrid>
        </Section>

        {/* 결제 내역 */}
        <Section title="결제 내역" subtitle={`${month} · ${rows.length}건`}>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-gray-400 text-sm">로딩 중…</div>
            ) : rows.length === 0 ? (
              <div className="p-12 text-center text-gray-400 text-sm">결제 내역이 없습니다.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600 text-[13px]">
                    <tr>
                      <Th>결제일시</Th><Th>상태</Th><Th>금액</Th><Th>상품</Th><Th>고객</Th><Th>전화 끝4</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.portone_payment_id} className="border-t border-gray-100 hover:bg-gray-50">
                        <Td>{new Date(r.paid_at).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</Td>
                        <Td><StatusBadge status={r.status} /></Td>
                        <Td className="font-medium">₩{r.amount.toLocaleString()}</Td>
                        <Td>{r.product_name ?? '-'}</Td>
                        <Td>{r.customer_name_masked ?? '-'}</Td>
                        <Td>{r.customer_phone_last4 ?? '-'}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, subtitle, right, children }: { title: string; subtitle?: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <div className="flex items-end justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}
function StatGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 md:grid-cols-5 gap-3">{children}</div>;
}
function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-5 border ${highlight ? 'bg-[#fffbe6] border-[#e5b80c]' : 'bg-white border-gray-200'}`}>
      <div className="text-[13px] text-gray-500">{label}</div>
      <div className={`mt-2 text-xl font-bold ${highlight ? 'text-[#a06f00]' : 'text-[#1a1a1a]'}`}>{value}</div>
    </div>
  );
}
function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-left font-semibold text-[13px]">{children}</th>;
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-[14px] ${className ?? ''}`}>{children}</td>;
}
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    PAID: { label: '완료', cls: 'bg-green-100 text-green-700' },
    REFUNDED: { label: '환불', cls: 'bg-red-100 text-red-700' },
    PARTIAL_REFUND: { label: '부분환불', cls: 'bg-amber-100 text-amber-700' },
  };
  const v = map[status] ?? { label: status, cls: 'bg-gray-100 text-gray-700' };
  return <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${v.cls}`}>{v.label}</span>;
}
function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function lastNMonths(n: number): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return out;
}
