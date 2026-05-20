// app/admin/capital/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  PiggyBank, Calendar, Plus, Wallet, TrendingUp, RefreshCcw, History, 
  CheckCircle2, CircleDashed, ArrowUpRight, Edit2, Trash2, X, Save, 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Banknote, QrCode, Search 
} from 'lucide-react';

export default function AdminFinancialLedger() {
  const [ledger, setLedger] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [transactionTypes, setTransactionTypes] = useState<any[]>([]); 
  const [companyBankCode, setCompanyBankCode] = useState<string>('MB'); // Tách riêng mã bank trung tâm
  const [companyBankAccount, setCompanyBankAccount] = useState<string>(''); // Tách riêng số tài khoản trung tâm
  const [loading, setLoading] = useState(true);
  
  const [monthInput, setMonthInput] = useState(() => {
    const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const selectedMonth = monthInput.split('-').reverse().join('/');

  // Thêm State ẩn/hiện Popup Thêm mới theo chỉ đạo của Sếp
  const [showAddModal, setShowAddModal] = useState(false);

  // Form States Thêm Mới
  const [type, setType] = useState('CHI_TIEU');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [reporter, setReporter] = useState('');
  const [isPaid, setIsPaid] = useState(true);

  // States Popup Chỉnh Sửa
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editType, setEditType] = useState('CHI_TIEU');
  const [editCategory, setEditCategory] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editReporter, setEditReporter] = useState('');
  const [editIsPaid, setEditIsPaid] = useState(true);

  // States VietQR Popup
  const [showQrModal, setShowQrModal] = useState(false);
  const [activeQrUrl, setActiveQrUrl] = useState('');
  const [activeQrTarget, setActiveQrTarget] = useState<any>(null);

  // ĐỒNG BỘ THANH PHÂN TRANG & Ô TÌM KIẾM THEO GIAO DIỆN MẪU ĐÒN BẨY ENTERPRISE
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8); 
  const [pageInput, setPageInput] = useState('1');

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

      // ĐỌC TÁCH BIỆT ĐỘNG: Kéo riêng biệt 2 trường ngân hàng trung tâm từ DB settings
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
    setPageInput('1');
    loadData(); 
  }, [selectedMonth]);

  // THUẬT TOÁN LỌC CHỐNG LỖI NULL DỮ LIỆU GỐC TRÊN SỔ CÁI
  const filteredLedger = ledger.filter(l => 
    (l.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.requested_by || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredLedger.length / itemsPerPage) || 1;
  const currentLedgerData = filteredLedger.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleInsertLedger = async () => {
    if (!category.trim() || !amount) { alert('Vui lòng điền đủ nội dung và số tiền!'); return; }
    
    const { error } = await supabase.from('financial_ledger').insert([{ 
      type, category: category.trim(), amount: Number(amount), requested_by: reporter, month_period: selectedMonth, is_paid: isPaid 
    }]);

    if (error) {
      alert('❌ Lỗi ghi sổ cái: ' + error.message);
    } else {
      setCategory(''); setAmount(''); setCurrentPage(1); setPageInput('1'); loadData();
      setShowAddModal(false); // Đóng popup thêm mới sau khi lưu thành công
      alert('✨ Đã ghi sổ thành công!');
    }
  };

  const handleOpenEdit = (item: any) => {
    setEditingId(item.id); setEditType(item.type); setEditCategory(item.category); setEditAmount(item.amount.toString()); setEditReporter(item.requested_by); setEditIsPaid(item.is_paid);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editCategory.trim() || !editAmount) { alert('Vui lòng điền đủ thông tin sửa!'); return; }
    if (!editingId) return;

    await supabase.from('financial_ledger').update({
      type: editType, category: editCategory.trim(), amount: Number(editAmount), requested_by: editReporter, is_paid: editIsPaid
    }).eq('id', editingId);

    setLedger(prev => prev.map(item => item.id === editingId ? {
      ...item, type: editType, category: editCategory.trim(), amount: Number(editAmount), requested_by: editReporter, is_paid: editIsPaid
    } : item));

    setShowEditModal(false); setEditingId(null);
    alert('✨ Đã cập nhật thông tin thành công!');
  };

  const handleTogglePaid = async (id: number, currentStatus: boolean) => {
    setLedger(prev => prev.map(l => l.id === id ? { ...l, is_paid: !currentStatus } : l));
    await supabase.from('financial_ledger').update({ is_paid: !currentStatus }).eq('id', id);
  };

  const handleInstantPaymentSuccess = async () => {
    if (!activeQrTarget || !activeQrTarget.id) return;
    const targetId = activeQrTarget.id;

    await supabase.from('financial_ledger').update({ is_paid: true }).eq('id', targetId);
    setLedger(prev => prev.map(l => l.id === targetId ? { ...l, is_paid: true } : l));
    
    setShowQrModal(false);
    setActiveQrUrl('');
    alert('✅ Hệ thống ghi sổ đã tự động cập nhật trạng thái khoản mục thành ĐÃ THANH TOÁN!');
  };

  const handleDeleteLedger = async (id: number) => {
    if (window.confirm('⚠️ Sếp có chắc chắn muốn xóa vĩnh viễn dòng tài chính này không?')) {
      setLedger(prev => prev.filter(l => l.id !== id));
      await supabase.from('financial_ledger').delete().eq('id', id);
    }
  };

  const handleGenerateVietQR = (item: any) => {
    if (item.type === 'CHI_TIEU') {
      const matchedStaff = employees.find(e => e.full_name === item.requested_by);
      if (!matchedStaff || !matchedStaff.bank_account_number || !matchedStaff.bank_name) {
        alert(`⚠️ Không thể gen mã: Nhân sự [${item.requested_by}] chưa điền tài khoản ngân hàng trong hồ sơ!`);
        return;
      }
      const cleanCategory = encodeURIComponent(item.category);
      const qrUrl = `https://img.vietqr.io/image/${matchedStaff.bank_name}-${matchedStaff.bank_account_number}-compact2.png?amount=${item.amount}&addInfo=${cleanCategory}`;
      
      setActiveQrUrl(qrUrl);
      setActiveQrTarget({ id: item.id, title: '❌ QUÉT MÃ HOÀN TIỀN CHI TIÊU CHO THỢ', bankName: matchedStaff.bank_name, accountNo: matchedStaff.bank_account_number, amount: item.amount, category: item.category });
      setShowQrModal(true);
    } 
    else if (item.type === 'VON_GOP') {
      if (!companyBankAccount) {
        alert('⚠️ Thất bại: Sếp chưa khai báo [Số tài khoản nộp vốn] ở mục Cấu hình hệ thống!');
        return;
      }
      const cleanCategory = encodeURIComponent(`Nop von: ${item.requested_by}`);
      const qrUrl = `https://img.vietqr.io/image/${companyBankCode}-${companyBankAccount}-compact2.png?amount=${item.amount}&addInfo=${cleanCategory}`;
      
      setActiveQrUrl(qrUrl);
      setActiveQrTarget({ id: item.id, title: '🟢 QUÉT MÃ NỘP VỐN ĐẦU TƯ VÀO CÔNG TY', bankName: companyBankCode, accountNo: companyBankAccount, amount: item.amount, category: item.category });
      setShowQrModal(true);
    }
  };

  const totalGop = ledger.filter(l => l.type === 'VON_GOP' && l.is_paid).reduce((sum, l) => sum + Number(l.amount), 0);
  const totalDoanhThu = ledger.filter(l => l.type === 'DOANH_THU' && l.is_paid).reduce((sum, l) => sum + Number(l.amount), 0);
  const totalChi = ledger.filter(l => l.type === 'CHI_TIEU' && l.is_paid).reduce((sum, l) => sum + Number(l.amount), 0);
  const totalTreo = ledger.filter(l => !l.is_paid).reduce((sum, l) => sum + Number(l.amount), 0);
  const totalRemainingBalance = (totalGop + totalDoanhThu) - totalChi;

  if (loading) {
    return (
      <div className="p-6 text-xs text-center font-mono text-slate-500 min-h-screen bg-slate-950 flex items-center justify-center gap-2">
        <RefreshCcw className="w-4 h-4 animate-spin inline" />
        <span>Đang tải sổ cái két quỹ xưởng...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-100 bg-slate-950 min-h-screen font-sans">
      
      {/* HEADER TÍCH HỢP NÚT POPUP THÊM MỚI THEO CHỈ THỊ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-4 gap-4">
        <div>
          <h1 className="text-base font-bold flex items-center gap-2"><PiggyBank className="w-5 h-5 text-emerald-500" /> Sổ Cái & Quản Lý Giao Dịch Tài Chính</h1>
          <p className="text-[11px] text-slate-400 mt-0.5">Hệ thống hạch toán quỹ, tích hợp cổng sinh VietQR nộp vốn và hoàn chi tự động đối soát</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {/* NÚT THÊM MỚI BẮN POPUP CHUẨN UI */}
          <button 
            onClick={() => setShowAddModal(true)} 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition shadow-lg shrink-0"
          >
            <Plus className="w-4 h-4" /> Thêm Giao Dịch
          </button>
          <div className="bg-slate-900 border border-slate-800 p-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 shrink-0">
            <Calendar className="w-4 h-4 text-blue-400" /> Kỳ báo cáo: 
            <input type="month" className="bg-slate-950 border border-slate-800 rounded p-1 text-slate-200 focus:outline-none [color-scheme:dark] font-bold" value={monthInput} onChange={(e) => setMonthInput(e.target.value)} />
          </div>
        </div>
      </div>

      {/* METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs font-bold uppercase tracking-wider">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex justify-between items-center"><div><p className="text-slate-500 text-[10px]">Vốn Đầu Tư</p><p className="text-xs font-black text-emerald-400 mt-1 font-mono">+{totalGop.toLocaleString()} đ</p></div><Wallet className="w-4 h-4 text-emerald-500" /></div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex justify-between items-center"><div><p className="text-slate-500 text-[10px]">Doanh Thu</p><p className="text-xs font-black text-blue-400 mt-1 font-mono">+{totalDoanhThu.toLocaleString()} đ</p></div><ArrowUpRight className="w-4 h-4 text-blue-400" /></div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex justify-between items-center"><div><p className="text-slate-500 text-[10px]">Chi phí Đã trả</p><p className="text-xs font-black text-red-400 mt-1 font-mono">-{totalChi.toLocaleString()} đ</p></div><TrendingUp className="w-4 h-4 text-red-400" /></div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex justify-between items-center"><div><p className="text-slate-500 text-[10px]">Khoản Treo Nợ</p><p className="text-xs font-black text-amber-400 mt-1 font-mono">{totalTreo.toLocaleString()} đ</p></div><History className="w-4 h-4 text-amber-400" /></div>
        <div className="bg-slate-900 border-2 border-cyan-500/30 p-4 rounded-2xl flex justify-between items-center shadow-lg">
          <div><p className="text-cyan-400 text-[10px]">Số tiền còn lại</p><p className="text-xs font-black text-cyan-400 mt-1 font-mono">{totalRemainingBalance.toLocaleString()} đ</p></div>
          <Banknote className="w-4 h-4 text-cyan-400 animate-pulse" />
        </div>
      </div>

      {/* BẢNG DỮ LIỆU FULL CHIỀU NGANG RỘNG RÃI SẠCH SẼ */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between">
        
        {/* TÍCH HỢP THANH KIỂM SOÁT TÌM KIẾM GÓC PHẢI BẢNG */}
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Nhật Ký Hạch Toán Kỳ {selectedMonth}</span>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input 
              type="text" 
              placeholder="Tìm kiếm nội dung, tên thợ..." 
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); setPageInput('1'); }}
            />
          </div>
        </div>

        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[10px]">
            <tr>
              <th className="p-4">Nội dung chi tiết</th><th className="p-4">Nhân sự</th><th className="p-4">Trạng thái</th><th className="p-4 text-right">Số tiền</th><th className="p-4 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {currentLedgerData.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-500 font-mono">Chưa phát sinh dữ liệu hạch toán nào khớp tiêu chuẩn lọc.</td></tr>
            ) : currentLedgerData.map(l => (
              <tr key={l.id} className="hover:bg-slate-950/20 transition text-[11px]">
                <td className="p-4 font-bold text-slate-200">{l.type === 'CHI_TIEU' ? '❌' : l.type === 'VON_GOP' ? '🟢' : '💰'} {l.category}</td>
                <td className="p-4 text-slate-400 font-medium">{l.requested_by}</td>
                <td className="p-4">
                  <button onClick={() => handleTogglePaid(l.id, l.is_paid)} className={`px-2 py-1.5 flex items-center gap-1.5 rounded-lg font-bold border text-[10px] transition ${l.is_paid ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-500'}`}>
                    {l.is_paid ? 'Đã Trả' : 'Treo nợ'}
                  </button>
                </td>
                <td className={`p-4 text-right font-mono font-bold text-sm ${l.type === 'CHI_TIEU' ? 'text-red-400' : 'text-emerald-400'}`}>{Number(l.amount).toLocaleString()} đ</td>
                <td className="p-4 text-center space-x-1.5">
                  {((l.type === 'CHI_TIEU' && !l.is_paid) || (l.type === 'VON_GOP' && !l.is_paid)) && (
                    <button onClick={() => handleGenerateVietQR(l)} className="p-1.5 bg-cyan-950 border border-cyan-800 hover:bg-cyan-900 rounded-lg text-cyan-400 transition" title="Bắn mã VietQR chuyển khoản"><QrCode className="w-3.5 h-3.5" /></button>
                  )}
                  <button onClick={() => handleOpenEdit(l)} className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-blue-400 transition"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDeleteLedger(l.id)} className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-red-500 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ĐỒNG BỘ HOÀN TOÀN THANH PHÂN TRANG ENTERPRISE THIẾT KẾ THEO ẢNH MẪU IMAGE_CBEB6A.PNG CỦA SẾP */}
        <div className="p-4 bg-slate-950/50 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-mono text-slate-400 select-none">
          <div>Total <span className="text-cyan-400 font-bold">{filteredLedger.length}</span> items</div>
          
          <div className="flex flex-wrap items-center justify-end gap-4 w-full md:w-auto">
            <div className="flex items-center gap-1.5">
              <span>Show rows:</span>
              <select 
                className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 font-bold text-slate-200 focus:outline-none cursor-pointer"
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); setPageInput('1'); }}
              >
                <option value={5}>5</option><option value={8}>8</option><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
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
              <input type="number" min={1} max={totalPages} className="w-12 bg-slate-900 border border-slate-800 rounded-lg p-1 text-center font-bold text-slate-100 focus:outline-none" value={pageInput} onChange={(e) => setPageInput(e.target.value)} />
              <button onClick={() => { const p = Number(pageInput); if (p >= 1 && p <= totalPages) setCurrentPage(p); }} className="bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg font-black hover:bg-slate-800 text-slate-200 transition">Go</button>
            </div>
          </div>
        </div>

      </div>

      {/* POPUP (MODAL) FORM GHI SỔ MỚI - ĐÃ ĐƯỢC CHUYỂN HOÀN TOÀN TỪ SIDEBAR VÀO ĐÂY THEO LỆNH SẾP */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm space-y-4 text-xs relative text-slate-200 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-1.5"><Plus className="w-4 h-4 text-blue-500" /><h3 className="font-bold text-slate-200 uppercase tracking-wider text-[10px]">Ghi Sổ Mới</h3></div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="space-y-3">
              <div><label className="text-slate-400 font-medium">Nghiệp vụ:</label>
                <select className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 mt-1 focus:outline-none font-semibold text-slate-200" value={type} onChange={(e) => setType(e.target.value)}>
                  {transactionTypes.map((t: any) => <option key={t.code} value={t.code}>{t.label}</option>)}
                </select>
              </div>
              <div><label className="text-slate-400 font-medium">Nội dung khoản mục:</label><input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 mt-1 focus:outline-none text-slate-200" placeholder="Nội dung..." value={category} onChange={(e) => setCategory(e.target.value)} /></div>
              <div><label className="text-slate-400 font-medium">Số tiền giá cả (VND):</label><input type="number" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 mt-1 font-mono focus:outline-none text-amber-400 font-bold text-sm" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
              <div><label className="text-slate-400 font-medium">Người liên quan:</label>
                <select className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 mt-1 focus:outline-none font-semibold text-slate-200" value={reporter} onChange={(e) => setReporter(e.target.value)}>
                  <option value="Admin (Hệ thống)">Admin (Hệ thống)</option>
                  {employees.map(e => <option key={e.id} value={e.full_name}>{e.full_name}</option>)}
                </select>
              </div>
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer p-3 bg-slate-950 border border-slate-800 rounded-xl hover:border-blue-500 transition">
                  <input type="checkbox" checked={isPaid} onChange={(e) => setIsPaid(e.target.checked)} className="accent-blue-500 w-4 h-4" />
                  <span className="text-slate-300 font-bold">{isPaid ? '✅ Tiền ĐÃ THANH TOÁN' : '⏳ Khoản này đang TREO NỢ'}</span>
                </label>
              </div>
            </div>

            {/* THIẾT KẾ NÚT CHUẨN TỐI GIẢN CHỈ CÓ "HỦY" VÀ "LƯU" */}
            <div className="pt-2 border-t border-slate-800 flex gap-2">
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)} 
                className="flex-1 bg-slate-950 border border-slate-800 p-3 rounded-xl font-bold text-slate-400 text-center transition hover:bg-slate-850"
              >
                Hủy
              </button>
              <button 
                type="button" 
                onClick={handleInsertLedger} 
                className="flex-1 bg-blue-600 text-white font-black p-3 rounded-xl transition hover:bg-blue-700 shadow-lg"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP SỬA ĐỔI DỮ LIỆU */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4 text-xs relative">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-200 uppercase">📝 Điều chỉnh dòng tiền ghi sổ</h3>
              <button onClick={() => { setShowEditModal(false); setEditingId(null); }} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div><label className="text-slate-400 font-bold">Nghiệp vụ:</label>
                <select className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 mt-1.5 text-slate-200" value={editType} onChange={(e) => setEditType(e.target.value)}>
                  {transactionTypes.map((t: any) => <option key={t.code} value={t.code}>{t.label}</option>)}
                </select>
              </div>
              <div><label className="text-slate-400 font-bold">Nội dung khoản mục:</label><input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 mt-1.5 text-slate-200" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} /></div>
              <div><label className="text-slate-400 font-bold">Số tiền (VND):</label><input type="number" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 mt-1.5 font-mono text-amber-400 font-black text-base" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} /></div>
              <div><label className="text-slate-400 font-bold">Người thực hiện:</label>
                <select className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 mt-1.5 text-slate-200" value={editReporter} onChange={(e) => setEditReporter(e.target.value)}>
                  <option value="Admin (Hệ thống)">Admin (Hệ thống)</option>{employees.map(e => <option key={e.id} value={e.full_name}>{e.full_name}</option>)}
                </select>
              </div>
              <div className="pt-2"><label className="flex items-center gap-2 cursor-pointer p-3 bg-slate-950 border border-slate-800 rounded-xl hover:border-blue-500 transition"><input type="checkbox" checked={editIsPaid} onChange={(e) => setEditIsPaid(e.target.checked)} className="w-4 h-4" /><span className="text-slate-200 font-bold">{editIsPaid ? '✅ Đã thanh toán xong' : '⏳ Chuyển về trạng thái Treo nợ'}</span></label></div>
            </div>
            
            <div className="pt-2 border-t border-slate-800 flex gap-2">
              <button onClick={() => { setShowEditModal(false); setEditingId(null); }} className="flex-1 bg-slate-950 border border-slate-800 p-3 rounded-xl text-slate-400 font-bold text-center transition hover:bg-slate-850">Hủy</button>
              <button onClick={handleSaveEdit} className="flex-1 bg-blue-600 text-white font-black p-3 rounded-xl transition hover:bg-blue-700">Lưu</button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MÃ VIETQR ĐỘNG */}
      {showQrModal && activeQrTarget && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm text-center space-y-4 relative">
            <button onClick={() => { setShowQrModal(false); setActiveQrUrl(''); }} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
            <div className="space-y-1">
              <h3 className="font-black text-xs uppercase tracking-wider text-cyan-400">{activeQrTarget.title}</h3>
              <p className="text-[11px] text-slate-400">Quét mã bằng app ngân hàng để hoàn tất thanh toán tiền mặt</p>
            </div>
            
            <div className="bg-white p-3 rounded-2xl inline-block border-4 border-cyan-500/30">
              <img src={activeQrUrl} alt="VietQR Động" className="w-64 h-64 object-contain" />
            </div>
            
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-left space-y-1.5 text-[11px] font-mono leading-relaxed">
              <p><span className="text-slate-500">Đích Ngân hàng:</span> <span className="text-cyan-400 font-bold">{activeQrTarget.bankName}</span></p>
              <p><span className="text-slate-500">Số tài khoản:</span> <span className="text-slate-200 font-bold">{activeQrTarget.accountNo}</span></p>
              <p><span className="text-slate-500">Số tiền chuyển:</span> <span className="text-red-400 font-bold text-xs">{activeQrTarget.amount.toLocaleString()} đ</span></p>
              <p className="truncate"><span className="text-slate-500">Nội dung mã hóa:</span> <span className="text-slate-300 italic">{activeQrTarget.category}</span></p>
            </div>
            
            <div className="pt-2 border-t border-slate-800 flex gap-2 text-xs">
              <button onClick={() => { setShowQrModal(false); setActiveQrUrl(''); }} className="flex-1 bg-slate-950 border border-slate-800 p-3 rounded-xl font-bold text-slate-400 transition hover:bg-slate-850">Đóng</button>
              <button onClick={handleInstantPaymentSuccess} className="flex-1 bg-emerald-600 hover:bg-emerald-700 font-black p-3 rounded-xl text-white transition shadow-lg tracking-wide">Thanh toán thành công</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}