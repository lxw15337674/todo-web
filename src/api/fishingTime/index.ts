import { service } from '..';

export function getFishingTime(): Promise<string> {
  return service.get('/fishingTime');
}
