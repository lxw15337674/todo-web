import data from '../assets/chess.json'

export const chesses: Chess[] = data

export enum ChessImageType {
  /** 小头像 */
  head,
  /** 完整图片 */
  full
}

export interface Attack {
  /** 攻击力 */
  value: string
  /** 攻速 */
  speed: string
  /** 攻击距离 */
  range: string
}
  
export interface Life {
  /** 生命值 */
  value: string
  /** 护甲 */
  armor: string
  /** 魔抗 */
  spellBlock: string
}
  
export interface Skill {
  /** 技能名称 */
  name: string
  /** 技能详情 */
  detail: string
  /** 技能图标 */
  iconUrl: string
  /** 初始法力值 */
  startMagic: string
  /** 释放技能所需法力值 */
  magic: string
}
  
export interface RaceJobInfo {
  /** ID */
  id: string
  /** 名称 */
  name: string
}

export interface Chess {
  id: string
  /** 名称 */
  name: string
  /** 图片ID */
  imageId: string
  /** 生命值 */
  life: Life
  /** 普攻数据 */
  attack: Attack
  /** 暴击率 */
  critRate: string
  /** 职业 */
  jobs: RaceJobInfo[]
  /** 种族 */
  races: RaceJobInfo[]
  /** 技能 */
  skill: Skill
  /** 价格 */
  price: number
}

export function getChessImage (imageId: string, type: ChessImageType): string {
  switch (type) {
    case ChessImageType.head:
      return `https://game.gtimg.cn/images/lol/act/img/tft/champions/${imageId}.png`
    case ChessImageType.full:
      return `https://game.gtimg.cn/images/lol/tftstore/s11/624x318/${imageId}.jpg`
  }
}

export function getBorderColor (price: number) {
  switch (price) {
    case 1: return '#999999'
    case 2: return '#5FCC29'
    case 3: return '#297ACC'
    case 4: return '#CC29CC'
    case 5: return '#CCA329'
    default: return '#000000'
  }
}
