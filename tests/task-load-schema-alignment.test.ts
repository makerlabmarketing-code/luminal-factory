import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const repositoryRoot = join(__dirname, '..');

function source(relativePath: string): string {
  return readFileSync(join(repositoryRoot, relativePath), 'utf8');
}

describe('task load schema alignment', () => {
  it('loads the employee directory by employees.id, not employees.employee_id', () => {
    const employeeService = source('services/employeeService.ts');
    const taskPage = source('app/admin/tasks/page.tsx');

    expect(employeeService).toMatch(/select\('id, full_name, title, status'\)/);
    expect(employeeService).not.toMatch(/select\([^)]*employee_id/);
    expect(taskPage).not.toMatch(/employee\.employee_id|emp\.employee_id|e\.employee_id|matchedEmployee\?\.employee_id/);
  });

  it('keeps legacy tasks assigned_to and packer_assigned as text, not fake employee relations', () => {
    const repository = source('services/repositories/workflowRepository.ts');

    expect(repository).toMatch(/assigned_to/);
    expect(repository).toMatch(/packer_assigned/);
    expect(repository).toMatch(/select\('id, project_name, assigned_to, current_phase, estimation_date, issue_note, packer_assigned, created_at'\)/);
    expect(repository).not.toMatch(/pickFirstNumber\(row, \['assignee_id', 'employee_id'\]\)/);
    expect(repository).not.toMatch(/\{ employee_id: params\.value \}/);
  });

  it('maps legacy task assignment text without inventing an employee id', () => {
    const repository = source('services/repositories/workflowRepository.ts');

    expect(repository).toMatch(/const assignedToText = pickFirstText\(row, \['assigned_to'\]\)/);
    expect(repository).toMatch(/const packerAssignedText = pickFirstText\(row, \['packer_assigned'\]\)/);
    expect(repository).toMatch(/const assigneeName = assignedToText \|\| packerAssignedText/);
    expect(repository).toMatch(/phase_id: null/);
    expect(repository).toMatch(/assignee_id: null/);
  });

  it('keeps orphan and partially empty task rows mappable', () => {
    const repository = source('services/repositories/workflowRepository.ts');

    expect(repository).toMatch(/if \(id === null\) return null/);
    expect(repository).toMatch(/project_name: pickFirstText\(row as GenericRow, \['project_name'\]\)/);
    expect(repository).toMatch(/status: pickFirstText\(row, \['current_phase', 'status', 'task_status', 'value'\]\) \|\| 'TODO'/);
    expect(repository).toMatch(/name: pickFirstText\(row, \['task_name', 'name', 'project_name'\]\) \|\| `Task \$\{id\}`/);
  });

  it('does not turn task load failures into an empty list or expose raw database text', () => {
    const taskPage = source('app/admin/tasks/page.tsx');
    const workflowService = source('services/workflowService.ts');

    expect(taskPage).toMatch(/Không thể tải dữ liệu công việc\./);
    expect(taskPage).not.toMatch(/showToast\('Lỗi tải dữ liệu', e\.message/);
    expect(workflowService).not.toMatch(/catch\s*\([^)]*\)\s*\{\s*return\s*\[\]/);
  });

  it('keeps staff_tasks employee relations on employee_id while employees use id', () => {
    const repository = source('services/repositories/workflowRepository.ts');

    expect(repository).not.toMatch(/employees!inner/);
    expect(repository).not.toMatch(/employees\.employee_id/);
  });
});
