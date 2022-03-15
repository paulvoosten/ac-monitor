/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'blend-playlist-covers.spotifycdn.com',
      'i.scdn.co',
      'mosaic.scdn.co',
    ],
  },
  reactStrictMode: true,
  serverRuntimeConfig: {
    PROJECT_ROOT: __dirname,
  },
};

module.exports = nextConfig;
