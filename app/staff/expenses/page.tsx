// app/staff/expenses/page.tsx
import { Suspense } from 'react';
import { StaffExpensesContent } from './ExpensesView';
import { getAuthenticatedStaffPortalData } from '@/services/server/staffPortalData';

export default async function StaffExpensesPage() {
  const portalData = await getAuthenticatedStaffPortalData();

  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex justify-center items-center text-slate-500 text-xs font-mono">Loading...</div>}>
      <div className="p-4 max-w-7xl mx-auto text-slate-100 bg-slate-950 min-h-screen pt-6">
        <StaffExpensesContent workerData={portalData.employee} />
      </div>
    </Suspense>
  );
}
