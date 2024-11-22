'use server';

import axios from 'axios';
import { JobType, RaceType, TFTCard, TFTChess } from './type';
import { EquipsByType, TFTEquip } from './model/Equipment';

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

export async function getVersionConfig(): Promise<ISeasonInfo[]> {
  const res = await axios.get('/routing/tftVersionConfig');
  return res.data;
}

const routingGame = (url: string) => {
  return url.replace('https://game.gtimg.cn/', '/routing/game/');
};

// 棋子
export async function getChessData(url: string): Promise<TFTChess[]> {
  const res = await axios.get(routingGame(url));
  return res.data.data;
}

// 职业
export async function getJobData(url: string): Promise<TFTCard[]> {
  const res = await axios.get(routingGame(url));
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
}

// 羁绊
export async function getRaceData(url: string): Promise<TFTCard[]> {
  const res = await axios.get(routingGame(url));
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
}

// 装备
export async function getEquipData(url: string): Promise<EquipsByType> {
  const res = await axios.get(routingGame(url));
  return res.data.data.reduce((acc: EquipsByType, equip: TFTEquip) => {
    return acc.set(equip.type, (acc.get(equip.type) || []).concat(equip));
  }, new Map());
}
