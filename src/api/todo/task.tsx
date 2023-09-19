import { service } from '..';
import { Task } from './interface';
import { useTodoStore } from 'store/todo';

export function getTaskList(): Promise<Task[]> {
  return service.get('/task/findAll').then((tasks) => {
    useTodoStore.setState({ tasks });
    return tasks;
  });
}
export function createTask(task: Task): Promise<Task> {
  return service.post('/task/create', task).then(() => {
    getTaskList();
    return task;
  });
}

export function updateTask(task: Task): Promise<Task> {
  return service.patch('/task/update', task).then(() => {
    getTaskList();
    return task;
  });
}

export function getTaskByTitle(title: string): Promise<Task[]> {
  return service.get(`/task/findByTitle/${title}`).then((res) => {
    return res;
  });
}

export function removeTask(id: string): Promise<void> {
  return service.post(`/task/remove/${id}`);
}
