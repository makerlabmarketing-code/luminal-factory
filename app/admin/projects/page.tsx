// app/admin/projects/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Layers, Plus, Trash2, ChevronDown, ChevronRight, CheckCircle2, Circle, Save, X, Search, User, RefreshCcw } from 'lucide-react';

export default function AdminProjectManagement() {
  const [projects, setProjects] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [viewDetailId, setViewDetailId] = useState<number | null>(null);

  // States Form Tạo Dự Án
  const [projectName, setProjectName] = useState('');
  const [phases, setPhases] = useState<any[]>([{ name: 'Giai đoạn 1', tasks: [{ name: '', assignee: '' }] }]);

  // Phân trang danh sách dự án
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: projs } = await supabase.from('projects').select('*, phases(*, tasks(*))').order('id', { ascending: false });
      const { data: emps } = await supabase.from('employees').select('full_name');
      
      if (projs) {
        projs.forEach(p => p.phases.sort((a: any, b: any) => a.order_index - b.order_index));
      }
      setProjects(projs || []);
      setEmployees(emps || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const addPhase = () => setPhases([...phases, { name: `Giai đoạn ${phases.length + 1}`, tasks: [{ name: '', assignee: '' }] }]);
  const addTask = (pIndex: number) => {
    const newPhases = [...phases];
    newPhases[pIndex].tasks.push({ name: '', assignee: '' });
    setPhases(newPhases);
  };
  const updatePhaseName = (pIndex: number, val: string) => {
    const newPhases = [...phases]; newPhases[pIndex].name = val; setPhases(newPhases);
  };
  const updateTask = (pIndex: number, tIndex: number, field: string, val: string) => {
    const newPhases = [...phases]; newPhases[pIndex].tasks[tIndex][field] = val; setPhases(newPhases);
  };

  const handleCreateProject = async () => {
    if (!projectName.trim()) return alert('Vui lòng nhập tên dự án!');
    
    const { data: newProj, error: pErr } = await supabase.from('projects').insert([{ name: projectName.trim() }]).select().single();
    if (pErr || !newProj) return alert('Lỗi tạo dự án trên Cloud!');

    for (let i = 0; i < phases.length; i++) {
      const { data: newPhase } = await supabase.from('phases').insert([{ project_id: newProj.id, name: phases[i].name, order_index: i }]).select().single();
      if (newPhase) {
        const tasksToInsert = phases[i].tasks.filter((t: any) => t.name.trim()).map((t: any) => ({
          phase_id: newPhase.id, name: t.name.trim(), assignee: t.assignee, status: 'TODO'
        }));
        if (tasksToInsert.length > 0) await supabase.from('tasks').insert(tasksToInsert);
      }
    }
    setShowModal(false); setProjectName(''); setPhases([{ name: 'Giai đoạn 1', tasks: [{ name: '', assignee: '' }] }]);
    loadData(); alert('✨ Đã khởi tạo chuỗi dự án phân việc thành công!');
  };

  const handleDeleteProject = async (id: number) => {
    if (confirm('⚠️ Sếp có chắc muốn xóa dự án này cùng toàn bộ phase con?')) {
      await supabase.from('projects').delete().eq('id', id);
      setViewDetailId(null); loadData();
    }
  };

  // Cơ chế tự động khóa/mở phase: Phase trước xong hết task mới kích hoạt mở phase sau
  const getPhaseStatus = (phase: any, allPhases: any[]) => {
    const hasTasks = phase.tasks && phase.tasks.length > 0;
    const isAllDone = hasTasks && phase.tasks.every((t: any) => t.status === 'DONE');
    if (isAllDone) return 'COMPLETED'; 

    const firstUnfinishedPhase = allPhases.find(p => !p.tasks || p.tasks.length === 0 || p.tasks.some((t: any) => t.status !== 'DONE'));
    if (phase.id === firstUnfinishedPhase?.id) return 'ACTIVE';
    
    return 'PENDING'; 
  };

  const totalPages = Math.ceil(projects.length / itemsPerPage) || 1;
  const currentProjectData = projects.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return <div className="p-6 text-center text-xs font-mono text-slate-500 bg-slate-950 min-h-screen flex items-center justify-center gap-2"><RefreshCcw className="w-4 h-4 animate-spin" /> Đang đồng bộ cấu trúc dự án...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-100 bg-slate-950 min-h-screen font-sans">
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <h1 className="text-base font-bold flex items-center gap-2"><Layers className="w-5 h-5 text-blue-500" /> Bản Đồ Điều Phối Dự Án Admin</h1>
        <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition shadow-lg"><Plus className="w-4 h-4" /> Thêm Mới Dự Án</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* CONTAINER TRÁI: DANH SÁCH DỰ ÁN TABLE */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between">
          <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/40 font-bold uppercase text-[10px] text-slate-400">Danh Sách Dự Án Kỹ Thuật</div>
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[9px]">
              <tr><th className="p-4">Tên Dự Án</th><th className="p-4 text-center w-20">Xóa</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium text-[11px]">
              {currentProjectData.map(p => (
                <tr key={p.id} onClick={() => setViewDetailId(p.id)} className={`cursor-pointer transition ${viewDetailId === p.id ? 'bg-blue-950/30 font-bold text-blue-400' : 'hover:bg-slate-950/20'}`}>
                  <td className="p-4">{p.name}</td>
                  <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}><button onClick={() => handleDeleteProject(p.id)} className="text-slate-500 hover:text-red-400 transition"><Trash2 className="w-4 h-4"/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {totalPages > 1 && (
            <div className="p-3 bg-slate-950/40 border-t border-slate-800 flex justify-end gap-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-1 bg-slate-900 border rounded disabled:opacity-30"><ChevronLeft className="w-4 h-4"/></button>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-1 bg-slate-900 border rounded disabled:opacity-30"><ChevronRight className="w-4 h-4"/></button>
            </div>
          )}
        </div>

        {/* CONTAINER PHẢI: CHI TIẾT TỪNG DROPDOWN BOX PHASE */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl min-h-[50vh]">
          {!viewDetailId ? (
            <div className="h-full flex items-center justify-center text-slate-500 text-xs italic py-20 font-mono">Sếp chọn một dự án ở bảng bên cạnh để theo dõi sơ đồ Phase.</div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-sm font-black text-blue-400 uppercase tracking-wider border-b border-slate-800 pb-3">Dự án: {projects.find(p => p.id === viewDetailId)?.name}</h2>
              <div className="space-y-3">
                {projects.find(p => p.id === viewDetailId)?.phases.map((phase: any, index: number, allPhases: any[]) => {
                  const status = getPhaseStatus(phase, allPhases);
                  
                  return (
                    <details key={phase.id} className="group bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-inner" open={status === 'ACTIVE'}>
                      <summary className={`px-4 py-3 cursor-pointer flex justify-between items-center text-xs font-bold transition select-none ${status === 'COMPLETED' ? 'bg-emerald-950/20 text-emerald-400' : status === 'ACTIVE' ? 'bg-slate-800/50 text-slate-100 border-b border-slate-800' : 'text-slate-600 bg-slate-900/30 opacity-40 pointer-events-none'}`}>
                        <div className="flex items-center gap-2">
                          {status === 'COMPLETED' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Circle className="w-4 h-4" />}
                          Giai đoạn {index + 1}: {phase.name}
                        </div>
                        <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded border border-current">{status === 'COMPLETED' ? 'Hoàn thành' : status === 'ACTIVE' ? 'Đang chạy' : 'Chưa bắt đầu'}</span>
                      </summary>
                      
                      <div className="p-4 bg-slate-950 space-y-2.5">
                        {phase.tasks && phase.tasks.map((task: any) => (
                          <div key={task.id} className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-col md:flex-row justify-between gap-3 text-[11px]">
                            <div className="space-y-1 w-full">
                              <p className={`font-bold ${task.status === 'DONE' ? 'line-through text-slate-500' : 'text-slate-200'}`}>{task.name}</p>
                              <div className="flex items-center gap-4 text-slate-400 font-mono text-[10px]">
                                <span className="flex items-center gap-1"><User className="w-3 h-3"/> Thợ: {task.assignee || 'Chưa gán'}</span>
                                {task.deadline && <span className="text-amber-400 font-bold">⏱️ Estimate: {task.deadline}</span>}
                              </div>
                              {task.note && <div className="p-2 mt-1.5 bg-slate-950 border border-slate-850 rounded-lg text-slate-400 italic text-[10px]">Ghi chú/Link: {task.note}</div>}
                            </div>
                            <div className="shrink-0 flex items-center justify-end">
                              <span className={`px-2 py-1 rounded font-black text-[9px] ${task.status === 'DONE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : task.status === 'DOING' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-slate-950 text-slate-500 border border-slate-800'}`}>
                                {task.status === 'DONE' ? '✓ DONE' : task.status === 'DOING' ? '⚡ DOING' : '⏳ TODO'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL KHỞI TẠO DỰ ÁN MỚI */}
      {showModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-3xl space-y-4 text-xs text-slate-200 max-h-[90vh] overflow-y-auto shadow-2xl animate-fadeIn">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-blue-500 uppercase tracking-wider">Khởi tạo Dự án & Chia giai đoạn</h3>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-slate-500 hover:text-white" /></button>
            </div>
            
            <input type="text" placeholder="Nhập tên dự án tổng..." className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm font-bold text-blue-400 focus:outline-none" value={projectName} onChange={(e) => setProjectName(e.target.value)} />

            <div className="space-y-4">
              {phases.map((p, pIndex) => (
                <div key={pIndex} className="bg-slate-950/40 p-4 border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-500">Giai đoạn {pIndex + 1}:</span>
                    <input type="text" className="bg-slate-950 border border-slate-800 p-2 rounded-lg font-bold text-slate-200 w-1/2 focus:outline-none" placeholder="Tên Phase..." value={p.name} onChange={(e) => updatePhaseName(pIndex, e.target.value)} />
                  </div>
                  
                  <div className="pl-4 border-l-2 border-slate-800 space-y-2">
                    {p.tasks.map((t: any, tIndex: number) => (
                      <div key={tIndex} className="flex flex-col sm:flex-row gap-2">
                        <input type="text" className="flex-1 bg-slate-950 border border-slate-800 p-2 rounded-lg text-slate-200 focus:outline-none" placeholder="Nội dung Task vụ con..." value={t.name} onChange={(e) => updateTask(pIndex, tIndex, 'name', e.target.value)} />
                        <select className="w-full sm:w-48 bg-slate-950 border border-slate-800 p-2 rounded-lg text-slate-400 focus:outline-none cursor-pointer" value={t.assignee} onChange={(e) => updateTask(pIndex, tIndex, 'assignee', e.target.value)}>
                          <option value="">Gán thợ phụ trách...</option>
                          {employees.map(e => <option key={e.full_name} value={e.full_name}>{e.full_name}</option>)}
                        </select>
                      </div>
                    ))}
                    <button onClick={() => addTask(pIndex)} className="text-[10px] text-blue-400 font-bold hover:text-blue-300 flex items-center gap-1">+ Thêm Task vụ con</button>
                  </div>
                </div>
              ))}
              <button onClick={addPhase} className="w-full border border-dashed border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-500 p-3 rounded-xl font-bold transition flex justify-center items-center gap-1">+ Bổ sung Giai đoạn mới</button>
            </div>

            <div className="pt-3 border-t border-slate-800 flex gap-2 font-sans">
              <button onClick={() => setShowModal(false)} className="flex-1 bg-slate-950 border border-slate-800 p-3 rounded-xl font-bold text-slate-400 hover:bg-slate-850">Hủy</button>
              <button onClick={handleCreateProject} className="flex-1 bg-blue-600 text-white font-bold p-3 rounded-xl hover:bg-blue-700 shadow-lg">Khởi Tạo Dây Chuyền</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}