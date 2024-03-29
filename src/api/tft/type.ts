import { JobColor } from '@/api/tft/model/RaceJob';

// 英雄基础数据类型
/**
 * TFT棋子类型
 */
export interface TFTChess {
  /**
   * 棋子ID
   */
  chessId: string;
  /**
   * 棋子称号
   */
  title: string;
  /**
   * 棋子名称
   */
  name: string;
  /**
   * 棋子显示名称
   */
  displayName: string;
  /**
   * 棋子种族ID列表
   */
  raceIds: string;
  /**
   * 棋子职业ID列表
   */
  jobIds: string;
  /**
   * 棋子价格
   */
  price: string;
  /**
   * 棋子技能名称
   */
  skillName: string;
  /**
   * 棋子技能类型
   */
  skillType: string;
  /**
   * 棋子技能图片URL
   */
  skillImage: string;
  /**
   * 棋子技能介绍
   */
  skillIntroduce: string;
  /**
   * 棋子技能详情
   */
  skillDetail: string;
  /**
   * 棋子生命值
   */
  life: string;
  /**
   * 棋子法力值
   */
  magic: string;
  /**
   * 棋子初始法力值
   */
  startMagic: string;
  /**
   * 棋子护甲
   */
  armor: string;
  /**
   * 棋子魔抗
   */
  spellBlock: string;
  /**
   * 棋子攻击力加成
   */
  attackMag: string;
  /**
   * 棋子攻击力暴击
   */
  attack: string;
  /**
   * 棋子攻速
   */
  attackSpeed: string;
  /**
   * 棋子攻击范围
   */
  attackRange: string;
  /**
   * 棋子暴击率
   */
  crit: string;
  /**
   * 棋子原画URL
   */
  originalImage: string;
  /**
   * 棋子生命值加成
   */
  lifeMag: string;
  /**
   * 棋子TFT ID
   */
  TFTID: string;
  /**
   * 棋子羁绊
   */
  synergies: string;
  /**
   * 棋子描述
   */
  illustrate: string;
  /**
   * 棋子推荐装备
   */
  recEquip: string;
  /**
   * 棋子职业状态
   */
  proStatus: string;
  /**
   * 棋子英文名称
   */
  hero_EN_name: string;
  /**
   * 棋子ID
   */
  id: string;
  /**
   * 棋子种族
   */
  races: string;
  /**
   * 棋子职业
   */
  jobs: string;
  /**
   * 棋子攻击力数据
   */
  attackData: string;
  /**
   * 棋子生命值数据
   */
  lifeData: string;
}

// 羁绊类型
export interface RaceType {
  // Unique identifier for the race
  raceId: string;

  // The name of the race
  name: string;

  // Identifier for a specific trait associated with the race
  traitId: string;

  // A brief introduction or description of the race
  introduce: string;

  // Alias or alternative names for the race
  alias: string;

  // Object mapping different levels to their descriptions
  level: {
    [level: string]: string;
  };

  // Identifier associated with Teamfight Tactics (TFT), if applicable
  TFTID: string;

  // Identifier for the character associated with this race
  characterid: string;

  // Unique identifier for the race instance
  id: string;

  // Path to an image representing the race
  imagePath: string;

  // A string representing a list of colors associated with the race
  race_color_list: string;
}
export interface JobType {
  TFTID: string;
  alias: string;
  characterid: string;
  id: string;
  imagePath: string;
  introduce: string;
  jobId: string;
  job_color_list: string;
  level: {
    [level: number]: string;
  };
  name: string;
  traitId: string;
}

export interface Level {
  /** 所需棋子数量 */
  chessCount: number;
  /** 效果描述 */
  description: string;
  /** 等级对应的颜色 */
  color: JobColor;
}
export interface TFTCard {
  TFTID: string;
  alias: string;
  characterid: string;
  id: string;
  imagePath: string;
  introduce: string;
  jobId: string;
  job_color_list: string;
  level: Level[];
  name: string;
  traitId: string;
}
