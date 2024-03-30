export enum EquipmentType {
  /** 基础装备 */
  basic = '1',
  /** 成装 */
  advanced = '2',
  /** 光明装备 */
  light = '3',
  /** 墨之影装备 */
  ink = '4',
  /** 无法合成的特殊转职纹章 */
  job = '5',
  /** 奥恩神器 */
  ornn = '6',
  /** 金鳞龙装备 */
  golden = '7',
  /** 辅助装备 */
  support = '8',
}

/**
 * TFT装备类型
 */
export interface TFTEquip {
  /**
   * 装备ID
   */
  equipId: string;
  /**
   * 装备类型
   */
  type: EquipmentType;
  /**
   * 装备名称
   */
  name: string;
  /**
   * 装备效果
   */
  effect: string;
  /**
   * 装备关键词
   */
  keywords: string;
  /**
   * 装备公式
   */
  formula: string;
  /**
   * 装备图片URL
   */
  imagePath: string;
  /**
   * 装备TFT ID
   */
  TFTID: string;
  /**
   * 装备适用职业ID
   */
  jobId: string;
  /**
   * 装备适用种族ID
   */
  raceId: string;
  /**
   * 装备职业状态
   */
  proStatus: string;
  /**
   * 装备是否显示
   */
  isShow: string;
  /**
   * 装备英文名称
   */
  englishName: string;
  /**
   * 装备ID
   */
  id: string;
}

export type EquipsByType = Map<EquipmentType, TFTEquip[]>;
