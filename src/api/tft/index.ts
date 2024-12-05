'use service';
import axios from 'axios';
import { JobType, RaceType, TFTCard, TFTChess } from './type';
import { EquipsByType, TFTEquip } from './model/Equipment';
import { unstable_cache } from 'next/cache';

export interface ISeasonInfo {
  booleanPreVersion: boolean;
  arrVersionLimit: string[];
  stringName: string;
  idSeason: string;
  urlChessData: string;
  urlRaceData: string;
  urlJobData: string;
  urlEquipData: string;
  urlBuffData: string;
  urlGalaxyData?: string;
  urlLegendData?: string;
  urlAdventureData?: string;
}

export const revalidate = 60 * 60 * 24 * 7;

export const getVersionConfig = unstable_cache(
  async (): Promise<ISeasonInfo[]> => {
    const res = await axios.get(
      'https://lol.qq.com/zmtftzone/public-lib/versionconfig.json',
    );
    return res.data;
  },
  ['version'],
  { revalidate: 60 * 60 * 24 * 7 },
);

// 棋子
export const getChessData = unstable_cache(
  async (url: string): Promise<TFTChess[]> => {
    const res = await axios.get(url);
    return res.data.data;
  },
  ['chess'],
  { revalidate: 60 * 60 * 24 * 7 },
);

// 职业
export const getJobData = unstable_cache(
  async (url: string): Promise<TFTCard[]> => {
    const res = await axios.get(url);
    return res.data.data.map((job: JobType) => {
      return {
        ...job,
        id: job.jobId,
        level: job.job_color_list?.split(',').map((item) => {
          const [chessCount, color] = item.split(':');
          return {
            chessCount: parseInt(chessCount),
            color: parseInt(color),
            description: job.level[parseInt(chessCount)],
          };
        }),
      };
    });
  },
  ['job'],
  { revalidate: 60 * 60 * 24 * 7 },
);

// 羁绊
export const getRaceData = unstable_cache(
  async (url: string): Promise<TFTCard[]> => {
    const res = await axios.get(url);
    return res.data.data.map((race: RaceType) => {
      return {
        ...race,
        id: race.raceId,
        level: race.race_color_list.split(',').map((item) => {
          const [chessCount, color] = item.split(':');
          return {
            chessCount: parseInt(chessCount),
            color: parseInt(color),
            description: race.level[parseInt(chessCount)],
          };
        }),
      };
    });
  },
  ['race'],
  { revalidate: 60 * 60 * 24 * 7 },
);

// 装备
export const getEquipData = unstable_cache(
  async (url: string): Promise<TFTEquip[]> => {
    const res = await axios.get(url);
    return res.data.data;
  },
  ['equip'],
  { revalidate: 60 * 60 * 24 * 7 },
);
