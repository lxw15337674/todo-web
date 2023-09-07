import { service } from 'api';
import { Task } from './interface';
import { useTodoStore } from 'pages/todo/store';

export function createTask(task: Task): Promise<Task> {
  return service.post('/task/create', task);
}

export function updateTask(task: Task): Promise<Task> {
  return service.patch('/task/update', task);
}

export function getTaskList(): Promise<Task[]> {
  return service.get('/task/findAll').then((tasks) => {
    useTodoStore.setState({ tasks });
    return tasks;
  });
}

export function getTaskByTitle(title: string): Promise<Task[]> {
  return service.get(`/task/findByTitle/${title}`).then((res) => {
    return res;
  });
}

export function removeTask(id: string): Promise<Task[]> {
  return service.post(`/task/remove/${id}`).then((res) => {
    return res;
  });
}
