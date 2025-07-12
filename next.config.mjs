import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type'
          }
        ]
      }
    ]
  },
  images: {
    domains: [
      'api.qrserver.com',
      'lh3.googleusercontent.com', // Google profile images
      'avatars.githubusercontent.com' // GitHub avatars
    ],
    unoptimized: true
  }
};

export default withNextIntl(nextConfig);