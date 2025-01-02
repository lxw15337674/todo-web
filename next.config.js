/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true, // 开发环境下禁用图片优化
  },
}

module.exports = nextConfig 