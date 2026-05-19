// app/admin/employees/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { UserCheck, UserPlus, Copy, RefreshCcw } from 'lucide-react';

interface Employee { id: string; full_name: string; title: string; hourly_rate: number; qr_token: string; email: string; }

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const { data } = await supabase.from('employees').select('*').eq('is_active', true);
      setEmployees(data || []);
      setLoading(false);
    };
    loadData();
  }, []);

  const copyToClipboard = (token: string) => {
    // Thuật toán tự sinh đường dẫn cổng portal đính kèm mã định danh token
    const portalLink = `${window.location.origin}/staff/portal?token=${token}`;
    navigator.clipboard.writeText(portalLink);
    alert(`Đã copy Link Check-in độc quyền của nhân sự!\nLink: ${portalLink}`);
  };

  if (loading) return <div className="p-6 text-xs font-mono text-slate-500 text-center"><RefreshCcw className="w-4 h-4 animate-spin inline" /> Đang tải hồ sơ...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 text-slate-100 bg-slate-950 min-h-screen">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-4"><UserCheck className="w-5 h-5 text-blue-500" /><h1 className="text-base font-bold">Danh Sách Nhân Sự & Cấp Quyền Link Cổng Ca</h1></div>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase">
            <tr><th className="p-4">Họ tên</th><th className="p-4">Mức Lương</th><th className="p-4 text-right">Link Cổng Check-in Riêng Biệt</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {employees.map(emp => (
              <tr key={emp.id} className="hover:bg-slate-950/20 transition">
                <td className="p-4 font-bold text-slate-200">{emp.full_name}<span className="block text-[10px] text-slate-500 font-normal font-mono mt-0.5">{emp.email}</span></td>
                <td className="p-4 font-mono text-amber-400 font-bold">{emp.hourly_rate.toLocaleString()} đ/h</td>
                <td className="p-4 text-right"><button onClick={() => copyToClipboard(emp.qr_token)} className="bg-slate-950 hover:bg-slate-800 border border-slate-800 font-bold px-3 py-1.5 rounded-xl text-blue-400 inline-flex items-center gap-1.5 transition"><Copy className="w-3.5 h-3.5" /> Copy Link Gửi Thợ</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}