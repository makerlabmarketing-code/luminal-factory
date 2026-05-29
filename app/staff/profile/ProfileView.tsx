// app/staff/profile/ProfileView.tsx
'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useNotification } from '@/component/NotificationContext';
import { Briefcase, RefreshCcw, ShieldCheck } from 'lucide-react';

export function StaffProfileContent({ token: propsToken, workerData }: any) {
  const { showToast } = useNotification();
  const searchParams = useSearchParams();
  const token = propsToken || searchParams.get('token');

  const [worker, setWorker] = useState<any>(workerData || null);
  const [assignedBranch, setAssignedBranch] = useState<any>(null);
  const [loading, setLoading] = useState(!workerData);

  const [profilePhone, setProfilePhone] = useState('');
  const [profileBankName, setProfileBankName] = useState('');
  const [profileBankAcc, setProfileBankAcc] = useState('');

  const GET_SHIFT_WAGE_BY_TITLE = (title: string) => {
    const formattedTitle = (title || '').trim().toUpperCase();
    if (formattedTitle === 'A1') return 150000; 
    return 100000; 
  };

  useEffect(() => {
    const loadProfile = async () => {
      let currentWorker = worker;
      if (!currentWorker && token) {
        const { data: emp } = await supabase.from('employees').select('*').eq('qr_token', token).maybeSingle();
        if (emp) { setWorker(emp); currentWorker = emp; }
      }
      if (currentWorker) {
        setProfilePhone(currentWorker.phone || '');
        setProfileBankName(currentWorker.bank_name || '');
        setProfileBankAcc(currentWorker.bank_account_number || '');

        const { data: metaBranch } = await supabase.from('system_metadata').select('data').eq('name', 'Danh sách Chi nhánh').maybeSingle();
        const branchData = metaBranch?.data || [];
        const myBranch = branchData.find((b: any) => b.code === currentWorker.branch_code || b.name === currentWorker.branch);
        setAssignedBranch(myBranch || branchData[0] || null);
      }
      setLoading(false);
    };
    loadProfile();
  }, [token, workerData]);

  const handleSaveProfile = async () => {
    if (!worker) return;
    try {
      const { error } = await supabase.from('employees').update({
        phone: profilePhone.trim(), bank_name: profileBankName.trim(), bank_account_number: profileBankAcc.trim()
      }).eq('id', worker.id);
      if (error) throw error;
      showToast('Thành công', 'Hồ sơ tài khoản đã được lưu cấu hình!', 'success');
    } catch (e: any) { showToast('Thất bại', e.message, 'error'); }
  };

  if (loading) return <div className="text-center p-6 text-xs text-slate-500 font-mono"><RefreshCcw className="w-4 h-4 animate-spin text-blue-500 mx-auto mb-2"/> Đang tải hồ sơ...</div>;
  if (!worker) return <div className="text-center p-6 text-slate-500 text-xs">Không tìm thấy nhân sự.</div>;

  const currentWage = GET_SHIFT_WAGE_BY_TITLE(worker.title);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 text-xs max-w-2xl mx-auto animate-fadeIn w-full text-slate-100 font-sans">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3"><Briefcase className="w-4 h-4 text-blue-400" /><h2 className="font-bold text-slate-200 uppercase tracking-wider text-[12px]">Hồ Sơ Thành Viên Số Hóa</h2></div>
      <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px]">
        <div><span className="text-slate-500 font-bold uppercase block text-[9px]">🏛️ Vị trí cơ sở làm việc:</span><p className="font-black text-slate-200 mt-1">{assignedBranch ? assignedBranch.name : 'Chưa phân phối'}</p></div>
        <div><span className="text-slate-500 font-bold uppercase block text-[9px]">🧧 Định mức lương ca máy mặc định:</span><p className="font-black text-emerald-400 mt-1 font-mono">{currentWage.toLocaleString()} đ / ca</p></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label className="text-slate-400 font-bold">Số điện thoại liên hệ:</label><input type="text" className="w-full bg-slate-950 border border-slate-800 p-3 mt-1 rounded-xl focus:outline-none text-slate-200" value={profilePhone} onChange={e => setProfilePhone(e.target.value)} /></div>
        <div><label className="text-slate-400 font-bold">Tên Ngân hàng:</label><input type="text" className="w-full bg-slate-950 border border-slate-800 p-3 mt-1 rounded-xl focus:outline-none text-slate-200" value={profileBankName} onChange={e => setProfileBankName(e.target.value)} /></div>
        <div className="sm:col-span-2"><label className="text-slate-400 font-bold">Số tài khoản nhận tiền lương quỹ:</label><input type="text" className="w-full bg-slate-950 border border-slate-800 p-3 mt-1 rounded-xl focus:outline-none text-amber-400 font-bold font-mono tracking-wider" value={profileBankAcc} onChange={e => setProfileBankAcc(e.target.value)} /></div>
      </div>
      <button onClick={handleSaveProfile} className="w-full bg-blue-600 text-white font-black p-3 rounded-xl transition shadow-lg flex items-center justify-center gap-1 cursor-pointer"><ShieldCheck className="w-4 h-4"/> Lưu hồ sơ</button>
    </div>
  );
}