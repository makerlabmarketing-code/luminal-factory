// app/admin/tasks/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ClipboardList, Bell, CheckCircle, AlertTriangle, Truck, Package, Hourglass, User, MessageSquare, Send, RefreshCcw } from 'lucide-react';

export default function AdminTaskWorkflowDashboard() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [showNotiPanel, setShowNotiPanel] = useState(false);
  const [loading, setLoading] = useState(true);

  // States thao tác cập nhật nhanh của thợ
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [estDate, setEstDate] = useState('');
  const [issue, setIssue] = useState('');

  const loadData = async () => {
    setLoading(true);
    const { data: tList } = await supabase.from('tasks').select('*').order('id', { ascending: false });
    setTasks(tList || []);

    const { data: emps } = await supabase.from('employees').select('id, full_name').eq('status', 'ACTIVE');
    setEmployees(emps || []);
    setLoading(false);
  };

  useEffect(() => { 
    loadData(); 
    // Giả lập thợ nhận thông báo khi có dự án mới gán ngầm
    setNotifications([
      '📌 Bạn được gán phụ trách dự án [Mô hình Khủng long T-Rex 1m2]',
      '⚠️ Giai đoạn [Bộ vỏ Robot Công nghiệp Phase 1] đã được sếp duyệt thông qua!'
    ]);
  }, []);

  // HÀM: Thợ tự điền thời gian hoàn thành mong muốn & khai báo sự cố nghẽn nhựa/vật tư
  const handleStaffEstimateAndIssue = async () => {
    if (!selectedTask) return;
    await supabase.from('tasks').update({ estimation_date: estDate, issue_note: issue }).eq('id', selectedTask.id);
    setSelectedTask(null); setIssue(''); loadData();
    alert('📝 Thợ đã cập nhật tiến độ tự lượng và báo cáo lỗi lên xưởng thành công!');
  };

  // HÀM CHUYỂN GIAI ĐOẠN TỰ ĐỘNG (Trực tiếp bắn Email thông báo và chuyển thợ Đóng gói)
  const handleAdminApprovePhase = async (task: any, nextPhase: 'REVIEW' | 'PACKING' | 'DONE') => {
    const updatePayload: any = { current_phase: nextPhase };
    
    if (nextPhase === 'PACKING') {
      // Tự động chỉ định thợ đầu tiên trong xưởng nhận ca đóng gói vận chuyển
      updatePayload.packer_assigned = employees[0]?.full_name || 'Admin hệ thống';
      updatePayload.issue_note = 'Sếp đã duyệt thành công! Ép tiến độ đóng gói chuyển giao hàng gấp.';
      
      // Giả lập bắn API email thông qua email_templates đã dựng sẵn cho sếp ở bài trước
      alert(`📧 [HỆ THỐNG AUTOMATION]: Đã gửi mail thông báo chốt duyệt đến thợ phụ trách đóng gói [${updatePayload.packer_assigned}]!`);
    }

    await supabase.from('tasks').update(updatePayload).eq('id', task.id);
    loadData();
  };

  // Tính toán chỉ số phân tích nhanh trên Dashboard
  const countInProg = tasks.filter(t => t.current_phase === 'IN_PROG').length;
  const countReview = tasks.filter(t => t.current_phase === 'REVIEW').length;
  const countPacking = tasks.filter(t => t.current_phase === 'PACKING').length;

  if (loading) return <div className="p-6 text-xs text-center font-mono text-slate-500"><RefreshCcw className="w-4 h-4 animate-spin inline" /> Đang điều phối pipeline...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 text-slate-100 bg-slate-950 min-h-screen">
      
      {/* HEADER KÈM NÚT NOTIFICATION CHUẨN UX CHUỖI VẬN HÀNH */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-4 relative">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-blue-500" />
          <h1 className="text-base font-bold">Dây Chuyền Tiến Độ & Phân Tích Phase Công Việc</h1>
        </div>
        
        {/* NÚT THÔNG BÁO GÁN VIỆC */}
        <div className="relative">
          <button onClick={() => setShowNotiPanel(!showNotiPanel)} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:text-white transition flex items-center gap-2 relative text-xs font-bold">
            <Bell className="w-4 h-4 text-amber-400 animate-bounce" />
            <span>Cổng Thông Báo</span>
            <span className="bg-red-600 text-white font-mono text-[9px] px-1 py-0.5 rounded-full font-black">{notifications.length}</span>
          </button>

          {showNotiPanel && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-2xl z-50 space-y-2 text-[11px] animate-fadeIn">
              <div className="font-bold border-b border-slate-800 pb-1.5 uppercase text-slate-400">Dự án được gán mới nhất</div>
              {notifications.map((n, i) => <div key={i} className="bg-slate-950 p-2.5 border border-slate-800 rounded-lg text-slate-300 font-medium leading-relaxed">{n}</div>)}
            </div>
          )}
        </div>
      </div>

      {/* DASHBOARD PHÂN TÍCH ĐỒNG BỘ TRÊN ĐẦU */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs uppercase font-bold tracking-wider">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex justify-between items-center"><div><p className="text-slate-500 text-[10px]">1. Đang sản xuất / In 3D</p><p className="text-base font-black text-blue-400 font-mono mt-1">{countInProg} Dự án</p></div><Hourglass className="w-4 h-4 text-blue-400" /></div>
        <div className="bg-slate-900 border border-amber-600/40 p-4 rounded-2xl flex justify-between items-center bg-amber-950/10"><div><p className="text-amber-500 text-[10px]">2. Chờ sếp duyệt lại (Review)</p><p className="text-base font-black text-amber-400 font-mono mt-1">{countReview} File chờ</p></div><AlertTriangle className="w-4 h-4 text-amber-500" /></div>
        <div className="bg-slate-900 border border-emerald-600/40 p-4 rounded-2xl flex justify-between items-center bg-emerald-950/10"><div><p className="text-emerald-500 text-[10px]">3. Đóng gói & Giao vận</p><p className="text-base font-black text-emerald-400 font-mono mt-1">{countPacking} Kiện hàng</p></div><Package className="w-4 h-4 text-emerald-500" /></div>
      </div>

      {/* TABLE LIST CHI TIẾT CÔNG VIỆC PIPELINE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 text-[10px] uppercase">
            <tr><th className="p-4">Tên Sản Phẩm / Dự Án</th><th className="p-4">Phụ Trách Sản Xuất</th><th className="p-4">Giai đoạn Hiện tại (Phase)</th><th className="p-4">Thợ tự Estimate / Khai báo lỗi</th><th className="p-4 text-center">Thao tác điều phối của Sếp</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {tasks.map(t => (
              <tr key={t.id} className="hover:bg-slate-950/30 transition text-[11px]">
                <td className="p-4 font-bold text-slate-100">⚙️ {t.project_name}</td>
                <td className="p-4 text-slate-400 flex items-center gap-1.5 mt-2"><User className="w-3.5 h-3.5 text-slate-500" />{t.assigned_to}</td>
                <td className="p-4">
                  {t.current_phase === 'IN_PROG' && <span className="bg-blue-500/10 text-blue-400 px-2 py-1 border border-blue-500/20 rounded-md font-bold">🏗️ Đang tạo phôi mẫu</span>}
                  {t.current_phase === 'REVIEW' && <span className="bg-amber-500/10 text-amber-400 px-2 py-1 border border-amber-500/30 rounded-md font-bold animate-pulse">⏳ Chờ sếp check chất lượng</span>}
                  {t.current_phase === 'PACKING' && <span className="bg-cyan-500/10 text-cyan-400 px-2 py-1 border border-cyan-500/20 rounded-md font-bold">📦 Đóng gói: {t.packer_assigned}</span>}
                  {t.current_phase === 'DONE' && <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 border border-emerald-500/20 rounded-md font-bold">🚚 Đã giao vận chuyển</span>}
                </td>
                <td className="p-4">
                  <div className="text-[10px] text-slate-500 font-mono">Hạn ước: {t.estimation_date || 'Chưa bấm hạn'}</div>
                  {t.issue_note && <div className="text-[10px] text-red-400 flex items-center gap-1 mt-1 font-sans"><MessageSquare className="w-3 h-3 text-red-500" /> {t.issue_note}</div>}
                  <button onClick={() => { setSelectedTask(t); setEstDate(t.estimation_date || ''); setIssue(t.issue_note || ''); }} className="text-blue-400 hover:underline text-[10px] block mt-1.5">➔ Gõ Estimate & Báo cáo nghẽn</button>
                </td>
                
                {/* ĐIỀU PHỐI GIAI ĐOẠN LUỒNG CỦA SẾP */}
                <td className="p-4 text-center">
                  {t.current_phase === 'IN_PROG' && <button onClick={() => handleAdminApprovePhase(t, 'REVIEW')} className="bg-slate-950 hover:bg-slate-800 px-2.5 py-1.5 border border-slate-800 rounded-lg text-slate-400 font-bold text-[10px]">Gửi sếp check</button>}
                  {t.current_phase === 'REVIEW' && (
                    <button onClick={() => handleAdminApprovePhase(t, 'PACKING')} className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-3 py-1.5 rounded-lg font-black text-[10px] flex items-center gap-1 mx-auto transition shadow-md shadow-amber-900/20">
                      <CheckCircle className="w-3.5 h-3.5" /> Duyệt & Bắn Lệnh Đóng Gói
                    </button>
                  )}
                  {t.current_phase === 'PACKING' && (
                    <button onClick={() => handleAdminApprovePhase(t, 'DONE')} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-black text-[10px] flex items-center gap-1 mx-auto transition">
                      <Truck className="w-3.5 h-3.5" /> Xuất Kho Giao Hàng
                    </button>
                  )}
                  {t.current_phase === 'DONE' && <span className="text-slate-600 font-mono text-[10px]">🔒 Pipeline Completed</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* POPUP: THỢ TỰ ƯỚC LƯỢNG THỜI GIAN VÀ BÁO CÁO VẤN ĐỀ NGHẼN SẢN XUẤT */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2"><h3 className="font-bold text-slate-200 uppercase">📝 Thợ cập nhật báo cáo: {selectedTask.project_name}</h3><button onClick={() => setSelectedTask(null)}><X className="w-4 h-4" /></button></div>
            <div className="space-y-3">
              <div><label className="text-slate-400 font-bold">1. Tự Estimate ngày hoàn thành giai đoạn này:</label><input type="date" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 mt-1.5 text-slate-200 [color-scheme:dark]" value={estDate} onChange={(e) => setEstDate(e.target.value)} /></div>
              <div><label className="text-slate-400 font-bold">2. Gặp vấn đề gì? (Báo cáo máy lỗi, thiếu phôi để sếp ứng tiền két chi ngay):</label><textarea className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 mt-1.5 h-20 resize-none text-slate-200" placeholder="Ví dụ: Máy đùn nhựa đầu số 2 bị nghẹt, cần mua thêm dung dịch IPA vệ sinh..." value={issue} onChange={(e) => setIssue(e.target.value)} /></div>
            </div>
            <button onClick={handleStaffEstimateAndIssue} className="w-full bg-blue-600 p-3 rounded-xl font-bold uppercase text-white mt-2 flex items-center justify-center gap-1"><Send className="w-3.5 h-3.5" /> Gửi báo cáo lên hệ thống điều hành</button>
          </div>
        </div>
      )}
    </div>
  );
}