// app/admin/employees/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { UserCheck, Search, Shield, ChevronLeft, ChevronRight, Edit2, Copy, Users, UserPlus, Eye, X, FileText, Trash2, RefreshCcw } from 'lucide-react';

export default function AdminEmployeesManagement() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [jobRelations, setJobRelations] = useState<any[]>([]); 
  const [dbBanks, setDbBanks] = useState<any[]>([]); 
  const [dbRoles, setDbRoles] = useState<any[]>([]);
  const [dbStatuses, setDbStatuses] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState<any>(null);
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

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; 

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
    (e.email && e.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const currentData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

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
    if (window.confirm('⚠️ Xóa thợ này khỏi xưởng?')) {
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
    
    setShowModal(false); loadData(); alert('✨ Đồng bộ hồ sơ nhân sự thành công!');
  };

  if (loading) return <div className="p-6 text-xs font-mono text-slate-500"><RefreshCcw className="w-4 h-4 animate-spin inline mr-2" /> Đang load danh sách...</div>;

  return (
    <div className="p-6 space-y-6 text-slate-100 bg-slate-950 min-h-screen">
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-base font-bold flex items-center gap-2"><Users className="w-5 h-5 text-blue-500" /> Hồ Sơ Nhân Sự Chuỗi</h1>
        </div>
        <button onClick={handleOpenAdd} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition"><UserPlus className="w-4 h-4" /> Tạo Nhân Sự</button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/40 flex justify-between items-center">
          <span className="text-xs font-bold uppercase text-slate-200">Danh Sách Điều Hành</span>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input type="text" placeholder="Tìm kiếm nhanh..." className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
            <tr><th className="p-4">Họ Tên Thợ</th><th className="p-4">Vị trí chức danh</th><th className="p-4 text-right">Thao tác</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {currentData.map(emp => (
              <tr key={emp.id} className="hover:bg-slate-950/40 transition">
                <td className="p-4 font-bold text-slate-200">{emp.full_name} <span className={`ml-2 px-1.5 py-0.5 rounded text-[8px] ${emp.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{emp.status}</span><br/><span className="text-[10px] text-slate-500 font-mono">{emp.email}</span></td>
                <td className="p-4"><span className="text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded-md">{emp.title} ({emp.level})</span></td>
                <td className="p-4 text-right space-x-1">
                  <button onClick={() => setShowDetailModal(emp)} className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-400"><Eye className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleOpenEdit(emp)} className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-blue-400"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(emp.id)} className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* POPUP THÊM MỚI / CẬP NHẬT BIẾN ĐỔI THEO DANH MỤC DB */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-2xl space-y-4 max-h-[90vh] overflow-y-auto text-xs text-slate-200">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2"><h3 className="font-bold text-blue-500 uppercase">{isEditing ? 'Cập nhật' : 'Thêm mới'}</h3><button onClick={() => setShowModal(false)}><X className="w-4 h-4" /></button></div>
            <div className="space-y-4">
              <div className="bg-slate-950/40 p-4 border border-slate-800/80 rounded-2xl grid grid-cols-2 gap-3">
                <div className="col-span-2 font-bold text-slate-400 uppercase text-[9px] tracking-wider">1. Lý lịch cá nhân</div>
                <div><label>Họ Tên Thợ:</label><input type="text" className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 mt-1" value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
                <div><label>Email:</label><input type="email" className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 mt-1" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              </div>
              
              <div className="bg-slate-950/40 p-4 border border-slate-800/80 rounded-2xl grid grid-cols-2 gap-3">
                <div className="col-span-2 font-bold text-slate-400 uppercase text-[9px] tracking-wider">2. Vị trí & Quyền hạn (Từ DB Metadata)</div>
                <div><label>Chức danh:</label><select className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 mt-1" value={title} onChange={(e) => setTitle(e.target.value)}>{uniqueTitles.map((t: any) => <option key={t} value={t}>{t}</option>)}</select></div>
                <div><label>Cấp độ Level:</label><select className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 mt-1" value={level} onChange={(e) => setLevel(e.target.value)}>{availableLevels.map((l: any) => <option key={l} value={l}>{l}</option>)}</select></div>
                <div><label>Phân quyền cốt lõi:</label><select className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 mt-1 text-amber-400 font-bold" value={role} onChange={(e) => setRole(e.target.value)}>{dbRoles.map((r: any) => <option key={r.code} value={r.code}>{r.label}</option>)}</select></div>
                <div><label>Trạng thái hoạt động:</label><select className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 mt-1 text-emerald-400 font-bold" value={status} onChange={(e) => setStatus(e.target.value)}>{dbStatuses.map((s: any) => <option key={s.code} value={s.code}>{s.label}</option>)}</select></div>
              </div>

              <div className="bg-slate-950/60 p-4 border border-cyan-500/20 rounded-2xl grid grid-cols-2 gap-3">
                <div className="col-span-2 font-bold text-cyan-400 uppercase text-[9px] tracking-wider">3. Cổng thanh toán kết nối</div>
                <div><label>Ngân hàng hoàn chi:</label><select className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 mt-1" value={bankName} onChange={(e) => setBankName(e.target.value)}><option value="">Chọn</option>{dbBanks.map((b: any) => <option key={b.code} value={b.code}>{b.name}</option>)}</select></div>
                <div><label>Số tài khoản:</label><input type="text" className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 mt-1 font-mono" value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} /></div>
              </div>
            </div>
            <button onClick={handleSave} className="w-full bg-blue-600 p-3 rounded-xl font-bold uppercase text-white mt-4">Đồng bộ lưu trữ hồ sơ</button>
          </div>
        </div>
      )}
    </div>
  );
}