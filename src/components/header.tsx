import { signIn, signOut, useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { IconButton, Menu, MenuItem } from '@mui/material';
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
  }, {
    name: '云顶之弈一图流',
    url: 'tft'
  }
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
        <title>{currentApp?.name}</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
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
