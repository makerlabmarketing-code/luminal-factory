// app/api/payments/webhook/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const paymentResponse = await request.json();

    // 1. Đọc dữ liệu lõi từ phản hồi giao dịch của ngân hàng (Mẫu chuẩn API VietQR/Casso/PayOS)
    const { code, description, amount, status } = paymentResponse.data;

    // Kiểm tra xem phản hồi giao dịch có báo trạng thái THÀNH CÔNG (SUCCESSFUL / PAID) không
    if (status !== 'PAID' && code !== '00') {
      return NextResponse.json(
        { message: 'Giao dịch chưa hoàn tất, bỏ qua cập nhật.' },
        { status: 200 }
      );
    }

    // 2. PHÂN TÍCH NỘI DUNG CHUYỂN KHOẢN (DESCRIPTION) ĐỂ TỰ ĐỘNG PHÂN LOẠI GHI SỔ
    const memo = description.toUpperCase();

    // TRƯỜNG HỢP A: Nếu nội dung có chữ "GOP VON [TEN_CO_DONG]"
    if (memo.includes('GOP VON')) {
      // Tìm mã định danh cổ đông dựa trên nội dung text
      let shareholderId = memo.includes('CO DONG B') ? '2' : '1';

      const { error } = await supabase
        .from('shareholders')
        .update({ status: 'DONE', contributed_amount: amount })
        .eq('id', shareholderId);

      if (error) throw error;

      console.log(
        `[HỆ THỐNG KẾ TOÁN] Cổ đông nạp tiền QR thành công. Tự động duyệt Góp vốn +${amount}đ.`
      );
    }

    // TRƯỜNG HỢP B: Nếu nội dung chứa tiền thanh toán chi phí văn phòng (Ví dụ: "TIEN DIEN THANG 5")
    if (memo.includes('TIEN DIEN') || memo.includes('TIEN NHA')) {
      const expenseId = memo.includes('TIEN DIEN') ? '2' : '1';

      const { error } = await supabase
        .from('office_expenses')
        .update({
          status: 'PAID',
          date: new Date().toISOString().split('T')[0],
        })
        .eq('id', expenseId);

      if (error) throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Hệ thống đối soát QR hoàn tất kế toán thành công!',
    });
  } catch (error) {
    console.error('Lỗi kế toán Webhook:', error);
    return NextResponse.json(
      { error: 'Lỗi ghi sổ dữ liệu tài chính ngầm!' },
      { status: 500 }
    );
  }
}
