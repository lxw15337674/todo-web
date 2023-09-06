import { service } from 'api';
import { Task } from './interface';

export function createTask(task: Task): Promise<Task> {
  return service.post('/task/create', task).then((res) => {
    console.log(res);
    return res;
  });
}
