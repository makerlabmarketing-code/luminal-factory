import { supabase } from '@/lib/supabase';
import type { Employee } from '@/lib/types/employee';
import type { FinancialLedgerEntry } from '@/lib/types/finance';
import {
  formatCurrency,
  getCurrentMonthPeriod,
  parseCurrency,
} from '@/services/financialService';
import { getStaffEmployeeByToken } from '@/services/staffPortalService';

export { formatCurrency, parseCurrency, getCurrentMonthPeriod };

export async function getStaffExpensesData(params: {
  token?: string | null;
  workerData?: Employee | null;
}): Promise<{
  employee: Employee | null;
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
  employee: Employee;
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
