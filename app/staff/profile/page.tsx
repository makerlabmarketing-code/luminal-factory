// app/staff/profile/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useNotification } from '@/component/NotificationContext';
import { Briefcase, RefreshCcw } from 'lucide-react';

export default function StaffProfilePage() {
  const { showToast } = useNotification();
  const [worker, setWorker] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [profilePhone, setProfilePhone] = useState('');
  const [profileBankName, setProfileBankName] = useState('');
  const [profileBankAcc, setProfileBankAcc] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: emp } = await supabase.from('employees').select('*').eq('status', 'ACTIVE').order('id', { ascending: true }).limit(1).maybeSingle();
        if (emp) {
          setWorker(emp);
          setProfilePhone(emp.phone || '');
          setProfileBankName(emp.bank_name || '');
          setProfileBankAcc(emp.bank_account_number || '');
        }
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    loadProfile();
  }, []);

  const handleSaveProfile = async () => {
    try {
      const { error } = await supabase.from('employees').update({
        phone: profilePhone.trim(),
        bank_name: profileBankName.trim(),
        bank_account_number: profileBankAcc.trim()
      }).eq('id', worker.id);

      if (error) throw error;
      showToast('Thành công', 'Hồ sơ thông tin tài khoản thụ hưởng lương đã được cập nhật cố định!', 'success');
    } catch (e: any) {
      showToast('Thất bại', e.message, 'error');
    }
  };

  if (loading) return <div className="p-12 text-center text-xs font-mono text-slate-500 bg-slate-950 min-h-screen flex items-center justify-center gap-2"><RefreshCcw className="w-4 h-4 animate-spin" />Đang kiểm tra hồ sơ...</div>;
  if (!worker) return null;

  return (
    <div className="p-4 max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 text-xs mt-4">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <Briefcase className="w-4 h-4 text-blue-400" />
        <h2 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">Hồ Sơ Thành Viên Số Hóa</h2>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label className="text-slate-400 font-bold">Số điện thoại liên lạc liên hệ:</label><input type="text" className="w-full bg-slate-950 border border-slate-800 p-3 mt-1.5 rounded-xl focus:outline-none text-slate-200 font-medium" value={profilePhone} onChange={e => setProfilePhone(e.target.value)} /></div>
        <div><label className="text-slate-400 font-bold">Tên Ngân hàng thụ hưởng lương ca:</label><input type="text" className="w-full bg-slate-950 border border-slate-800 p-3 mt-1.5 rounded-xl focus:outline-none text-slate-200 font-medium" value={profileBankName} onChange={e => setProfileBankName(e.target.value)} /></div>
        <div className="sm:col-span-2"><label className="text-slate-400 font-bold">Số tài khoản nhận tiền lương quỹ:</label><input type="text" className="w-full bg-slate-950 border border-slate-800 p-3 mt-1.5 rounded-xl focus:outline-none text-amber-400 font-bold font-mono text-sm tracking-wider" value={profileBankAcc} onChange={e => setProfileBankAcc(e.target.value)} /></div>
      </div>
      <button onClick={handleSaveProfile} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black p-3.5 rounded-xl transition shadow-lg uppercase text-[11px] tracking-wide">Cập nhật tài khoản lương thụ hưởng</button>
      
      <div className="pt-4 border-t border-slate-800 mt-3">
        <label className="text-slate-500 block mb-2 font-bold uppercase text-[9px] tracking-wider font-mono">Bản sao hợp đồng lao động số hóa xem link từ bên quản lý nhân sự:</label>
        {worker.drive_contract ? (
          <a href={worker.drive_contract} target="_blank" rel="noreferrer" className="block w-full bg-slate-950 border border-slate-700 hover:border-blue-500 text-blue-400 font-bold p-3 rounded-xl text-center transition hover:bg-slate-900 font-mono text-xs">📥 MỞ XEM BẢN SCAN PDF HỢP ĐỒNG LAO ĐỘNG</a>
        ) : (
          <div className="w-full bg-slate-950/40 border border-slate-800 border-dashed p-3 rounded-xl text-slate-600 text-center italic font-mono">Hệ thống quản lý hành chính chưa cập nhật tệp hợp đồng lao động của sếp lên Cloud.</div>
        )}
      </div>
    </div>
  );
}