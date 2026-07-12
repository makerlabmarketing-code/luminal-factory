import 'server-only';

import { createClient } from '@/ultis/supabase/server';
import type { Facility } from '@/lib/types/facility';
import {
  requireAuthenticatedEmployee,
  type ServerEmployee,
  toPublicStaffEmployee,
} from '@/services/server/auth';

export function findAssignedBranch(
  employee: Pick<ServerEmployee, 'branch' | 'branch_code'>,
  branches: Facility[]
): Facility | null {
  const matchedBranch = branches.find((branch) => {
    if (branch.code && employee.branch_code && branch.code === employee.branch_code) return true;
    if (branch.name && employee.branch && branch.name === employee.branch) return true;
    if (branch.name && employee.branch_code && branch.name === employee.branch_code) return true;
    if (branch.facility_name && employee.branch_code && branch.facility_name === employee.branch_code) return true;

    return false;
  });

  return matchedBranch || null;
}

async function getMetadataBranches(): Promise<Facility[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('system_metadata')
    .select('data')
    .eq('name', 'Danh sách Chi nhánh')
    .maybeSingle();

  if (error) return [];

  const payload = data?.data;

  return Array.isArray(payload) ? (payload as Facility[]) : [];
}

export async function getAuthenticatedStaffPortalData() {
  const authContext = await requireAuthenticatedEmployee();
  const branches = await getMetadataBranches();

  return {
    employee: toPublicStaffEmployee(authContext.employee),
    assignedBranch: findAssignedBranch(authContext.employee, branches),
  };
}
