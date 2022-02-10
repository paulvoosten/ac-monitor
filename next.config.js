/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['i.scdn.co'],
  },
  reactStrictMode: true,
  serverRuntimeConfig: {
    PROJECT_ROOT: __dirname,
  },
};

module.exports = nextConfig;
