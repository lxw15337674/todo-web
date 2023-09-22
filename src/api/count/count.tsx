import { useCountStore } from 'store/count';
import { service } from '..';
import {
  CountItem,
  CountMeta,
  CreateCountMeta,
  UpdateCountMeta,
} from './interface';
import { useNotificationStore } from 'store/notification';

export function getCountList(): Promise<CountMeta[]> {
  return service.get('/count/findAll').then((counts) => {
    useCountStore.setState({ counts });
    return counts;
  });
}

export function createCount(count: CreateCountMeta): Promise<CountMeta> {
  return service.post('/count/createType', count).then((res) => {
    getCountList();
    return res;
  });
}

export function updateCount(count: UpdateCountMeta): Promise<void> {
  return service.patch('/count/update', count).then(() => {
    getCountList();
  });
}

export function getCountByTitle(title: string): Promise<CountMeta[]> {
  return service.get(`/count/findByTitle/${title}`).then((res) => {
    return res;
  });
}

export async function removeCount(id: string): Promise<void> {
  await service.delete(`/count/remove`, {
    data: { id },
  });
  getCountList();
}

export async function addCount(countId: string): Promise<void> {
  const count = await service.post<CountItem>(`/count/addCount`, { countId });
  await getCountList();
  useNotificationStore
    .getState()
    .notification(`${count.countMeta.name}计数成功`);
}

export async function resetCount(countId: string): Promise<void> {
  await service.post(`/count/resetCount`, { countId });
  await getCountList();
}
