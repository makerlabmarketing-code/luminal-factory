// app/admin/capital/page.tsx
'use client';
import { useState } from 'react';
import {
  PiggyBank,
  CreditCard,
  Send,
  TrendingUp,
  DollarSign,
  Bell,
} from 'lucide-react';

export default function AdminCapitalPage() {
  // 1. Quản lý danh sách cổ đông góp vốn
  const [shareholders, setShareholders] = useState([
    {
      id: '1',
      name: 'Bạn (Founder)',
      share: 60,
      contributed: 30000000,
      status: 'DONE',
    },
    {
      id: '2',
      name: 'Cổ đông B',
      share: 40,
      contributed: 20000000,
      status: 'PENDING',
    },
  ]);

  // 2. Quản lý chi tiêu văn phòng hàng tháng
  const [expenses, setExpenses] = useState([
    {
      id: '1',
      category: 'Tiền thuê mặt bằng xưởng',
      amount: 5000000,
      status: 'PAID',
      date: '2026-05-05',
    },
    {
      id: '2',
      category: 'Tiền điện chạy máy in 3D & Máy cồn',
      amount: 1200000,
      status: 'UNPAID',
      date: '---',
    },
  ]);

  const [bankAccount, setBankAccount] = useState({
    bank: 'MB Bank',
    number: '1900xxxxxxxxx',
    name: 'LUMINAL FACTORY',
  });
  const [isSending, setIsSending] = useState(false);

  // Gửi mail nhắc nhở các cổ đông nạp tiền vào STK chung
  const handleSendReminder = async () => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      alert(
        'Đã gửi Email & thông báo Telegram nhắc nhở cổ đông đóng vốn kèm thông tin STK và mã QR chuyển khoản!'
      );
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-xl font-bold tracking-wide">
              Quản Trị Vốn & Chi Tiêu Hàng Tháng
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Quản lý dòng tiền góp, chi phí cố định văn phòng và quỹ chung
            </p>
          </div>
          <button
            onClick={handleSendReminder}
            disabled={isSending}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl transition"
          >
            <Bell className="w-3.5 h-3.5" />
            {isSending ? 'Đang gửi thông báo...' : 'Gửi Mail Nhắc Góp Vốn'}
          </button>
        </div>

        {/* Khối Cấu hình STK Chung */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase text-slate-400">
                Tài khoản ngân hàng chung của Quỹ
              </h3>
              <p className="text-sm font-semibold text-slate-200 mt-0.5">
                {bankAccount.bank} - {bankAccount.number} ({bankAccount.name})
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cấu phần 1: Quản lý Góp Vốn Cổ Đông */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold tracking-wide flex items-center gap-2 border-b border-slate-800 pb-3">
              <PiggyBank className="w-4 h-4 text-emerald-400" /> Phân Chia Tỉ Lệ
              Góp Vốn
            </h3>
            <div className="space-y-3">
              {shareholders.map((s) => (
                <div
                  key={s.id}
                  className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex justify-between items-center"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-200">
                      {s.name}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Tỉ lệ cổ phần sở hữu: {s.share}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold font-mono text-slate-200">
                      {s.contributed.toLocaleString()} đ
                    </p>
                    <span
                      className={`inline-block text-[9px] font-extrabold px-1.5 py-0.5 rounded mt-1 ${
                        s.status === 'DONE'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {s.status === 'DONE' ? 'ĐÃ GÓP ĐỦ' : 'CHỜ CHUYỂN KHOẢN'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cấu phần 2: Chi Tiêu Văn Phòng Hàng Tháng */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold tracking-wide flex items-center gap-2 border-b border-slate-800 pb-3">
              <TrendingUp className="w-4 h-4 text-red-400" /> Chi Phí Văn Phòng
              / Xưởng In
            </h3>
            <div className="space-y-3">
              {expenses.map((e) => (
                <div
                  key={e.id}
                  className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex justify-between items-center"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-200">
                      {e.category}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Ngày chi: {e.date}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold font-mono text-red-400">
                      -{e.amount.toLocaleString()} đ
                    </p>
                    <span
                      className={`inline-block text-[9px] font-extrabold px-1.5 py-0.5 rounded mt-1 ${
                        e.status === 'PAID'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {e.status === 'PAID' ? 'ĐÃ THANH TOÁN' : 'CHƯA TRẢ'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
