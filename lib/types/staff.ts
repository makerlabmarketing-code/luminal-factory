export interface StaffEmployee {
    id: number | string;
    full_name: string;
    title?: string | null;
    qr_token?: string | null;
    branch?: string | null;
    branch_code?: string | null;
    phone?: string | null;
    bank_name?: string | null;
    bank_account_number?: string | null;
    hourly_rate?: number | string | null;
    base_salary_per_hour?: number | string | null;
  }
  
  export interface StaffBranch {
    id?: number | string;
    code?: string | null;
    name?: string | null;
    facility_name?: string | null;
    lat?: number | string | null;
    lng?: number | string | null;
    radius?: number | string | null;
  }
  
  export interface FinancialLedgerEntry {
    id: number | string;
    type?: string | null;
    category?: string | null;
    amount?: number | string | null;
    bill_url?: string | null;
    requested_by?: string | null;
    is_paid?: boolean | null;
    month_period?: string | null;
  }
  
  export type StaffPortalTab = 'attendance' | 'tasks' | 'expenses' | 'profile';