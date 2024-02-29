/** @type {import('next').NextConfig} */
const nextConfig = {
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
    ];
  },
};

module.exports = nextConfig;
