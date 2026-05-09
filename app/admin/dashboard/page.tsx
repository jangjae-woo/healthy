'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface PaymentRow {
  paid_at: string;
  status: string;
  amount: number;
  refund_amount: number | null;
  product_name: string | null;
  customer_name_masked: string | null;
  customer_phone_last4: string | null;
  portone_payment_id: string;
  influencer_id: string | null;
}
interface Summary {
  paidCount: number;
  refundCount: number;
  refundRate: number;
  grossSales: number;
  refundAmount: number;
  netSales: number;
}

export default function AdminDashboardPage() {
  const [allSummary, setAllSummary] = useState<Summary | null>(null);
  const [monthSummary, setMonthSummary] = useState<Summary | null>(null);
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [month, setMonth] = useState<string>(currentMonth());
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  async function load() {
    setLoading(true); setErr('');
    try {
      const [allRes, monthRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch(`/api/admin/stats?month=${month}`),
      ]);
      if (allRes.status === 401) { window.location.href = '/admin/login'; return; }
      const all = await allRes.json();
      const m = await monthRes.json();
      if (!all.ok || !m.ok) { setErr('조회 실패'); }
      else {
        setAllSummary(all.summary);
        setMonthSummary(m.summary);
        setRows(m.rows);
      }
    } catch { setErr('네트워크 오류'); }
    setLoading(false);
  }

  useEffect(() => { load(); }, [month]);

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-[#1a1a1a]">
      {/* 상단 헤더 */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-[12px] tracking-[0.2em] text-gray-400 uppercase">Paljawon Admin</div>
            <h1 className="text-2xl font-bold mt-1">팔자원 운영자 대시보드</h1>
          </div>
          <Link href="/admin/influencers" className="text-base px-5 py-2.5 rounded-lg bg-[#1a1a1a] text-white hover:bg-[#333] transition font-semibold">
            인플루언서 관리
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {err && <div className="rounded-lg p-3 mb-4 bg-red-50 border border-red-200 text-red-700 text-sm">{err}</div>}

        {/* 누적 통계 */}
        <Section title="누적 통계" subtitle="전체 기간">
          <StatGrid>
            <Stat label="총 결제 건" value={allSummary ? allSummary.paidCount.toLocaleString() : '—'} />
            <Stat label="환불 건" value={allSummary ? allSummary.refundCount.toLocaleString() : '—'} />
            <Stat label="환불률" value={allSummary ? (allSummary.refundRate * 100).toFixed(1) + '%' : '—'} />
            <Stat label="총 매출" value={allSummary ? '₩' + allSummary.grossSales.toLocaleString() : '—'} />
            <Stat label="순매출 (환불 차감)" value={allSummary ? '₩' + allSummary.netSales.toLocaleString() : '—'} highlight />
          </StatGrid>
        </Section>

        {/* 월별 통계 */}
        <Section
          title="월별 통계"
          subtitle={month}
          right={
            <div className="flex items-center gap-2">
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 bg-white"
              >
                {lastNMonths(24).map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <a
                href={`/api/admin/export?month=${month}`}
                className="text-sm px-3 py-1.5 rounded-lg bg-[#1a1a1a] text-white hover:bg-[#333] transition"
              >
                CSV 다운
              </a>
            </div>
          }
        >
          <StatGrid>
            <Stat label="결제 건" value={monthSummary ? monthSummary.paidCount.toLocaleString() : '—'} />
            <Stat label="환불 건" value={monthSummary ? monthSummary.refundCount.toLocaleString() : '—'} />
            <Stat label="환불률" value={monthSummary ? (monthSummary.refundRate * 100).toFixed(1) + '%' : '—'} />
            <Stat label="매출" value={monthSummary ? '₩' + monthSummary.grossSales.toLocaleString() : '—'} />
            <Stat label="총 결제액" value={monthSummary ? '₩' + monthSummary.netSales.toLocaleString() : '—'} highlight />
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
                      <Th>결제일시</Th>
                      <Th>상태</Th>
                      <Th>금액</Th>
                      <Th>상품</Th>
                      <Th>고객</Th>
                      <Th>전화 끝4</Th>
                      <Th>경로</Th>
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
                        <Td>{r.influencer_id ? <span className="text-blue-600">인플루언서</span> : <span className="text-gray-400">직접</span>}</Td>
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
