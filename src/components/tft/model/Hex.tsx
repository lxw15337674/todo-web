import data from '../assets/hex.json'

export const hexes: Hex[] = data as any

export enum HexLevel {
  /** 银色海克斯 */
  silver = "1",
  /** 金色海克斯 */
  golden = "2",
  /** 棱彩海克斯 */
  colorful = "3"
}

export interface Hex {
  id: string
  /** 名称 */
  name: string
  /** 海克斯等级 */
  level: HexLevel
  /** 描述 */
  description: string
  /** 图标Url */
  iconUrl: string
}
