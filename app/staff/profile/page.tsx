// app/staff/profile/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useNotification } from '@/component/NotificationContext';
import { Briefcase, RefreshCcw, ShieldCheck, MapPin, Award, Banknote } from 'lucide-react';

interface ProfileProps {
  token?: string | null;
  workerData?: any;
}

export default function StaffProfilePage({ token: propsToken, workerData }: ProfileProps) {
  const { showToast } = useNotification();
  const searchParams = useSearchParams();
  
  // Ưu tiên lấy token từ props Portal, nếu không có mới bóc từ URL đường dẫn lẻ
  const token = propsToken || searchParams.get('token');

  const [worker, setWorker] = useState<any>(workerData || null);
  const [loading, setLoading] = useState(!workerData);

  const [profilePhone, setProfilePhone] = useState('');
  const [profileBankName, setProfileBankName] = useState('');
  const [profileBankAcc, setProfileBankAcc] = useState('');

  // 💵 BẢNG ĐỐI SOÁT ĐƠN GIÁ CÔNG CA ĐƯỢC HIỂN THỊ ĐỂ THỢ THEO DÕI
  const GET_SHIFT_WAGE_BY_TITLE = (title: string) => {
    const formattedTitle = (title || '').trim().toUpperCase();
    if (formattedTitle === 'A1') return 150000; 
    return 100000; 
  };

  const loadProfileData = async () => {
    if (!token) return;
    try {
      let currentWorker = worker;
      // Nếu Portal chưa truyền kịp workerData sang, chạy định danh hỏa tốc theo token URL
      if (!currentWorker) {
        const { data: emp } = await supabase.from('employees').select('*').eq('qr_token', token).maybeSingle();
        if (emp) {
          setWorker(emp);
          currentWorker = emp;
        }
      }

      if (currentWorker) {
        setProfilePhone(currentWorker.phone || '');
        setProfileBankName(currentWorker.bank_name || '');
        setProfileBankAcc(currentWorker.bank_account_number || '');
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { 
    loadProfileData(); 
  }, [token, workerData]);

  const handleSaveProfile = async () => {
    if (!worker) return;
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

  if (loading) return <div className="text-center p-6 text-xs text-slate-500 font-mono"><RefreshCcw className="w-4 h-4 animate-spin text-blue-500 mx-auto mb-2"/> Đang kiểm tra hồ sơ số hóa...</div>;
  if (!worker) return <div className="text-center p-6 text-xs text-slate-500 italic font-mono">Không tìm thấy thông tin nhân sự hợp lệ.</div>;

  const currentWage = GET_SHIFT_WAGE_BY_TITLE(worker.title);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-xl space-y-5 text-xs max-w-2xl mx-auto animate-fadeIn">
      
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <Briefcase className="w-4 h-4 text-blue-400" />
        <h2 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">Hồ Sơ Thành Viên Số Hóa</h2>
      </div>

      {/* 🔒 KHỐI THÔNG TIN VỊ TRÍ & MỨC LƯƠNG (READ-ONLY) */}
      <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-4 text-[11px] font-sans">
        <div className="space-y-1">
          <span className="text-slate-500 font-bold uppercase block text-[9px] tracking-wide flex items-center gap-1">
            <MapPin className="w-3 h-3 text-purple-400" /> Vị trí làm việc:
          </span>
          <input 
            type="text" 
            readOnly 
            className="w-full bg-slate-900/60 border border-slate-800/60 p-2.5 rounded-xl text-slate-400 font-black cursor-not-allowed focus:outline-none" 
            value={worker.branch || 'Chưa phân phối'} 
          />
        </div>
        <div className="space-y-1">
          <span className="text-slate-500 font-bold uppercase block text-[9px] tracking-wide flex items-center gap-1">
            <Award className="w-3 h-3 text-blue-400" /> Chức vụ (Title):
          </span>
          <input 
            type="text" 
            readOnly 
            className="w-full bg-slate-900/60 border border-slate-800/60 p-2.5 rounded-xl text-blue-400 font-black tracking-wider cursor-not-allowed focus:outline-none" 
            value={`${worker.title || 'KTV'} • Cấp ${worker.level || 'M1'}`} 
          />
        </div>
        <div className="space-y-1">
          <span className="text-slate-500 font-bold uppercase block text-[9px] tracking-wide flex items-center gap-1">
            <Banknote className="w-3 h-3 text-emerald-400" /> Đơn giá công ca:
          </span>
          <input 
            type="text" 
            readOnly 
            className="w-full bg-slate-900/60 border border-slate-800/60 p-2.5 rounded-xl text-emerald-400 font-bold font-mono cursor-not-allowed focus:outline-none" 
            value={`${currentWage.toLocaleString('vi-VN')} đ / ca`} 
          />
        </div>
      </div>
      
      {/* ✏️ KHỐI THÔNG TIN CÓ THỂ CHỈNH SỬA VÀ CẬP NHẬT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        <div className="space-y-1.5">
          <label className="text-slate-400 font-bold block pl-0.5">Số điện thoại liên lạc liên hệ:</label>
          <input type="text" className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl focus:outline-none text-slate-200 font-medium font-mono" value={profilePhone} onChange={e => setProfilePhone(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label className="text-slate-400 font-bold block pl-0.5">Tên Ngân hàng thụ hưởng lương ca:</label>
          <input type="text" className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl focus:outline-none text-slate-200 font-medium" value={profileBankName} onChange={e => setProfileBankName(e.target.value)} />
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-slate-400 font-bold block pl-0.5">Số tài khoản nhận tiền lương quỹ:</label>
          <input type="text" className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl focus:outline-none text-amber-400 font-bold font-mono text-sm tracking-wider" value={profileBankAcc} onChange={e => setProfileBankAcc(e.target.value)} />
        </div>
      </div>

      <button onClick={handleSaveProfile} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black p-3.5 rounded-xl transition shadow-lg uppercase text-[10px] tracking-widest flex items-center justify-center gap-1 cursor-pointer">
        <ShieldCheck className="w-4 h-4" /> Cập nhật tài khoản lương thụ hưởng
      </button>
      
      {/* KHỐI FILE SCAN HỢP ĐỒNG */}
      <div className="pt-4 border-t border-slate-800 mt-2">
        <label className="text-slate-500 block mb-2 font-bold uppercase text-[9px] tracking-wider font-mono">Bản sao hợp đồng lao động số hóa xem link từ bên quản lý nhân sự:</label>
        {worker.drive_contract ? (
          <a href={worker.drive_contract} target="_blank" rel="noreferrer" className="block w-full bg-slate-950 border border-slate-700 hover:border-blue-500 text-blue-400 font-bold p-3 rounded-xl text-center transition hover:bg-slate-900 font-mono text-xs shadow-inner">
            📥 MỞ XEM BẢN SCAN PDF HỢP ĐỒNG LAO ĐỘNG
          </a>
        ) : (
          <div className="w-full bg-slate-950/40 border border-slate-800 border-dashed p-3 rounded-xl text-slate-600 text-center italic font-mono">
            Hệ thống quản lý hành chính chưa cập nhật tệp hợp đồng lao động của sếp lên Cloud.
          </div>
        )}
      </div>

    </div>
  );
}