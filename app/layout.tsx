'use client';
import './global.css';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import theme from '../src/theme';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { ThemeProvider as NextThemeProvider } from "@/components/theme-provider"
import Header from './Header';
import { SidebarProvider, SidebarTrigger } from '../src/components/ui/sidebar';


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning>
      <body>
        <SidebarProvider>
          <AppRouterCacheProvider options={{ enableCssLayer: true }}>
            <ThemeProvider theme={theme} defaultMode="dark" >
              <NextThemeProvider
                attribute="class"
                defaultTheme="dark"
              >
                <CssBaseline enableColorScheme />
                <main className='w-screen h-screen'>
                  <Header />
                  {children}
                </main>
              </NextThemeProvider>
            </ThemeProvider>
          </AppRouterCacheProvider>
        </SidebarProvider>
      </body>
    </html>
  );
}
