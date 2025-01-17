import axios from 'axios';

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
