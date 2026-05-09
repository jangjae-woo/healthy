'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErr(j.error || '로그인 실패'); setBusy(false); return;
      }
      router.push('/admin/dashboard');
    } catch { setErr('네트워크 오류'); setBusy(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f8fa]">
      <form onSubmit={submit} className="w-full max-w-sm bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
        <div className="text-[11px] tracking-[0.2em] text-gray-400 uppercase">Paljawon Admin</div>
        <h1 className="text-xl font-bold mt-1 mb-1 text-[#1a1a1a]">운영자 로그인</h1>
        <p className="text-sm text-gray-500 mb-6">관리자 비밀번호를 입력해주세요.</p>
        <input
          type="password"
          autoFocus
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="비밀번호"
          className="w-full px-4 py-3 rounded-lg text-[#1a1a1a] border border-gray-300 focus:outline-none focus:border-gray-500"
        />
        {err && <p className="text-red-600 text-sm mt-3">{err}</p>}
        <button
          type="submit"
          disabled={busy || !pw}
          className="w-full mt-5 py-3 rounded-lg font-bold bg-[#1a1a1a] text-white hover:bg-[#333] transition disabled:opacity-40"
        >
          {busy ? '확인 중…' : '로그인'}
        </button>
      </form>
    </div>
  );
}
