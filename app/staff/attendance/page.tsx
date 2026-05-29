// app/staff/attendance/page.tsx
'use client';
import { Suspense } from 'react';
import { StaffAttendanceContent } from './AttendanceView';

export default function StaffAttendancePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex justify-center items-center text-slate-500 text-xs font-mono">Loading...</div>}>
      <div className="p-4 max-w-md mx-auto text-slate-100 bg-slate-950 min-h-screen pt-8">
        <StaffAttendanceContent />
      </div>
    </Suspense>
  );
}