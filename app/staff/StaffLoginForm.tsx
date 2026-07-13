'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RefreshCcw, User } from 'lucide-react';
import { supabase } from '@/utils/supabase/client';
import { STAFF_PORTAL_PATH } from '@/utils/auth/flow';

interface StaffLoginFormProps {
  message?: string;
}

export default function StaffLoginForm({ message }: StaffLoginFormProps) {
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
      setError('Email hoặc mật khẩu chưa đúng.');
      setChecking(false);
      return;
    }

    router.replace(STAFF_PORTAL_PATH);
    router.refresh();
    setChecking(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100 font-sans">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl space-y-4">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-2xl flex items-center justify-center mx-auto">
            <User className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold">Đăng nhập nhân sự</h3>
        </div>

        <div className="space-y-2">
          <input
            type="email"
            placeholder="Email nhân sự"
            className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs focus:outline-none focus:border-purple-600"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={checking}
            autoComplete="email"
            required
          />
          <input
            type="password"
            placeholder="Mật khẩu"
            className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs focus:outline-none focus:border-purple-600"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={checking}
            autoComplete="current-password"
            required
          />
          {error && <p className="text-[11px] text-red-400 text-center font-bold">{error}</p>}
        </div>

        <button type="submit" disabled={checking} className="w-full bg-purple-600 hover:bg-purple-700 p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1">
          {checking ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : 'Đăng nhập'}
        </button>

        <Link href="/auth/forgot-password" className="block text-center text-xs text-slate-400 hover:text-slate-100">
          Quên mật khẩu?
        </Link>
      </form>
    </div>
  );
}
