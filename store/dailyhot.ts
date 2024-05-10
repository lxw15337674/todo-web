import { IData, IRootObject } from '@/api/dailyhot';
import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

export interface HotType {
  label: string;
  name: string;
  order: number;
  show: boolean;
  subtitle?: string;
  updateTime?: string;
  children: IData[];
}

const news = [
  // {
  //   label: '哔哩哔哩',
  //   name: 'bilibili',
  //   order: 0,
  //   show: true,
  // },
  {
    label: '微博',
    name: 'weibo',
    order: 1,
    show: true,
  },
  // {
  //   label: '抖音',
  //   name: 'douyin',
  //   order: 2,
  //   show: true,
  // },
  {
    label: '知乎',
    name: 'zhihu',
    order: 3,
    show: true,
  },
  {
    label: '36氪',
    name: '36kr',
    order: 4,
    show: true,
  },
  // {
  //     label: "百度",
  //     name: "baidu",
  //     order: 5,
  //     show: true,
  // },
  // {
  //   label: '少数派',
  //   name: 'sspai',
  //   order: 6,
  //   show: true,
  // },
  // {
  //     label: "IT之家",
  //     name: "ithome",
  //     order: 7,
  //     show: true,
  // },
  // {
  //   label: '澎湃新闻',
  //   name: 'thepaper',
  //   order: 8,
  //   show: true,
  // },
  // {
  //   label: '今日头条',
  //   name: 'toutiao',
  //   order: 9,
  //   show: true,
  // },
  // {
  //     label: "百度贴吧",
  //     name: "tieba",
  //     order: 10,
  //     show: true,
  // },
  {
    label: '稀土掘金',
    name: 'juejin',
    order: 11,
    show: true,
  },
  // {
  //   label: '腾讯新闻',
  //   name: 'newsqq',
  //   order: 12,
  //   show: true,
  // },
  {
    label: '豆瓣',
    name: 'douban_new',
    order: 13,
    show: true,
  },
  {
    label: 'LOL',
    name: 'lol',
    order: 15,
    show: true,
  },
  // {
  //     label: "快手",
  //     name: "kuaishou",
  //     order: 16,
  //     show: true,
  // },
  {
    label: '网易新闻',
    name: 'netease',
    order: 17,
    show: true,
  },
  {
    label: '微信读书',
    name: 'weread',
    order: 18,
    show: true,
  },
  {
    label: '豆瓣讨论小组',
    name: 'douban_group',
    order: 19,
    show: true,
  },
  // {
  //     label: "网易云音乐",
  //     name: "netease_music_toplist",
  //     params: { type: 1 },
  //     order: 20,
  //     show: true,
  // },
  // {
  //     label: "QQ音乐热歌榜",
  //     name: "qq_music_toplist",
  //     params: { type: 1 },
  //     order: 21,
  //     show: true,
  // },
  {
    label: 'NGA',
    name: 'ngabbs',
    order: 22,
    show: true,
  },
  {
    label: 'V2EX',
    name: 'v2ex',
    order: 23,
    show: true,
  },
];
interface HotStore {
  hotLists: HotType[];
  setHotLists: (type: string, hotLists: IRootObject) => void;
}
const useDailyHotStore = create(
  devtools<HotStore>((set, get) => ({
    hotLists: news.map((item) => {
      return {
        ...item,
        children: [],
      };
    }),
    setHotLists: (type, data) => {
      const newHotLists = get().hotLists.map((item) => {
        if (item.name === type) {
          return {
            ...item,
            subtitle: data.subtitle,
            updateTime: data.updateTime,
            children: data.data.slice(0, 20) ?? [],
          };
        }
        return item;
      });
      set({ hotLists: newHotLists });
    },
  })),
);
export default useDailyHotStore;
