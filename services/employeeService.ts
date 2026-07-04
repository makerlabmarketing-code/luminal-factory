import { supabase } from '@/lib/supabase';
import type { Employee } from '@/lib/types/employee';

export async function getActiveEmployees(): Promise<Employee[]> {
  const { data, error } = await supabase
    .from('employees')
    .select('id, employee_id, full_name, title, status')
    .eq('status', 'ACTIVE')
    .order('full_name', { ascending: true });

  if (error) throw error;

  return (data || []) as Employee[];
}

export function getEmployeeLabel(employee: Employee | null | undefined): string {
  if (!employee) return '';
  return employee.full_name || String(employee.employee_id || employee.id || '');
}

export function findEmployeeByIdentifier(
  employees: Employee[],
  identifier?: string | number | null
): Employee | undefined {
  if (identifier === null || identifier === undefined || identifier === '') return undefined;

  return employees.find((employee) => {
    return (
      String(employee.id) === String(identifier) ||
      String(employee.employee_id) === String(identifier)
    );
  });
}

export function findEmployeeByName(
  employees: Employee[],
  fullName?: string | null
): Employee | undefined {
  if (!fullName) return undefined;
  return employees.find((employee) => employee.full_name === fullName);
}
