import { NextResponse } from 'next/server';
import { getDistance } from 'geolib';
import { createClient } from '@/utils/supabase/server';
import {
  businessMonthFromDateInput,
  businessMonthFromInstant,
  businessMonthRange,
  formatBusinessDateInput,
  formatBusinessMonthInput,
  businessDateFromInstant,
} from '@/lib/business-date';
import type { AttendanceRecord } from '@/lib/types/attendance';
import type { Facility } from '@/lib/types/facility';
import { calculateHoursFromStrings, calculateSalary } from '@/services/payrollService';
import { loadAttendanceData } from '@/services/server/attendanceData';
import {
  AuthFlowError,
  requireWorkspaceAccess,
  type ServerEmployee,
} from '@/services/server/auth';

const ATTENDANCE_SELECT =
  'id, employee_id, work_date, shift_name, check_in, check_out, total_hours, total_salary, status';
const FACILITY_SELECT = 'id, name, facility_name, code, lat, lng, radius';

function normalizeTimeValue(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.length === 5 ? `${value}:00` : value;
}

function getEmployeeHourlyRate(employee: ServerEmployee): number {
  return Number(employee.hourly_rate || 30000);
}

function autoDetectShift(date: Date) {
  const hour = date.getHours();

  if (hour >= 6 && hour < 12) return 'Ca Sáng';
  if (hour >= 12 && hour < 18) return 'Ca Chiều';

  return 'Ca Tối';
}

function findMatchedBranch(employee: ServerEmployee, branches: Facility[]): Facility | null {
  const matchedBranch = branches.find((branch) => {
    if (String(employee.branch_code || '') === String(branch.id || '')) return true;

    const branchNameLower = branch.facility_name?.toLowerCase();
    if (employee.branch_code?.toLowerCase() === branchNameLower) return true;

    return false;
  });

  return matchedBranch || null;
}

function resolveBranchName(branch?: Facility | null) {
  return branch?.facility_name || branch?.name || 'Chưa gán cơ sở';
}

function isAttendanceRecordComplete(record: AttendanceRecord): boolean {
  return Boolean(record.check_in && record.check_out);
}

async function loadFacilities() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('facilities').select(FACILITY_SELECT);

  if (error) return [];

  return (data || []) as Facility[];
}

async function getOpenAttendanceRecord(employeeId: number | string, workDate: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('attendance')
    .select(ATTENDANCE_SELECT)
    .eq('employee_id', employeeId)
    .eq('work_date', workDate)
    .is('check_out', null)
    .not('check_in', 'is', null)
    .order('id', { ascending: false })
    .limit(1);

  if (error) throw error;

  return ((data as AttendanceRecord[] | null)?.[0]) || null;
}

async function getAttendanceRecordByShift(
  employeeId: number | string,
  workDate: string,
  shiftName: string
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('attendance')
    .select(ATTENDANCE_SELECT)
    .eq('employee_id', employeeId)
    .eq('work_date', workDate)
    .eq('shift_name', shiftName)
    .order('id', { ascending: true })
    .limit(1);

  if (error) throw error;

  return ((data as AttendanceRecord[] | null)?.[0]) || null;
}

async function loadAttendancePayload(employee: ServerEmployee, monthInput: string) {
  const month = businessMonthFromDateInput(monthInput);
  const monthRange = businessMonthRange(month);
  const startDate = formatBusinessDateInput(monthRange.localStart);
  const endDate = formatBusinessDateInput(monthRange.localEnd);
  const todayStr = formatBusinessDateInput(businessDateFromInstant(new Date()));
  const currentShift = autoDetectShift(new Date());

  const openRecord = await getOpenAttendanceRecord(employee.id, todayStr);
  const currentShiftRecord = openRecord
    ? null
    : await getAttendanceRecordByShift(employee.id, todayStr, currentShift);
  const branches = await loadFacilities();
  const matchedBranch = findMatchedBranch(employee, branches);
  const attendancePayload = await loadAttendanceData({
    monthInput,
    employeeId: employee.id,
    includeDirectory: false,
  });

  return {
    employee: {
      id: employee.id,
      employee_id: employee.employee_id ?? null,
      full_name: employee.full_name,
      title: employee.title ?? null,
      branch: employee.branch ?? null,
      branch_code: employee.branch_code ?? null,
      hourly_rate: employee.hourly_rate ?? null,
    },
    localBranchName: resolveBranchName(matchedBranch),
    todayRecord: openRecord || currentShiftRecord || null,
    isInShift: Boolean(openRecord),
    attendanceHistory: attendancePayload.attendanceRecords,
    sourceCounts: attendancePayload.sourceCounts,
  };
}

