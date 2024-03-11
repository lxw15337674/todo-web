import { SessionProvider } from 'next-auth/react';
import './global.css';
import type { AppProps } from 'next/app';
import type { Session } from 'next-auth';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps<{ session: Session }>) {
  return (
    <>
      <SessionProvider session={session} baseUrl="/">
        <Component {...pageProps} />
      </SessionProvider>
      <SpeedInsights />
    </>
  );
}
