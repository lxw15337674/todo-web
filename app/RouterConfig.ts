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
  History,
  Music,
  MessageCircle,
  Clipboard,
  CircleDollarSign
} from 'lucide-react';

interface MenuItem {
  name: string;
  url: string;
  icon?: any;
  auth?: boolean;
}

export const Apps: MenuItem[] = [
  {
    name: 'ToDo',
    url: '/task',
    icon: CheckSquare,
    auth: true
  },
  {
    name: '打卡',
    url: '/habit',
    icon: Calendar,
    auth: true
  },
  {
    name: '书签',
    url: '/bookmark',
    icon: Bookmark,
    auth: true
  },
  {
    name:'紀念日',
    url:'/anniversary',
    icon: AnniversaryIcon,
    auth: true
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
    name: '每日热点',
    url: '/dailyhot',
    icon: Newspaper
  },
  { name: '命令聊天', url: '/chat', icon: MessageCircle },
  {
    name: '资产管理', url: '/fund', icon: CircleDollarSign, auth: true
  }
];

export const Links: MenuItem[] = [
  {
    name: '博客',
    url: 'https://bhwa233-blog.vercel.app',
    icon: BookOpen
  },
  {
    name: '随想',
    url: 'https://memox-ten.vercel.app/',
    icon: StickyNote
  },
  {
    name: '微博历史',
    url: 'https://weibo-trending-hot-history.vercel.app',
    icon: History
  },
  {
    name: 'b站音频',
    url:'https://bilibili-audio-downloader.vercel.app',
    icon: Music
  },
  {
    name: '剪贴板',
    url: 'https://cloudpaste.404174262.workers.dev/',
    icon: Clipboard
  }
];