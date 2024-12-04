const runtimeCaching = require('next-pwa/cache');

const withPWA = require('next-pwa')({
  disable: process.env.NODE_ENV === 'development',
  dest: 'public',
  register: true,
  skipWaiting: true,
  runtimeCaching,
  buildExcludes: [/middleware-manifest.json$/],
});

const nextConfig = withPWA({
  env: {
    API_URL: process.env.API_URL,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    reactCompiler: true,
    largePageDataBytes: 512 * 100000,
  },
  images: {
    domains: ['game.gtimg.cn'],
  },
  rewrites: async () => {
    return [
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
    ];
  },
});
module.exports = nextConfig;
