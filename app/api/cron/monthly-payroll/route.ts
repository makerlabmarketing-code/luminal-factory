// app/api/cron/capital-call/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    // 1. Lấy danh sách các sếp/quản lý (Có quyền nạp vốn)
    const { data: managers } = await supabase.from('employees').select('email, full_name').or('role.eq.ADMIN,is_manager.eq.true');
    if (!managers || managers.length === 0) return NextResponse.json({ message: 'Không có quản lý nào.' });

    // 2. Lấy mẫu Email Kêu gọi vốn từ Database
    const { data: template } = await supabase.from('email_templates').select('*').eq('group_type', 'CAPITAL_CALL').single();
    if (!template) return NextResponse.json({ message: 'Chưa cấu hình template mail CAPITAL_CALL.' });

    for (const manager of managers) {
      if (!manager.email) continue;
      
      // Xử lý thay thế biến động trong HTML (Ví dụ thay {{hoTen}} thành tên sếp)
      let personalizedHtml = template.html_content.replace(/{{hoTen}}/g, manager.full_name);
      
    }

    return NextResponse.json({ success: true, message: 'Đã bắn lệnh gọi vốn tự động thành công!' });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi thực thi ngầm!' }, { status: 500 });
  }
}