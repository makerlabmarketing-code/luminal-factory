export function getShiftWageByTitle(title?: string | null): number {
  const formattedTitle = (title || '').trim().toUpperCase();

  if (formattedTitle === 'A1') return 150000;

  return 100000;
}

export async function updateStaffProfile(params: {
  phone: string;
  bankName: string;
  bankAccountNumber: string;
}): Promise<void> {
  const response = await fetch('/api/staff/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: params.phone,
      bankName: params.bankName,
      bankAccountNumber: params.bankAccountNumber,
    }),
  });

  if (!response.ok) {
    const result = (await response.json().catch(() => null)) as { error?: string } | null;

    throw new Error(result?.error || 'Không thể lưu hồ sơ.');
  }
}
