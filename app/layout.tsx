'use client';
import './global.css';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import theme from '../src/theme';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { ThemeProvider as NextThemeProvider } from "@/components/theme-provider"
import Header from './Header';
import { SidebarProvider } from '../src/components/ui/sidebar';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Geist } from 'next/font/google';
import { cn } from '@/lib/utils';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning className={cn('font-sans', geist.variable)}>
      <body>
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <ThemeProvider theme={theme} defaultMode="dark" >
            <NextThemeProvider
              attribute="class"
              defaultTheme="dark"
            >
              <CssBaseline enableColorScheme />
              <TooltipProvider>
                <SidebarProvider>
                  <main className='min-h-screen h-full w-screen'>
                    <Header />
                    {children}
                    <Toaster />
                    <SpeedInsights />
                  </main>
                </SidebarProvider>
              </TooltipProvider>
            </NextThemeProvider>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
