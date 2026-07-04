export type WorkflowTaskStatus = 'TODO' | 'DOING' | 'DONE' | string;

export interface WorkflowTask {
  id?: number;
  phase_id?: number | null;
  name?: string;
  assignee?: string;
  assignee_id?: number | string | null;
  assignee_name?: string;
  status?: WorkflowTaskStatus;
  deadline?: string;
  note?: string;
}

export interface WorkflowDescription {
  project_drive_link?: string;
  project_deadline?: string;
  tasks_list?: WorkflowTask[];
}

export interface WorkflowSetting {
  id?: number | string;
  key: string;
  project_id?: number;
  phase_id?: number;
  value?: string | null;
  group_name?: string | null;
  config_name?: string | null;
  param_type?: string | null;
  description?: string | null;
}

export interface EditableWorkflowTask {
  status: string;
  deadline: string;
  note: string;
}

export interface WorkflowProject {
  id: number;
  name: string;
  project_deadline?: string | null;
  drive_link?: string | null;
  phases?: WorkflowPhase[];
}

export interface WorkflowPhase {
  id: number;
  project_id: number;
  name: string;
  order_index?: number | null;
  status?: string | null;
  tasks?: WorkflowTask[];
}

export type WorkflowProjectRow = WorkflowProject;
export type WorkflowPhaseRow = WorkflowPhase;
export type WorkflowTaskRow = WorkflowTask;

export interface WorkflowProjectInsertInput {
  projectName: string;
  projectDeadline: string;
  phases: WorkflowPhaseFormInput[];
}

export interface WorkflowPhaseFormInput {
  name?: string;
  tasks?: WorkflowTask[];
}
