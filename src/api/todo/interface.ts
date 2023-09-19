export type Status = 'todo' | 'doing' | 'done';

export interface Task {
  id?: number;
  title?: string;
  remark?: string;
  type?: string;
  status?: Status;
  priority?: string;
  createTime?: string;
  finishTime?: string;
  updateTime?: string;
  userId?: number;
}

export interface TaskType {
  id: string;
  name: string;
  userId: number;
  color: string;
}
