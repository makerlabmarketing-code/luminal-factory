import { supabase } from '@/lib/supabase';
import type {
  WorkflowPhaseRow,
  WorkflowProjectRow,
  WorkflowTaskRow,
} from '@/lib/types/workflow';

type GenericRow = Record<string, unknown>;

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return null;
}

function pickFirstText(row: GenericRow, keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'string' && value.trim() !== '') return value;
  }
  return '';
}

function pickFirstNumber(row: GenericRow, keys: string[]): number | null {
  for (const key of keys) {
    const value = toNumber(row[key]);
    if (value !== null) return value;
  }
  return null;
}

export function normalizeProjectRow(row: GenericRow): WorkflowProjectRow | null {
  const id = pickFirstNumber(row, ['id']);
  if (id === null) return null;

  return {
    id,
    name: pickFirstText(row, ['name', 'project_name', 'title']) || `Project ${id}`,
    project_deadline: pickFirstText(row, ['project_deadline', 'deadline', 'due_date']) || null,
    drive_link: pickFirstText(row, ['drive_link', 'project_drive_link', 'google_drive_link']) || null,
  };
}

export function normalizePhaseRow(row: GenericRow): WorkflowPhaseRow | null {
  const id = pickFirstNumber(row, ['id']);
  const projectId = pickFirstNumber(row, ['project_id']);
  if (id === null || projectId === null) return null;

  return {
    id,
    project_id: projectId,
    name: pickFirstText(row, ['name', 'phase_name', 'title']) || `Giai doan ${id}`,
    order_index: pickFirstNumber(row, ['order_index', 'sort_order', 'position']) ?? 0,
    status: pickFirstText(row, ['status', 'phase_status', 'value']) || 'TODO',
  };
}

export function normalizeTaskRow(row: GenericRow): WorkflowTaskRow | null {
  const id = pickFirstNumber(row, ['id']);
  const phaseId = pickFirstNumber(row, ['phase_id']);
  if (id === null || phaseId === null) return null;

  const assigneeId = pickFirstNumber(row, ['assignee_id', 'employee_id']);
  const assigneeName = pickFirstText(row, ['assignee_name', 'employee_name', 'assignee']);

  return {
    id,
    phase_id: phaseId,
    name: pickFirstText(row, ['name', 'task_name', 'title']),
    assignee_id: assigneeId,
    assignee_name: assigneeName,
    assignee: assigneeName || (assigneeId !== null ? String(assigneeId) : ''),
    deadline: pickFirstText(row, ['deadline', 'due_date']),
    note: pickFirstText(row, ['note', 'description', 'remarks']),
    status: pickFirstText(row, ['status', 'task_status', 'value']) || 'TODO',
  };
}

async function tryUpdateById(
  table: 'projects' | 'phases' | 'tasks',
  id: number,
  payloads: GenericRow[]
): Promise<void> {
  let lastError: Error | null = null;

  for (const payload of payloads) {
    const { error } = await supabase.from(table).update(payload).eq('id', id);
    if (!error) return;
    lastError = error;
  }

  throw lastError || new Error(`Khong cap nhat duoc bang ${table}.`);
}

export class WorkflowRepository {
  async listProjects(): Promise<WorkflowProjectRow[]> {
    const { data, error } = await supabase.from('projects').select('*').order('id', { ascending: false });
    if (error) throw error;

    return (data || [])
      .map((row) => normalizeProjectRow(row as GenericRow))
      .filter((row): row is WorkflowProjectRow => row !== null);
  }

  async listPhasesByProjectIds(projectIds: number[]): Promise<WorkflowPhaseRow[]> {
    if (projectIds.length === 0) return [];

    const { data, error } = await supabase
      .from('phases')
      .select('*')
      .in('project_id', projectIds)
      .order('id', { ascending: true });

    if (error) throw error;

    return (data || [])
      .map((row) => normalizePhaseRow(row as GenericRow))
      .filter((row): row is WorkflowPhaseRow => row !== null);
  }

  async listTasksByPhaseIds(phaseIds: number[]): Promise<WorkflowTaskRow[]> {
    if (phaseIds.length === 0) return [];

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .in('phase_id', phaseIds)
      .order('id', { ascending: true });

    if (error) throw error;

    return (data || [])
      .map((row) => normalizeTaskRow(row as GenericRow))
      .filter((row): row is WorkflowTaskRow => row !== null);
  }

