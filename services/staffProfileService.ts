import { supabase } from '@/lib/supabase';
import type { Employee } from '@/lib/types/employee';
import type { Facility } from '@/lib/types/facility';
import {
  findAssignedBranch,
  getMetadataBranches,
  getStaffEmployeeByToken,
} from '@/services/staffPortalService';

export function getShiftWageByTitle(title?: string | null): number {
  const formattedTitle = (title || '').trim().toUpperCase();

  if (formattedTitle === 'A1') return 150000;

  return 100000;
}

export async function getStaffProfileData(params: {
  token?: string | null;
  workerData?: Employee | null;
}): Promise<{
  employee: Employee | null;
  assignedBranch: Facility | null;
}> {
  let employee = params.workerData || null;

  if (!employee && params.token) {
    employee = await getStaffEmployeeByToken(params.token);
  }

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

export async function updateStaffProfile(params: {
  employeeId: number | string;
  phone: string;
  bankName: string;
  bankAccountNumber: string;
}): Promise<void> {
  const { error } = await supabase
    .from('employees')
    .update({
      phone: params.phone.trim(),
      bank_name: params.bankName.trim(),
      bank_account_number: params.bankAccountNumber.trim(),
    })
    .eq('id', params.employeeId);

  if (error) throw error;
}