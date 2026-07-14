import { LockKeyhole } from 'lucide-react';

export default function AdminSystemSettingsDisabled() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-slate-100">
      <div className="max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2 text-amber-300">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold">Cấu hình trung tâm đã tắt</h1>
            <p className="mt-1 text-xs text-slate-400">
              Module này không còn được dùng trong runtime hiện tại.
            </p>
          </div>
        </div>

        <p className="text-sm leading-6 text-slate-300">
          Các cấu hình nhạy cảm như SMTP và tài khoản ngân hàng công ty phải được quản lý qua biến môi trường server hoặc kênh vận hành được duyệt. Bảng dữ liệu hiện vẫn được giữ tạm thời để xử lý policy ở bước riêng.
        </p>
      </div>
    </div>
  );
}
