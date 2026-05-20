// app/admin/tasks/page.tsx
'use777777777'; // Fallback
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ClipboardList, Bell, CheckCircle, AlertTriangle, Truck, Package, Hourglass, User, MessageSquare, Send, RefreshCcw, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X } from 'lucide-react';

export default function AdminTaskWorkflowDashboard() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [showNotiPanel, setShowNotiPanel] = useState(false);
  const [loading, setLoading] = useState(true);

  // Bộ lọc ô Search góc bảng & Phân trang chuyên sâu
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pageInput, setPageInput] = useState('1');

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
    setNotifications([
      '📌 Bạn được gán phụ trách dự án [Mô hình Khủng long T-Rex 1m2]',
      '⚠️ Giai đoạn [Bộ vỏ Robot Công nghiệp Phase 1] đã được sếp duyệt thông qua!'
    ]);
  }, []);

  const handleStaffEstimateAndIssue = async () => {
    if (!selectedTask) return;
    await supabase.from('tasks').update({ estimation_date: estDate, issue_note: issue }).eq('id', selectedTask.id);
    setSelectedTask(null); setIssue(''); loadData();
    alert('📝 Đã cập nhật báo cáo tiến độ thành công!');
  };

  const handleAdminApprovePhase = async (task: any, nextPhase: 'REVIEW' | 'PACKING' | 'DONE') => {
    const updatePayload: any = { current_phase: nextPhase };
    if (nextPhase === 'PACKING') {
      updatePayload.packer_assigned = employees[0]?.full_name || 'Admin hệ thống';
      updatePayload.issue_note = 'Sếp đã duyệt! Ép đóng gói gấp.';
      alert(`📧 [HỆ THỐNG AUTOMATION]: Đã bắn mail gọi thợ [${updatePayload.packer_assigned}] đóng gói!`);
    }
    await supabase.from('tasks').update(updatePayload).eq('id', task.id);
    loadData();
  };

  const filteredTasks = tasks.filter(t => 
    (t.project_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.assigned_to || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage) || 1;
  const paginatedTasks = filteredTasks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const countInProg = tasks.filter(t => t.current_phase === 'IN_PROG').length;
  const countReview = tasks.filter(t => t.current_phase === 'REVIEW').length;
  const countPacking = tasks.filter(t => t.current_phase === 'PACKING').length;

  if (loading) {
    return (
      <div className="p-6 text-xs text-center font-mono text-slate-500 min-h-screen bg-slate-950 flex items-center justify-center gap-2">
        <RefreshCcw className="w-4 h-4 animate-spin inline" />
        <span>Đang điều phối pipeline xưởng...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 text-slate-100 bg-slate-950 min-h-screen">
      
      {/* HEADER */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-4 relative">
        <div className="flex items-center gap-2"><ClipboardList className="w-5 h-5 text-blue-500" /><h1 className="text-base font-bold">Dây Chuyền Tiến Độ & Phân Tích Phase Công Việc</h1></div>
        <div className="relative">
          <button onClick={() => setShowNotiPanel(!showNotiPanel)} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:text-white flex items-center gap-2 text-xs font-bold">
            <Bell className="w-4 h-4 text-amber-400 animate-bounce" /><span>Cổng Thông Báo</span>
            <span className="bg-red-600 text-white font-mono text-[9px] px-1 py-0.5 rounded-full font-black">{notifications.length}</span>
          </button>
          {showNotiPanel && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-2xl z-50 space-y-2 text-[11px]">
              <div className="font-bold border-b border-slate-800 pb-1.5 uppercase text-slate-400">Dự án gán mới</div>
              {notifications.map((n, i) => <div key={i} className="bg-slate-950 p-2.5 border border-slate-800 rounded-lg text-slate-300">{n}</div>)}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs uppercase font-bold tracking-wider">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex justify-between items-center"><div><p className="text-slate-500 text-[10px]">1. Đang sản xuất</p><p className="text-base font-black text-blue-400 font-mono mt-1">{countInProg} Dự án</p></div><Hourglass className="w-4 h-4 text-blue-400" /></div>
        <div className="bg-slate-900 border border-amber-600/40 p-4 rounded-2xl flex justify-between items-center bg-amber-950/10"><div><p className="text-amber-500 text-[10px]">2. Chờ sếp duyệt</p><p className="text-base font-black text-amber-400 font-mono mt-1">{countReview} File</p></div><AlertTriangle className="w-4 h-4 text-amber-500" /></div>
        <div className="bg-slate-900 border border-emerald-600/40 p-4 rounded-2xl flex justify-between items-center bg-emerald-950/10"><div><p className="text-emerald-500 text-[10px]">3. Đóng gói & Giao vận</p><p className="text-base font-black text-emerald-400 font-mono mt-1">{countPacking} Kiện</p></div><Package className="w-4 h-4 text-emerald-500" /></div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/40 flex justify-between items-center">
          <span className="text-xs font-bold uppercase text-slate-200">Ma Trận Điều Phối Giai Đoạn Sản Phẩm</span>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input type="text" placeholder="Tìm tên sản phẩm, tên thợ..." className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
          </div>
        </div>

        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px] uppercase">
            <tr><th className="p-4">Tên Sản Phẩm / Dự Án</th><th className="p-4">Phụ Trách</th><th className="p-4">Giai đoạn (Phase)</th><th className="p-4">Estimate / Báo lỗi</th><th className="p-4 text-center">Thao tác của Sếp</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-[11px]">
            {paginatedTasks.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-500 font-mono">Không tìm thấy dự án công việc nào.</td></tr>
            ) : paginatedTasks.map(t => (
              <tr key={t.id} className="hover:bg-slate-950/30 transition">
                <td className="p-4 font-bold text-slate-100">
                  <div className="flex flex-col space-y-1">
                    <span>⚙️ {t.project_name}</span>
                    <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/shared/project/${t.share_token}`); alert('📋 Đã copy Link!'); }} className="text-[9px] text-cyan-400 font-mono w-fit bg-cyan-950/40 border border-cyan-800/30 px-1.5 py-0.5 rounded-md">🔗 Copy Link Khách Xem</button>
                  </div>
                </td>
                <td className="p-4 text-slate-400 flex items-center gap-1.5 mt-3"><User className="w-3.5 h-3.5 text-slate-500" />{t.assigned_to}</td>
                <td className="p-4">
                  {t.current_phase === 'IN_PROG' && <span className="bg-blue-500/10 text-blue-400 px-2 py-1 border border-blue-500/20 rounded-md font-bold">🏗️ Đang tạo phôi</span>}
                  {t.current_phase === 'REVIEW' && <span className="bg-amber-500/10 text-amber-400 px-2 py-1 border border-amber-500/30 rounded-md font-bold animate-pulse">⏳ Chờ duyệt</span>}
                  {t.current_phase === 'PACKING' && <span className="bg-cyan-500/10 text-cyan-400 px-2 py-1 border border-cyan-500/20 rounded-md font-bold">📦 Đóng gói: {t.packer_assigned}</span>}
                  {t.current_phase === 'DONE' && <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 border border-emerald-500/20 rounded-md font-bold">🚚 Đã giao vận chuyển</span>}
                </td>
                <td className="p-4">
                  <div className="text-[10px] text-slate-500 font-mono">Hạn ước: {t.estimation_date || 'Chưa bấm'}</div>
                  {t.issue_note && <div className="text-[10px] text-red-400 flex items-center gap-1 mt-1"><MessageSquare className="w-3 h-3 text-red-500" /> {t.issue_note}</div>}
                  <button onClick={() => { setSelectedTask(t); setEstDate(t.estimation_date || ''); setIssue(t.issue_note || ''); }} className="text-blue-400 hover:underline text-[10px] block mt-1">➔ Gõ Estimate & Báo nghẽn</button>
                </td>
                <td className="p-4 text-center">
                  {t.current_phase === 'IN_PROG' && <button onClick={() => handleAdminApprovePhase(t, 'REVIEW')} className="bg-slate-950 border border-slate-800 px-2.5 py-1.5 rounded-lg text-slate-400 text-[10px]">Gửi sếp check</button>}
                  {t.current_phase === 'REVIEW' && <button onClick={() => handleAdminApprovePhase(t, 'PACKING')} className="bg-amber-500 text-slate-950 px-3 py-1.5 rounded-lg font-black text-[10px] flex items-center gap-1 mx-auto transition"><CheckCircle className="w-3.5 h-3.5" /> Duyệt & Bắn Lệnh Đóng Gói</button>}
                  {t.current_phase === 'PACKING' && <button onClick={() => handleAdminApprovePhase(t, 'DONE')} className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-black text-[10px] flex items-center gap-1 mx-auto transition"><Truck className="w-3.5 h-3.5" /> Xuất Kho Giao Hàng</button>}
                  {t.current_phase === 'DONE' && <span className="text-slate-600 font-mono text-[10px]">🔒 Pipeline Completed</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* PREMIUM TIMELINE GRID PAGINATION DISPATCHER */}
        <div className="p-4 bg-slate-950/50 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-mono text-slate-400 select-none">
          <div>Total <span className="text-blue-400 font-bold">{filteredTasks.length}</span> items</div>
          <div className="flex flex-wrap items-center justify-end gap-4 w-full md:w-auto">
            <div className="flex items-center gap-1.5">
              <span>Show rows:</span>
              <select className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 font-bold text-slate-200 focus:outline-none" value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                <option value={5}>5</option><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg disabled:opacity-20 hover:bg-slate-800 transition"><ChevronsLeft className="w-4 h-4 text-slate-300" /></button>
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg disabled:opacity-20 hover:bg-slate-800 transition"><ChevronLeft className="w-4 h-4 text-slate-300" /></button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button key={page} onClick={() => setCurrentPage(page)} className={`w-7 h-7 rounded-lg font-black transition text-[11px] ${currentPage === page ? 'bg-red-600 text-white shadow-md' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800'}`}>{page}</button>
              ))}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg disabled:opacity-20 hover:bg-slate-800 transition"><ChevronRight className="w-4 h-4 text-slate-300" /></button>
              <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg disabled:opacity-20 hover:bg-slate-800 transition"><ChevronsRight className="w-4 h-4 text-slate-300" /></button>
            </div>

            <div className="flex items-center gap-1.5">
              <input type="number" min={1} max={totalPages} className="w-12 bg-slate-900 border border-slate-800 rounded-lg p-1 text-center font-bold text-slate-100" value={pageInput} onChange={(e) => setPageInput(e.target.value)} />
              <button onClick={() => { const p = Number(pageInput); if (p >= 1 && p <= totalPages) setCurrentPage(p); }} className="bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg font-black hover:bg-slate-800 text-slate-200 transition">Go</button>
            </div>
          </div>
        </div>

      </div>

      {/* POPUP COAT */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2"><h3 className="font-bold text-slate-200 uppercase">📝 Báo cáo tiến độ: {selectedTask.project_name}</h3><button onClick={() => setSelectedTask(null)}><X className="w-4 h-4" /></button></div>
            <div className="space-y-3">
              <div><label className="text-slate-400 font-bold">1. Tự Estimate ngày hoàn thành phase:</label><input type="date" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 mt-1.5 text-slate-200 [color-scheme:dark]" value={estDate} onChange={(e) => setEstDate(e.target.value)} /></div>
              <div><label className="text-slate-400 font-bold">2. Gặp vấn đề sự cố nghẽn gì xưởng?</label><textarea className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 mt-1.5 h-20 resize-none text-slate-200" placeholder="Khai báo..." value={issue} onChange={(e) => setIssue(e.target.value)} /></div>
            </div>
            <div className="pt-2 border-t border-slate-800 flex gap-2">
              <button type="button" onClick={() => setSelectedTask(null)} className="flex-1 bg-slate-950 border border-slate-800 p-3 rounded-xl font-bold text-slate-400 text-center">Hủy</button>
              <button type="button" onClick={handleStaffEstimateAndIssue} className="flex-1 bg-blue-600 text-white font-black p-3 rounded-xl">Lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}