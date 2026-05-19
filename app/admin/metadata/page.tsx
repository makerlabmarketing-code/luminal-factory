// app/admin/metadata/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Database, Plus, Trash2, Save, RefreshCcw, Layers } from 'lucide-react';

export default function MetadataManagement() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCatName, setNewCatName] = useState('');

  const loadMetadata = async () => {
    setLoading(true);
    const { data } = await supabase.from('system_metadata').select('*').order('id', { ascending: true });
    setCategories(data || []);
    setLoading(false);
  };

  useEffect(() => { loadMetadata(); }, []);

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    await supabase.from('system_metadata').insert([{ name: newCatName.trim(), data: [] }]);
    setNewCatName('');
    loadMetadata();
  };

  const handleAddRow = (catId: number) => {
    setCategories(categories.map(c => c.id === catId ? {
      ...c, data: [...c.data, { title: 'Tên vị trí mới', level: 'A1', rate: 30000 }]
    } : c));
  };

  const handleUpdateRow = (catId: number, index: number, field: string, value: any) => {
    setCategories(categories.map(c => {
      if (c.id === catId) {
        const newData = [...c.data];
        newData[index] = { ...newData[index], [field]: field === 'rate' ? Number(value) : value };
        return { ...c, data: newData };
      }
      return c;
    }));
  };

  const handleSaveCategory = async (cat: any) => {
    await supabase.from('system_metadata').update({ data: cat.data }).eq('id', cat.id);
    alert(`Đã lưu cấu trúc dữ liệu JSON cho danh mục [${cat.name}] thành công!`);
  };

  if (loading) return <div className="p-6 text-xs text-center font-mono text-slate-500"><RefreshCcw className="w-4 h-4 animate-spin inline mr-2" /> Đang đồng bộ DB...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 text-slate-100 font-sans">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
        <Layers className="w-5 h-5 text-purple-400" />
        <div>
          <h1 className="text-base font-bold">Hệ Thống Danh Mục Metadata (Dữ liệu DB động)</h1>
          <p className="text-[11px] text-slate-400">Không lo lỗi ổ đĩa - Lưu trữ JSON trực tiếp trong cơ sở dữ liệu đám mây</p>
        </div>
      </div>

      <div className="flex gap-2 bg-slate-900 p-3 rounded-xl border border-slate-800">
        <input 
          type="text" 
          placeholder="Tên danh mục cấu hình mới..." 
          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none"
          value={newCatName}
          onChange={(e) => setNewCatName(e.target.value)}
        />
        <button onClick={handleCreateCategory} className="bg-purple-600 hover:bg-purple-700 text-xs px-3 py-2 rounded-lg font-bold flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Thêm danh mục</button>
      </div>

      <div className="space-y-6">
        {categories.map(cat => (
          <div key={cat.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800/60 pb-2">
              <span className="text-xs font-bold text-purple-400">📁 {cat.name}</span>
              <button onClick={() => handleSaveCategory(cat)} className="bg-emerald-600 hover:bg-emerald-700 text-[10px] font-bold px-2 py-1.5 rounded-lg flex items-center gap-1"><Save className="w-3.5 h-3.5" /> Lưu danh mục</button>
            </div>

            <div className="space-y-2">
              {cat.data.map((row: any, idx: number) => (
                <div key={idx} className="grid grid-cols-3 gap-2 bg-slate-950 p-2 rounded-xl border border-slate-900 text-xs">
                  <input type="text" className="bg-slate-900 border border-slate-800 rounded-lg p-1.5" value={row.title} onChange={(e) => handleUpdateRow(cat.id, idx, 'title', e.target.value)} placeholder="Tiêu đề" />
                  <input type="text" className="bg-slate-900 border border-slate-800 rounded-lg p-1.5 font-mono" value={row.level} onChange={(e) => handleUpdateRow(cat.id, idx, 'level', e.target.value)} placeholder="Cấp bậc" />
                  <input type="number" className="bg-slate-900 border border-slate-800 rounded-lg p-1.5 font-mono text-amber-400 font-bold" value={row.rate} onChange={(e) => handleUpdateRow(cat.id, idx, 'rate', e.target.value)} placeholder="Định mức lương" />
                </div>
              ))}
            </div>
            <button onClick={() => handleAddRow(cat.id)} className="text-[11px] font-bold text-purple-400 flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Thêm dòng dữ liệu</button>
          </div>
        ))}
      </div>
    </div>
  );
}