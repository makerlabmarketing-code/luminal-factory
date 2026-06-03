// app/admin/capital/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useNotification } from '@/component/NotificationContext';
import { 
  PiggyBank, Calendar, Plus, Wallet, TrendingUp, RefreshCcw, History, 
  CheckCircle2, ArrowUpRight, Edit2, Trash2, X, Save, 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Banknote, QrCode, Search 
} from 'lucide-react';

// Helper functions xử lý tiền tệ
const formatCurrency = (value: string) => {
  if (!value) return '';
  const onlyNumbers = value.replace(/[^0-9]/g, '');
  return onlyNumbers.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const parseCurrency = (value: string) => {
  if (!value) return 0;
  return Number(value.replace(/,/g, ''));
};

export default function AdminFinancialLedger() {
  const { showToast, showConfirm } = useNotification();
  const [ledger, setLedger] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [transactionTypes, setTransactionTypes] = useState<any[]>([]); 
  const [companyBankCode, setCompanyBankCode] = useState<string>('MB'); 
  const [companyBankAccount, setCompanyBankAccount] = useState<string>(''); 
  const [loading, setLoading] = useState(true);
  
  const [monthInput, setMonthInput] = useState(() => {
    const d = new Date(); 
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const selectedMonth = monthInput.split('-').reverse().join('/');

  const [showAddModal, setShowAddModal] = useState(false);

  // Form States
  const [type, setType] = useState('CHI_PHI');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [reporter, setReporter] = useState('');
  const [isPaid, setIsPaid] = useState(false); // Hoàn ứng mặc định là chưa chi trả khi tạo mới

  // Edit States
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editType, setEditType] = useState('CHI_PHI');
  const [editCategory, setEditCategory] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editReporter, setEditReporter] = useState('');
  const [editIsPaid, setEditIsPaid] = useState(false);

  // VietQR States
  const [showQrModal, setShowQrModal] = useState(false);
  const [activeQrUrl, setActiveQrUrl] = useState('');
  const [activeQrTarget, setActiveQrTarget] = useState<any>(null);

  // Pagination & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8); 

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: emps } = await supabase.from('employees').select('*');
      setEmployees(emps || []);
      if (emps && emps.length > 0 && !reporter) setReporter(emps[0].full_name);

      const { data: meta } = await supabase.from('system_metadata').select('data').eq('name', 'Danh mục Nghiệp vụ').maybeSingle();
      if (meta && meta.data) {
        setTransactionTypes(meta.data);
        if (meta.data.length > 0 && !type) setType(meta.data[0].code);
      }

      const { data: setBank } = await supabase.from('system_settings').select('value').eq('key', 'company_bank_code').maybeSingle();
      if (setBank) setCompanyBankCode(setBank.value);

      const { data: setAccount } = await supabase.from('system_settings').select('value').eq('key', 'company_bank_account').maybeSingle();
      if (setAccount) setCompanyBankAccount(setAccount.value);

      const { data: ledgers } = await supabase.from('financial_ledger').select('*').eq('month_period', selectedMonth).order('id', { ascending: false });
      setLedger(ledgers || []);
    } catch (e) { 
      console.error(e); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    setCurrentPage(1);
    loadData(); 
  }, [selectedMonth]);

  const filteredLedger = ledger.filter(l => 
    (l.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.requested_by || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredLedger.length / itemsPerPage) || 1;
  const currentLedgerData = filteredLedger.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleInsertLedger = async () => {
    const numericAmount = parseCurrency(amount);
    if (!category.trim() || !numericAmount) {
      showToast('Thiếu số liệu', 'Vui lòng điền đủ nội dung khoản mục và giá tiền!', 'error');
      return;
    }
    
    try {
      const { error } = await supabase.from('financial_ledger').insert([{ 
        type, 
        category: category.trim(), 
        amount: numericAmount, 
        requested_by: reporter, 
        month_period: selectedMonth, 
        is_paid: isPaid 
      }]);

      if (error) throw error;
      setCategory(''); 
      setAmount(''); 
      setCurrentPage(1); 
      loadData();
      setShowAddModal(false);
      showToast('Ghi sổ thành công', 'Khoản mục tài chính mới đã được đồng bộ.', 'success');
    } catch (err: any) {
      showToast('Thất bại', err.message, 'error');
    }
  };

  const handleOpenEdit = (item: any) => {
    setEditingId(item.id); 
    setEditType(item.type); 
    setEditCategory(item.category); 
    setEditAmount(formatCurrency(item.amount.toString())); 
    setEditReporter(item.requested_by); 
    setEditIsPaid(item.is_paid);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    const numericAmount = parseCurrency(editAmount);
    if (!editCategory.trim() || !numericAmount) {
      showToast('Thiếu số liệu', 'Vui lòng điền đủ thông tin sửa hạch toán!', 'error');
      return;
    }
    if (!editingId) return;

    await supabase.from('financial_ledger').update({
      type: editType, 
      category: editCategory.trim(), 
      amount: numericAmount, 
      requested_by: editReporter, 
      is_paid: editIsPaid
    }).eq('id', editingId);

    setShowEditModal(false); 
    setEditingId(null); 
    loadData();
    showToast('Thành công', 'Đã cập nhật sửa đổi dữ liệu.', 'success');
  };

  const handleTogglePaid = async (id: number, currentStatus: boolean) => {
    await supabase.from('financial_ledger').update({ is_paid: !currentStatus }).eq('id', id);
    setLedger(prev => prev.map(l => l.id === id ? { ...l, is_paid: !currentStatus } : l));
    showToast('Đổi trạng thái', 'Đã cập nhật trạng thái tất toán và tính toán lại dòng tiền quỹ.', 'info');
  };

  const handleInstantPaymentSuccess = async () => {
    if (!activeQrTarget?.id) return;
    const targetId = activeQrTarget.id;

    await supabase.from('financial_ledger').update({ is_paid: true }).eq('id', targetId);
    setLedger(prev => prev.map(l => l.id === targetId ? { ...l, is_paid: true } : l));
    
    setShowQrModal(false); 
    setActiveQrUrl('');
    showToast('Thanh toán xong', 'Đã chuyển hoàn ứng thành CHI PHÍ THỰC TẾ thành công!', 'success');
  };

  const handleDeleteLedger = (id: number) => {
    showConfirm('Xác nhận hủy bỏ', 'Xóa vĩnh viễn dòng tài chính này?', async () => {
      await supabase.from('financial_ledger').delete().eq('id', id);
      setLedger(prev => prev.filter(l => l.id !== id));
      if (currentLedgerData.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      }
      showToast('Đã xóa', 'Đã hủy dòng hạch toán ra khỏi sổ cái.', 'info');
    });
  };

  const handleGenerateVietQR = (item: any) => {
    // Hoàn ứng hoặc chi phí khi chưa trả đều cần quét mã chuyển khoản cho nhân viên nhận tiền hoàn ứng
    if (item.type === 'CHI_PHI' || item.type === 'CHI_TIEU' || item.type === 'HOAN_UNG') {
      const matchedStaff = employees.find(e => e.full_name === item.requested_by);
      if (!matchedStaff || !matchedStaff.bank_account_number || !matchedStaff.bank_name) {
        showToast('Thiếu hồ sơ', `Nhân sự [${item.requested_by}] chưa khai báo số tài khoản!`, 'error');
        return;
      }
      const cleanCategory = encodeURIComponent(item.category);
      const qrUrl = `https://img.vietqr.io/image/${matchedStaff.bank_name}-${matchedStaff.bank_account_number}-compact2.png?amount=${item.amount}&addInfo=${cleanCategory}`;
      setActiveQrUrl(qrUrl);
      setActiveQrTarget({ 
        id: item.id, 
        title: item.type === 'HOAN_UNG' ? '🔄 QUÉT MÃ TẤT TOÁN HOÀN ỨNG CHO NHÂN SỰ' : '❌ QUÉT MÃ THANH TOÁN CHI PHÍ CHO NHÂN SỰ', 
        bankName: matchedStaff.bank_name, 
        accountNo: matchedStaff.bank_account_number, 
        amount: item.amount, 
        category: item.category 
      });
      setShowQrModal(true);
    } 
    // Các trường hợp dòng tiền vào xưởng (Vốn góp, Doanh thu)
    else {
      if (!companyBankAccount) {
        showToast('Thiếu cấu hình', 'Chưa cấu hình tài khoản công ty nhận tiền!', 'error');
        return;
      }
      const prefix = item.type === 'DOANH_THU' ? 'Thu' : 'Gop von';
      const cleanCategory = encodeURIComponent(`${prefix}: ${item.requested_by}`);
      const qrUrl = `https://img.vietqr.io/image/${companyBankCode}-${companyBankAccount}-compact2.png?amount=${item.amount}&addInfo=${cleanCategory}`;
      setActiveQrUrl(qrUrl);
      
      setActiveQrTarget({ 
        id: item.id, 
        title: item.type === 'DOANH_THU' ? '💰 QUÉT MÃ THU TIỀN KHÁCH HÀNG' : '🟢 QUÉT MÃ NỘP VỐN CÔNG TY', 
        bankName: companyBankCode, 
        accountNo: companyBankAccount, 
        amount: item.amount, 
        category: item.category 
      });
      setShowQrModal(true);
    }
  };

  // --- LOGIC HẠCH TOÁN DOANH NGHIỆP ---
  // 1. Vốn đầu tư (chỉ tính dòng đã duyệt)
  const totalGop = ledger.filter(l => l.type === 'VON_GOP' && l.is_paid).reduce((sum, l) => sum + Number(l.amount), 0);
  // 2. Doanh thu (chỉ tính dòng đã thực thu)
  const totalDoanhThu = ledger.filter(l => l.type === 'DOANH_THU' && l.is_paid).reduce((sum, l) => sum + Number(l.amount), 0);
  
  // 3. Tổng chi phí: Gồm có (Mã CHI_PHI đã trả) + (Mã HOAN_UNG đã được Admin chi trả tất toán)
  const totalChiPhi = ledger.filter(l => 
    ((l.type === 'CHI_PHI' || l.type === 'CHI_TIEU' || l.type === 'HOAN_UNG') && l.is_paid)
  ).reduce((sum, l) => sum + Number(l.amount), 0);

  // 4. Khoản Treo Nợ: Bất kỳ dòng tiền nào chưa chuyển khoản/tất toán (is_paid === false)
  const totalTreo = ledger.filter(l => !l.is_paid).reduce((sum, l) => sum + Number(l.amount), 0);
  
  // 5. Số dư tồn quỹ khả dụng = Tổng thu (Góp + Doanh Thu) - Tổng chi (Chi phí + Hoàn ứng đã tất toán)
  const totalRemainingBalance = (totalGop + totalDoanhThu) - totalChiPhi;

  const getTypeLabel = (item: any) => {
    if (item.type === 'HOAN_UNG') {
      // Nếu hoàn ứng đã trả tiền -> Đổi icon hiển thị chuyển dịch sang trạng thái Chi phí để tránh nhầm lẫn
      return item.is_paid ? (
        <><span className="text-red-400">❌</span> <span className="text-slate-400 font-normal line-through text-[10px] mr-1">Hoàn ứng</span> {item.category}</>
      ) : (
        <><span className="text-cyan-400">🔄</span> [Hoàn ứng treo] {item.category}</>
      );
    }
    switch(item.type) {
      case 'CHI_PHI':
      case 'CHI_TIEU': return <><span className="text-red-400">❌</span> {item.category}</>;
      case 'VON_GOP': return <><span className="text-emerald-400">🟢</span> {item.category}</>;
      case 'DOANH_THU': return <><span className="text-yellow-400">💰</span> {item.category}</>;
      default: return item.category;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-100 bg-slate-950 min-h-screen font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-4 gap-4">
        <div>
          <h1 className="text-base font-bold flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-emerald-500" /> Sổ Cái & Quản Lý Giao Dịch
          </h1>
          <p className="text-[11px] text-slate-400 mt-0.5">Quản lý hạch toán đồng bộ dữ liệu hoàn ứng tự động chuyển đổi thành chi phí khi tất toán</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition shadow-lg">
            <Plus className="w-4 h-4" /> Thêm Giao Dịch
          </button>
          <div className="bg-slate-900 border border-slate-800 p-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2">
            Kỳ báo cáo: <input type="month" className="bg-slate-950 border border-slate-800 rounded p-1 text-slate-200 focus:outline-none [color-scheme:dark]" value={monthInput} onChange={(e) => setMonthInput(e.target.value)} />
          </div>
        </div>
      </div>

      {/* METRICS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 text-xs font-bold uppercase tracking-wider select-none">
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex flex-col justify-center">
          <p className="text-slate-500 text-[9px] flex items-center gap-1"><Wallet className="w-3 h-3 text-emerald-500"/> Vốn Đầu Tư</p>
          <p className="text-xs font-black text-emerald-400 mt-1 font-mono">+{totalGop.toLocaleString()}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex flex-col justify-center">
          <p className="text-slate-500 text-[9px] flex items-center gap-1"><ArrowUpRight className="w-3 h-3 text-blue-400"/> Doanh Thu</p>
          <p className="text-xs font-black text-blue-400 mt-1 font-mono">+{totalDoanhThu.toLocaleString()}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex flex-col justify-center">
          <p className="text-slate-500 text-[9px] flex items-center gap-1"><TrendingUp className="w-3 h-3 text-red-400"/> Tổng Chi Phí</p>
          <p className="text-xs font-black text-red-400 mt-1 font-mono">-{totalChiPhi.toLocaleString()}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex flex-col justify-center">
          <p className="text-slate-500 text-[9px] flex items-center gap-1"><History className="w-3 h-3 text-amber-400"/> Khoản Treo Nợ</p>
          <p className="text-xs font-black text-amber-400 mt-1 font-mono">{totalTreo.toLocaleString()}</p>
        </div>
        <div className="bg-slate-900 border-2 border-emerald-500/30 p-3 rounded-2xl flex flex-col justify-center shadow-lg col-span-2 lg:col-span-1">
          <p className="text-emerald-400 text-[9px] flex items-center gap-1"><Banknote className="w-3 h-3"/> Số dư khả dụng</p>
          <p className="text-xs font-black text-emerald-400 mt-1 font-mono">{totalRemainingBalance.toLocaleString()} đ</p>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <span className="text-xs font-bold uppercase text-slate-400">Nhật Ký Hạch Toán Kỳ {selectedMonth}</span>
          <input type="text" placeholder="Tìm kiếm nội dung..." className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none w-full sm:w-64" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 uppercase text-[9px]">
            <tr>
              <th className="p-4">Khoản Mục</th>
              <th className="p-4">Nhân sự thực hiện</th>
              <th className="p-4">Trạng thái quỹ</th>
              <th className="p-4 text-right">Số tiền</th>
              <th className="p-4 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium text-[11px]">
            {currentLedgerData.map(l => (
              <tr key={l.id} className="hover:bg-slate-950/20 transition">
                <td className="p-4 font-bold text-slate-200">
                  {getTypeLabel(l)}
                </td>
                <td className="p-4 text-slate-400">{l.requested_by}</td>
                <td className="p-4">
                  <button onClick={() => handleTogglePaid(l.id, l.is_paid)} className={`px-2 py-1 rounded text-[9px] border font-black ${l.is_paid ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                    {l.is_paid ? 'Đã Trả' : 'Treo nợ'}
                  </button>
                </td>
                <td className="p-4 text-right font-mono font-bold text-slate-200">{Number(l.amount).toLocaleString()} đ</td>
                <td className="p-4 text-center space-x-1">
                  {!l.is_paid && <button onClick={() => handleGenerateVietQR(l)} className="p-1.5 bg-cyan-950 border border-cyan-800 rounded-lg text-cyan-400"><QrCode className="w-3.5 h-3.5"/></button>}
                  <button onClick={() => handleOpenEdit(l)} className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-blue-400"><Edit2 className="w-3.5 h-3.5"/></button>
                  <button onClick={() => handleDeleteLedger(l.id)} className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-red-500"><Trash2 className="w-3.5 h-3.5"/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Pagination Controls */}
        {filteredLedger.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3 bg-slate-950 border-t border-slate-800">
            <span className="text-xs text-slate-500 mb-3 sm:mb-0">
              Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredLedger.length)} trong tổng số {filteredLedger.length} bản ghi
            </span>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition"><ChevronsLeft className="w-4 h-4" /></button>
              <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-xs font-mono font-bold text-slate-300 px-3">{currentPage} / {totalPages}</span>
              <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition"><ChevronRight className="w-4 h-4" /></button>
              <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition"><ChevronsRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* POPUP ADD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm space-y-4 text-xs text-slate-200 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
              <h3 className="font-bold uppercase tracking-wider text-[11px]">Ghi Hạch Toán Sổ Cái Mới</h3>
              <button onClick={() => setShowAddModal(false)}><X className="w-5 h-5"/></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-slate-400">Nghiệp vụ:</label>
                <select className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 mt-1 focus:outline-none" value={type} onChange={e => setType(e.target.value)}>
                  {transactionTypes.map((t: any) => <option key={t.code} value={t.code}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-slate-400">Nội dung khoản mục:</label>
                <input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 mt-1 focus:outline-none" value={category} onChange={e => setCategory(e.target.value)} />
              </div>
              <div>
                <label className="text-slate-400">Số tiền (VND):</label>
                <input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 mt-1 font-mono text-amber-400 font-bold focus:outline-none" value={amount} onChange={e => setAmount(formatCurrency(e.target.value))} />
              </div>
              <div>
                <label className="text-slate-400">Nhân sự thực hiện:</label>
                <select className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 mt-1 focus:outline-none" value={reporter} onChange={e => setReporter(e.target.value)}>
                  <option value="Admin (Hệ thống)">Admin (Hệ thống)</option>
                  {employees.map(e => <option key={e.id} value={e.full_name}>{e.full_name}</option>)}
                </select>
              </div>
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer p-3 bg-slate-950 border border-slate-800 rounded-xl hover:border-blue-500 transition">
                  <input type="checkbox" checked={isPaid} onChange={e => setIsPaid(e.target.checked)} className="accent-blue-500 w-4 h-4" />
                  <span className="text-slate-300 font-bold">{isPaid ? '✅ Tiền đã thanh toán tất toán' : '⏳ Khoản này đang treo nợ chờ chi'}</span>
                </label>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-800 flex gap-2">
              <button onClick={() => setShowAddModal(false)} className="flex-1 bg-slate-950 border border-slate-800 p-3 rounded-xl font-bold text-slate-400">Hủy</button>
              <button onClick={handleInsertLedger} className="flex-1 bg-blue-600 text-white font-black p-3 rounded-xl shadow-lg">Ghi Sổ</button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP EDIT MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm space-y-4 text-xs text-slate-200 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
              <h3 className="font-bold uppercase tracking-wider text-[11px]">Sửa thông tin hạch toán</h3>
              <button onClick={() => { setShowEditModal(false); setEditingId(null); }}><X className="w-5 h-5"/></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-slate-400">Nghiệp vụ:</label>
                <select className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 mt-1 focus:outline-none" value={editType} onChange={e => setEditType(e.target.value)}>
                  {transactionTypes.map((t: any) => <option key={t.code} value={t.code}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-slate-400">Nội dung khoản mục:</label>
                <input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 mt-1 focus:outline-none" value={editCategory} onChange={e => setEditCategory(e.target.value)} />
              </div>
              <div>
                <label className="text-slate-400">Số tiền sửa (VND):</label>
                <input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 mt-1 font-mono text-amber-400 font-bold focus:outline-none" value={editAmount} onChange={e => setEditAmount(formatCurrency(e.target.value))} />
              </div>
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer p-3 bg-slate-950 border border-slate-800 rounded-xl hover:border-blue-500 transition">
                  <input type="checkbox" checked={editIsPaid} onChange={e => setEditIsPaid(e.target.checked)} className="accent-blue-500 w-4 h-4" />
                  <span className="text-slate-300 font-bold">Đã chi trả tất toán</span>
                </label>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-800 flex gap-2">
              <button onClick={() => { setShowEditModal(false); setEditingId(null); }} className="flex-1 bg-slate-950 border border-slate-800 p-3 rounded-xl font-bold text-slate-400">Hủy</button>
              <button onClick={handleSaveEdit} className="flex-1 bg-blue-600 text-white font-black p-3 rounded-xl shadow-lg">Cập Nhật</button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP VIETQR DETAILED */}
      {showQrModal && activeQrTarget && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm text-center space-y-4 relative text-slate-200 shadow-2xl">
            <button onClick={() => { setShowQrModal(false); setActiveQrUrl(''); }} className="absolute top-4 right-4 text-slate-500"><X className="w-5 h-5" /></button>
            <h3 className="font-black text-xs uppercase tracking-wider text-cyan-400">{activeQrTarget.title}</h3>
            <div className="bg-white p-3 rounded-2xl inline-block border-4 border-cyan-500/30">
              <img src={activeQrUrl} alt="VietQR" className="w-60 h-60 object-contain" />
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-left space-y-1 text-[11px] font-mono leading-relaxed">
              <p><span className="text-slate-500">Ngân hàng:</span> <span className="text-cyan-400 font-bold">{activeQrTarget.bankName}</span></p>
              <p><span className="text-slate-500">Số tài khoản:</span> <span className="text-slate-200 font-bold">{activeQrTarget.accountNo}</span></p>
              <p><span className="text-slate-500">Số tiền VND:</span> <span className="text-red-400 font-bold text-xs">{activeQrTarget.amount.toLocaleString()} đ</span></p>
            </div>
            <div className="pt-2 border-t border-slate-800 flex gap-2 text-xs">
              <button onClick={() => { setShowQrModal(false); setActiveQrUrl(''); }} className="flex-1 bg-slate-950 border border-slate-800 p-3 rounded-xl font-bold text-slate-400">Đóng</button>
              <button onClick={handleInstantPaymentSuccess} className="flex-1 bg-emerald-600 text-white font-black p-3 rounded-xl shadow-lg">Xác Nhận Đã Chuyển Tiền</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}