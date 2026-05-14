'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Influencer {
  id: string;
  slug: string;
  name: string;
  discount_amount: number;
  discount_days: number;
  created_at: string;
}

export default function InfluencersPage() {
  const [list, setList] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newSlug, setNewSlug] = useState('');
  const [newName, setNewName] = useState('');
  const [newPw, setNewPw] = useState('');
  const [newDiscount, setNewDiscount] = useState('0');
  const [newDays, setNewDays] = useState('1');
  const [busy, setBusy] = useState(false);
  const [origin, setOrigin] = useState('');

  // 행별 할인 수정 상태
  const [editId, setEditId] = useState<string | null>(null);
  const [editDiscount, setEditDiscount] = useState('0');
  const [editDays, setEditDays] = useState('1');
  const [editBusy, setEditBusy] = useState(false);

  // 추적 URL은 항상 라이브 도메인. preview에서 봐도 공유할 URL은 paljawon.com
  useEffect(() => { setOrigin('https://www.paljawon.com'); load(); }, []);

  async function load() {
    setLoading(true); setErr('');
    try {
      const res = await fetch('/api/admin/influencers');
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      const j = await res.json();
      if (!j.ok) setErr(j.error || '조회 실패');
      else setList(j.influencers);
    } catch { setErr('네트워크 오류'); }
    setLoading(false);
  }

  async function add() {
    if (!newSlug || !newName || !newPw) return;
    setBusy(true); setErr('');
    try {
      const res = await fetch('/api/admin/influencers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: newSlug,
          name: newName,
          password: newPw,
          discount_amount: Number(newDiscount) || 0,
          discount_days: Number(newDays) || 1,
        }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) { setErr(j.error || '생성 실패'); }
      else {
        setNewSlug(''); setNewName(''); setNewPw(''); setNewDiscount('0'); setNewDays('1');
        setShowAdd(false);
        load();
      }
    } catch { setErr('네트워크 오류'); }
    setBusy(false);
  }

  function startEdit(i: Influencer) {
    setEditId(i.id);
    setEditDiscount(String(i.discount_amount ?? 0));
    setEditDays(String(i.discount_days ?? 1));
    setErr('');
  }

  async function saveEdit(id: string) {
    setEditBusy(true); setErr('');
    try {
      const res = await fetch('/api/admin/influencers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          discount_amount: Number(editDiscount) || 0,
          discount_days: Number(editDays) || 1,
        }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) setErr(j.error || '수정 실패');
      else { setEditId(null); load(); }
    } catch { setErr('네트워크 오류'); }
    setEditBusy(false);
  }

  async function remove(id: string, name: string) {
    if (!confirm(`"${name}" 인플루언서를 삭제할까요?`)) return;
    try {
      const res = await fetch('/api/admin/influencers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const j = await res.json();
      if (!j.ok) setErr(j.error || '삭제 실패');
      else load();
    } catch { setErr('네트워크 오류'); }
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-[#1a1a1a]">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-[12px] tracking-[0.2em] text-gray-400 uppercase">Paljawon Admin</div>
            <h1 className="text-2xl font-bold mt-1">인플루언서 관리</h1>
          </div>
          <Link href="/admin/dashboard" className="text-base px-5 py-2.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition font-semibold">
            ← 대시보드
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {!showAdd && (
          <button onClick={() => setShowAdd(true)} className="mb-5 px-4 py-2.5 rounded-lg text-sm font-bold bg-[#1a1a1a] text-white hover:bg-[#333] transition">
            + 인플루언서 추가
          </button>
        )}

        {showAdd && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
            <h3 className="text-sm font-bold mb-4">신규 인플루언서</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
              <Field label="slug (URL용, 영숫자)" value={newSlug} onChange={setNewSlug} placeholder="예: hong" />
              <Field label="표시명" value={newName} onChange={setNewName} placeholder="예: 홍길동" />
              <Field label="비밀번호" value={newPw} onChange={setNewPw} placeholder="••••••••" type="password" />
              <Field label="할인 금액 (원)" value={newDiscount} onChange={setNewDiscount} placeholder="예: 20000" type="number" />
              <Field label="할인 유효일수 (일)" value={newDays} onChange={setNewDays} placeholder="기본 1" type="number" />
            </div>
            <p className="text-[12px] text-gray-400 mb-3">
              할인 유효일수 = 추적 URL 유입 후 며칠간 할인·실적이 인정되는지. 기본 1일(유입 당일만).
            </p>
            <div className="flex gap-2">
              <button onClick={add} disabled={busy || !newSlug || !newName || !newPw} className="px-4 py-2 rounded-lg text-sm font-bold bg-[#1a1a1a] text-white hover:bg-[#333] transition disabled:opacity-40">
                저장
              </button>
              <button onClick={() => { setShowAdd(false); setNewSlug(''); setNewName(''); setNewPw(''); setNewDiscount('0'); setNewDays('1'); }} className="px-4 py-2 rounded-lg text-sm bg-gray-100 hover:bg-gray-200">
                취소
              </button>
            </div>
          </div>
        )}

        {err && <div className="rounded-lg p-3 mb-4 bg-red-50 border border-red-200 text-red-700 text-sm">{err}</div>}

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-400 text-sm">로딩 중…</div>
          ) : list.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-sm">아직 등록된 인플루언서가 없습니다.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-[13px]">
                <tr>
                  <Th>표시명</Th>
                  <Th>slug</Th>
                  <Th>할인 금액 / 유효일수</Th>
                  <Th>추적 URL (팔로워 공유용)</Th>
                  <Th>로그인 URL (인플루언서 전용)</Th>
                  <Th>등록일</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody>
                {list.map((i) => {
                  const trackUrl = `${origin}/${i.slug}`;
                  const loginUrl = `${origin}/influencer/login?slug=${i.slug}`;
                  const editing = editId === i.id;
                  return (
                    <tr key={i.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <Td>{i.name}</Td>
                      <Td className="font-mono text-[12px] text-gray-500">{i.slug}</Td>
                      <Td>
                        {editing ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              value={editDiscount}
                              onChange={(e) => setEditDiscount(e.target.value)}
                              className="w-20 px-2 py-1 rounded border border-gray-300 text-[12px] focus:outline-none focus:border-gray-500"
                            />
                            <span className="text-[12px] text-gray-400">원 ·</span>
                            <input
                              type="number"
                              value={editDays}
                              onChange={(e) => setEditDays(e.target.value)}
                              className="w-14 px-2 py-1 rounded border border-gray-300 text-[12px] focus:outline-none focus:border-gray-500"
                            />
                            <span className="text-[12px] text-gray-400">일</span>
                          </div>
                        ) : (
                          <span className="text-[13px]">
                            {(i.discount_amount ?? 0).toLocaleString()}원
                            <span className="text-gray-400"> · {i.discount_days ?? 1}일</span>
                          </span>
                        )}
                      </Td>
                      <Td>
                        <button
                          onClick={() => { navigator.clipboard.writeText(trackUrl); alert('추적 URL 복사됨'); }}
                          className="text-[12px] text-blue-600 hover:text-blue-800 underline truncate max-w-[260px] inline-block"
                        >
                          {trackUrl}
                        </button>
                      </Td>
                      <Td>
                        <button
                          onClick={() => { navigator.clipboard.writeText(loginUrl); alert('로그인 URL 복사됨'); }}
                          className="text-[12px] text-emerald-600 hover:text-emerald-800 underline truncate max-w-[260px] inline-block"
                        >
                          {loginUrl}
                        </button>
                      </Td>
                      <Td className="text-gray-500">{new Date(i.created_at).toLocaleDateString('ko-KR')}</Td>
                      <Td>
                        {editing ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveEdit(i.id)}
                              disabled={editBusy}
                              className="text-[12px] font-bold text-[#1a1a1a] hover:text-black disabled:opacity-40"
                            >
                              저장
                            </button>
                            <button
                              onClick={() => setEditId(null)}
                              className="text-[12px] text-gray-500 hover:text-gray-700"
                            >
                              취소
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button onClick={() => startEdit(i)} className="text-[12px] text-blue-600 hover:text-blue-800">
                              수정
                            </button>
                            <button onClick={() => remove(i.id, i.name)} className="text-[12px] text-red-600 hover:text-red-800">
                              삭제
                            </button>
                          </div>
                        )}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="block text-[11px] text-gray-500 mb-1">{label}</label>
      <input
        type={type ?? 'text'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-gray-500"
      />
    </div>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return <th className="px-4 py-3 text-left font-semibold">{children}</th>;
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-[14px] ${className ?? ''}`}>{children}</td>;
}
