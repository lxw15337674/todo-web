import data from '../assets/equip.json'

export const equipments: Equipment[] = data as any

export enum EquipmentType {
  /** 基础装备 */
  basic = "1",
  /** 成装 */
  advanced = "2",
  /** 光明装备 */
  light = "3",
  /** 墨之影装备 */
  ink = "4",
  /** 无法合成的特殊转职纹章 */
  job = "5",
  /** 奥恩神器 */
  ornn = "6",
  /** 金鳞龙装备 */
  golden = "7",
  /** 辅助装备 */
  support = "8"
}

export interface Equipment {
  id: string
  /** 装备类型 */
  type: EquipmentType
  /** 名称 */
  name: string
  /** 效果 */
  effect: string
  /** 关键词 */
  keywords: string
  /** 图标Url */
  iconUrl: string
}
