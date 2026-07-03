import { supabase } from '@/lib/supabase';
import type { StaffBranch, StaffEmployee } from '@/lib/types/staff';

export async function getStaffEmployeeByToken(token: string): Promise<StaffEmployee | null> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('qr_token', token)
    .maybeSingle();

  if (error) throw error;

  return (data as StaffEmployee | null) || null;
}

export async function getStaffEmployeeById(employeeId: number | string): Promise<StaffEmployee | null> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', employeeId)
    .maybeSingle();

  if (error) throw error;

  return (data as StaffEmployee | null) || null;
}

export async function getMetadataBranches(): Promise<StaffBranch[]> {
  const { data, error } = await supabase
    .from('system_metadata')
    .select('data')
    .eq('name', 'Danh sách Chi nhánh')
    .maybeSingle();

  if (error) throw error;

  return Array.isArray(data?.data) ? (data.data as StaffBranch[]) : [];
}

export function findAssignedBranch(
  employee: StaffEmployee,
  branches: StaffBranch[]
): StaffBranch | null {
  const matchedBranch = branches.find((branch) => {
    if (branch.code && employee.branch_code && branch.code === employee.branch_code) return true;
    if (branch.name && employee.branch && branch.name === employee.branch) return true;
    if (branch.name && employee.branch_code && branch.name === employee.branch_code) return true;

    return false;
  });

  return matchedBranch || branches[0] || null;
}

export async function getStaffPortalData(token: string): Promise<{
  employee: StaffEmployee | null;
  assignedBranch: StaffBranch | null;
}> {
  const employee = await getStaffEmployeeByToken(token);

  if (!employee) {
    return {
      employee: null,
      assignedBranch: null,
    };
  }

  const branches = await getMetadataBranches();
  const assignedBranch = findAssignedBranch(employee, branches);

  return {
    employee,
    assignedBranch,
  };
}