function toErrorResponse(error: unknown) {
  if (error instanceof AuthFlowError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  return NextResponse.json({ error: 'Không thể xử lý dữ liệu chấm công.' }, { status: 500 });
}

export async function GET(request: Request) {
  try {
    const authContext = await requireWorkspaceAccess('STAFF_WORKSPACE');
    const url = new URL(request.url);
    const monthInput =
      url.searchParams.get('month') ||
      formatBusinessMonthInput(businessMonthFromInstant(new Date()));

    const payload = await loadAttendancePayload(authContext.employee, monthInput);

    return NextResponse.json(payload);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const authContext = await requireWorkspaceAccess('STAFF_WORKSPACE');
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const userLat = Number(body?.userLat);
    const userLng = Number(body?.userLng);

    if (!Number.isFinite(userLat) || !Number.isFinite(userLng)) {
      return NextResponse.json({ error: 'Thiếu thông tin định vị hợp lệ.' }, { status: 400 });
    }

    const branches = await loadFacilities();
    const matchedBranch = findMatchedBranch(authContext.employee, branches);

    if (!matchedBranch || !matchedBranch.lat || !matchedBranch.lng || !matchedBranch.radius) {
      return NextResponse.json(
        { error: 'Cơ sở được giao chưa được cấu hình tọa độ GPS.' },
        { status: 400 }
      );
    }

    const distance = getDistance(
      { latitude: userLat, longitude: userLng },
      { latitude: Number(matchedBranch.lat), longitude: Number(matchedBranch.lng) }
    );

    if (distance > Number(matchedBranch.radius)) {
      return NextResponse.json(
        { error: `Vị trí sai! Bạn đang cách cơ sở khoảng ${Math.round(distance)} mét.` },
        { status: 403 }
      );
    }

    const now = new Date();
    const todayStr = formatBusinessDateInput(businessDateFromInstant(now));
    const timeStr = now.toLocaleTimeString('vi-VN', { hour12: false });
    const currentShift = autoDetectShift(now);
    const openRecord = await getOpenAttendanceRecord(authContext.employee.id, todayStr);
    const supabase = await createClient();

    if (openRecord) {
      const timeOut = normalizeTimeValue(timeStr);
      const totalHours = calculateHoursFromStrings(openRecord.check_in || null, timeOut);
      const totalSalary = calculateSalary(totalHours, getEmployeeHourlyRate(authContext.employee));
      const { error } = await supabase
        .from('attendance')
        .update({
          check_out: timeOut,
          total_hours: totalHours,
          total_salary: totalSalary,
          status: 'PRESENT',
        })
        .eq('id', openRecord.id)
        .eq('employee_id', authContext.employee.id);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: `Đã tan ca [${openRecord.shift_name}] thành công.`,
      });
    }

    const existingShift = await getAttendanceRecordByShift(
      authContext.employee.id,
      todayStr,
      currentShift
    );

    if (existingShift) {
      return NextResponse.json({
        success: true,
        message: `Ca [${currentShift}] đã có dữ liệu chấm công.`,
      });
    }

    const { error } = await supabase.from('attendance').insert([
      {
        employee_id: authContext.employee.id,
        work_date: todayStr,
        shift_name: currentShift,
        check_in: normalizeTimeValue(timeStr),
        status: 'PRESENT',
      },
    ]);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `Đã ghi nhận [${currentShift}] lúc ${timeStr}.`,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
