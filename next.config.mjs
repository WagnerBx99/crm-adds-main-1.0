/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['sonner'],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': './src',
    }
    return config
  },
}

export default nextConfig
