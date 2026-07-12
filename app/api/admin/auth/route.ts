// app/api/admin/auth/route.ts
import { NextResponse } from 'next/server';
import { AuthFlowError, requireAdminEmployee } from '@/services/server/auth';

function toErrorResponse(error: unknown) {
  if (error instanceof AuthFlowError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  return NextResponse.json({ error: 'Không thể xác minh phiên quản trị.' }, { status: 500 });
}

async function verifyAdminSession() {
  try {
    await requireAdminEmployee();

    return NextResponse.json({ success: true, message: 'Phiên quản trị hợp lệ.' });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function GET() {
  return verifyAdminSession();
}

export async function POST() {
  return verifyAdminSession();
}
