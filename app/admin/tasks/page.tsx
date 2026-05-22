// app/admin/tasks/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useNotification } from '@/component/NotificationContext';
import { ClipboardList, Plus, Trash2, CheckCircle, AlertTriangle, Hourglass, RefreshCcw, Search, ChevronLeft, ChevronRight, X, Layers, Circle, CheckCircle2 } from 'lucide-react';

export default function AdminTaskWorkflowDashboard() {
  const { showToast, showConfirm } = useNotification();
  const [tasks, setTasks] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Bộ lọc tìm kiếm & Phân trang
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Điều khiển Popup Form Tạo Mới Dự Án
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  
  // 🔥 TRẢ LẠI SỰ LINH HOẠT: Mảng quản lý Phase động, sếp tự do thêm bớt
  const [formPhases, setFormPhases] = useState<any[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: tList, error: tErr } = await supabase
        .from('system_settings')
        .select('*')
        .eq('group_name', 'PRODUCTION_WORKFLOW')
        .order('key', { ascending: false });
        
      if (tErr) throw tErr;
      setTasks(tList || []);

      const { data: emps, error: eErr } = await supabase.from('employees').select('id, full_name').eq('status', 'ACTIVE');
      if (eErr) throw eErr;
      setEmployees(emps || []);
    } catch (e: any) {
      showToast('Lỗi tải dữ liệu', e.message, 'error');
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  // Mở Form với 1 Phase trắng mặc định
  const handleOpenAddModal = () => {
    setNewProjectName('');
    setFormPhases([{ name: 'Giai đoạn 1', tasks: [{ name: '', assignee: '' }] }]);
    setShowAddModal(true);
  };

  // Các hàm điều khiển ĐỘNG (Dynamic Form) cho Phase và Task con
  const handleAddPhaseInForm = () => {
    setFormPhases([...formPhases, { name: `Giai đoạn ${formPhases.length + 1}`, tasks: [{ name: '', assignee: '' }] }]);
  };

  const handleRemovePhaseInForm = (pIdx: number) => {
    const updated = [...formPhases];
    updated.splice(pIdx, 1);
    setFormPhases(updated);
  };

  const handleAddTaskInForm = (pIdx: number) => {
    const updated = [...formPhases];
    updated[pIdx].tasks.push({ name: '', assignee: '' });
    setFormPhases(updated);
  };

  const handleRemoveTaskInForm = (pIdx: number, tIdx: number) => {
    const updated = [...formPhases];
    updated[pIdx].tasks.splice(tIdx, 1);
    setFormPhases(updated);
  };

  // 🔥 LƯU DỰ ÁN VỚI SỐ LƯỢNG PHASE BẤT KỲ XUỐNG DB
  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      showToast('Thiếu dữ liệu', 'Sếp vui lòng nhập tên dự án / lệnh sản xuất!', 'error');
      return;
    }
    if (formPhases.length === 0) {
      showToast('Thiếu tiến trình', 'Dự án phải có ít nhất 1 giai đoạn sản xuất!', 'error');
      return;
    }

    try {
      const payloadArray = formPhases.map((phase, idx) => {
        const validTasks = phase.tasks.filter((t: any) => t.name.trim() !== '');
        const finalPhaseName = phase.name.trim() || `Giai đoạn ${idx + 1}`;
        
        return {
          group_name: 'PRODUCTION_WORKFLOW',
          config_name: `${newProjectName.trim()} - ${finalPhaseName}`,
          key: `TASK_${Date.now()}_PHASE_${idx}`,
          value: idx === 0 ? 'DOING' : 'TODO', // Bước đầu tiên luôn kích hoạt
          description: JSON.stringify(validTasks)
        };
      });

      const { error } = await supabase.from('system_settings').insert(payloadArray);
      if (error) throw error;

      setShowAddModal(false);
      await loadData();
      showToast('Thành công', '✨ Đã phát lệnh sản xuất chuỗi tiến độ động xuống xưởng!', 'success');
    } catch (err: any) {
      showToast('Lỗi Lưu Trữ', err.message, 'error');
    }
  };

  const handleUpdateStatusInline = async (taskKey: string, currentConfigName: string, newStatus: string) => {
    try {
      const { error } = await supabase.from('system_settings').update({ value: newStatus }).eq('key', taskKey);
      if (error) throw error;
      showToast('Đã cập nhật', `Cập nhật trạng thái [${currentConfigName}] sang ${newStatus}`, 'success');
      loadData();
    } catch (e: any) {
      showToast('Lỗi', e.message, 'error');
    }
  };

  const handleDeleteProjectGroup = (configNamePrefix: string) => {
    const shortName = configNamePrefix.split(' - ')[0]; 
    showConfirm('Hủy lệnh sản xuất', `Sếp có chắc chắn muốn gỡ bỏ toàn bộ các giai đoạn của dự án [${shortName}] không?`, async () => {
      try {
        const { error } = await supabase.from('system_settings').delete().like('config_name', `${shortName}%`);
        if (error) throw error;
        showToast('Đã xóa', 'Tiến trình kỹ thuật dự án đã được dọn sạch khỏi DB.', 'info');
        loadData();
      } catch (e: any) {
        showToast('Lỗi', e.message, 'error');
      }
    });
  };

  // Gom nhóm hiển thị
  const projectGroupsMap: { [key: string]: any[] } = {};
  tasks.forEach(t => {
    const pName = t.config_name.split(' - ')[0];
    if (!projectGroupsMap[pName]) projectGroupsMap[pName] = [];
    projectGroupsMap[pName].push(t);
  });

  const uniqueProjectNames = Object.keys(projectGroupsMap).filter(name => name.toLowerCase().includes(searchTerm.toLowerCase()));
  const totalPages = Math.ceil(uniqueProjectNames.length / itemsPerPage) || 1;
  const currentProjectNames = uniqueProjectNames.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const countCompleted = tasks.filter(t => t.value === 'DONE').length;
  const countDoing = tasks.filter(t => t.value === 'DOING').length;
  const countTodo = tasks.filter(t => t.value === 'TODO').length;

  if (loading) {
    return (
      <div className="p-6 text-xs text-center font-mono text-slate-500 min-h-screen bg-slate-950 flex items-center justify-center gap-2">
        <RefreshCcw className="w-4 h-4 animate-spin inline" />
        <span>Đang đồng bộ ma trận dây chuyền...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-100 bg-slate-950 min-h-screen font-sans">
      
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-purple-500" />
          <div>
            <h1 className="text-base font-bold">Ma Trận Giai Đoạn Sản Xuất & Lồng Việc Cơ Động</h1>
            <p className="text-[11px] text-slate-400 mt-0.5">Số hóa dây chuyền đa phân hệ: Tự do tùy biến Phase cho Đúc, In 3D, Gia công CNC...</p>
          </div>
        </div>
        <button onClick={handleOpenAddModal} className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition shadow-lg shrink-0">
          <Plus className="w-4 h-4" /> Phát lệnh sản xuất mới
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs uppercase font-bold tracking-wider select-none">
        <div className="bg-slate-900 border border-emerald-600/30 p-4 rounded-2xl flex justify-between items-center bg-emerald-950/10"><div><p className="text-emerald-400 text-[10px]">✓ Đã hoàn thành (DONE)</p><p className="text-xl font-black text-emerald-400 font-mono mt-1">{countCompleted} Giai đoạn</p></div><CheckCircle className="w-4 h-4 text-emerald-400" /></div>
        <div className="bg-slate-900 border border-blue-600/30 p-4 rounded-2xl flex justify-between items-center bg-blue-950/10"><div><p className="text-blue-400 text-[10px]">⚡ Đang triển khai (DOING)</p><p className="text-xl font-black text-blue-400 font-mono mt-1">{countDoing} Ca máy</p></div><RefreshCcw className="w-4 h-4 text-blue-400 animate-spin" style={{ animationDuration: '6s' }} /></div>
        <div className="bg-slate-900 border border-amber-600/30 p-4 rounded-2xl flex justify-between items-center bg-amber-950/10"><div><p className="text-amber-400 text-[10px]">⏳ Đang chờ xếp lịch (TODO)</p><p className="text-xl font-black text-amber-400 font-mono mt-1">{countTodo} Bước phôi</p></div><Hourglass className="w-4 h-4 text-amber-400" /></div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Danh Sách Lệnh Sản Xuất Đang Chạy</span>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input type="text" placeholder="Tìm tên lệnh sản xuất..." className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
          </div>
        </div>

        <div className="p-5 space-y-4">
          {currentProjectNames.length === 0 ? (
            <div className="text-center text-slate-500 font-mono italic py-10 text-xs">Chưa có dự án nào đang chạy hoặc không khớp từ khóa.</div>
          ) : currentProjectNames.map(pName => {
            const projectPhases = projectGroupsMap[pName].sort((a, b) => a.key.localeCompare(b.key));
            const isAllCompleted = projectPhases.every(ph => ph.value === 'DONE');
            
            return (
              <details key={pName} className="group bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl" open={!isAllCompleted}>
                <summary className={`px-5 py-4 cursor-pointer flex justify-between items-center text-sm font-black transition select-none ${isAllCompleted ? 'bg-emerald-950/20 text-emerald-400' : 'bg-slate-800/40 text-blue-400 border-b border-slate-800'}`}>
                  <div className="flex items-center gap-2">
                    {isAllCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Layers className="w-5 h-5" />} 📦 {pName}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded border border-current">{isAllCompleted ? 'Đã Xong (Gập)' : 'Đang sản xuất'}</span>
                    <button onClick={(e) => { e.preventDefault(); handleDeleteProjectGroup(pName); }} className="p-1.5 text-slate-500 hover:text-red-400 transition" title="Xóa toàn bộ dự án"><Trash2 className="w-4 h-4"/></button>
                  </div>
                </summary>
                
                <div className="p-5 space-y-3 bg-slate-950">
                  {projectPhases.map((phase) => {
                    let nestedTasks = [];
                    try { nestedTasks = JSON.parse(phase.description || '[]'); } catch { nestedTasks = []; }

                    return (
                      <div key={phase.key} className="bg-slate-900 border border-slate-850 p-4 rounded-xl flex flex-col md:flex-row justify-between gap-4 text-[11px] items-start md:items-center">
                        <div className="space-y-2 w-full">
                          <p className={`font-bold ${phase.value === 'DONE' ? 'line-through text-slate-500' : 'text-slate-200'} text-xs`}>
                            {phase.config_name.split(' - ')[1] || phase.config_name}
                          </p>
                          {nestedTasks.length > 0 && (
                            <div className="pl-3 border-l-2 border-slate-800 space-y-1">
                              {nestedTasks.map((nt: any, ntIdx: number) => (
                                <div key={ntIdx} className="text-slate-400 flex items-center gap-2 font-mono">
                                  <span className="text-slate-500">• {nt.name}</span>
                                  {nt.assignee && <span className="bg-slate-950 px-1.5 rounded border border-slate-800 text-[9px] text-blue-300">👤 {nt.assignee}</span>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="shrink-0">
                          <select 
                            className={`text-[10px] font-black border rounded-lg p-2 focus:outline-none cursor-pointer text-center tracking-wide uppercase ${
                              phase.value === 'DONE' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50' : 
                              phase.value === 'DOING' ? 'bg-blue-950/40 text-blue-400 border-blue-800/50 shadow-[0_0_10px_rgba(59,130,246,0.2)]' : 
                              'bg-slate-950 text-slate-500 border-slate-800'
                            }`}
                            value={phase.value || 'TODO'}
                            onChange={(e) => handleUpdateStatusInline(phase.key, phase.config_name, e.target.value)}
                          >
                            <option value="TODO">⚪ Đang chờ</option>
                            <option value="DOING">⚡ Đang làm</option>
                            <option value="DONE">✓ Hoàn thành</option>
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </details>
            );
          })}
        </div>

        <div className="p-4 bg-slate-950/50 border-t border-slate-800 flex justify-between items-center text-xs font-mono text-slate-400 select-none">
          <div>Total <span className="text-purple-400 font-bold">{uniqueProjectNames.length}</span> lệnh sản xuất</div>
          <div className="flex items-center gap-1">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg disabled:opacity-20 hover:bg-slate-800 transition"><ChevronLeft className="w-4 h-4" /></button>
            <span className="px-3 text-slate-200 font-bold text-[11px]">Trang {currentPage} / {totalPages}</span>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg disabled:opacity-20 hover:bg-slate-800 transition"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-40 animate-fadeIn overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-4xl space-y-4 text-xs text-slate-200 shadow-2xl relative my-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-1.5"><Layers className="w-4 h-4 text-purple-500"/><h3 className="font-bold uppercase tracking-wider text-[11px]">Khởi tạo quy trình lệnh sản xuất mới</h3></div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="bg-slate-950 p-4 rounded-2xl border border-blue-900/30 shadow-inner">
              <label className="text-slate-400 font-bold block mb-1.5">Nhập tên mặt hàng mẫu đúc / đơn hàng tổng:</label>
              <input type="text" placeholder="Ví dụ: Đơn in 3D Mô hình Titan..." className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm font-bold text-blue-400 focus:outline-none focus:border-blue-500/50" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} />
            </div>

            <div className="space-y-4 mt-2">
              {formPhases.map((p, pIdx) => (
                <div key={pIdx} className="bg-slate-950/40 p-4 border border-slate-800 rounded-2xl space-y-3 relative">
                  {/* Nút Xóa Phase Khỏi Dự Án */}
                  {formPhases.length > 1 && (
                    <button 
                      onClick={() => handleRemovePhaseInForm(pIdx)} 
                      className="absolute top-4 right-4 p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition"
                      title="Xóa giai đoạn này"
                    >
                      <Trash2 className="w-3.5 h-3.5"/>
                    </button>
                  )}

                  <div className="flex flex-col gap-1 pr-10">
                    <span className="font-black text-slate-500">Mốc Phase {pIdx + 1}:</span>
                    <input type="text" className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg font-bold text-emerald-400 w-full focus:outline-none focus:border-emerald-500/50" placeholder="Nhập tên giai đoạn (Ví dụ: In Test Mẫu)..." value={p.name} onChange={(e) => { const n = [...formPhases]; n[pIdx].name = e.target.value; setFormPhases(n); }} />
                  </div>
                  
                  <div className="pl-4 border-l-2 border-slate-800 space-y-2 mt-2">
                    {p.tasks.map((t: any, tIdx: number) => (
                      <div key={tIdx} className="flex flex-col sm:flex-row gap-2 relative items-center">
                        <input type="text" className="flex-1 bg-slate-950 border border-slate-800 p-2 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500 w-full" placeholder="Nội dung việc con cần thợ làm..." value={t.name} onChange={(e) => { const n = [...formPhases]; n[pIdx].tasks[tIdx].name = e.target.value; setFormPhases(n); }} />
                        <select className="w-full sm:w-48 bg-slate-950 border border-slate-800 p-2 rounded-lg text-slate-400 focus:outline-none cursor-pointer" value={t.assignee} onChange={(e) => { const n = [...formPhases]; n[pIdx].tasks[tIdx].assignee = e.target.value; setFormPhases(n); }}>
                          <option value="">Gán thợ trực máy...</option>
                          {employees.map(e => <option key={e.id} value={e.full_name}>{e.full_name}</option>)}
                        </select>
                        <button type="button" onClick={() => handleRemoveTaskInForm(pIdx, tIdx)} className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition shrink-0"><Trash2 className="w-4 h-4"/></button>
                      </div>
                    ))}
                    <button type="button" onClick={() => handleAddTaskInForm(pIdx)} className="text-[10px] text-purple-400 font-bold hover:text-purple-300 flex items-center gap-0.5 mt-2">+ Bổ sung một việc con</button>
                  </div>
                </div>
              ))}
              <button type="button" onClick={handleAddPhaseInForm} className="w-full border border-dashed border-slate-700 bg-slate-900/30 text-slate-400 hover:text-slate-200 p-3.5 rounded-2xl font-bold transition flex justify-center items-center gap-1 hover:bg-slate-900/60">+ Thêm Giai Đoạn (Phase) Mới</button>
            </div>

            <div className="pt-3 border-t border-slate-800 flex gap-2 font-sans sticky bottom-0 bg-slate-900 pb-2">
              <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 bg-slate-950 border border-slate-800 p-3.5 rounded-xl font-bold text-slate-400 text-center transition hover:bg-slate-850">Hủy bỏ</button>
              <button type="button" onClick={handleCreateProject} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-black p-3.5 rounded-xl shadow-lg uppercase text-[11px] tracking-wider transition-transform active:scale-[0.98]">🚀 Lưu & Phát Lệnh Xuống Xưởng</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}