// app/admin/dashboard/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { DollarSign, Wallet, BarChart3, CheckSquare, ArrowUpRight, TrendingDown } from 'lucide-react';

export default function AdminDashboardPage() {
  const [totalPayroll, setTotalPayroll] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);

  const profitChartData = [
    { month: 'Tháng 1', revenue: 45, cost: 20, profit: 25 },
    { month: 'Tháng 2', revenue: 55, cost: 22, profit: 33 },
    { month: 'Tháng 3', revenue: 70, cost: 25, profit: 45 },
    { month: 'Tháng 4', revenue: 65, cost: 24, profit: 41 },
    { month: 'Tháng 5', revenue: 95, cost: 32, profit: 63 },
  ];

  useEffect(() => {
    const loadStats = async () => {
      const { data: logs } = await supabase.from('attendance_logs').select('earnings_today').eq('status', 'COMPLETED');
      setTotalPayroll(logs?.reduce((sum, l) => sum + (l.earnings_today || 0), 0) || 0);
      
      const { data: exp } = await supabase.from('office_expenses').select('amount');
      setTotalExpenses(exp?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0);
    };
    loadStats();
  }, []);

  return (
    <div className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-100">
      <div>
        <h1 className="text-xl font-bold tracking-wide">Financial Command Center 📊</h1>
        <p className="text-xs text-slate-400 mt-0.5">Phân tích dòng tiền, chi phí vận hành văn phòng và doanh thu gộp</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex justify-between items-center">
          <div><p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Tổng Doanh Thu Lũy Kế</p><h3 className="text-xl font-black text-emerald-400 mt-1">330.000.000 đ</h3></div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl"><ArrowUpRight className="w-5 h-5" /></div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex justify-between items-center">
          <div><p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Chi Phí Cố Định + Vật Tư</p><h3 className="text-xl font-black text-amber-500 mt-1">{totalExpenses.toLocaleString()} đ</h3></div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl"><TrendingDown className="w-5 h-5" /></div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex justify-between items-center">
          <div><p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Quỹ Lương Đã Phát Sinh</p><h3 className="text-xl font-black text-red-400 mt-1">{totalPayroll.toLocaleString()} đ</h3></div>
          <div className="p-3 bg-red-500/10 text-red-400 rounded-xl"><DollarSign className="w-5 h-5" /></div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3"><BarChart3 className="w-4 h-4 text-blue-400" /><h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Biểu đồ Lợi Nhuận Thực Tế Qua Các Tháng (Triệu VND)</h3></div>
        <div className="h-56 flex items-end justify-between pt-6 px-4 border-l border-b border-slate-800">
          {profitChartData.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-2 w-16 group relative">
              <div className="w-7 bg-emerald-500 rounded-t-lg transition-all group-hover:bg-emerald-400" style={{ height: `${d.profit * 2}px` }}></div>
              <div className="w-3 bg-red-500/30 rounded-t-md" style={{ height: `${d.cost * 2}px` }}></div>
              <span className="text-[10px] text-slate-500 font-bold mt-2 font-mono">{d.month}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-6 justify-center text-[10px] font-bold uppercase tracking-wider">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-emerald-500 rounded"></div> Lợi nhuận ròng</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-red-500/30 rounded"></div> Tổng chi phí tổng hợp</div>
        </div>
      </div>
    </div>
  );
}