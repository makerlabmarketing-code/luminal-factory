import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { AuthFlowError, requireAuthenticatedEmployee } from '@/services/server/auth';

const MAX_PROFILE_FIELD_LENGTH = 120;

function cleanProfileField(value: unknown): string {
  if (typeof value !== 'string') return '';

  return value.trim().slice(0, MAX_PROFILE_FIELD_LENGTH);
}

function toErrorResponse(error: unknown) {
  if (error instanceof AuthFlowError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  return NextResponse.json({ error: 'Không thể lưu hồ sơ nhân sự.' }, { status: 500 });
}

export async function PATCH(request: Request) {
  try {
    const authContext = await requireAuthenticatedEmployee();
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

    if (!body) {
      return NextResponse.json({ error: 'Dữ liệu hồ sơ không hợp lệ.' }, { status: 400 });
    }

    const payload = {
      phone: cleanProfileField(body.phone),
      bank_name: cleanProfileField(body.bankName),
      bank_account_number: cleanProfileField(body.bankAccountNumber),
    };

    const supabase = await createClient();
    const { error } = await supabase
      .from('employees')
      .update(payload)
      .eq('id', authContext.employee.id);

    if (error) {
      return NextResponse.json({ error: 'Không thể lưu hồ sơ nhân sự.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
