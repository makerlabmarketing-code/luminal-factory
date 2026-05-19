// app/staff/[uuid]/tasks/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Bell, Clock, FileText, ShieldCheck, RefreshCcw, LayoutGrid, ShoppingBag, Plus, Calendar, CheckCircle2 } from 'lucide-react';

export default function StaffSecurePortal() {
  const { uuid } = useParams(); // Đọc chuỗi UUID bảo mật từ URL đường dẫn
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // States phần báo cáo chi tiêu vật tư phụ
  const [itemName, setItemName] = useState('');
  const [itemCost, setItemCost] = useState('');
  const [isReporting, setIsReporting] = useState(false);

  // Giả lập danh sách thông báo và công việc gán cho thợ này
  const [notifications] = useState([
    '📢 Admin vừa phân bổ công đoạn sơn phủ Concept cho bộ Keycap Meowhe v1!',
    '💡 Nhắc nhở: Hãy kiểm tra kỹ bề mặt phôi in Resin trước khi phủ màu lót.'
  ]);

  const [tasks, setTasks] = useState([
    { id: 't1', project: 'Bộ Keycap Meowhe v1 🐱', task: 'Sơn phủ màu nhám phối mảng Concept Acrylic', group: 'Nhóm Nghệ Thuật Decor & QC', deadline: '2026-05-22', status: 'DOING' },
    { id: 't2', project: 'Bộ Keycap Lollipop Candy 🍭', task: 'Đổ keo Epoxy bảo vệ bề mặt và đánh bóng phôi', group: 'Nhóm Nghệ Thuật Decor & QC', deadline: '2026-05-25', status: 'LOCK' }
  ]);

  useEffect(() => {
    const fetchEmployeeByUuid = async () => {
      try {
        const { data, error } = await supabase
          .from('employees')
          .select('*')
          .eq('qr_token', uuid)
          .maybeSingle();

        if (error) throw error;
        setEmployee(data);
      } catch (e) {
        console.error('Lỗi xác thực UUID:', e);
      } finally {
        setLoading(false);
      }
    };
    if (uuid) fetchEmployeeByUuid();
  }, [uuid]);

  // THUẬT TOÁN ĐỘNG: Thợ tự điều chỉnh Estimate Deadline khi bận
  const handleEstimateDeadline = (id: string, newDate: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, deadline: newDate } : t));
    alert(`Đã cập nhật ước lượng tiến độ mới (${newDate}) gửi lên trung tâm điều hành của Admin!`);
  };

  // THUẬT TOÁN ĐỘNG: Tự động ghi nhận chi tiêu (Không lo chọn nhầm tên nhờ UUID khóa sẵn)
  const handleReportExpense = async () => {
    if (!itemName.trim() || !itemCost) {
      alert('Vui lòng nhập đủ tên đồ mua và số tiền!');
      return;
    }
    setIsReporting(true);
    try {
      const { error } = await supabase.from('office_expenses').insert([
        { 
          category: itemName.trim(), 
          amount: Number(itemCost), 
          requested_by: employee.full_name, // Khóa chặt tên theo UUID bảo mật
          status: 'UNPAID', 
          month_period: '05/2026' 
        }
      ]);

      if (error) throw error;
      alert(`Đã gửi đệ trình thanh toán khoản chi [${itemName}] lên Admin duyệt chi!`);
      setItemName('');
      setItemCost('');
    } catch (e) {
      alert('Lỗi đệ trình chi tiêu!');
    } finally {
      setIsReporting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-xs text-center font-mono text-slate-500 min-h-screen bg-slate-950 flex items-center justify-center">
        <RefreshCcw className="w-4 h-4 animate-spin text-blue-500 mr-2" /> Đang bảo mật mã hóa đường truyền UUID...
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-6 text-xs text-center text-red-400 font-mono min-h-screen bg-slate-950 flex items-center justify-center">
        ❌ Cổng bảo mật không tồn tại, mã GUID sai hoặc tài khoản đã bị đóng khóa!
      </div>
    );
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-5 bg-slate-950 min-h-screen text-slate-100 font-sans pb-10">
      
      {/* 1. KHU VỰC THÔNG BÁO DYNAMIC */}
      {notifications.length > 0 && (
        <div className="bg-blue-950/40 border border-blue-900/40 p-4 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
            <Bell className="w-4 h-4 animate-pulse" /> Trung tâm thông báo việc
          </div>
          <div className="space-y-1.5 pl-6 list-disc text-[11px] text-blue-300 leading-relaxed">
            {notifications.map((n, i) => <p key={i}>• {n}</p>)}
          </div>
        </div>
      )}

      {/* 2. PROFILE HEADER & LINK FILE HỢP ĐỒNG CÁ NHÂN */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex justify-between items-center shadow-xl">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Thợ: {employee.full_name}</span>
          </div>
          <p className="text-[10px] text-slate-500 font-mono mt-1">{employee.title} • Cấp {employee.level || 'A1'}</p>
        </div>
        {employee.drive_contract ? (
          <a 
            href={employee.drive_contract} 
            target="_blank" 
            rel="noreferrer" 
            className="bg-slate-950 border border-slate-800 hover:bg-slate-800 text-amber-400 font-bold text-[10px] px-2.5 py-2 rounded-xl inline-flex items-center gap-1 transition uppercase tracking-wider"
          >
            <FileText className="w-3.5 h-3.5" /> Xem Hợp Đồng
          </a>
        ) : (
          <span className="text-[10px] text-slate-600 font-bold italic">Chưa ký HĐ</span>
        )}
      </div>

      {/* 3. KHỐI DANH SÁCH WORKFLOW TASK ĐƯỢC GÁN */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
          <LayoutGrid className="w-4 h-4 text-blue-500" /> Danh sách công đoạn sản xuất đang phụ trách
        </h3>
        
        {tasks.map(t => (
          <div 
            key={t.id} 
            className={`p-4 rounded-2xl border transition-all ${
              t.status === 'DOING' 
                ? 'bg-slate-900 border-blue-600/60 shadow-lg shadow-blue-950/20' 
                : 'bg-slate-900/40 border-slate-800/80 opacity-40'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] font-black px-1.5 py-0.5 bg-slate-950 text-slate-400 rounded-md uppercase tracking-wider border border-slate-800">
                  {t.group}
                </span>
                <h4 className="text-xs font-extrabold text-slate-100 mt-2.5">{t.project}</h4>
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">{t.task}</p>
              </div>
              {t.status === 'DOING' && <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>}
            </div>
            
            {/* INPUT ĐỘNG CHO PHÉP THỢ TỰ ESTIMATE LẠI TIẾN ĐỘ KHI BẬN */}
            {t.status === 'DOING' && (
              <div className="pt-3 border-t border-slate-800/60 mt-3 flex items-center justify-between gap-2 text-[11px]">
                <span className="text-slate-500 font-bold flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-amber-500" /> Tự Estimate hạn xong:</span>
                <input 
                  type="date" 
                  className="bg-slate-950 border border-slate-800 rounded-lg p-1.5 font-mono text-amber-400 font-bold focus:outline-none focus:border-amber-500/50 transition text-right" 
                  value={t.deadline} 
                  onChange={(e) => handleEstimateDeadline(t.id, e.target.value)} 
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 4. KHỐI BÁO CÁO PHỤ CẤP VẬT TƯ MUA NGOÀI AN TOÀN */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-xl">
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2.5">
          <ShoppingBag className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Ghi sổ chi mua đồ hộ văn phòng</h3>
        </div>
        
        <div className="space-y-3 text-xs">
          <div>
            <label className="text-slate-400 font-semibold">Tên vật tư / Đồ mua ngoài cần hoàn tiền:</label>
            <input 
              type="text" 
              className="mt-2 block w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-emerald-500/40 transition" 
              placeholder="Ví dụ: Mua thêm dung dịch cồn rửa phôi, chổi sơn..." 
              value={itemName} 
              onChange={(e) => setItemName(e.target.value)} 
            />
          </div>
          
          <div>
            <label className="text-slate-400 font-semibold">Số tiền thực tế đã chi out-of-pocket (VND):</label>
            <input 
              type="number" 
              className="mt-2 block w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-red-400 font-extrabold focus:outline-none focus:border-emerald-500/40 transition" 
              placeholder="Ví dụ: 75000" 
              value={itemCost} 
              onChange={(e) => setItemCost(e.target.value)} 
            />
          </div>

          <button 
            onClick={handleReportExpense} 
            disabled={isReporting} 
            className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold p-3 rounded-xl flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider mt-2 transition text-white shadow-lg shadow-emerald-950/40"
          >
            {isReporting ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-4 h-4" />}
            {isReporting ? 'Đang gửi xác thực...' : 'Đệ trình hoàn tiền chi'}
          </button>
        </div>
      </div>

    </div>
  );
}