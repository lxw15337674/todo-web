import { useCountStore } from 'store/count';
import { service } from '..';
import { CountMeta, CreateCountMeta, UpdateCountMeta } from './interface';

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

export function removeCount(id: string): Promise<void> {
  return service.post(`/count/remove/${id}`);
}

export async function addCount(countId: string): Promise<void> {
  await service.post(`/count/addCount`, { countId });
  await getCountList();
}

export async function resetCount(countId: string): Promise<void> {
  await service.post(`/count/resetCount`, { countId });
  await getCountList();
}
