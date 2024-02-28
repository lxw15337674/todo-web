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
  // rewrites: async () => {
  //   return [
  //     {
  //       source: '/moyu',
  //       destination: `https://moyu.awsl.icu/api/moyu_json`,
  //     },
  //     {
  //       source: '/moyu/img',
  //       destination: 'https://api.vvhan.com/api/moyu',
  //     },
  //   ];
  // },
};

module.exports = nextConfig;
