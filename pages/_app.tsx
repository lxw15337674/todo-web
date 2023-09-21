import { SessionProvider } from 'next-auth/react';
import './global.css';
import type { AppProps } from 'next/app';
import type { Session } from 'next-auth';

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps<{ session: Session }>) {
  console.log(session);

  return (
    <SessionProvider session={session} baseUrl="/">
      <Component {...pageProps} />
    </SessionProvider>
  );
}
