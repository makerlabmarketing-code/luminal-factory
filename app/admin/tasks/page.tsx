// app/admin/tasks/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ClipboardList, Plus, ExternalLink, Layers } from 'lucide-react';

interface Project { id: string; project_name: string; drive_url: string; }

export default function AdminTasksPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [pName, setPName] = useState('');
  const [driveUrl, setDriveUrl] = useState('');

  const loadData = async () => {
    const { data } = await supabase.from('projects').select('*').order('id', { ascending: false });
    setProjects(data || []);
  };
  useEffect(() => { loadData(); }, []);

  const handleCreate = async () => {
    if (!pName.trim()) return;
    await supabase.from('projects').insert([{ project_name: pName.trim(), drive_url: driveUrl.trim() }]);
    setPName(''); setDriveUrl(''); loadData();
    alert('Đã đồng bộ bộ Concept thiết kế mới lên luồng sản xuất!');
  };

  return (
    <div className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-100">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-4"><ClipboardList className="w-5 h-5 text-blue-500" /><h1 className="text-base font-bold">Phân Phối Bản Vẽ & Lệnh Sản Xuất</h1></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 h-fit text-xs">
          <h3 className="font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Layers className="w-4 h-4 text-emerald-400" /> Gán Dự Án Mới</h3>
          <div><label className="text-slate-400 font-medium">Tên bộ sản phẩm (Meowhe, Lollipop):</label><input type="text" className="mt-2 block w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 focus:outline-none" value={pName} onChange={(e) => setPName(e.target.value)} /></div>
          <div><label className="text-slate-400 font-medium">Link thư mục Google Drive ảnh phối màu 2D:</label><input type="text" className="mt-2 block w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 focus:outline-none text-blue-400 font-mono" value={driveUrl} onChange={(e) => setDriveUrl(e.target.value)} /></div>
          <button onClick={handleCreate} className="w-full bg-blue-600 hover:bg-blue-700 font-bold p-2.5 rounded-xl">Kích Hoạt Lệnh</button>
        </div>
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Danh sách phôi bản vẽ đang kích hoạt</h3>
          <div className="space-y-2.5">
            {projects.map(p => (
              <div key={p.id} className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex justify-between items-center text-xs">
                <div><p className="font-bold text-slate-200">{p.project_name}</p>{p.drive_url && <a href={p.drive_url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline flex items-center gap-1 mt-1 font-mono"><ExternalLink className="w-3 h-3" /> Đường dẫn Drive liên kết</a>}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}