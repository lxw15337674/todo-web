const runtimeCaching = require('next-pwa/cache');

const withPWA = require('next-pwa')({
  dest: 'public',
  runtimeCaching,
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

const nextConfig = withPWA({
  reactStrictMode: true,
  env: {
    API_URL: process.env.API_URL,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  experimental: {
    largePageDataBytes: 512 * 100000,
  },
  rewrites: async () => {
    return [
      {
        source: '/todayInHistory',
        destination: `https://www.ipip5.com/today/api.php?type=json`,
      },
      {
        source: '/poems',
        destination: 'https://v2.jinrishici.com/one.json',
      },
      {
        source: '/englishToday',
        destination: 'https://apiv3.shanbay.com/weapps/dailyquote/quote/',
      },
      {
        source: '/jiaqi',
        destination:
          'https://s3.cn-north-1.amazonaws.com.cn/general.lesignstatic.com/config/jiaqi.json',
      },
      {
        source: '/routing/tftVersionConfig',
        destination:
          'https://lol.qq.com/zmtftzone/public-lib/versionconfig.json',
      },
      {
        source: '/routing/game/:path*',
        destination: 'https://game.gtimg.cn/:path*',
      },
      {
        source: '/routing/dailyHot/:path*',
        destination: 'https://daily-hot-api-chi-topaz.vercel.app/:path*',
      },
    ];
  },
});
module.exports = nextConfig;
