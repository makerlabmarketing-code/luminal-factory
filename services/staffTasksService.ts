import type { Employee } from '@/lib/types/employee';
import type {
  EditableWorkflowTask,
  WorkflowDescription,
  WorkflowSetting,
} from '@/lib/types/workflow';
import {
  getWorkflowItems,
  updateWorkflowProjectDriveLink,
  updateWorkflowTask,
} from '@/services/workflowService';

export function parseWorkflowDescription(description?: string | null): WorkflowDescription {
  try {
    const parsed = JSON.parse(description || '{}') as WorkflowDescription;

    return {
      project_drive_link: parsed.project_drive_link || '',
      project_deadline: parsed.project_deadline || '',
      tasks_list: Array.isArray(parsed.tasks_list) ? parsed.tasks_list : [],
    };
  } catch {
    return {
      project_drive_link: '',
      project_deadline: '',
      tasks_list: [],
    };
  }
}

export async function getStaffTasksData(params: {
  workerData?: Employee | null;
}): Promise<{
  workerId: number | string | null;
  workerName: string;
  workflowItems: WorkflowSetting[];
}> {
  const employee = params.workerData || null;

  if (!employee) {
    return {
      workerId: null,
      workerName: '',
      workflowItems: [],
    };
  }

  const data = await getWorkflowItems();

  return {
    workerId: employee.employee_id || employee.id,
    workerName: employee.full_name,
    workflowItems: data,
  };
}

export function buildWorkflowEditMaps(workflowItems: WorkflowSetting[]): {
  driveInputs: Record<string, string>;
  editableTasks: Record<string, EditableWorkflowTask>;
} {
  const driveInputs: Record<string, string> = {};
  const editableTasks: Record<string, EditableWorkflowTask> = {};

  workflowItems.forEach((item) => {
    const parsed = parseWorkflowDescription(item.description);

    driveInputs[item.key] = parsed.project_drive_link || '';

    parsed.tasks_list?.forEach((task, index) => {
      editableTasks[`${item.key}_TASK_${index}`] = {
        status: task.status || 'TODO',
        deadline: task.deadline || '',
        note: task.note || '',
      };
    });
  });

  return {
    driveInputs,
    editableTasks,
  };
}

export function groupWorkflowByProject(
  workflowItems: WorkflowSetting[]
): Record<string, WorkflowSetting[]> {
  const groups: Record<string, WorkflowSetting[]> = {};

  workflowItems.forEach((item) => {
    if (!item.config_name) return;

    const projectName = item.config_name.split(' - ')[0];

    if (!groups[projectName]) {
      groups[projectName] = [];
    }

    groups[projectName].push(item);
  });

  return groups;
}

export function getTaskStats(params: {
  workflowItems: WorkflowSetting[];
  workerId?: number | string | null;
  workerName: string;
}): {
  total: number;
  done: number;
  pending: number;
} {
  let total = 0;
  let done = 0;
  let pending = 0;

  params.workflowItems.forEach((item) => {
    const parsed = parseWorkflowDescription(item.description);

    parsed.tasks_list?.forEach((task) => {
      const matchesById =
        params.workerId !== null &&
        params.workerId !== undefined &&
        task.assignee_id !== null &&
        task.assignee_id !== undefined &&
        String(task.assignee_id) === String(params.workerId);
      const matchesByName = task.assignee === params.workerName || task.assignee_name === params.workerName;

      if (!matchesById && !matchesByName) return;

      total += 1;

      if (task.status === 'DONE') {
        done += 1;
      } else {
        pending += 1;
      }
    });
  });

  return {
    total,
    done,
    pending,
  };
}

export async function updateStaffWorkflowTask(params: {
  item: WorkflowSetting;
  taskIndex: number;
  bufferedTask: EditableWorkflowTask;
}): Promise<string> {
  const parsed = parseWorkflowDescription(params.item.description);

  if (!parsed.tasks_list || !parsed.tasks_list[params.taskIndex]) {
    throw new Error('Không tìm thấy đầu việc cần cập nhật.');
  }

  parsed.tasks_list[params.taskIndex] = {
    ...parsed.tasks_list[params.taskIndex],
    status: params.bufferedTask.status,
    deadline: params.bufferedTask.deadline,
    note: params.bufferedTask.note,
  };

  const updatedDescription = JSON.stringify(parsed);
  const taskId = parsed.tasks_list[params.taskIndex].id;

  if (!taskId) {
    throw new Error('Khong tim thay ID dau viec can cap nhat.');
  }

  await updateWorkflowTask({
    taskId,
    status: params.bufferedTask.status,
    deadline: params.bufferedTask.deadline,
    note: params.bufferedTask.note,
  });

  return updatedDescription;
}

export async function updateProjectDriveLink(params: {
  projectName: string;
  driveLink: string;
}): Promise<void> {
  const phases = await getWorkflowItems();
  const projectPhase = phases.find(
    (phase) => phase.config_name?.split(' - ')[0] === params.projectName
  );

  if (!projectPhase?.project_id) return;

  await updateWorkflowProjectDriveLink({
    projectId: projectPhase.project_id,
    driveLink: params.driveLink,
  });
}
