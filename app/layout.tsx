import type { Metadata } from 'next';
import './global.css';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import theme from '../src/theme';
import { ThemeProvider } from '@mui/material/styles';
import Header from './Header';
import { CssBaseline } from '@mui/material';
import { ConfigProvider, theme as antdTheme } from 'antd';

export const metadata: Metadata = {
  title: 'Home',
  description: 'Welcome to Next.js',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <ThemeProvider theme={theme}>
            <ConfigProvider theme={{ algorithm: antdTheme.darkAlgorithm }}>
              <CssBaseline enableColorScheme />
              <Header />
              {children}
            </ConfigProvider>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
