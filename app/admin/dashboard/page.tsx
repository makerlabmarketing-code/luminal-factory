'use client';
import { useState } from 'react';
import { Users, DollarSign, Wallet, MailCheck, RefreshCcw } from 'lucide-react';

export default function AdminDashboardPage() {
  const [totalPayroll] = useState(2970000);
  const [staffs] = useState([
    {
      id: '1',
      name: 'Đỗ Hải Vân',
      title: 'A1',
      hours: 45,
      total: 1350000,
      email: 'dov68683@gmail.com',
    },
    {
      id: '2',
      name: 'Nguyễn Yến Nhi',
      title: 'A1',
      hours: 54,
      total: 1620000,
      email: 'nguyenyennhi1.252005@gmail.com',
    },
  ]);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncPayroll = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      alert(
        'Hệ thống đã tự động tính toán dữ liệu công nhật, render HTML và gửi Email phiếu lương hàng loạt thành công!'
      );
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-5 gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-wide">
              Luminal Factory Dashboard
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Hệ thống trung tâm điều hành sản xuất và đối soát tài chính từ xa
            </p>
          </div>
          <button
            onClick={handleSyncPayroll}
            disabled={isSyncing}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-lg"
          >
            {isSyncing ? (
              <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <MailCheck className="w-3.5 h-3.5" />
            )}
            {isSyncing ? 'Đang quyết toán...' : 'Chốt công & Gửi Mail Lương'}
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Tổng ngân sách lương
              </p>
              <h3 className="text-xl font-black text-red-400 mt-1">
                {totalPayroll.toLocaleString()} đ
              </h3>
            </div>
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Nhân sự kích hoạt
              </p>
              <h3 className="text-xl font-black text-blue-400 mt-1">
                {staffs.length} Thành viên
              </h3>
            </div>
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Vốn máy móc / Nợ gốc
              </p>
              <h3 className="text-xl font-black text-slate-300 mt-1">
                Giai đoạn 1
              </h3>
            </div>
            <div className="p-3 bg-slate-500/10 border border-slate-500/20 text-slate-400 rounded-xl">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/40">
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
              Bảng tổng hợp chi trả lương nhân viên
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm text-slate-300">
              <thead>
                <tr className="bg-slate-950/20 text-slate-400 font-semibold border-b border-slate-800 text-xs uppercase">
                  <th className="p-4">Nhân sự</th>
                  <th className="p-4">Cấp bậc</th>
                  <th className="p-4">Tổng giờ</th>
                  <th className="p-4 text-right">Thực nhận</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {staffs.map((staff) => (
                  <tr
                    key={staff.id}
                    className="hover:bg-slate-950/20 transition"
                  >
                    <td className="p-4 font-semibold text-slate-200">
                      {staff.name}
                      <span className="block text-[11px] text-slate-500 font-normal mt-0.5">
                        {staff.email}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 text-xs font-bold bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-md">
                        {staff.title}
                      </span>
                    </td>
                    <td className="p-4 font-mono">{staff.hours} h</td>
                    <td className="p-4 text-right font-bold text-red-400">
                      {staff.total.toLocaleString()} đ
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
