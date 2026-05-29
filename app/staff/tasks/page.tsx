// app/staff/tasks/page.tsx
'use client';
import { Suspense } from 'react';
import { StaffTasksContent } from './TasksView';

export default function StaffTasksPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex justify-center items-center text-slate-500 text-xs font-mono">Loading...</div>}>
      <div className="p-4 max-w-7xl mx-auto text-slate-100 bg-slate-950 min-h-screen pt-6">
        <StaffTasksContent />
      </div>
    </Suspense>
  );
}