import { 
  CheckSquare, 
  Calendar, 
  Bookmark, 
  Calendar as AnniversaryIcon, 
  Image, 
  Fish,
  Gamepad2,
  Newspaper,
  BookOpen,
  StickyNote,
  History
} from 'lucide-react';

interface MenuItem {
  name: string;
  url: string;
  icon?: any;
}

export const Apps: MenuItem[] = [
  {
    name: 'ToDo',
    url: '/task',
    icon: CheckSquare
  },
  {
    name: '打卡',
    url: '/habit',
    icon: Calendar
  },
  {
    name: '书签',
    url: '/bookmark',
    icon: Bookmark
  },
  {
    name:'紀念日',
    url:'/anniversary',
    icon: AnniversaryIcon
  },
  {
    name : '图床',
    url: '/gallery',
    icon: Image
  },
  {
    name: '摸鱼办',
    url: '/fishingTime',
    icon: Fish
  },
  {
    name: '云顶之弈一图流',
    url: '/tft',
    icon: Gamepad2
  },
  {
    name: '每日热点',
    url: '/dailyhot',
    icon: Newspaper
  },
];

export const Links: MenuItem[] = [
  {
    name: '博客',
    url: 'https://bhwa233-blog.vercel.app',
    icon: BookOpen
  },
  {
    name: '随想',
    url: 'https://feishu-memos.vercel.app/',
    icon: StickyNote
  },
  {
    name: '微博历史',
    url: 'https://weibo-trending-hot-history.vercel.app',
    icon: History
  },
];
