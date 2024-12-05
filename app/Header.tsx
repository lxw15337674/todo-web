'use client'
import React, { useEffect } from 'react';
import { ModeToggle } from 'src/components/ModeToggle';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../src/components/ui/dropdown-menu';
import { Button } from '../src/components/ui/button';
import { Separator } from '../src/components/ui/separator';
import { LayoutGrid } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Toaster } from '../src/components/ui/toaster';

// 效率工具
const EfficiencyTools = [
  {
    name: '待办事项',
    url: '/todo',
  },
  {
    name: '打卡',
    url: '/track',
  },
]

const APPS = [
  {
    name: '摸鱼办',
    url: '/fishingTime',
  },
  // {
  //   name: '待办事项',
  //   url: '/todo',
  // },
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

const Links = [
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

export default function Header() {
  const router = usePathname();
  const currentApp = APPS.find((app) => app.url === router);

  useEffect(() => {
    if (currentApp) {
      document.title = currentApp.name;
    }
  }, [currentApp]);

  return (
    <header>
      <Toaster />
      <div
        className={
          'px-4 py-2  bg-zine-800 dark:border-zinc-800 border-b-[1px] flex items-center '
        }
      >
        <div className="mr-4 flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <LayoutGrid />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {EfficiencyTools.map((app) => (
                <DropdownMenuCheckboxItem
                  onClick={() => {
                    window.location.href = app.url;
                  }}
                  checked={currentApp?.url === app.url}
                  key={app.name}
                >
                  {app.name}
                </DropdownMenuCheckboxItem>
              ))}
              <Separator />
              {APPS.map((app) => (
                <DropdownMenuCheckboxItem
                  onClick={() => {
                    window.location.href = app.url;
                  }}
                  checked={currentApp?.url === app.url}
                  key={app.name}
                >
                  {app.name}
                </DropdownMenuCheckboxItem>
              ))}
              <Separator />
              {Links.map((app) => (
                <DropdownMenuItem
                  onClick={() => {
                    window.open(app.url);
                  }}
                  key={app.name}
                >
                  {app.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <span className="font-bold ml-2">{currentApp?.name}</span>
        </div>
        <div className="flex-1" />
        <ModeToggle />
      </div>
    </header>
  );
}
