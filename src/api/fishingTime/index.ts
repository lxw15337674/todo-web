import axios from 'axios';
import { service } from '..';

export interface FishingTime {
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
  return axios.get(`${process.env.API_URL}/fishingTime`).then((res) => {
    return res.data.data;
  });
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

interface Poem {
  title: string;
  dynasty: string;
  author: string;
  content: string[];
  translate: null;
}
export function poems(): Promise<Poem> {
  return axios.get('/poems').then((res) => {
    return res?.data?.data.origin;
  });
}

interface EnglishToday {
  content: string;
  translation: string;
}

export function englishToday(): Promise<EnglishToday> {
  return axios.get('/englishToday').then((res) => {
    return res?.data;
  });
}

interface Holiday {
  holiday: string;
  enName: string;
  name: string;
  year: number;
  start?: string;
  end?: string;
}
export function holiday(): Promise<Holiday[]> {
  return axios.get('/jiaqi').then((res) => {
    return res?.data.vacation;
  });
}
