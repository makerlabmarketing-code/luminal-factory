// app/staff/portal/page.tsx
'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useNotification } from '@/component/NotificationContext';
import { User, ClipboardList, Clock, Banknote, ImageIcon, Briefcase, RefreshCcw, Save } from 'lucide-react';
// 🔥 IMPORT TRỰC TIẾP CÁC COMPONENT ĐỂ LIÊN THÔNG GIAO DIỆN CHUẨN KỶ NGUYÊN MỚI
import StaffAttendancePage from '../attendance/page';
import StaffTasksPage from '../tasks/page';
import StaffExpensesPage from '../expenses/page';
import StaffProfilePage from '../profile/page';
function StaffPortalContent() {
  const { showToast } = useNotification();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [worker, setWorker] = useState<any>(null);
  const [assignedBranch, setAssignedBranch] = useState<any>(null); // 🔥 KHÓA CỨNG CƠ SỞ THEO THỢ
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('attendance'); 

  // --- STATE TABExpenses ---
  const [expenses, setExpenses] = useState<any[]>([]);
  const [expCategory, setExpCategory] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expBillUrl, setExpBillUrl] = useState('');
  const [expenseSearch, setExpenseSearch] = useState('');

  // --- STATE TAB PROFILE ---
  const [profilePhone, setProfilePhone] = useState('');
  const [profileBankName, setProfileBankName] = useState('');
  const [profileBankAcc, setProfileBankAcc] = useState('');

  const loadPortalData = async () => {
    if (!token) { setLoading(false); return; }
    try {
      // 1. Định danh nhân sự hỏa tốc qua Token URL
      const { data: emp } = await supabase.from('employees').select('*').eq('qr_token', token).maybeSingle();
      if (!emp) { setLoading(false); return; }
      setWorker(emp);
      setProfilePhone(emp.phone || ''); 
      setProfileBankName(emp.bank_name || ''); 
      setProfileBankAcc(emp.bank_account_number || '');

      // 2. 🔥 KHÓA CỨNG ĐỊA ĐIỂM THEO PROFILE: Quét hệ thống metadata tìm cơ sở duy nhất gán cho thợ này
      const { data: metaBranch } = await supabase.from('system_metadata').select('data').eq('name', 'Danh sách Chi nhánh').maybeSingle();
      const branchData = metaBranch?.data || [];
      const myBranch = branchData.find((b: any) => b.code === emp.branch_code || b.name === emp.branch);
      setAssignedBranch(myBranch || branchData[0] || null);

      // 3. Tải sổ đối soát chi tiêu cá nhân
      const { data: exps } = await supabase.from('financial_ledger').select('*').eq('requested_by', emp.full_name).order('id', { ascending: false });
      setExpenses(exps || []);

    } catch (e) { console.error(e); }
    setLoading(false);
  };

  // Tự động load lại lấy thông tin tươi mới nhất từ Database mỗi khi thợ nhảy qua lại giữa các Tab Footer
  useEffect(() => {
    loadPortalData();
  }, [token, activeTab]);

  const submitExpense = async () => {
    if (!expCategory.trim() || !expAmount) return showToast('Thiếu thông tin', 'Vui lòng điền đủ tên vật tư và số tiền!', 'error');
    const currentPeriod = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`.split('-').reverse().join('/');

    await supabase.from('financial_ledger').insert([{
      type: 'CHI_TIEU', category: expCategory.trim(), amount: Number(expAmount), bill_url: expBillUrl.trim(), requested_by: worker.full_name, is_paid: false, month_period: currentPeriod
    }]);

    setExpCategory(''); setExpAmount(''); setExpBillUrl(''); loadPortalData(); 
    showToast('Thành công', 'Phiếu chi tiêu hoàn ứng đã được gieo hỏa tốc lên Admin!', 'success');
  };

  const handleSaveProfile = async () => {
    await supabase.from('employees').update({ phone: profilePhone.trim(), bank_name: profileBankName.trim(), bank_account_number: profileBankAcc.trim() }).eq('id', worker.id);
    showToast('Thành công', 'Hồ sơ tài khoản nhận lương thụ hưởng đã lưu cấu hình!', 'success');
    loadPortalData();
  };

  const filteredExpenses = expenses.filter(e => (e.category || '').toLowerCase().includes(expenseSearch.toLowerCase()));

  if (loading) return <div className="min-h-screen bg-slate-950 flex justify-center items-center text-slate-400 text-xs font-mono"><RefreshCcw className="w-4 h-4 animate-spin mr-2 text-purple-500"/> Đang đồng bộ cổng Portal nguyên khối...</div>;

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-5 text-slate-100 bg-slate-950 min-h-screen pb-24 font-sans select-none">
      
      {/* THẺ ĐỊNH DANH DÙNG CHUNG */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-600/10 border border-purple-500/20 text-purple-400 rounded-xl"><User className="w-4 h-4" /></div>
          <div>
            <h2 className="text-xs font-black text-slate-100">{worker?.full_name}</h2>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{worker?.title || 'Kỹ thuật viên'} • Cấp {worker?.level || 'M1'}</p>
          </div>
        </div>
        <span className="text-[9px] text-slate-400 font-mono bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-850">🏛️ {assignedBranch ? assignedBranch.name : 'Đang nạp định vị...'}</span>
      </div>

      {/* --- TAB 1: NHÚNG NGUYÊN KHỐI INTERACTION TỪ COMPONENT ATTENDANCE --- */}
      {activeTab === 'attendance' && (
        <StaffAttendancePage token={token} workerData={worker} assignedBranchData={assignedBranch} />
      )}

      {/* --- TAB 2: NHÚNG NGUYÊN KHỐI PHÂN HỆ TASKS TỪ FOLDER CHUYÊN TRÁCH --- */}
      {activeTab === 'tasks' && (
        <StaffTasksPage token={token} workerData={worker} />
      )}

      {/* --- TAB 3: BÁO CHI TIÊU KÊ KHAI VẬT TƯ --- */}
      {activeTab === 'expenses' && (
        <StaffExpensesPage token={token} workerData={worker} />
      )}

      {/* --- TAB 4: HỒ SƠ CÁ NHÂN NHẬN LƯƠNG --- */}
      {activeTab === 'profile' && (
        <StaffProfilePage token={token} workerData={worker} />
      )}

      {/* FOOTER BOTTOM TABS MENU LUÔN ĐƯỢC GHIM CỐ ĐỊNH Ở ĐÁY MÀN HÌNH CHỐNG MẤT MENU */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-3.5 z-50 flex justify-around items-center shadow-2xl text-[10px] font-bold">
        <button onClick={() => setActiveTab('attendance')} className={`flex flex-col items-center gap-1 transition-all duration-200 focus:outline-none cursor-pointer ${activeTab === 'attendance' ? 'text-blue-400 font-black' : 'text-slate-500'}`}>
          <Clock className="w-4 h-4" />
          <span>Ca Làm Việc</span>
        </button>
        <button onClick={() => setActiveTab('tasks')} className={`flex flex-col items-center gap-1 transition-all duration-200 focus:outline-none cursor-pointer ${activeTab === 'tasks' ? 'text-blue-400 font-black' : 'text-slate-500'}`}>
          <ClipboardList className="w-4 h-4" />
          <span>Nhận Việc</span>
        </button>
        <button onClick={() => setActiveTab('expenses')} className={`flex flex-col items-center gap-1 transition-all duration-200 focus:outline-none cursor-pointer ${activeTab === 'expenses' ? 'text-blue-400 font-black' : 'text-slate-500'}`}>
          <Banknote className="w-4 h-4" />
          <span>Báo Chi Tiêu</span>
        </button>
        <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 transition-all duration-200 focus:outline-none cursor-pointer ${activeTab === 'profile' ? 'text-blue-400 font-black' : 'text-slate-500'}`}>
          <User className="w-4 h-4" />
          <span>Cá Nhân</span>
        </button>
      </div>

    </div>
  );
}

export default function WorkerPortal() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex justify-center items-center text-slate-500 text-xs font-mono">Đang đồng bộ cổng Portal nguyên khối...</div>}>
      <StaffPortalContent />
    </Suspense>
  );
}