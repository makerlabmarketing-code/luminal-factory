import { NextResponse } from 'next/server';
import { requireAdminEmployee } from '@/services/server/auth';

function jsonNoStore(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set('Cache-Control', 'no-store');

  return response;
}

export async function GET() {
  try {
    await requireAdminEmployee();

    return jsonNoStore({
      companyBankCode: process.env.COMPANY_BANK_CODE || 'MB',
      companyBankAccount: process.env.COMPANY_BANK_ACCOUNT || '',
    });
  } catch (error) {
    const status = error instanceof Error && 'status' in error
      ? Number((error as { status?: number }).status || 500)
      : 500;

    return jsonNoStore(
      {
        error: status === 401 ? 'Phiên đăng nhập đã hết hạn.' : 'Không tải được cấu hình tài chính.',
      },
      { status }
    );
  }
}
