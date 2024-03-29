// export const jobs: RaceJob[] = 【 as any
// export const races: RaceJob[] = raceData as any

export enum JobColor {
  level1 = 1,
  level2,
  level3,
  level4,
  level5,
}

export interface Level {
  /** 所需棋子数量 */
  chessCount: number;
  /** 效果描述 */
  description: string;
  /** 等级对应的颜色 */
  color: JobColor;
}

export interface RaceJob {
  id: string;
  /** 名称 */
  name: string;
  /** 介绍 */
  introduce: string;
  /** 等级 */
  levels: Level[];
  /** 图标Url */
  iconUrl: string;
}

export function getRaceJobLevelColor(level: JobColor) {
  switch (level) {
    case JobColor.level1:
      return '#7F4F3E';
    case JobColor.level2:
      return '#818181';
    case JobColor.level3:
      return '#AE8B42';
    case JobColor.level4:
      return '#60DACE';
    case JobColor.level5:
      return '#DE5B1A';
  }
}

export function getRaceJobLevelBorderColor(level: JobColor) {
  switch (level) {
    case JobColor.level1:
      return '#A5644A';
    case JobColor.level2:
      return '#A7A399';
    case JobColor.level3:
      return '#C6AA4F';
    case JobColor.level4:
      return '#D4F6F1';
    case JobColor.level5:
      return '#FDB08A';
  }
}
