// app/admin/attendance/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar, UserCheck, X, RefreshCcw, Clock } from 'lucide-react';

interface Log { employee_id: number; check_in_time: string; shift_type: string; shift_count: number; }
interface Employee { id: number; full_name: string; title: string; }

export default function AdminAttendanceCalendarPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  // States quản lý Popup Lịch Chấm Công
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1); // Giả lập lịch 31 ngày tháng hiện tại

  useEffect(() => {
    const loadLogs = async () => {
      setLoading(true);
      const { data: e } = await supabase.from('employees').select('*').eq('is_active', true);
      setEmployees(e || []);
      const { data: l } = await supabase.from('attendance_logs').select('employee_id, check_in_time, shift_type, shift_count');
      setLogs(l || []);
      setLoading(false);
    };
    loadLogs();
  }, []);

  // Hàm kiểm tra xem ngày đó nhân viên có đi làm không để trả về loại Ca và Số Ca nhỏ
  const getAttendanceForDay = (empId: number, day: number) => {
    return logs.find(log => {
      const logDay = new Date(log.check_in_time).getDate();
      return log.employee_id === empId && logDay === day;
    });
  };

  if (loading) return <div className="p-6 text-xs font-mono text-slate-500 text-center"><RefreshCcw className="w-4 h-4 animate-spin inline" /> Đang tổng hợp bảng chấm công...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 text-slate-100 bg-slate-950 min-h-screen">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-4"><Calendar className="w-5 h-5 text-blue-500" /><h1 className="text-base font-bold">Đối Soát Ngày Công & Lịch Trình Ca Làm</h1></div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase">
            <tr><th className="p-4">Họ và Tên Thợ</th><th className="p-4">Vị trí</th><th className="p-4 text-right">Hành động</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {employees.map(emp => (
              <tr key={emp.id} className="hover:bg-slate-950/20 transition">
                <td className="p-4 font-bold text-slate-200">👤 {emp.full_name}</td>
                <td className="p-4"><span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-md font-bold">{emp.title}</span></td>
                <td className="p-4 text-right"><button onClick={() => setSelectedEmp(emp)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-xl transition">Show ngày công</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* POPUP CUỐN LỊCH CHẤM CÔNG SIÊU ĐẲNG (MODAL) */}
      {selectedEmp && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl relative animate-scaleUp">
            <button onClick={() => setSelectedEmp(null)} className="absolute top-4 right-4 text-slate-500 hover:text-slate-300"><X className="w-5 h-5" /></button>
            
            <div>
              <h3 className="text-sm font-bold text-slate-100">Lịch Chấm Công: {selectedEmp.full_name}</h3>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">Tháng hiện tại (3 ca làm việc: Sáng - Chiều - Tối)</p>
            </div>

            {/* Khung Grid cuốn lịch */}
            <div className="grid grid-cols-7 gap-2 pt-2">
              {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((w, idx) => <div key={idx} className="text-center text-[10px] font-bold text-slate-600 uppercase">{w}</div>)}
              
              {daysInMonth.map(day => {
                const work = getAttendanceForDay(selectedEmp.id, day);
                return (
                  <div 
                    key={day} 
                    className={`h-11 rounded-xl flex flex-col items-center justify-center relative font-mono text-xs border ${
                      work ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-400 font-bold' : 'bg-slate-950 border-slate-900 text-slate-700'
                    }`}
                  >
                    <span>{day}</span>
                    {/* Số ca nhỏ hiển thị dạng lũy thừa (Superscript) y hệt AppScript */}
                    {work && (
                      <span className="absolute top-0.5 right-1.5 text-[8px] font-black text-amber-400">
                        {work.shift_type === 'SANG' ? '¹' : work.shift_type === 'CHIEU' ? '²' : '³'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-wider text-slate-500 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500/20 border border-emerald-500 rounded"></div> Ngày có công làm</div>
              <div className="flex items-center gap-1"><span className="text-amber-400 text-xs font-black">¹ ² ³</span> Số hiệu Ca (Sáng/Chiều/Tối)</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}