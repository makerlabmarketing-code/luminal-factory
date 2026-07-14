import {
  compareReportingPeriods,
  groupPaidLedgerCashflowByReportingPeriod,
  isValidReportingPeriod,
} from './financialReportingService';
import type { MonthlyChartData } from '../lib/types/dashboard';
import type { FinancialLedgerEntry } from '../lib/types/finance';

export interface DashboardSummaryDto {
  totalCapital: number;
  totalRevenue: number;
  totalExpense: number;
  currentBalance: number;
}

export interface DashboardCompositionDto {
  name: 'Vốn Góp' | 'Doanh Thu' | 'Chi Phí' | 'Hoàn Ứng';
  value: number;
}

export interface AdminDashboardDto {
  summary: DashboardSummaryDto;
  monthlyCashFlow: MonthlyChartData[];
  cashFlowComposition: DashboardCompositionDto[];
  reportingYear: string;
  generatedAt: string;
}

export type DashboardLedgerEntry = Pick<
  FinancialLedgerEntry,
  'id' | 'type' | 'category' | 'amount' | 'is_paid' | 'month_period'
>;

export function buildAdminDashboardDto(
  ledger: DashboardLedgerEntry[],
  generatedAt: Date = new Date(),
): AdminDashboardDto {
  const reportingYear = generatedAt.getFullYear().toString();
  let totalCapital = 0;
  let totalRevenue = 0;
  let totalExpense = 0;
  let totalRefund = 0;
  let yearCapital = 0;
  let yearRevenue = 0;
  let yearExpense = 0;

  ledger.forEach((entry) => {
    const amount = Number(entry.amount) || 0;
    const reportingPeriod = entry.month_period || '';

    if (isValidReportingPeriod(reportingPeriod) && reportingPeriod.endsWith(`/${reportingYear}`)) {
      if (entry.type === 'VON_GOP') yearCapital += amount;
      else if (entry.type === 'DOANH_THU') yearRevenue += amount;
      else if (isDashboardExpenseType(entry.type)) yearExpense += amount;
    }

    if (entry.type === 'VON_GOP') totalCapital += amount;
    if (entry.type === 'DOANH_THU') totalRevenue += amount;
    if (entry.type === 'CHI_PHI' || entry.type === 'CHI_TIEU') totalExpense += amount;
    if (entry.type === 'HOAN_UNG') totalRefund += amount;
  });

  const monthlyCashFlow = groupPaidLedgerCashflowByReportingPeriod(
    ledger as FinancialLedgerEntry[],
  ).sort((a, b) => compareReportingPeriods(a.name, b.name));

  const allCashFlowComposition: DashboardCompositionDto[] = [
    { name: 'Vốn Góp', value: totalCapital },
    { name: 'Doanh Thu', value: totalRevenue },
    { name: 'Chi Phí', value: totalExpense },
    { name: 'Hoàn Ứng', value: totalRefund },
  ];
  const cashFlowComposition = allCashFlowComposition.filter((entry) => entry.value > 0);

  return {
    summary: {
      totalCapital: yearCapital,
      totalRevenue: yearRevenue,
      totalExpense: yearExpense,
      currentBalance: yearCapital + yearRevenue - yearExpense,
    },
    monthlyCashFlow,
    cashFlowComposition,
    reportingYear,
    generatedAt: generatedAt.toISOString(),
  };
}

function isDashboardExpenseType(type: string | null | undefined): boolean {
  return type === 'CHI_PHI' || type === 'CHI_TIEU' || type === 'HOAN_UNG';
}
