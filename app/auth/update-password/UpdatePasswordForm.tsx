'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, KeyRound, RefreshCcw } from 'lucide-react';
import { supabase } from '@/utils/supabase/client';
import { ADMIN_DASHBOARD_PATH, validateNewPassword } from '@/utils/auth/flow';

interface UpdatePasswordFormProps {
  initialError?: string;
}

export default function UpdatePasswordForm({ initialError }: UpdatePasswordFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(initialError || '');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      const { data, error: userError } = await supabase.auth.getUser();
      if (!isMounted) return;

      if (userError || !data.user) {
        setError(initialError || 'Link đặt mật khẩu không hợp lệ hoặc đã hết hạn.');
      }

      setCheckingSession(false);
    }

    checkSession();

    return () => {
      isMounted = false;
    };
  }, [initialError]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const validation = validateNewPassword(password, confirmPassword);
    if (!validation.ok) {
      setError(validation.message || 'Mật khẩu chưa hợp lệ.');
      return;
    }

    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError('Không thể đặt mật khẩu. Vui lòng dùng lại link trong email.');
      setSaving(false);
      return;
    }

    setPassword('');
    setConfirmPassword('');
    setSuccess('Đặt mật khẩu thành công.');
    setSaving(false);

    window.setTimeout(() => {
      router.replace(ADMIN_DASHBOARD_PATH);
      router.refresh();
    }, 700);
  };

  const disabled = checkingSession || saving || Boolean(initialError);

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100 font-sans">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl space-y-4"
      >
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto">
            <KeyRound className="w-5 h-5" />
          </div>
          <h1 className="text-base font-bold">Đặt mật khẩu</h1>
          <p className="text-xs text-slate-400">Mật khẩu cần có ít nhất 8 ký tự.</p>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-300" htmlFor="new-password">
            Mật khẩu mới
          </label>
          <div className="relative">
            <input
              id="new-password"
              type={showPassword ? 'text' : 'password'}
              className="w-full bg-slate-950 border border-slate-800 p-3 pr-10 rounded-xl text-xs focus:outline-none focus:border-blue-600"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={disabled}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              className="absolute inset-y-0 right-2 text-slate-400 hover:text-slate-100"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-300" htmlFor="confirm-password">
            Nhập lại mật khẩu
          </label>
          <input
            id="confirm-password"
            type={showPassword ? 'text' : 'password'}
            className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs focus:outline-none focus:border-blue-600"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            disabled={disabled}
            autoComplete="new-password"
            required
          />
        </div>

        {checkingSession && (
          <p className="text-[11px] text-slate-400 text-center">Đang kiểm tra phiên đăng nhập.</p>
        )}
        {error && <p className="text-[11px] text-red-400 text-center font-bold">{error}</p>}
        {success && <p className="text-[11px] text-emerald-400 text-center font-bold">{success}</p>}

        <button
          type="submit"
          disabled={disabled}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 font-bold text-xs p-3 rounded-xl transition flex items-center justify-center gap-1"
        >
          {saving ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : 'Lưu mật khẩu'}
        </button>
      </form>
    </main>
  );
}
