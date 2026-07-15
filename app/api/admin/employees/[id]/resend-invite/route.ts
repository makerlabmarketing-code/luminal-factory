import { NextResponse } from 'next/server';
import { AuthFlowError } from '@/services/server/auth';
import { resendEmployeeInvite } from '@/services/server/adminEmployeeActions';

function toJsonResponse(result: unknown, init?: ResponseInit) {
  const response = NextResponse.json(result, init);
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

function toErrorResponse(error: unknown) {
  if (error instanceof AuthFlowError) {
    return toJsonResponse({ success: false, message: error.message }, { status: error.status });
  }

  return toJsonResponse(
    { success: false, message: 'Không thể gửi lại lời mời.' },
    { status: 500 }
  );
}

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    return toJsonResponse(await resendEmployeeInvite(params.id));
  } catch (error) {
    return toErrorResponse(error);
  }
}
