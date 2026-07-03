export interface WorkflowTask {
    name?: string;
    assignee?: string;
    status?: 'TODO' | 'DOING' | 'DONE' | string;
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