  async insertProject(params: {
    projectName: string;
    projectDeadline: string;
  }): Promise<number> {
    const payloads: GenericRow[] = [
      {
        name: params.projectName.trim(),
        project_deadline: params.projectDeadline,
        drive_link: '',
      },
      {
        project_name: params.projectName.trim(),
        deadline: params.projectDeadline,
        project_drive_link: '',
      },
      {
        title: params.projectName.trim(),
        due_date: params.projectDeadline,
        google_drive_link: '',
      },
    ];

    let lastError: Error | null = null;

    for (const payload of payloads) {
      const { data, error } = await supabase.from('projects').insert([payload]).select('*').single();
      if (!error && data) {
        const project = normalizeProjectRow(data as GenericRow);
        if (project) return project.id;
      }
      if (error) lastError = error;
    }

    throw lastError || new Error('Khong tao duoc du an.');
  }

  async insertPhase(params: {
    projectId: number;
    phaseName: string;
    orderIndex: number;
    status: string;
  }): Promise<number> {
    const payloads: GenericRow[] = [
      {
        project_id: params.projectId,
        name: params.phaseName,
        order_index: params.orderIndex,
        status: params.status,
      },
      {
        project_id: params.projectId,
        phase_name: params.phaseName,
        sort_order: params.orderIndex,
        phase_status: params.status,
      },
    ];

    let lastError: Error | null = null;

    for (const payload of payloads) {
      const { data, error } = await supabase.from('phases').insert([payload]).select('*').single();
      if (!error && data) {
        const phase = normalizePhaseRow(data as GenericRow);
        if (phase) return phase.id;
      }
      if (error) lastError = error;
    }

    throw lastError || new Error('Khong tao duoc phase.');
  }

  async insertTasks(tasks: GenericRow[]): Promise<void> {
    if (tasks.length === 0) return;

    const { error } = await supabase.from('tasks').insert(tasks);
    if (!error) return;

    const fallbackTasks = tasks.map((task) => ({
      phase_id: task.phase_id,
      task_name: task.name,
      assignee_id: task.assignee_id,
      assignee_name: task.assignee_name,
      due_date: task.deadline,
      description: task.note,
      task_status: task.status,
    }));

    const { error: fallbackError } = await supabase.from('tasks').insert(fallbackTasks);
    if (fallbackError) throw fallbackError;
  }

  async updatePhaseStatus(phaseId: number, status: string): Promise<void> {
    await tryUpdateById('phases', phaseId, [{ status }, { phase_status: status }, { value: status }]);
  }

  async updateProjectDriveLink(projectId: number, driveLink: string): Promise<void> {
    await tryUpdateById('projects', projectId, [
      { drive_link: driveLink },
      { project_drive_link: driveLink },
      { google_drive_link: driveLink },
    ]);
  }

  async updateTaskField(params: {
    taskId: number;
    field: 'assignee' | 'deadline' | 'note' | 'status' | 'assignee_id' | 'assignee_name';
    value: string | number | null;
  }): Promise<void> {
    const payloadsByField: Record<string, GenericRow[]> = {
      assignee: [{ assignee: params.value }, { assignee_name: params.value }],
      assignee_id: [{ assignee_id: params.value }, { employee_id: params.value }],
      assignee_name: [{ assignee_name: params.value }, { assignee: params.value }, { employee_name: params.value }],
      deadline: [{ deadline: params.value }, { due_date: params.value }],
      note: [{ note: params.value }, { description: params.value }, { remarks: params.value }],
      status: [{ status: params.value }, { task_status: params.value }, { value: params.value }],
    };

    await tryUpdateById('tasks', params.taskId, payloadsByField[params.field] || [{ [params.field]: params.value }]);
  }

  async updateTask(params: {
    taskId: number;
    status: string;
    deadline: string;
    note: string;
  }): Promise<void> {
    await tryUpdateById('tasks', params.taskId, [
      {
        status: params.status,
        deadline: params.deadline || null,
        note: params.note,
      },
      {
        task_status: params.status,
        due_date: params.deadline || null,
        description: params.note,
      },
    ]);
  }

  async deleteProject(projectId: number): Promise<void> {
    const { error } = await supabase.from('projects').delete().eq('id', projectId);
    if (error) throw error;
  }
}

export const workflowRepository = new WorkflowRepository();
