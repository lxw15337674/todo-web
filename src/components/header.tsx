import { signIn, signOut, useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Divider, IconButton, Menu, MenuItem } from '@mui/material';
import React from 'react';
import AppsIcon from '@mui/icons-material/Apps';
import Head from 'next/head';

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
    name: '网站剪藏',
    url: 'https://omnivore.app/',
  },
];

export default function Header() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const currentApp = APPS.find((app) => app.url === router.pathname);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/user/login');
    }
    if (currentApp?.name && document.title) {
      document.title = currentApp?.name;
    }
  }, [router, status]);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  return (
    <header>
      <Head>
        <meta name="application-name" content="PWA App" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="PWA App" />
        <meta name="description" content="Best PWA App in the world" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/icons/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#2B5797" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#000000" />

        <link rel="apple-touch-icon" href="/icons/touch-icon-iphone.png" />
        <link
          rel="apple-touch-icon"
          sizes="152x152"
          href="/icons/touch-icon-ipad.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/icons/touch-icon-iphone-retina.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="167x167"
          href="/icons/touch-icon-ipad-retina.png"
        />

        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/icons/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/icons/favicon-16x16.png"
        />
        <link rel="manifest" href="/manifest.json" />
        <link
          rel="mask-icon"
          href="/icons/safari-pinned-tab.svg"
          color="#5bbad5"
        />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css?family=Roboto:300,400,500"
        />

        <meta name="twitter:card" content="summary" />
        <meta name="twitter:url" content="https://yourdomain.com" />
        <meta name="twitter:title" content="PWA App" />
        <meta name="twitter:description" content="Best PWA App in the world" />
        <meta
          name="twitter:image"
          content="https://yourdomain.com/icons/android-chrome-192x192.png"
        />
        <meta name="twitter:creator" content="@DavidWShadow" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="PWA App" />
        <meta property="og:description" content="Best PWA App in the world" />
        <meta property="og:site_name" content="PWA App" />
        <meta property="og:url" content="https://yourdomain.com" />
        <meta
          property="og:image"
          content="https://yourdomain.com/icons/apple-touch-icon.png"
        />
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, user-scalable=no, viewport-fit=cover"
        />
        <title>{currentApp?.name}</title>
        <link rel="icon" href="/icons/icon-384.png" />
      </Head>
      <div
        className={
          'h-[48px] leading-[48px] bg-primary text-white flex px-[14px]  '
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
          <span>{currentApp?.name}</span>
        </div>
        <div className="flex-1"> </div>
        <div className="flex items-center">
          {!session && (
            <>
              <span>You are not signed in</span>
              <button onClick={() => signIn()}>登录</button>
            </>
          )}
          {session?.user && (
            <>
              <strong className="mr-4">{session.user.name}</strong>
              {session.user.image && (
                <span
                  style={{ backgroundImage: `url('${session.user.image}')` }}
                  className="avatar rounded-full h-[32px] w-[32px]  bg-white bg-cover bg-no-repeat inline-block"
                />
              )}
              <a
                className="ml-4 "
                href={`/api/auth/signout`}
                onClick={(e) => {
                  e.preventDefault();
                  localStorage.removeItem('token');
                  signOut({
                    callbackUrl: '/user/login',
                  });
                }}
              >
                登出
              </a>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
