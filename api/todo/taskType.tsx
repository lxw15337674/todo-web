import { service } from 'api';
import { TaskType } from './interface';
import { useTodoStore } from 'store/todo';

export function getTaskTypeList(): Promise<TaskType[]> {
  return service.get('/taskType/findAll').then((taskTypes) => {
    useTodoStore.setState({ taskTypes });
    return taskTypes;
  });
}
export function createTaskType(name: string): Promise<TaskType> {
  return service.post('/taskType/create', { name }).then((res) => {
    getTaskTypeList();
    return res;
  });
}

export function updateTaskType(taskTypes: TaskType): Promise<void> {
  return service.patch('/taskType/update', taskTypes).then(() => {
    getTaskTypeList();
  });
}

export function removeTaskType(id: string): Promise<void> {
  return service.post(`/taskType/remove/${id}`).then((res) => {
    return res;
  });
}
