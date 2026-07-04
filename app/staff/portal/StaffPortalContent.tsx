'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Banknote, ClipboardList, Clock, RefreshCcw, User } from 'lucide-react';
import { StaffAttendanceContent } from '../attendance/AttendanceView';
import { StaffTasksContent } from '../tasks/TasksView';
import { StaffExpensesContent } from '../expenses/ExpensesView';
import { StaffProfileContent } from '../profile/ProfileView';
import { getStaffPortalData } from '@/services/staffPortalService';
import type { StaffPortalTab } from '@/lib/types/staff';
import type { Employee } from '@/lib/types/employee';
import type { Facility } from '@/lib/types/facility';

export default function StaffPortalContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [worker, setWorker] = useState<Employee | null>(null);
  const [assignedBranch, setAssignedBranch] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<StaffPortalTab>('attendance');
  const [visitedTabs, setVisitedTabs] = useState<Record<StaffPortalTab, boolean>>({
    attendance: true,
    tasks: false,
    expenses: false,
    profile: false,
  });

  useEffect(() => {
    const loadPortalData = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const portalData = await getStaffPortalData(token);

        setWorker(portalData.employee);
        setAssignedBranch(portalData.assignedBranch);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadPortalData();
  }, [token]);

  useEffect(() => {
    setVisitedTabs((prev) =>
      prev[activeTab]
        ? prev
        : {
            ...prev,
            [activeTab]: true,
          }
    );
  }, [activeTab]);

  const tabClasses = useMemo(
    () => ({
      attendance: activeTab === 'attendance' ? 'block' : 'hidden',
      tasks: activeTab === 'tasks' ? 'block' : 'hidden',
      expenses: activeTab === 'expenses' ? 'block' : 'hidden',
      profile: activeTab === 'profile' ? 'block' : 'hidden',
    }),
    [activeTab]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex justify-center items-center text-slate-400 text-xs font-mono">
        <RefreshCcw className="w-4 h-4 animate-spin mr-2 text-purple-500" /> Đang dựng cấu trúc trạm đồng bộ...
      </div>
    );
  }

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-5 text-slate-100 bg-slate-950 min-h-screen pb-24 font-sans select-none">
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-600/10 border border-purple-500/20 text-purple-400 rounded-xl">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-black text-slate-100">{worker?.full_name}</h2>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{worker?.title || 'Kỹ thuật viên'}</p>
          </div>
        </div>
      </div>

      <div className={tabClasses.attendance}>
        {visitedTabs.attendance && (
          <StaffAttendanceContent token={token} workerData={worker} assignedBranchData={assignedBranch} />
        )}
      </div>

      <div className={tabClasses.tasks}>
        {visitedTabs.tasks && <StaffTasksContent token={token} workerData={worker} />}
      </div>

      <div className={tabClasses.expenses}>
        {visitedTabs.expenses && <StaffExpensesContent token={token} workerData={worker} />}
      </div>

      <div className={tabClasses.profile}>
        {visitedTabs.profile && <StaffProfileContent token={token} workerData={worker} />}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-3.5 z-50 flex justify-around items-center shadow-2xl text-[10px] font-bold">
        <button onClick={() => setActiveTab('attendance')} className={`flex flex-col items-center gap-1 transition-all duration-200 focus:outline-none cursor-pointer ${activeTab === 'attendance' ? 'text-blue-400 font-black' : 'text-slate-500'}`}>
          <Clock className="w-4 h-4" /><span>Ca Làm Việc</span>
        </button>
        <button onClick={() => setActiveTab('tasks')} className={`flex flex-col items-center gap-1 transition-all duration-200 focus:outline-none cursor-pointer ${activeTab === 'tasks' ? 'text-blue-400 font-black' : 'text-slate-500'}`}>
          <ClipboardList className="w-4 h-4" /><span>Nhận Việc</span>
        </button>
        <button onClick={() => setActiveTab('expenses')} className={`flex flex-col items-center gap-1 transition-all duration-200 focus:outline-none cursor-pointer ${activeTab === 'expenses' ? 'text-blue-400 font-black' : 'text-slate-500'}`}>
          <Banknote className="w-4 h-4" /><span>Báo Chi Tiêu</span>
        </button>
        <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 transition-all duration-200 focus:outline-none cursor-pointer ${activeTab === 'profile' ? 'text-blue-400 font-black' : 'text-slate-500'}`}>
          <User className="w-4 h-4" /><span>Cá Nhân</span>
        </button>
      </div>
    </div>
  );
}
