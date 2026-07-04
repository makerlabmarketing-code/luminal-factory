import { supabase } from '@/lib/supabase';
import type { Employee } from '@/lib/types/employee';
import type { Facility } from '@/lib/types/facility';

export async function getStaffEmployeeByToken(token: string): Promise<Employee | null> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('qr_token', token)
    .maybeSingle();

  if (error) throw error;

  return (data as Employee | null) || null;
}

export async function getStaffEmployeeById(employeeId: number | string): Promise<Employee | null> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', employeeId)
    .maybeSingle();

  if (error) throw error;

  return (data as Employee | null) || null;
}

export async function getMetadataBranches(): Promise<Facility[]> {
  const { data, error } = await supabase
    .from('system_metadata')
    .select('data')
    .eq('name', 'Danh sách Chi nhánh')
    .maybeSingle();

  if (error) throw error;

  const payload = data?.data;
  return Array.isArray(payload) ? (payload as Facility[]) : [];
}

export function findAssignedBranch(employee: Employee, branches: Facility[]): Facility | null {
  const matchedBranch = branches.find((branch) => {
    if (branch.code && employee.branch_code && branch.code === employee.branch_code) return true;
    if (branch.name && employee.branch && branch.name === employee.branch) return true;
    if (branch.name && employee.branch_code && branch.name === employee.branch_code) return true;
    if (branch.facility_name && employee.branch_code && branch.facility_name === employee.branch_code) return true;

    return false;
  });

  return matchedBranch || null;
}

export async function getStaffPortalData(token: string): Promise<{
  employee: Employee | null;
  assignedBranch: Facility | null;
}> {
  const employee = await getStaffEmployeeByToken(token);

  if (!employee) {
    return {
      employee: null,
      assignedBranch: null,
    };
  }

  const branches = await getMetadataBranches();

  return {
    employee,
    assignedBranch: findAssignedBranch(employee, branches),
  };
}
