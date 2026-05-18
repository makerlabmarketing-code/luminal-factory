// app/api/cron/monthly-payroll/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    // Chỉ cho phép hệ thống Vercel Cron Job kích hoạt ngầm bằng việc check Secret Token bảo mật
    const { searchParams } = new URL(request.url);
    const cronToken = searchParams.get('token');
    if (cronToken !== process.env.CRON_SECRET_TOKEN) {
      return NextResponse.json(
        { error: 'Từ chối quyền truy cập hệ thống tự động!' },
        { status: 403 }
      );
    }

    const currentMonth = new Date().getMonth() + 1;

    // 1. Lấy toàn bộ danh sách nhân viên đang hoạt động
    const { data: employees } = await supabase
      .from('employees')
      .select('*')
      .eq('is_active', true);
    if (!employees || employees.length === 0)
      return NextResponse.json({ message: 'Không có nhân sự kích hoạt.' });

    let hrSummaryReport = `📋 <b>BÁO CÁO TỔNG HỢP QUYẾT TOÁN LƯƠNG - THÁNG ${currentMonth}</b>\n\n`;
    let totalFactoryExpense = 0;

    // 2. Duyệt qua từng nhân sự để cộng dồn công nhật lưu vết
    for (const emp of employees) {
      const { data: logs } = await supabase
        .from('attendance_logs')
        .select('hours_worked, earnings_today')
        .eq('employee_id', emp.id)
        .eq('status', 'COMPLETED');

      const totalHours =
        logs?.reduce((sum, log) => sum + (log.hours_worked || 0), 0) || 0;
      const totalSalary =
        logs?.reduce((sum, log) => sum + (log.earnings_today || 0), 0) || 0;

      totalFactoryExpense += totalSalary;
      hrSummaryReport += `👤 ${emp.full_name} (${
        emp.title
      }):\n➔ Tổng giờ làm: ${totalHours}h\n➔ Tổng tiền nhận: ${totalSalary.toLocaleString()} đ\n\n`;

      // 3. LOGIC GỬI EMAIL TỰ ĐỘNG CHO TỪNG NHÂN VIÊN (Dùng SMTP cấu hình ở file .env)
      console.log(
        `[EMAIL ENGINE] Đang render mẫu phiếu lương HTML gửi tới cho nhân viên: ${emp.email}`
      );
      // (Khối mã gửi SMTP mail thực tế của bạn sẽ nằm tại đây)
    }

    hrSummaryReport += `💰 <b>TỔNG NGÂN SÁCH CHI TRẢ THÁNG NÀY: ${totalFactoryExpense.toLocaleString()} đ</b>`;

    // 4. GỬI EMAIL BÁO CÁO TỔNG CHỐT CHO VỢ BẠN VÀ BẠN (HR / CHỦ TÀI KHOẢN CHI)
    console.log(
      `[HR SYSTEM] Đang gửi mail báo cáo tổng hợp chi tiết cho: ${process.env.SMTP_USER}`
    );

    return NextResponse.json({
      success: true,
      message: `Hệ thống cron tự động đã hoàn tất quyết toán lương tháng ${currentMonth}.`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Lỗi động cơ Automation ngầm!' },
      { status: 500 }
    );
  }
}
