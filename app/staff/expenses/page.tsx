// app/staff/expenses/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ShoppingBag, Plus, RefreshCcw } from 'lucide-react';

interface StaffOption {
  id: string;
  full_name: string;
}

export default function StaffExpensesPage() {
  const [employees, setEmployees] = useState<StaffOption[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [item, setItem] = useState('');
  const [cost, setCost] = useState('');
  const [reporter, setReporter] = useState('');

  // TỰ ĐỘNG KÉO DANH SÁCH NHÂN SỰ DYNAMIC TỪ SUPABASE
  useEffect(() => {
    const loadActiveStaff = async () => {
      try {
        const { data, error } = await supabase
          .from('employees')
          .select('id, full_name')
          .eq('is_active', true)
          .order('full_name', { ascending: true });

        if (error) throw error;
        
        if (data && data.length > 0) {
          setEmployees(data);
          setReporter(data[0].full_name); // Tự động chọn nhân viên đầu tiên làm mặc định
        }
      } catch (e) {
        console.error('Lỗi tải nhân sự:', e);
      } finally {
        setLoading(false);
      }
    };
    loadActiveStaff();
  }, []);

  const handleReportExpense = async () => {
    if (!item.trim() || !cost) {
      alert('Vui lòng nhập đầy đủ tên đồ và số tiền!');
      return;
    }
    try {
      const { error } = await supabase.from('office_expenses').insert([
        { 
          category: item.trim(), 
          amount: Number(cost), 
          requested_by: reporter, 
          status: 'UNPAID', 
          month_period: '05/2026' 
        }
      ]);

      if (error) throw error;
      alert(`Đã đẩy báo cáo chi tiêu của [${reporter}] lên hàng chờ duyệt thành công!`);
      setItem(''); 
      setCost('');
    } catch (e) {
      alert('Lỗi gửi báo cáo tài chính!');
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-xs font-mono text-slate-500 text-center">
        <RefreshCcw className="w-4 h-4 animate-spin inline mr-2" /> Đang đồng bộ danh sách nhân sự thực tế...
      </div>
    );
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xl">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <ShoppingBag className="w-4 h-4 text-blue-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">Báo Cáo Chi Tiêu Vật Tư</h2>
        </div>
        
        <div className="space-y-4 text-xs">
          <div>
            <label className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Nhân sự báo cáo (Dynamic):</label>
            <select 
              className="mt-2 block w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-blue-500/50 transition font-medium" 
              value={reporter} 
              onChange={(e) => setReporter(e.target.value)}
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.full_name}>
                  👤 {emp.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Tên vật tư / Đồ mua ngoài:</label>
            <input type="text" className="mt-2 block w-full bg-slate-950 border border-slate-800 rounded-xl p-3 focus:outline-none focus:border-blue-500/50 text-slate-200" placeholder="Ví dụ: Cồn 90 độ, giấy nhám P1000..." value={item} onChange={(e) => setItem(e.target.value)} />
          </div>

          <div>
            <label className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Số tiền thực chi (VND):</label>
            <input type="number" className="mt-2 block w-full bg-slate-950 border border-slate-800 rounded-xl p-3 focus:outline-none focus:border-blue-500/50 font-mono text-red-400 font-bold" placeholder="Ví dụ: 120000" value={cost} onChange={(e) => setCost(e.target.value)} />
          </div>
          
          <button onClick={handleReportExpense} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-3 rounded-xl flex items-center justify-center gap-1.5 tracking-wide text-xs uppercase mt-2 transition shadow-lg shadow-emerald-950/50">
            <Plus className="w-4 h-4" /> Đệ trình Admin thanh toán
          </button>
        </div>
      </div>
    </div>
  );
}