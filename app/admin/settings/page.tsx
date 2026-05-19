// app/admin/settings/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Settings, Mail, MapPin, Save, RefreshCcw, ChevronDown, ChevronUp, Plus, Trash2, Sliders, Database } from 'lucide-react';

interface MetadataRow { title: string; level: string; rate: number; }
interface MetadataGroup { type: number; name: string; data: MetadataRow[]; }

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>('metadata');

  // SQL Cloud States
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [lat, setLat] = useState('21.0285');
  const [lng, setLng] = useState('105.8542');
  const [radius, setRadius] = useState('15');

  // FILE JSON TĨNH DYNAMIC STATES
  const [metadataGroups, setMetadataGroups] = useState<MetadataGroup[]>([]);
  const [newGroupName, setNewGroupName] = useState('');

  const loadAllConfig = async () => {
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
      });

      const res = await fetch('/api/admin/config');
      const json = await res.json();
      setMetadataGroups(Array.isArray(json) ? json : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadAllConfig(); }, []);

  // ENGINE XỬ LÝ METADATA TỰ ĐỘNG CONVERT
  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;
    const nextType = metadataGroups.length > 0 ? Math.max(...metadataGroups.map(g => g.type)) + 1 : 1;
    setMetadataGroups([...metadataGroups, { type: nextType, name: newGroupName.trim(), data: [] }]);
    setNewGroupName('');
  };

  const handleAddRow = (typeId: number) => {
    setMetadataGroups(metadataGroups.map(g => g.type === typeId ? { ...g, data: [...g.data, { title: 'Vị trí mới', level: 'A1', rate: 30000 }] } : g));
  };

  const handleUpdateRow = (typeId: number, index: number, field: keyof MetadataRow, val: any) => {
    setMetadataGroups(metadataGroups.map(g => {
      if (g.type === typeId) {
        const d = [...g.data];
        d[index] = { ...d[index], [field]: field === 'rate' ? Number(val) : val };
        return { ...g, data: d };
      }
      return g;
    }));
  };

  const handleRemoveRow = (typeId: number, index: number) => {
    setMetadataGroups(metadataGroups.map(g => g.type === typeId ? { ...g, data: g.data.filter((_, i) => i !== index) } : g));
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const sqlBatch = [
        { key: 'smtp_host', value: smtpHost }, { key: 'smtp_port', value: smtpPort },
        { key: 'smtp_user', value: smtpUser }, { key: 'smtp_pass', value: smtpPass },
        { key: 'studio_lat', value: lat }, { key: 'studio_lng', value: lng },
        { key: 'studio_radius', value: radius }
      ];
      await supabase.from('system_settings').upsert(sqlBatch, { onConflict: 'key' });

      // Lệnh gọi API ghi đè dữ liệu xuống file tĩnh JSON trên ổ đĩa
      await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metadataGroups)
      });

      alert('Đã đồng bộ tối ưu dữ liệu SQL Cloud và lưu đè tệp tin cấu hình JSON thành công!');
    } catch (e) { alert('Lỗi lưu trữ!'); }
    finally { setIsSaving(false); }
  };

  if (loading) return <div className="p-6 text-xs font-mono text-center text-slate-500"><RefreshCcw className="w-4 h-4 animate-spin inline mr-2" /> Đang chuẩn hóa tệp tin cấu hình...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 text-slate-100 bg-slate-950 min-h-screen font-sans">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
        <Settings className="w-5 h-5 text-blue-500" />
        <div>
          <h1 className="text-base font-bold">Cấu Hùng Trung Tâm Điều Hành</h1>
          <p className="text-[11px] text-slate-400 mt-0.5">Quản lý đóng gói phân mảnh tệp dữ liệu Metadata và bảo mật xưởng</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* KHỐI CHUYỂN ĐỔI METADATA TỰ ĐỘNG DẠNG DROPDOWN */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <button onClick={() => setOpenSection(openSection === 'metadata' ? null : 'metadata')} className="w-full flex justify-between items-center p-5 hover:bg-slate-800/20 text-left focus:outline-none">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600/10 text-blue-400 rounded-xl"><Database className="w-4 h-4" /></div>
              <div>
                <span className="text-xs font-bold text-slate-200 block">1. Cấu Hình Ma Trận Cấp Bậc & Định Mức (Convert File JSON Tĩnh)</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Giao diện tự động convert tệp và ghi đè trực tiếp xuống ổ đĩa cứng dự án</span>
              </div>
            </div>
            {openSection === 'metadata' ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>

          {openSection === 'metadata' && (
            <div className="p-5 bg-slate-950/40 border-t border-slate-800/60 space-y-6">
              <div className="flex gap-2 bg-slate-900 p-3 rounded-xl border border-slate-800/60 items-center">
                <input type="text" placeholder="Tên nhóm mới (Ví dụ: Định mức thưởng chuyên cần)..." className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs focus:outline-none text-slate-200" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} />
                <button onClick={handleCreateGroup} className="bg-blue-600 hover:bg-blue-700 font-bold text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 transition"><Plus className="w-3.5 h-3.5" /> Thêm nhóm mới</button>
              </div>

              <div className="space-y-4">
                {metadataGroups.map(group => (
                  <div key={group.type} className="border border-slate-800 bg-slate-900/40 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-800/60 pb-2">
                      <span className="text-xs font-bold text-slate-200 flex items-center gap-2">🛠️ {group.name} <span className="text-[9px] font-mono bg-slate-800 text-slate-500 px-1 py-0.5 rounded">Type: {group.type}</span></span>
                      <button onClick={() => setMetadataGroups(metadataGroups.filter(g => g.type !== group.type))} className="text-slate-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>

                    <div className="space-y-2 text-xs">
                      {group.data.map((row, rIdx) => (
                        <div key={rIdx} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center bg-slate-950/60 p-2 rounded-xl border border-slate-900">
                          <input type="text" className="bg-slate-900 border border-slate-800 rounded-lg p-1.5 focus:outline-none" value={row.title} onChange={(e) => handleUpdateRow(group.type, rIdx, 'title', e.target.value)} placeholder="Vị trí/Title" />
                          <input type="text" className="bg-slate-900 border border-slate-800 rounded-lg p-1.5 focus:outline-none font-mono" value={row.level} onChange={(e) => handleUpdateRow(group.type, rIdx, 'level', e.target.value)} placeholder="Level" />
                          <input type="number" className="bg-slate-900 border border-slate-800 rounded-lg p-1.5 focus:outline-none font-mono text-amber-400 font-bold" value={row.rate} onChange={(e) => handleUpdateRow(group.type, rIdx, 'rate', e.target.value)} placeholder="Định mức giá" />
                          <div className="text-right pr-2"><button onClick={() => handleRemoveRow(group.type, rIdx)} className="text-slate-600 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button></div>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => handleAddRow(group.type)} className="text-[11px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Thêm định mức hàng con</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* KHỐI CŨ GEOFENCING GPS */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <button onClick={() => setOpenSection(openSection === 'gps' ? null : 'gps')} className="w-full flex justify-between items-center p-5 hover:bg-slate-800/20 text-left focus:outline-none">
            <div className="flex items-center gap-3"><div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl"><MapPin className="w-4 h-4" /></div><span className="text-xs font-bold text-slate-200">2. Bản Đồ Định Vị Bảo Mật Xưởng (GPS Geofencing)</span></div>
            {openSection === 'gps' ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>
          {openSection === 'gps' && (
            <div className="p-5 bg-slate-950/50 border-t border-slate-800/60 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div><label className="text-slate-400">Vĩ độ:</label><input type="text" className="mt-2 block w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 font-mono text-slate-300 focus:outline-none" value={lat} onChange={(e) => setLat(e.target.value)} /></div>
              <div><label className="text-slate-400">Kinh độ:</label><input type="text" className="mt-2 block w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 font-mono text-slate-300 focus:outline-none" value={lng} onChange={(e) => setLng(e.target.value)} /></div>
              <div><label className="text-slate-400">Bán kính khoanh vùng (m):</label><input type="number" className="mt-2 block w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 font-mono text-amber-400 font-bold focus:outline-none" value={radius} onChange={(e) => setRadius(e.target.value)} /></div>
            </div>
          )}
        </div>
      </div>

      <div className="pt-4 text-right">
        <button onClick={handleSaveAll} disabled={isSaving} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 text-xs uppercase tracking-wider transition shadow-xl">
          {isSaving ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? 'Đang cập nhật file...' : 'Lưu tất cả cấu hình'}
        </button>
      </div>
    </div>
  );
}