import { IData } from '@/api/dailyhot';

export interface HotType {
  label: string;
  name: string;
  order: number;
  show: boolean;
  subtitle?: string;
  updateTime?: string;
  children: IData[];
}
