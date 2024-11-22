'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Divider, IconButton, Menu, MenuItem } from '@mui/material';
import React from 'react';
import AppsIcon from '@mui/icons-material/Apps';

const APPS = [
  {
    name: '摸鱼办',
    url: '/fishingTime',
  },
  {
    name: '待办事项',
    url: '/todo',
  },
  {
    name: '计数器',
    url: '/counter',
  },
  {
    name: '聊天室',
    url: '/chat',
  },
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
    name: 'AI聊天 - LobeChat',
    url: 'https://lobe-chat-omega-lac.vercel.app',
  },
  {
    name: '个人博客',
    url: 'https://bhwa233-blog.vercel.app',
  },
  {
    name: '个人笔记本',
    url: 'https://noiton-next-memos.vercel.app',
  },
  {
    name: '微博热搜榜历史',
    url: 'https://weibo-trending-hot-history.vercel.app',
  },
  {
    name: '网站剪藏',
    url: 'https://omnivore.app/',
  },
];

export default function Header() {
  const router = useRouter();
  // const currentApp = APPS.find((app) => app.url === router.pathname);

  // useEffect(() => {
  //   if (currentApp?.name && document.title) {
  //     document.title = currentApp?.name;
  //   }
  // }, [router]);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  return (
    <header>
      {/* <Head>
        <title>{currentApp?.name}</title>
        <link rel="icon" href="./icons/icon-384.png" />
        <meta name="description" content="description" />
        <meta
          name="keywords"
          content="HTML5, CSS3, JavaScript, TypeScript, Vue, React, 前端, 个人博客"
        />
        <meta name="author" content="author" />
        <meta
          name="viewport"
          content="width=device-width,initial-scale=1.0,minimum-scale=1,maximum-scale=1,user-scalable=no"
        />
        <meta name="theme-color" content="#2564cf" />
        <link rel="manifest" href="/manifest.json" />
      </Head> */}
      <div
        className={
          'h-[48px] leading-[48px] bg-primary  text-white flex px-[14px]  '
        }
      >
        <div className="mr-4 flex">
          <IconButton
            onClick={handleClick}
            style={{
              color: 'white',
            }}
          >
            <AppsIcon />
          </IconButton>
          <Menu
            id="basic-menu"
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            {APPS.map((app) => {
              return (
                <MenuItem
                  onClick={() => {
                    router.push(app.url);
                    handleClose();
                  }}
                  key={app.name}
                >
                  {app.name}
                </MenuItem>
              );
            })}
            <Divider />
            {Links.map((app) => {
              return (
                <MenuItem
                  onClick={() => {
                    window.open(app.url);
                    handleClose();
                  }}
                  key={app.name}
                >
                  {app.name}
                </MenuItem>
              );
            })}
          </Menu>
          {/* <span>{currentApp?.name}</span> */}
        </div>
        <div className="flex-1"> </div>
      </div>
    </header>
  );
}
