export interface PayrollHoursFixture {
  readonly name: string;
  readonly checkIn: string | null;
  readonly checkOut: string | null;
  readonly expectedHours: number;
}

export interface PayrollSalaryFixture {
  readonly name: string;
  readonly hours: number;
  readonly hourlyRate: number;
  readonly expectedSalary: number;
}

export const currentPayrollHoursFixtures: readonly PayrollHoursFixture[] = [
  {
    name: 'missing check-in returns zero',
    checkIn: null,
    checkOut: '12:00',
    expectedHours: 0,
  },
  {
    name: 'missing check-out returns zero',
    checkIn: '09:00',
    checkOut: null,
    expectedHours: 0,
  },
  {
    name: 'same minute returns zero',
    checkIn: '09:00',
    checkOut: '09:00',
    expectedHours: 0,
  },
  {
    name: 'one minute rounds up to one 3-hour block',
    checkIn: '09:00',
    checkOut: '09:01',
    expectedHours: 3,
  },
  {
    name: 'exact 3-hour block stays 3 hours',
    checkIn: '09:00',
    checkOut: '12:00',
    expectedHours: 3,
  },
  {
    name: '3 hours and 1 minute rounds up to 6 hours',
    checkIn: '09:00',
    checkOut: '12:01',
    expectedHours: 6,
  },
  {
    name: '9-hour day stays 9 hours',
    checkIn: '09:00',
    checkOut: '18:00',
    expectedHours: 9,
  },
  {
    name: 'overnight 3-hour shift is supported',
    checkIn: '22:00',
    checkOut: '01:00',
    expectedHours: 3,
  },
  {
    name: 'seconds are ignored by current HH:mm truncation',
    checkIn: '09:00:59',
    checkOut: '12:00:01',
    expectedHours: 3,
  },
];

export const currentPayrollSalaryFixtures: readonly PayrollSalaryFixture[] = [
  {
    name: '3 hours at default fallback rate',
    hours: 3,
    hourlyRate: 30000,
    expectedSalary: 90000,
  },
  {
    name: 'fractional hours are rounded to nearest integer salary',
    hours: 1.234,
    hourlyRate: 30000,
    expectedSalary: 37020,
  },
  {
    name: 'zero hours returns zero salary',
    hours: 0,
    hourlyRate: 30000,
    expectedSalary: 0,
  },
  {
    name: 'negative hours returns zero salary',
    hours: -1,
    hourlyRate: 30000,
    expectedSalary: 0,
  },
  {
    name: 'zero hourly rate returns zero salary',
    hours: 3,
    hourlyRate: 0,
    expectedSalary: 0,
  },
];

