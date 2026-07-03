export type { Employee as StaffEmployee } from './employee';
export type { Facility as StaffBranch } from './facility';
export type { FinancialLedgerEntry } from './finance';
export type {
  WorkflowTask,
  WorkflowDescription,
  WorkflowSetting,
  EditableWorkflowTask,
} from './workflow';

export type StaffPortalTab = 'attendance' | 'tasks' | 'expenses' | 'profile';