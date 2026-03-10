/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'avatars.githubusercontent.com',
      'lh3.googleusercontent.com',
      'cdn.discordapp.com',
      'pbs.twimg.com',
    ],
  },
};

module.exports = nextConfig;
