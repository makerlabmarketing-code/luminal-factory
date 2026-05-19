// app/admin/employees/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { UserCheck, Search, Shield, ChevronLeft, ChevronRight, Edit2, Copy, Users, UserPlus, Eye, X, FileText, Trash2, RefreshCcw } from 'lucide-react';

export default function AdminEmployeesManagement() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [jobPositions, setJobPositions] = useState<any[]>([]); // Data lấy từ DB Metadata
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // States cho Popup
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  // States dữ liệu form (FULL OPTION)
  const [targetId, setTargetId] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [cccd, setCccd] = useState('');
  const [driveCccd, setDriveCccd] = useState('');
  const [driveContract, setDriveContract] = useState('');
  const [title, setTitle] = useState('');
  const [level, setLevel] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [role, setRole] = useState('STAFF'); 

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; 

  const loadData = async () => {
    setLoading(true);
    // 1. Kéo nhân sự
    const { data: emps } = await supabase.from('employees').select('*').order('id', { ascending: true });
    setEmployees(emps || []);

    // 2. Kéo Metadata vị trí & lương từ DB
    const { data: meta } = await supabase.from('system_metadata').select('data').eq('name', 'Mức lương cơ bản & Cấp bậc').maybeSingle();
    if (meta && meta.data) {
      setJobPositions(meta.data);
      if (meta.data.length > 0) {
        setTitle(meta.data[0].title);
        setLevel(meta.data[0].level);
      }
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  // Lọc và Phân trang
  const filtered = employees.filter(e => e.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || (e.email && e.email.toLowerCase().includes(searchTerm.toLowerCase())));
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Lọc ra danh sách chức danh duy nhất (Unique Titles)
  const uniqueTitles = Array.from(new Set(jobPositions.map(p => p.title)));
  // Lọc ra các level khả dụng cho chức danh đang chọn
  const availableLevels = jobPositions.filter(p => p.title === title).map(p => p.level);

  // Auto-set level đầu tiên khi đổi chức danh
  useEffect(() => {
    if (title && availableLevels.length > 0 && !availableLevels.includes(level)) {
      setLevel(availableLevels[0]);
    }
  }, [title]);

  const handleOpenAdd = () => {
    setIsEditing(false); setTargetId(''); setFullName(''); setEmail(''); setPhone(''); setAddress(''); setCccd(''); setDriveCccd(''); setDriveContract(''); setStatus('ACTIVE'); setRole('STAFF'); 
    if (uniqueTitles.length > 0) setTitle(uniqueTitles[0]);
    setShowModal(true);
  };

  const handleOpenEdit = (emp: any) => {
    setIsEditing(true); setTargetId(emp.id); setFullName(emp.full_name); setEmail(emp.email); setPhone(emp.phone || ''); setAddress(emp.address || ''); setCccd(emp.cccd || ''); setDriveCccd(emp.drive_cccd || ''); setDriveContract(emp.drive_contract || ''); setTitle(emp.title); setLevel(emp.level || 'A1'); setStatus(emp.status || 'ACTIVE'); setRole(emp.role || 'STAFF'); 
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('⚠️ Xóa nhân sự này sẽ ảnh hưởng đến các báo cáo liên quan. Sếp có chắc chắn xóa không?')) {
      await supabase.from('employees').delete().eq('id', id);
      loadData();
    }
  };

  const handleSave = async () => {
    if (!fullName) return alert('Vui lòng nhập Tên!');
    const secureGuid = crypto.randomUUID();
    const payload = { full_name: fullName, email, phone, address, cccd, drive_cccd: driveCccd, drive_contract: driveContract, title, level, status, role, qr_token: isEditing ? undefined : secureGuid };
    
    if (isEditing) await supabase.from('employees').update(payload).eq('id', targetId);
    else await supabase.from('employees').insert([payload]);
    
    setShowModal(false); loadData(); alert('Đã cập nhật hồ sơ!');
  };

  if (loading) return <div className="p-6 text-xs text-center font-mono text-slate-500"><RefreshCcw className="w-4 h-4 animate-spin inline" /> Đang tải...</div>;

  return (
    <div className="p-6 space-y-6 text-slate-100 bg-slate-950 min-h-screen font-sans">
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div><h1 className="text-base font-bold flex items-center gap-2"><UserCheck className="w-5 h-5 text-blue-500" /> Quản Lý Hồ Sơ Tổng Hợp</h1></div>
        <button onClick={handleOpenAdd} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition"><UserPlus className="w-4 h-4" /> Tạo Nhân Sự</button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2"><Users className="w-4 h-4 text-blue-400" /><h3 className="text-xs font-bold uppercase text-slate-200">Danh Sách Nhân Sự</h3></div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input type="text" placeholder="Tìm tên, email..." className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
          </div>
        </div>

        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-500 border-b border-slate-800 uppercase text-[10px]"><tr><th className="p-4">Họ Tên & Email</th><th className="p-4">Phân quyền / Vị trí</th><th className="p-4 text-right">Thao tác</th></tr></thead>
          <tbody className="divide-y divide-slate-800/60">
            {currentData.length === 0 ? <tr><td colSpan={3} className="p-8 text-center text-slate-500 font-mono">Không tìm thấy dữ liệu.</td></tr> : currentData.map(emp => (
              <tr key={emp.id} className="hover:bg-slate-950/40">
                <td className="p-4 font-bold text-slate-200">{emp.full_name} <span className={`ml-2 px-1.5 py-0.5 rounded text-[8px] uppercase ${emp.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{emp.status}</span><br/><span className="text-[10px] text-slate-500 font-mono">{emp.email}</span></td>
                <td className="p-4">{emp.role === 'ADMIN' ? <span className="text-red-400 font-bold bg-red-500/10 px-2 py-0.5 rounded-md inline-flex items-center gap-1"><Shield className="w-3 h-3" /> Quản lý ({emp.title})</span> : <span className="text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded-md">Nhân sự ({emp.title} - {emp.level})</span>}</td>
                <td className="p-4 text-right space-x-2">
                  <button onClick={() => setShowDetailModal(emp)} className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400"><Eye className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleOpenEdit(emp)} className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-blue-400"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/staff/${emp.qr_token}/tasks`); alert('Đã copy link!'); }} className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-amber-400"><Copy className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(emp.id)} className="p-1.5 bg-slate-950 hover:bg-red-950/40 border border-slate-800 rounded-lg text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {totalPages > 1 && (
          <div className="flex justify-between items-center p-4 bg-slate-950/50 border-t border-slate-800">
            <span className="text-[10px] text-slate-500 font-mono">Trang {currentPage} / {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 bg-slate-900 border border-slate-700 rounded-lg"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 bg-slate-900 border border-slate-700 rounded-lg"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* POPUP THÊM/SỬA FULL OPTION */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-2xl space-y-4 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3"><h3 className="font-bold text-slate-200 uppercase">{isEditing ? 'Cập nhật hồ sơ' : 'Thêm hồ sơ mới'}</h3><button onClick={() => setShowModal(false)}><X className="w-4 h-4 text-slate-500" /></button></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="text-slate-400 font-bold">Họ Tên:</label><input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 mt-1 focus:outline-none" value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
              <div><label className="text-slate-400 font-bold">Email:</label><input type="email" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 mt-1 focus:outline-none" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div><label className="text-slate-400 font-bold">SĐT:</label><input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 mt-1 focus:outline-none" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
              <div><label className="text-slate-400 font-bold">CCCD:</label><input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 mt-1 focus:outline-none" value={cccd} onChange={(e) => setCccd(e.target.value)} /></div>
              <div className="sm:col-span-2"><label className="text-slate-400 font-bold">Địa chỉ:</label><input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 mt-1 focus:outline-none" value={address} onChange={(e) => setAddress(e.target.value)} /></div>
              
              {/* CHỌN VỊ TRÍ TỪ DB */}
              <div><label className="text-slate-400 font-bold text-blue-400">Vị trí (Từ Metadata):</label>
                <select className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 mt-1 focus:outline-none text-blue-300 font-bold" value={title} onChange={(e) => setTitle(e.target.value)}>
                  {uniqueTitles.map((t: any) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div><label className="text-slate-400 font-bold text-amber-400">Cấp độ Level:</label>
                <select className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 mt-1 focus:outline-none text-amber-300 font-mono font-bold" value={level} onChange={(e) => setLevel(e.target.value)}>
                  {availableLevels.map((l: any) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              <div><label className="text-slate-400 font-bold">Quyền hạn:</label><select className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 mt-1 focus:outline-none" value={role} onChange={(e) => setRole(e.target.value)}><option value="STAFF">Nhân sự (STAFF)</option><option value="ADMIN">Quản lý (ADMIN)</option></select></div>
              <div><label className="text-slate-400 font-bold">Trạng thái:</label><select className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 mt-1 focus:outline-none" value={status} onChange={(e) => setStatus(e.target.value)}><option value="ACTIVE">Hoạt động</option><option value="LOCK">Đình chỉ</option></select></div>
              <div className="sm:col-span-2"><label className="text-slate-400 font-bold">Link Drive Ảnh CCCD:</label><input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 mt-1 text-blue-400 font-mono focus:outline-none" value={driveCccd} onChange={(e) => setDriveCccd(e.target.value)} /></div>
              <div className="sm:col-span-2"><label className="text-slate-400 font-bold">Link Drive Hợp Đồng:</label><input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 mt-1 text-blue-400 font-mono focus:outline-none" value={driveContract} onChange={(e) => setDriveContract(e.target.value)} /></div>
            </div>
            <button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-700 font-bold p-3 rounded-xl uppercase tracking-wider text-white mt-4 shadow-lg shadow-blue-900/50">Lưu Hồ Sơ</button>
          </div>
        </div>
      )}

      {/* POPUP CHI TIẾT (Giữ nguyên gọn gàng) */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm space-y-4 relative text-xs">
            <button onClick={() => setShowDetailModal(null)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
            <h3 className="font-bold text-blue-400 border-b border-slate-800 pb-2">📁 Chi Tiết: {showDetailModal.full_name}</h3>
            <div className="space-y-3">
              <p><span className="text-slate-500">📍 Đ/C:</span> <span className="text-slate-200">{showDetailModal.address}</span></p>
              <p><span className="text-slate-500">📞 SĐT:</span> <span className="text-slate-200 font-mono">{showDetailModal.phone}</span></p>
              <p><span className="text-slate-500">🪪 CCCD:</span> <span className="text-slate-200 font-mono">{showDetailModal.cccd}</span></p>
              <div className="pt-2 flex flex-col gap-2">
                {showDetailModal.drive_cccd && <a href={showDetailModal.drive_cccd} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> Ảnh CCCD</a>}
                {showDetailModal.drive_contract && <a href={showDetailModal.drive_contract} target="_blank" rel="noreferrer" className="text-amber-400 hover:underline flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> Hợp đồng</a>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}