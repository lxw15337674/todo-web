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
    ];
  },
};

module.exports = nextConfig;
