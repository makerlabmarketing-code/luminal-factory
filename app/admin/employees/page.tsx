// app/admin/employees/page.tsx
'use client';
import { useState } from 'react';
import { UserPlus, Coins, UserCheck, Shield, Trash2 } from 'lucide-react';

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState([
    {
      id: '1',
      name: 'Đỗ Hải Vân',
      title: 'Nhân viên In 3D',
      hourly_rate: 30000,
      qr_token: 'NV_DOHAIVAN',
      is_active: true,
    },
    {
      id: '2',
      name: 'Nguyễn Yến Nhi',
      title: 'Nhân viên Decor/QC',
      hourly_rate: 30000,
      qr_token: 'NV_YENNHI',
      is_active: true,
    },
  ]);

  const [name, setName] = useState('');
  const [title, setTitle] = useState('Nhân viên Decor/QC');
  const [rate, setRate] = useState(30000);

  const handleAddEmployee = () => {
    if (!name.trim()) return;
    const cleanToken = 'NV_' + name.toUpperCase().replace(/\s+/g, '');

    setEmployees([
      ...employees,
      {
        id: Date.now().toString(),
        name: name.trim(),
        title,
        hourly_rate: Number(rate),
        qr_token: cleanToken,
        is_active: true,
      },
    ]);
    setName('');
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-100 flex justify-center">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
          <UserCheck className="w-5 h-5 text-blue-500" />
          <div>
            <h1 className="text-base font-bold">
              Hồ Sơ Nhân Sự & Cấu Hình Định Mức Lương
            </h1>
            <p className="text-[11px] text-slate-400">
              Quản lý quyền truy cập xưởng và định mức chi trả công nhật
            </p>
          </div>
        </div>

        {/* Form Thêm Nhân Viên Mới */}
        <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl grid grid-cols-1 sm:grid-cols-4 items-end gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase">
              Tên nhân viên:
            </label>
            <input
              type="text"
              placeholder="Nguyễn Văn A..."
              className="mt-1.5 block w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase">
              Vị trí công việc:
            </label>
            <select
              className="mt-1.5 block w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            >
              <option value="Nhân viên In 3D">Nhân viên In 3D</option>
              <option value="Nhân viên Decor/QC">Nhân viên Decor/QC</option>
              <option value="Cộng tác viên">Cộng tác viên</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase">
              Lương/Giờ (VND):
            </label>
            <input
              type="number"
              className="mt-1.5 block w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none font-mono"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
            />
          </div>
          <button
            onClick={handleAddEmployee}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 rounded-lg flex items-center justify-center gap-1.5 transition"
          >
            <UserPlus className="w-3.5 h-3.5" /> Kích hoạt nhân sự
          </button>
        </div>

        {/* Bảng Danh Sách Hồ Sơ */}
        <div className="border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">Họ và Tên</th>
                <th className="p-3">Vị trí</th>
                <th className="p-3">Lương Cứng</th>
                <th className="p-3">Mã QR Định Danh Token</th>
                <th className="p-3 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-950/40 transition">
                  <td className="p-3 font-semibold text-slate-100 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    {emp.name}
                  </td>
                  <td className="p-3 text-slate-400">{emp.title}</td>
                  <td className="p-3 font-mono text-amber-400 font-semibold">
                    {emp.hourly_rate.toLocaleString()} đ/h
                  </td>
                  <td className="p-3 font-mono text-slate-500">
                    {emp.qr_token}
                  </td>
                  <td className="p-3 text-center">
                    <button className="text-slate-500 hover:text-red-400 p-1 transition">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
