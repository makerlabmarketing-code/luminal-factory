// app/api/admin/auth/route.ts
import { NextResponse } from 'next/server';
import { AuthFlowError, requireAdminEmployee } from '@/services/server/auth';

function authErrorCode(status: number) {
  if (status === 401) return 'missing_session';
  if (status === 404) return 'missing_employee';
  if (status === 403) return 'forbidden';

  return 'admin_verification_failed';
}

function jsonNoStore(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set('Cache-Control', 'no-store');

  return response;
}

function toErrorResponse(error: unknown) {
  if (error instanceof AuthFlowError) {
    return jsonNoStore(
      {
        success: false,
        status: error.status,
        code: authErrorCode(error.status),
        error: error.message,
      },
      { status: error.status }
    );
  }

  return jsonNoStore(
    {
      success: false,
      status: 500,
      code: 'admin_verification_failed',
      error: 'Không thể xác minh phiên quản trị.',
    },
    { status: 500 }
  );
}

async function verifyAdminSession() {
  try {
    await requireAdminEmployee();

    return jsonNoStore({
      success: true,
      status: 200,
      code: 'admin_verified',
      message: 'Phiên quản trị hợp lệ.',
    });
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
