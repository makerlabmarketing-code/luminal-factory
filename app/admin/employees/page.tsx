// app/admin/employees/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, UserPlus, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Edit2, Trash2, X, RefreshCcw, Eye } from 'lucide-react';

export default function AdminEmployeesManagement() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [jobRelations, setJobRelations] = useState<any[]>([]); 
  const [dbBanks, setDbBanks] = useState<any[]>([]); 
  const [dbRoles, setDbRoles] = useState<any[]>([]);
  const [dbStatuses, setDbStatuses] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // States phân trang kiểu mẫu doanh nghiệp hàng loạt
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pageInput, setPageInput] = useState('1');

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form States
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
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: emps } = await supabase.from('employees').select('*').order('id', { ascending: true });
      setEmployees(emps || []);

      const { data: metaJob } = await supabase.from('system_metadata').select('data').eq('name', 'Phân quyền Vị trí & Cấp bậc').maybeSingle();
      if (metaJob?.data) setJobRelations(metaJob.data);

      const { data: metaBank } = await supabase.from('system_metadata').select('data').eq('name', 'Danh sách ngân hàng').maybeSingle();
      if (metaBank?.data) setDbBanks(metaBank.data);

      const { data: metaRole } = await supabase.from('system_metadata').select('data').eq('name', 'Quyền hạn nhân sự').maybeSingle();
      if (metaRole?.data) setDbRoles(metaRole.data);

      const { data: metaStatus } = await supabase.from('system_metadata').select('data').eq('name', 'Trạng thái hoạt động').maybeSingle();
      if (metaStatus?.data) setDbStatuses(metaStatus.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filtered = employees.filter(e => 
    (e.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (e.email && e.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (e.title && e.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const currentData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const uniqueTitles = Array.from(new Set(jobRelations.map(p => p.title)));
  const availableLevels = jobRelations.filter(p => p.title === title).map(p => p.level);

  useEffect(() => {
    if (title && availableLevels.length > 0 && !availableLevels.includes(level)) {
      setLevel(availableLevels[0]);
    }
  }, [title, availableLevels, level]);

  const handleOpenAdd = () => {
    setIsEditing(false); setTargetId(''); setFullName(''); setEmail(''); setPhone(''); setAddress(''); setCccd(''); 
    setDriveCccd(''); setDriveContract(''); setStatus('ACTIVE'); setRole('STAFF'); setBankName(''); setBankAccountNumber('');
    if (uniqueTitles.length > 0) setTitle(uniqueTitles[0]);
    setShowModal(true);
  };

  const handleOpenEdit = (emp: any) => {
    setIsEditing(true); setTargetId(emp.id); setFullName(emp.full_name || ''); setEmail(emp.email || ''); 
    setPhone(emp.phone || ''); setAddress(emp.address || ''); setCccd(emp.cccd || ''); 
    setDriveCccd(emp.drive_cccd || ''); setDriveContract(emp.drive_contract || ''); 
    setTitle(emp.title || ''); setLevel(emp.level || 'A1'); setStatus(emp.status || 'ACTIVE'); setRole(emp.role || 'STAFF'); 
    setBankName(emp.bank_name || ''); setBankAccountNumber(emp.bank_account_number || '');
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('⚠️ Sếp có muốn xóa vĩnh viễn hồ sơ nhân sự này?')) {
      await supabase.from('employees').delete().eq('id', id);
      loadData();
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) return alert('Vui lòng nhập họ tên!');
    const payload = { 
      full_name: fullName.trim(), email: email.trim(), phone: phone.trim(), address: address.trim(), cccd: cccd.trim(), 
      drive_cccd: driveCccd.trim(), drive_contract: driveContract.trim(), title, level, status, role,
      bank_name: bankName, bank_account_number: bankAccountNumber.trim(), qr_token: isEditing ? undefined : crypto.randomUUID()
    };
    
    if (isEditing) await supabase.from('employees').update(payload).eq('id', targetId);
    else await supabase.from('employees').insert([payload]);
    
    setShowModal(false); loadData(); alert('✨ Lưu hồ sơ thành công!');
  };

  if (loading) {
    return (
      <div className="p-6 text-xs text-center font-mono text-slate-500 min-h-screen bg-slate-950 flex items-center justify-center gap-2">
        <RefreshCcw className="w-4 h-4 animate-spin inline" />
        <span>Đang đồng bộ danh sách nhân sự...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 text-slate-100 bg-slate-950 min-h-screen">
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <h1 className="text-base font-bold flex items-center gap-2"><Users className="w-5 h-5 text-blue-500" /> Hệ Thống Quản Lý Nhân Sự Xưởng</h1>
        <button onClick={handleOpenAdd} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition"><UserPlus className="w-4 h-4" /> Tạo Nhân Sự</button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/40 flex justify-between items-center">
          <span className="text-xs font-bold uppercase text-slate-200">Danh Sách Điều Hành Nhân Sự</span>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input type="text" placeholder="Tìm tên thợ, vị trí..." className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); setPageInput('1'); }} />
          </div>
        </div>

        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
            <tr><th className="p-4">Họ Tên Thợ</th><th className="p-4">Vị trí chức danh</th><th className="p-4 text-right">Thao tác</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {currentData.length === 0 ? (
              <tr><td colSpan={3} className="p-8 text-center text-slate-500 font-mono">Không có dữ liệu thợ nào khớp bộ lọc.</td></tr>
            ) : currentData.map(emp => (
              <tr key={emp.id} className="hover:bg-slate-950/40 transition">
                <td className="p-4 font-bold text-slate-200">{emp.full_name} <span className={`ml-2 px-1.5 py-0.5 rounded text-[8px] ${emp.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{emp.status}</span><br/><span className="text-[10px] text-slate-500 font-mono">{emp.email}</span></td>
                <td className="p-4"><span className="text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded-md">{emp.title} ({emp.level})</span></td>
                <td className="p-4 text-right space-x-1">
                  <button onClick={() => handleOpenEdit(emp)} className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-blue-400"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(emp.id)} className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* THANH PHÂN TRANG CHUẨN DOANH NGHIỆP 100% THEO IMAGE_CBEB6A.PNG */}
        <div className="p-4 bg-slate-950/50 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-mono text-slate-400 select-none">
          <div>Total <span className="text-blue-400 font-bold">{filtered.length}</span> items</div>
          <div className="flex flex-wrap items-center justify-end gap-4 w-full md:w-auto">
            <div className="flex items-center gap-1.5">
              <span>Show rows:</span>
              <select className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 font-bold text-slate-200 focus:outline-none" value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); setPageInput('1'); }}>
                <option value={5}>5</option><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button onClick={() => { setCurrentPage(1); setPageInput('1'); }} disabled={currentPage === 1} className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg disabled:opacity-20 hover:bg-slate-800 transition"><ChevronsLeft className="w-4 h-4 text-slate-300" /></button>
              <button onClick={() => { const p = Math.max(1, currentPage - 1); setCurrentPage(p); setPageInput(String(p)); }} disabled={currentPage === 1} className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg disabled:opacity-20 hover:bg-slate-800 transition"><ChevronLeft className="w-4 h-4 text-slate-300" /></button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button key={page} onClick={() => { setCurrentPage(page); setPageInput(String(page)); }} className={`w-7 h-7 rounded-lg font-black transition text-[11px] ${currentPage === page ? 'bg-red-600 text-white shadow-md' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800'}`}>{page}</button>
              ))}
              <button onClick={() => { const p = Math.min(totalPages, currentPage + 1); setCurrentPage(p); setPageInput(String(p)); }} disabled={currentPage === totalPages} className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg disabled:opacity-20 hover:bg-slate-800 transition"><ChevronRight className="w-4 h-4 text-slate-300" /></button>
              <button onClick={() => { setCurrentPage(totalPages); setPageInput(String(totalPages)); }} disabled={currentPage === totalPages} className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg disabled:opacity-20 hover:bg-slate-800 transition"><ChevronsRight className="w-4 h-4 text-slate-300" /></button>
            </div>

            <div className="flex items-center gap-1.5">
              <input type="number" min={1} max={totalPages} className="w-12 bg-slate-900 border border-slate-800 rounded-lg p-1 text-center font-bold text-slate-100" value={pageInput} onChange={(e) => setPageInput(e.target.value)} />
              <button onClick={() => { const p = Number(pageInput); if (p >= 1 && p <= totalPages) setCurrentPage(p); }} className="bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg font-black hover:bg-slate-800 text-slate-200 transition">Go</button>
            </div>
          </div>
        </div>

      </div>

      {/* POPUP FORM */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-xl space-y-4 max-h-[85vh] overflow-y-auto text-xs text-slate-200">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2"><h3 className="font-bold text-blue-500 uppercase">{isEditing ? 'Sửa hồ sơ' : 'Thêm hồ sơ'}</h3><button onClick={() => setShowModal(false)}><X className="w-4 h-4" /></button></div>
            <div className="space-y-4">
              <div className="bg-slate-950/40 p-4 border border-slate-800 rounded-2xl grid grid-cols-2 gap-3">
                <div className="col-span-2 font-bold text-slate-400 uppercase text-[9px]">1. Thông tin cơ bản</div>
                <div><label>Họ Tên Thợ:</label><input type="text" className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 mt-1" value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
                <div><label>Email:</label><input type="email" className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 mt-1" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              </div>
              <div className="bg-slate-950/40 p-4 border border-slate-800 rounded-2xl grid grid-cols-2 gap-3">
                <div className="col-span-2 font-bold text-slate-400 uppercase text-[9px]">2. Vị trí & Chức vụ</div>
                <div><label>Vị trí:</label><select className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 mt-1" value={title} onChange={(e) => setTitle(e.target.value)}>{uniqueTitles.map((t: any) => <option key={t} value={t}>{t}</option>)}</select></div>
                <div><label>Cấp độ Level:</label><select className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 mt-1" value={level} onChange={(e) => setLevel(e.target.value)}>{availableLevels.map((l: any) => <option key={l} value={l}>{l}</option>)}</select></div>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-800 flex gap-2">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-950 border border-slate-800 p-3 rounded-xl font-bold text-slate-400 text-center">Hủy</button>
              <button type="button" onClick={handleSave} className="flex-1 bg-blue-600 text-white font-black p-3 rounded-xl">Lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}