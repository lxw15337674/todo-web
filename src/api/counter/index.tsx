import { useCountStore } from 'store/counter';
import { service } from '..';
import {
  CountDetail,
  CountItem,
  CountMeta,
  CreateCountMeta,
  UpdateCountMeta,
} from './interface';
import { useNotificationStore } from 'store/notification';

// export function getCountList(): Promise<CountMeta[]> {
//   return service.get('/count/findAll').then((counts) => {
//     useCountStore.setState({ counts });
//     return counts;
//   });
// }

export function findAllWithCounter(): Promise<CountDetail[]> {
  return service.get('/count/findAllWithCounter').then((counts) => {
    useCountStore.setState({ counts });
    return counts;
  });
}

export function createCount(count: CreateCountMeta): Promise<CountMeta> {
  return service.post('/count/createType', count).then((res) => {
    findAllWithCounter();
    useNotificationStore.getState().notification(`新建${count.name}类型成功`);
    return res;
  });
}

export function updateCount(count: UpdateCountMeta): Promise<void> {
  return service.patch('/count/update', count).then(() => {
    findAllWithCounter();
    useNotificationStore.getState().notification(`编辑${count.name}类型成功`);
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
  useNotificationStore.getState().notification(`删除成功`);
  findAllWithCounter();
}

export async function addCount(countId: string): Promise<void> {
  const count = await service.post<CountItem>(`/count/addCount`, { countId });
  await findAllWithCounter();
  console.log(count.countMeta);
  debugger;
  useNotificationStore
    .getState()
    .notification(`${count.countMeta?.name}计数成功`);
}

export async function resetCount(countId: string): Promise<void> {
  await service.post(`/count/resetCount`, { countId });
  useNotificationStore.getState().notification(`重置成功`);
  await findAllWithCounter();
}

export async function getTypeCounts(countId: string): Promise<CountItem[]> {
  return service.get(`/count/getTypeCounts`, {
    params: { countId },
  });
}
