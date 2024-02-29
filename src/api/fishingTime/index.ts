import axios from 'axios';
import { service } from '..';

interface FishingTime {
  year: number;
  month: number;
  day: number;
  weekday: string;
  passdays: number;
  passhours: number;
  salaryday1: number;
  salaryday5: number;
  salaryday9: number;
  salaryday10: number;
  salaryday15: number;
  salaryday20: number;
  day_to_weekend: number;
  nextHoliday: {
    name: string;
    nextHolidayDate: string;
    rest: number;
  };
  nextHolidayDate: string;
}

export function getFishingTime(): Promise<FishingTime> {
  return service.get('/fishingTime');
}

interface HistoricalEvent {
  year: string;
  title: string;
}

export function todayInHistory(): Promise<HistoricalEvent[]> {
  return axios.get('/todayInHistory').then((res) => {
    return res?.data?.result.slice(0, -1);
  });
}
