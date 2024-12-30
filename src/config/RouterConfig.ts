interface MenuItem {
  name: string;
  url: string;
}
// 效率工具
export const EfficiencyTools: MenuItem[] = [
  {
    name: 'ToDo',
    url: '/task',
  },
  {
    name: '打卡',
    url: '/habit',
  },
  {
    name: '书签',
    url: '/bookmark',
  },
  {
    name:'紀念日',
    url:'/anniversary',
  },
  {
    name : '图床',
    url: '/gallery',
  }
];

export const APPS: MenuItem []= [
  {
    name: '摸鱼办',
    url: '/fishingTime',
  },
  // {
  //   name: '聊天室',
  //   url: '/chat',
  // },
  {
    name: '云顶之弈一图流',
    url: '/tft',
  },
  {
    name: '每日热点',
    url: '/dailyhot',
  },
];

export const Links = [
  {
    name: '个人博客',
    url: 'https://bhwa233-blog.vercel.app',
  },
  {
    name: 'feishuMemos - 个人笔记本',
    url: 'https://feishu-next-memos.vercel.app',
  },
  {
    name: '微博热搜榜历史',
    url: 'https://weibo-trending-hot-history.vercel.app',
  },
  {
    name: 'hoarder - 网站剪藏',
    url: 'https://hoarder.hkg1.zeabur.app/dashboard/bookmarks',
  },
];
