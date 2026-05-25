// app/staff/portal/page.tsx
'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useNotification } from '@/component/NotificationContext';
// Import thêm các icon cần thiết
import { User, ClipboardList, Clock, Banknote, Power, Calendar, MapPin, Layers, Save, ChevronLeft, ChevronRight, Activity, CheckSquare } from 'lucide-react';

function StaffPortalContent() {
  const { showToast } = useNotification();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [worker, setWorker] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('attendance'); // Mặc định vào Chấm công
  const [loading, setLoading] = useState(true);
  
  // --- STATE CHẤM CÔNG ---
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchCode, setSelectedBranchCode] = useState('');
  const [isInShift, setIsInShift] = useState(false);
  const [liveTime, setLiveTime] = useState(new Date());

  // --- STATE NHẬN VIỆC (Dự án) ---
  const [projects, setProjects] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setLiveTime(new Date()), 1000);
    const loadData = async () => {
      if (!token) return;
      const { data: emp } = await supabase.from('employees').select('*').eq('qr_token', token).maybeSingle();
      if (!emp) return;
      setWorker(emp);

      // Load nhánh chi nhánh
      const { data: metaBranch } = await supabase.from('system_metadata').select('data').eq('name', 'Danh sách Chi nhánh').maybeSingle();
      setBranches(metaBranch?.data || []);

      // Load dự án
      const { data: projs } = await supabase.from('projects').select('*, phases(*, tasks(*))').order('id', { ascending: false });
      const myProjs = projs?.filter(p => p.phases.some((ph: any) => ph.tasks.some((t: any) => t.assignee === emp.full_name))) || [];
      setProjects(myProjs);
      setLoading(false);
    };
    loadData();
    return () => clearInterval(timer);
  }, [token]);

  // HÀM TỰ ĐỘNG NHẬN CA (Bỏ chọn ca thủ công)
  const autoDetectShift = () => {
    const hour = liveTime.getHours();
    if (hour >= 6 && hour < 12) return 'Ca Sáng';
    if (hour >= 12 && hour < 18) return 'Ca Chiều';
    return 'Ca Tối';
  };

  const handleToggleShift = async () => {
    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour12: false });
    const todayStr = new Date().toLocaleDateString('en-CA');
    const currentShift = autoDetectShift();

    if (!isInShift) {
      await supabase.from('attendance').insert([{ employee_id: worker.id, employee_name: worker.full_name, work_date: todayStr, check_in: timeStr, shift_name: currentShift, status: 'PRESENT' }]);
      showToast('Thành công', `Đã vào ${currentShift}`, 'success');
    } else {
      await supabase.from('attendance').update({ check_out: timeStr }).eq('employee_id', worker.id).eq('work_date', todayStr);
      showToast('Thành công', 'Đã tan ca', 'success');
    }
    setIsInShift(!isInShift);
  };

  if (loading) return <div className="text-center p-10 font-mono text-xs">Đang kết nối hệ thống...</div>;

  return (
    <div className="pb-24 font-sans text-slate-100 bg-slate-950 min-h-screen">
      
      {/* HEADER NHÂN VIÊN */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
        <h2 className="font-bold text-xs">{worker?.full_name}</h2>
        <span className="text-[10px] text-blue-400 font-mono">ID: {worker?.id}</span>
      </div>

      {/* NỘI DUNG THEO TAB */}
      <div className="p-4">
        {activeTab === 'attendance' && (
          <div className="flex flex-col items-center gap-6 pt-10">
            <h1 className="text-3xl font-black font-mono">{liveTime.toLocaleTimeString('vi-VN')}</h1>
            <button onClick={handleToggleShift} className={`w-40 h-40 rounded-full font-black text-xs ${isInShift ? 'bg-red-900' : 'bg-emerald-700'}`}>
              {isInShift ? 'RỜI CA' : 'VÀO CA'}
            </button>
            <p className="text-[10px] text-slate-500">Ca hiện tại: {autoDetectShift()}</p>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[60vh]">
            {/* Danh sách dự án (Bên trái) */}
            <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="p-3 bg-slate-800/50 text-[10px] uppercase font-bold text-slate-400">Dự án của bạn</div>
              {projects.map(p => (
                <div key={p.id} onClick={() => setSelectedProjectId(p.id)} className={`p-4 border-b border-slate-800 cursor-pointer ${selectedProjectId === p.id ? 'bg-blue-900/20' : ''}`}>
                  <p className="font-bold text-xs">{p.name}</p>
                </div>
              ))}
            </div>
            {/* Chi tiết (Bên phải) */}
            <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-y-auto">
               {/* ... (Code hiển thị chi tiết dự án như đã làm ở bước trước) ... */}
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM NAV */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 p-2 flex justify-around">
        <button onClick={() => setActiveTab('attendance')}><Clock size={20}/></button>
        <button onClick={() => setActiveTab('tasks')}><ClipboardList size={20}/></button>
        <button onClick={() => setActiveTab('profile')}><User size={20}/></button>
      </div>
    </div>
  );
}

export default function WorkerPortal() {
  return <Suspense fallback={<div>Loading...</div>}><StaffPortalContent /></Suspense>;
}