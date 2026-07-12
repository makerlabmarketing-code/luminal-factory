'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, RefreshCcw } from 'lucide-react';
import { supabase } from '@/utils/supabase/client';

interface AdminLoginFormProps {
  message?: string;
}

export default function AdminLoginForm({ message }: AdminLoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(message || '');
  const [checking, setChecking] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setChecking(true);
    setError('');

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError('Email hoặc mật khẩu không hợp lệ.');
      setChecking(false);
      return;
    }

    router.refresh();
    setChecking(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans text-white">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mx-auto border border-blue-500/20">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-sm font-black uppercase tracking-wider">Đăng nhập quản trị</h2>
        </div>

        <div className="space-y-2">
          <input
            type="email"
            placeholder="Email quản trị"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-blue-600 transition"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={checking}
            autoComplete="email"
            required
          />
          <input
            type="password"
            placeholder="Mật khẩu"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-blue-600 transition"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={checking}
            autoComplete="current-password"
            required
          />
          {error && <p className="text-[11px] text-red-400 text-center font-bold">{error}</p>}
        </div>

        <button type="submit" disabled={checking} className="w-full bg-blue-600 hover:bg-blue-700 font-bold text-xs p-3 rounded-xl uppercase tracking-wider transition flex items-center justify-center gap-1">
          {checking ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : 'Mở phiên quản trị'}
        </button>
      </form>
    </div>
  );
}
