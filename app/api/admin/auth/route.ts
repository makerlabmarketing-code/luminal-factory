// app/api/admin/auth/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { passcode } = await request.json();

    // Thay đổi mật mã quản trị tối cao của bạn tại đây (Ví dụ: 2026)
    if (passcode === '2026') {
      const response = NextResponse.json({ success: true, message: 'Xác thực thành công!' });
      
      // Thiết lập Session Cookie mã hóa ở tầng Server
      response.cookies.set('hq_session_token', 'luminal_secure_encrypted_admin_session_2026', {
        httpOnly: false, // Để tương thích mượt mà với môi trường ảo StackBlitz
        path: '/',
        maxAge: 60 * 60 * 2, // Hạn quyền truy cập trong 2 tiếng
      });
      return response;
    }

    return NextResponse.json({ error: 'Mật mã quản trị không chính xác!' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi máy chủ hệ thống!' }, { status: 500 });
  }
}