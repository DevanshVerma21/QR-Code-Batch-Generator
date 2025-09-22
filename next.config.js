/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000',
  },
  images: {
    domains: ['localhost'],
  },
  output: 'standalone', // Enable standalone mode for Docker
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
  // Exclude examples directory from build
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'].map(extension => {
    return extension;
  }),
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    // Ignore examples directory
    config.resolve.alias = {
      ...config.resolve.alias,
    };
    return config;
  },
}

module.exports = nextConfig