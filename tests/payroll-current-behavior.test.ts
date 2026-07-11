import { describe, expect, it } from 'vitest';
import {
  currentPayrollHoursFixtures,
  currentPayrollSalaryFixtures,
} from './fixtures/current-payroll-behavior';
import {
  calculateHoursFromStrings,
  calculateSalary,
} from '../services/payrollService';

describe('current payroll calculation behavior', () => {
  it.each(currentPayrollHoursFixtures)('$name', (fixture) => {
    expect(calculateHoursFromStrings(fixture.checkIn, fixture.checkOut)).toBe(
      fixture.expectedHours
    );
  });

  it.each(currentPayrollSalaryFixtures)('$name', (fixture) => {
    expect(calculateSalary(fixture.hours, fixture.hourlyRate)).toBe(
      fixture.expectedSalary
    );
  });
});

