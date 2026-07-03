import { supabase } from '@/lib/supabase';
import type { FinancialLedgerEntry, StaffEmployee } from '@/lib/types/staff';
import { getStaffEmployeeByToken } from '@/services/staffPortalService';

export function formatCurrency(value: string): string {
  if (!value) return '';

  const onlyNumbers = value.replace(/[^0-9]/g, '');

  return onlyNumbers.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function parseCurrency(value: string): number {
  if (!value) return 0;

  return Number(value.replace(/,/g, ''));
}

export function getCurrentMonthPeriod(): string {
  const now = new Date();

  return `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
}

export async function getStaffExpensesData(params: {
  token?: string | null;
  workerData?: StaffEmployee | null;
}): Promise<{
  employee: StaffEmployee | null;
  expenses: FinancialLedgerEntry[];
}> {
  let employee = params.workerData || null;

  if (!employee && params.token) {
    employee = await getStaffEmployeeByToken(params.token);
  }

  if (!employee) {
    return {
      employee: null,
      expenses: [],
    };
  }

  const { data, error } = await supabase
    .from('financial_ledger')
    .select('*')
    .eq('requested_by', employee.full_name)
    .order('id', { ascending: false });

  if (error) throw error;

  return {
    employee,
    expenses: (data || []) as FinancialLedgerEntry[],
  };
}

export async function submitStaffExpense(params: {
  employee: StaffEmployee;
  category: string;
  amount: number;
  billUrl: string;
}): Promise<void> {
  const { error } = await supabase.from('financial_ledger').insert([
    {
      type: 'HOAN_UNG',
      category: params.category.trim(),
      amount: params.amount,
      bill_url: params.billUrl.trim(),
      requested_by: params.employee.full_name,
      is_paid: false,
      month_period: getCurrentMonthPeriod(),
    },
  ]);

  if (error) throw error;
}