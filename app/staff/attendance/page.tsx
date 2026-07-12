// app/staff/attendance/page.tsx
import { Suspense } from 'react';
import { StaffAttendanceContent } from './AttendanceView';
import { getAuthenticatedStaffPortalData } from '@/services/server/staffPortalData';

export default async function StaffAttendancePage() {
  const portalData = await getAuthenticatedStaffPortalData();

  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex justify-center items-center text-slate-500 text-xs font-mono">Loading...</div>}>
      <div className="p-4 max-w-md mx-auto text-slate-100 bg-slate-950 min-h-screen pt-8">
        <StaffAttendanceContent workerData={portalData.employee} assignedBranchData={portalData.assignedBranch} />
      </div>
    </Suspense>
  );
}
