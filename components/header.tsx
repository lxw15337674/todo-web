import { signIn, signOut, useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Header() {
  const { data: session, status } = useSession();
  // const loading = status === 'loading';
  const router = useRouter();
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/user/login');
    }
  }, [router, status]);

  return (
    <header>
      <div
        className={
          'h-[48px] leading-[48px] bg-primary text-white flex px-[14px]  '
        }
      >
        <div className="mr-4">
          <span className="mr-4">切换</span>
          <span>todo</span>
        </div>
        <div className="flex-1">middle</div>
        <div className="flex items-center">
          {!session && (
            <>
              <span>You are not signed in</span>
              <button onClick={() => signIn()}>登录</button>
            </>
          )}
          {session?.user && (
            <>
              <strong className="mr-4">
                {session.user.email ?? session.user.name}
              </strong>
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
                  signOut({});
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
