// app/admin/tasks/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ClipboardList, Plus, ExternalLink, User, Layers } from 'lucide-react';

interface Project { id: string; project_name: string; drive_url: string; status: string; }
interface Employee { id: string; full_name: string; }

export default function AdminTasksAssignmentPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  // Inputs form
  const [pName, setPName] = useState('');
  const [driveUrl, setDriveUrl] = useState('');
  const [selectedEmp, setSelectedEmp] = useState('');
  const [taskName, setTaskName] = useState('In 3D phôi Resin (Máy Elegoo)');

  const loadData = async () => {
    const { data: p } = await supabase.from('projects').select('*').order('id', { ascending: false });
    setProjects(p || []);
    const { data: e } = await supabase.from('employees').select('id, full_name').eq('is_active', true);
    setEmployees(e || []);
    if (e && e.length > 0) setSelectedEmp(e[0].id);
  };

  useEffect(() => { loadData(); }, []);

  const handleCreateProject = async () => {
    if (!pName.trim()) return;
    const { error } = await supabase.from('projects').insert([{ project_name: pName.trim(), drive_url: driveUrl.trim() }]);
    if (!error) { alert('Đã tạo bộ Concept Keycap mới!'); setPName(''); setDriveUrl(''); loadData(); }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-100">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
        <ClipboardList className="w-5 h-5 text-blue-500" />
        <div>
          <h1 className="text-base font-bold">Trung Tâm Điều Phối Sản Xuất & Gán Việc</h1>
          <p className="text-[11px] text-slate-400">Khởi tạo bộ sản phẩm mẫu (Meowhe, Lollipop), gán ảnh vẽ phối màu 2D</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CỘT TRÁI: KHỞI TẠO BỘ BẢN VẼ CONCEPT */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 h-fit">
          <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5"><Layers className="w-4 h-4 text-emerald-400" /> Tạo Bộ Bản Vẽ Mới</h3>
          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold">Tên bộ sản phẩm (Ví dụ: Meowhe v1, Lollipop):</label>
              <input type="text" className="mt-1.5 block w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 focus:outline-none" placeholder="Nhập tên..." value={pName} onChange={(e) => setPName(e.target.value)} />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold">Đường dẫn thư mục ảnh phối màu 2D (Google Drive):</label>
              <input type="text" className="mt-1.5 block w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 focus:outline-none font-mono text-blue-400" placeholder="https://drive.google.com/..." value={driveUrl} onChange={(e) => setDriveUrl(e.target.value)} />
            </div>
            <button onClick={handleCreateProject} className="w-full bg-blue-600 hover:bg-blue-700 font-bold p-2.5 rounded-xl flex items-center justify-center gap-1.5 transition"><Plus className="w-4 h-4" /> Kích hoạt dự án phôi</button>
          </div>
        </div>

        {/* CỘT GIỮA VÀ PHẢI: DANH SÁCH SẢN PHẨM ĐANG CHẾ TÁC */}
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Danh mục các bộ đang sản xuất trong xưởng</h3>
          <div className="space-y-3">
            {projects.map(p => (
              <div key={p.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-200">{p.project_name}</h4>
                  {p.drive_url && (
                    <a href={p.drive_url} target="_blank" rel="noreferrer" className="text-[11px] text-blue-400 hover:underline flex items-center gap-1 mt-1 font-mono">
                      <ExternalLink className="w-3 h-3" /> Xem bản vẽ thiết kế màu 2D trên Drive
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select className="bg-slate-900 border border-slate-800 text-xs p-2 rounded-xl focus:outline-none flex-1 sm:flex-none" value={selectedEmp} onChange={(e) => setSelectedEmp(e.target.value)}>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                  </select>
                  <button onClick={() => alert('Đã phân bổ lệnh gán công đoạn kỹ thuật thành công tới máy nhân viên!')} className="bg-emerald-600 text-white font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1"><User className="w-3.5 h-3.5" /> Gán việc</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}