import data from '../assets/adventure.json'

export const adventures: Adventure[] = data

export interface Adventure {
  id: string
  /** 标题（提供奇遇的英雄名称） */
  title: string
  /** 描述 */
  description: string
  /** 图标Url */
  iconUrl: string
}