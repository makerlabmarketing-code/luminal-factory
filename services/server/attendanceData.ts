import 'server-only';

import { createClient } from '@/utils/supabase/server';
import {
  businessDateFromInstant,
  businessMonthFromDateInput,
  businessMonthRange,
  formatBusinessDateInput,
} from '@/lib/business-date';
import type { AttendanceRecord, Shift } from '@/lib/types/attendance';
import type { Employee } from '@/lib/types/employee';
import {
  enrichAttendanceRecord,
  mergeAttendanceRecords,
  normalizeTimeValue,
} from '@/services/attendanceService';

export const ATTENDANCE_SELECT =
  'id, employee_id, work_date, shift_name, check_in, check_out, total_hours, total_salary, status';
export const ATTENDANCE_LOG_SELECT =
  'id, employee_id, check_in_time, check_out_time, hours_worked, earnings_today, status';
export const EMPLOYEE_SELECT =
  'id, full_name, title, status, hourly_rate, base_salary_per_hour';
export const SHIFT_SELECT = 'id, shift_name, start_time, end_time';

interface AttendanceLogRow {
  id: number | string;
  employee_id: number | string;
  check_in_time?: string | null;
  check_out_time?: string | null;
  hours_worked?: number | string | null;
  earnings_today?: number | string | null;
  status?: string | null;
}

interface AttendanceQueryRange {
  startDate: string;
  endDate: string;
  queryStartIso: string;
  queryEndIso: string;
}

export interface AttendanceDataResult {
  employees: Employee[];
  shifts: Shift[];
  attendanceRecords: AttendanceRecord[];
  sourceCounts: {
    attendance: number;
    attendanceLogs: number;
  };
}

function timeFromInstant(value?: string | null): string | null {
  if (!value) return null;

  const instant = new Date(value);
  if (!Number.isFinite(instant.getTime())) return null;

  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).format(instant);
}

function toNumberOrNull(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;

  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : null;
}

function getMonthRange(monthInput: string): AttendanceQueryRange {
  const month = businessMonthFromDateInput(monthInput);
  const monthRange = businessMonthRange(month);

  return {
    startDate: formatBusinessDateInput(monthRange.localStart),
    endDate: formatBusinessDateInput(monthRange.localEnd),
    queryStartIso: monthRange.queryStart.toISOString(),
    queryEndIso: monthRange.queryEnd.toISOString(),
  };
}

function attendanceLogToRecord(log: AttendanceLogRow): AttendanceRecord | null {
  if (!log.check_in_time) return null;

  const workDate = formatBusinessDateInput(businessDateFromInstant(log.check_in_time));
  const checkIn = timeFromInstant(log.check_in_time);
  const checkOut = timeFromInstant(log.check_out_time);

  return enrichAttendanceRecord({
    id: `log-${log.id}`,
    employee_id: log.employee_id,
    work_date: workDate,
    shift_name: 'Log cũ',
    check_in: normalizeTimeValue(checkIn),
    check_out: normalizeTimeValue(checkOut),
    total_hours: toNumberOrNull(log.hours_worked),
    total_salary: toNumberOrNull(log.earnings_today),
    status: log.status || null,
    source: 'attendance_logs',
  });
}

export async function loadAttendanceData(params: {
  monthInput: string;
  employeeId?: number | string | null;
  includeDirectory?: boolean;
}): Promise<AttendanceDataResult> {
  const supabase = await createClient();
  const range = getMonthRange(params.monthInput);
  const includeDirectory = params.includeDirectory !== false;

  let attendanceQuery = supabase
    .from('attendance')
    .select(ATTENDANCE_SELECT)
    .gte('work_date', range.startDate)
    .lt('work_date', range.endDate)
    .order('work_date', { ascending: false })
    .order('id', { ascending: false });
  let logQuery = supabase
    .from('attendance_logs')
    .select(ATTENDANCE_LOG_SELECT)
    .gte('check_in_time', range.queryStartIso)
    .lt('check_in_time', range.queryEndIso)
    .order('check_in_time', { ascending: false });

  if (params.employeeId !== null && params.employeeId !== undefined) {
    attendanceQuery = attendanceQuery.eq('employee_id', params.employeeId);
    logQuery = logQuery.eq('employee_id', params.employeeId);
  }

  const [attendanceResult, logResult, employeeResult, shiftResult] = await Promise.all([
    attendanceQuery,
    logQuery,
    includeDirectory ? supabase.from('employees').select(EMPLOYEE_SELECT).order('full_name') : Promise.resolve(null),
    includeDirectory ? supabase.from('shifts').select(SHIFT_SELECT).order('start_time') : Promise.resolve(null),
  ]);

  if (attendanceResult.error) throw attendanceResult.error;
  if (logResult.error) throw logResult.error;
  if (employeeResult?.error) throw employeeResult.error;
  if (shiftResult?.error) throw shiftResult.error;

  const attendanceRecords = ((attendanceResult.data || []) as AttendanceRecord[]).map((record) =>
    enrichAttendanceRecord({ ...record, source: 'attendance' })
  );
  const logRecords = ((logResult.data || []) as AttendanceLogRow[])
    .map(attendanceLogToRecord)
    .filter((record): record is AttendanceRecord => Boolean(record));
  const mergedRecords = mergeAttendanceRecords([...attendanceRecords, ...logRecords]).sort((a, b) => {
    if (a.work_date !== b.work_date) return b.work_date.localeCompare(a.work_date);
    return String(b.id).localeCompare(String(a.id));
  });

  return {
    employees: (employeeResult?.data || []) as Employee[],
    shifts: (shiftResult?.data || []) as Shift[],
    attendanceRecords: mergedRecords,
    sourceCounts: {
      attendance: attendanceRecords.length,
      attendanceLogs: logRecords.length,
    },
  };
}
