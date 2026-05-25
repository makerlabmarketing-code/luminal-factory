// app/staff/page.tsx
'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function StaffPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      router.replace(`/staff/portal?token=${token}`);
    }
  }, [token, router]);

  return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500 font-mono text-xs">Đang vào cổng thông tin...</div>;
}