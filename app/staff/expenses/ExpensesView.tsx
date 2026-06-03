// app/staff/expenses/ExpensesView.tsx
'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useNotification } from '@/component/NotificationContext';
import { Banknote, Save, Image as ImageIcon, RefreshCcw } from 'lucide-react';

// Helper functions xử lý tiền tệ đồng bộ với Admin
const formatCurrency = (value: string) => {
  if (!value) return '';
  const onlyNumbers = value.replace(/[^0-9]/g, '');
  return onlyNumbers.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const parseCurrency = (value: string) => {
  if (!value) return 0;
  return Number(value.replace(/,/g, ''));
};

export function StaffExpensesContent({ token: propsToken, workerData }: any) {
  const { showToast } = useNotification();
  const searchParams = useSearchParams();
  const token = propsToken || searchParams.get('token');

  const [expenses, setExpenses] = useState<any[]>([]);
  const [worker, setWorker] = useState<any>(workerData || null);
  const [loading, setLoading] = useState(!workerData);

  const [expCategory, setExpCategory] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expBillUrl, setExpBillUrl] = useState('');

  const loadExpensesData = async () => {
    if (!token) { setLoading(false); return; }
    try {
      let currentWorker = worker;
      if (!currentWorker) {
        const { data: emp } = await supabase.from('employees').select('*').eq('qr_token', token).maybeSingle();
        if (emp) { setWorker(emp); currentWorker = emp; }
      }
      if (currentWorker) {
        // Chỉ lấy những khoản do user này yêu cầu, sắp xếp mới nhất lên đầu
        const { data: exps } = await supabase.from('financial_ledger').select('*').eq('requested_by', currentWorker.full_name).order('id', { ascending: false });
        setExpenses(exps || []);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadExpensesData(); }, [token, workerData]);

  const handleSubmitExpense = async () => {
    if (!worker) return showToast('Lỗi', 'Chưa xác định danh tính thợ trực ca!', 'error');
    
    const numericAmount = parseCurrency(expAmount);
    if (!expCategory.trim() || !numericAmount) return showToast('Thiếu thông tin', 'Vui lòng điền đủ thông tin vật tư và tiền chi!', 'error');
    
    const period = `${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`;

    try {
      const { error } = await supabase.from('financial_ledger').insert([{
        type: 'HOAN_UNG', // Đã cập nhật theo danh mục mới
        category: expCategory.trim(), 
        amount: numericAmount, 
        bill_url: expBillUrl.trim(), 
        requested_by: worker.full_name, 
        is_paid: false, // Mặc định là treo nợ chờ Admin duyệt
        month_period: period
      }]);
      if (error) throw error;
      
      setExpCategory(''); 
      setExpAmount(''); 
      setExpBillUrl('');
      showToast('Nộp phiếu thành công', 'Yêu cầu hoàn ứng đã được gửi lên hệ thống chờ duyệt!', 'success');
      loadExpensesData();
    } catch (err: any) { showToast('Lỗi', err.message, 'error'); }
  };

  if (loading) return <div className="text-center p-6 text-xs text-slate-500 font-mono"><RefreshCcw className="w-4 h-4 animate-spin text-emerald-500 mx-auto mb-2"/> Đang tải dữ liệu chi tiêu...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start w-full text-slate-100">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 text-xs shadow-xl">
        <h3 className="text-[10px] font-black uppercase text-slate-400 block border-b border-slate-800 pb-2 flex items-center gap-1"><Banknote className="w-3.5 h-3.5 text-emerald-400" /> Kê khai vật tư phát sinh</h3>
        <div>
          <label className="text-slate-400 font-bold">Tên vật tư đồ chi mua:</label>
          <input type="text" placeholder="Ví dụ: Khớp nối đồng" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 mt-1.5 focus:outline-none text-slate-200" value={expCategory} onChange={(e) => setExpCategory(e.target.value)} />
        </div>
        <div>
          <label className="text-slate-400 font-bold">Số tiền mặt thực chi (VND):</label>
          {/* Đổi sang input text và dùng formatCurrency */}
          <input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 mt-1.5 font-mono text-amber-400 font-bold focus:outline-none" value={expAmount} onChange={(e) => setExpAmount(formatCurrency(e.target.value))} />
        </div>
        <div>
          <label className="text-slate-400 font-bold">Link ảnh hóa đơn Bill (Tùy chọn):</label>
          <input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 mt-1.5 focus:outline-none text-blue-400 font-mono" value={expBillUrl} onChange={(e) => setExpBillUrl(e.target.value)} />
        </div>
        <button onClick={handleSubmitExpense} className="w-full bg-emerald-600 hover:bg-emerald-700 transition text-white font-black p-3.5 rounded-xl uppercase text-xs mt-2 cursor-pointer">
          Nộp phiếu hoàn ứng
        </button>
      </div>

      <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/40 text-[10px] font-bold uppercase text-slate-400">Sổ đối soát quỹ chi cá nhân</div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <tbody className="divide-y divide-slate-800/60 font-medium text-[11px]">
              {expenses.length === 0 ? (
                <tr><td className="p-6 text-center text-slate-500 italic">Chưa phát sinh khoản kê khai vật tư nào.</td></tr>
              ) : expenses.map(e => (
                <tr key={e.id} className="hover:bg-slate-950/10 transition">
                  <td className="p-4">
                    <p className="font-bold text-slate-200">{e.category}</p>
                    {e.bill_url && <a href={e.bill_url} target="_blank" rel="noreferrer" className="text-blue-400 flex items-center gap-0.5 mt-1 text-[10px] hover:underline font-mono"><ImageIcon className="w-3 h-3"/> Mở xem hóa đơn</a>}
                  </td>
                  <td className="p-4 text-center">
                    {/* Bổ sung trạng thái để thợ biết đã được nhận tiền chưa */}
                    <span className={`px-2 py-1 rounded text-[9px] border font-black ${e.is_paid ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                      {e.is_paid ? '✅ Đã thanh toán' : '⏳ Chờ duyệt'}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-red-400 font-bold text-right">{Number(e.amount).toLocaleString()} đ</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}