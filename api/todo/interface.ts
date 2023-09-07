export type Status = 'todo' | 'doing' | 'done';

export interface Task {
  id?: number;
  title?: string;
  remark?: string;
  type?: string;
  status?: Status;
  priority?: string;
}
