// app/staff/page.tsx
import { Suspense } from 'react';
import StaffPortalContent from './portal/StaffPortalContent';
import { getAuthenticatedStaffPortalData } from '@/services/server/staffPortalData';

export default async function StaffPage() {
  const portalData = await getAuthenticatedStaffPortalData();

  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex justify-center items-center text-slate-500 text-xs font-mono">Đang đồng bộ cổng nhân viên...</div>}>
      <StaffPortalContent
        workerData={portalData.employee}
        assignedBranchData={portalData.assignedBranch}
        capabilities={portalData.capabilities}
      />
    </Suspense>
  );
}
