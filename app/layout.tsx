import './global.css';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import theme from '../src/theme';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { ConfigProvider, theme as antdTheme } from 'antd';
import { ThemeProvider as NextThemeProvider } from "@/components/theme-provider"
import {  Viewport } from 'next';
import Header from '../src/components/Header';


export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning>
      <body>
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <ThemeProvider theme={theme} defaultMode="dark" >
            <ConfigProvider theme={{ algorithm: antdTheme.darkAlgorithm }}>
              <NextThemeProvider
                attribute="class"
                defaultTheme="dark"
              >
                <CssBaseline enableColorScheme />
                <Header />
                {children}
              </NextThemeProvider>
            </ConfigProvider>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
