// app/admin/settings/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Settings, Mail, MapPin, Wallet, Save, RefreshCcw, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Trạng thái bật/tắt (Dropdown) của từng nhóm cấu hình
  const [openGroup, setOpenGroup] = useState<string | null>('gps'); // Mặc định mở nhóm GPS trước

  // Dữ liệu SMTP Mail
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');

  // Dữ liệu GPS Studio
  const [lat, setLat] = useState('21.0285');
  const [lng, setLng] = useState('105.8542');
  const [radius, setRadius] = useState('15');

  // Dữ liệu Tài chính Quỹ chung (Tính năng mở rộng sau này)
  const [bankName, setBankName] = useState('MB Bank');
  const [bankNum, setBankNum] = useState('1900xxxxxxxxx');

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const { data } = await supabase.from('system_settings').select('*');
        data?.forEach(s => {
          if (s.key === 'smtp_host') setSmtpHost(s.value);
          if (s.key === 'smtp_port') setSmtpPort(s.value);
          if (s.key === 'smtp_user') setSmtpUser(s.value);
          if (s.key === 'smtp_pass') setSmtpPass(s.value);
          if (s.key === 'studio_lat') setLat(s.value);
          if (s.key === 'studio_lng') setLng(s.value);
          if (s.key === 'studio_radius') setRadius(s.value);
          if (s.key === 'bank_name') setBankName(s.value);
          if (s.key === 'bank_number') setBankNum(s.value);
        });
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchSettings();
  }, []);

  const toggleGroup = (groupName: string) => {
    setOpenGroup(openGroup === groupName ? null : groupName);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const batch = [
        { key: 'smtp_host', value: smtpHost }, { key: 'smtp_port', value: smtpPort },
        { key: 'smtp_user', value: smtpUser }, { key: 'smtp_pass', value: smtpPass },
        { key: 'studio_lat', value: lat }, { key: 'studio_lng', value: lng },
        { key: 'studio_radius', value: radius },
        { key: 'bank_name', value: bankName }, { key: 'bank_number', value: bankNum }
      ];
      const { error } = await supabase.from('system_settings').upsert(batch, { onConflict: 'key' });
      if (error) throw error;
      alert('Hệ thống Modular đã đồng bộ và lưu trữ thành công toàn bộ cấu hình nâng cao!');
    } catch (e) { 
      alert('Lỗi đồng bộ dữ liệu cài đặt!'); 
    } finally { 
      setIsSaving(false); 
    }
  };

  if (loading) return <div className="p-6 text-xs font-mono text-slate-500 text-center"><RefreshCcw className="w-4 h-4 animate-spin inline mr-2" /> Đang kết nối trung tâm điều hành...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 text-slate-100 bg-slate-950 min-h-screen">
      
      {/* Top Header */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
        <Settings className="w-5 h-5 text-blue-500" />
        <div>
          <h1 className="text-lg font-bold tracking-wide">Cấu Hình Hệ Thống Tập Trung</h1>
          <p className="text-xs text-slate-400 mt-0.5">Phân tách cấu hình dạng Module linh hoạt, sẵn sàng mở rộng</p>
        </div>
      </div>

      <div className="space-y-3">
        
        {/* NHÓM 1: DROPDOWN AN NINH VỊ TRÍ (GPS) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition-all">
          <button 
            onClick={() => toggleGroup('gps')}
            className="w-full flex justify-between items-center p-5 hover:bg-slate-800/40 transition text-left focus:outline-none"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl"><MapPin className="w-4 h-4" /></div>
              <div>
                <span className="text-xs font-bold text-slate-200 block">1. An Ninh Tọa Độ Vệ Tinh (GPS Geofencing)</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Thiết lập vùng quét an toàn chống chấm công từ xa cho Vân & Nhi</span>
              </div>
            </div>
            {openGroup === 'gps' ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>
          
          {openGroup === 'gps' && (
            <div className="p-5 bg-slate-950/50 border-t border-slate-800/60 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs animate-fadeIn">
              <div><label className="text-slate-400 font-medium">Vĩ độ Studio (Latitude):</label><input type="text" className="mt-2 block w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 font-mono text-slate-300" value={lat} onChange={(e) => setLat(e.target.value)} /></div>
              <div><label className="text-slate-400 font-medium">Kinh độ Studio (Longitude):</label><input type="text" className="mt-2 block w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 font-mono text-slate-300" value={lng} onChange={(e) => setLng(e.target.value)} /></div>
              <div><label className="text-slate-400 font-medium">Bán kính khoanh vùng (Mét):</label><input type="number" className="mt-2 block w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 font-mono text-amber-400 font-bold" value={radius} onChange={(e) => setRadius(e.target.value)} /></div>
            </div>
          )}
        </div>

        {/* NHÓM 2: DROPDOWN MÁY CHỦ EMAIL (SMTP) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition-all">
          <button 
            onClick={() => toggleGroup('smtp')}
            className="w-full flex justify-between items-center p-5 hover:bg-slate-800/40 transition text-left focus:outline-none"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl"><Mail className="w-4 h-4" /></div>
              <div>
                <span className="text-xs font-bold text-slate-200 block">2. Cấu Hình Cổng Mail Tự Động (SMTP Server)</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Quản lý tài khoản lõi gửi phiếu lương cho thợ và thông báo cổ đông</span>
              </div>
            </div>
            {openGroup === 'smtp' ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>

          {openGroup === 'smtp' && (
            <div className="p-5 bg-slate-950/50 border-t border-slate-800/60 space-y-4 text-xs animate-fadeIn">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2"><label className="text-slate-400 font-medium">SMTP Host:</label><input type="text" className="mt-2 block w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-300 font-mono" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} /></div>
                <div><label className="text-slate-400 font-medium">Cổng Port:</label><input type="text" className="mt-2 block w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-300 font-mono" value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} /></div>
              </div>
              <div><label className="text-slate-400 font-medium">Tài khoản Email đại diện gửi:</label><input type="email" className="mt-2 block w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-300 font-mono" value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} /></div>
              <div><label className="text-slate-400 font-medium">Mật khẩu ứng dụng Gmail (App Password):</label><input type="password" className="mt-2 block w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-blue-400 tracking-widest font-mono" value={smtpPass} onChange={(e) => setSmtpPass(e.target.value)} /></div>
            </div>
          )}
        </div>

        {/* NHÓM 3: DROPDOWN TÀI CHÍNH QUỸ CHUNG (MỞ RỘNG MỚI) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition-all">
          <button 
            onClick={() => toggleGroup('finance')}
            className="w-full flex justify-between items-center p-5 hover:bg-slate-800/40 transition text-left focus:outline-none"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl"><Wallet className="w-4 h-4" /></div>
              <div>
                <span className="text-xs font-bold text-slate-200 block">3. Tài Khoản MB Bank Đối Soát QR Quỹ</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Thông tin tài khoản nhận tiền nạp vốn cổ đông và chi tiêu dùng chung</span>
              </div>
            </div>
            {openGroup === 'finance' ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>

          {openGroup === 'finance' && (
            <div className="p-5 bg-slate-950/50 border-t border-slate-800/60 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs animate-fadeIn">
              <div><label className="text-slate-400 font-medium">Tên ngân hàng thương mại:</label><input type="text" className="mt-2 block w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-300" value={bankName} onChange={(e) => setBankName(e.target.value)} /></div>
              <div><label className="text-slate-400 font-medium">Số tài khoản đích (STK chung):</label><input type="text" className="mt-2 block w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-300 font-mono font-bold" value={bankNum} onChange={(e) => setBankNum(e.target.value)} /></div>
            </div>
          )}
        </div>

      </div>

      {/* Nút lưu tổng lực */}
      <div className="pt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-emerald-500/70" /> Trạng thái cổng kết nối an toàn Cloud</span>
        <button 
          onClick={handleSaveAll} 
          disabled={isSaving} 
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 text-xs uppercase tracking-wider transition shadow-lg shadow-blue-950"
        >
          {isSaving ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? 'Đang đồng bộ...' : 'Lưu mọi thiết lập hệ thống'}
        </button>
      </div>

    </div>
  );
}