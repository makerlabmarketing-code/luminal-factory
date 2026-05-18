import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getDistance } from 'geolib';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { qrToken, userLat, userLng } = body;

    if (!qrToken || !userLat || !userLng) {
      return NextResponse.json(
        { error: 'Thiếu thông tin tọa độ hoặc mã xác thực!' },
        { status: 400 }
      );
    }

    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('id, full_name, is_active, title')
      .eq('qr_token', qrToken)
      .single();

    if (empError || !employee || !employee.is_active) {
      return NextResponse.json(
        { error: 'Mã QR không hợp lệ hoặc tài khoản đã bị khóa!' },
        { status: 401 }
      );
    }

    const studioLat = Number(process.env.NEXT_PUBLIC_STUDIO_LAT);
    const studioLng = Number(process.env.NEXT_PUBLIC_STUDIO_LNG);
    const maxRadius =
      Number(process.env.NEXT_PUBLIC_STUDIO_RADIUS_METERS) || 15;

    const distance = getDistance(
      { latitude: userLat, longitude: userLng },
      { latitude: studioLat, longitude: studioLng }
    );

    if (distance > maxRadius) {
      return NextResponse.json(
        {
          error: `Check-in thất bại! Bạn đang cách Studio ${distance}m (Giới hạn cho phép: ${maxRadius}m).`,
        },
        { status: 403 }
      );
    }

    const { error: logError } = await supabase
      .from('attendance_logs')
      .insert([
        {
          employee_id: employee.id,
          check_in_time: new Date().toISOString(),
          latitude: userLat,
          longitude: userLng,
          status: 'VALID',
        },
      ]);

    if (logError) throw logError;

    return NextResponse.json({
      success: true,
      message: `Xin chào ${employee.full_name}! Ghi nhận vào ca thành công.`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Lỗi hệ thống xử lý từ xa!' },
      { status: 500 }
    );
  }
}
