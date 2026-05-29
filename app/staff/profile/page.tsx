// app/staff/profile/page.tsx
'use client';
import { Suspense } from 'react';
import { StaffProfileContent } from './ProfileView';

export default function StaffProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex justify-center items-center text-slate-400 text-xs font-mono">Loading...</div>}>
      <div className="p-4 max-w-2xl mx-auto text-slate-100 bg-slate-950 min-h-screen pt-8">
        <StaffProfileContent />
      </div>
    </Suspense>
  );
}