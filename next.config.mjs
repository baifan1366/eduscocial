import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  },
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
      'avatars.githubusercontent.com', // GitHub avatars
      'platform-lookaside.fbsbx.com', // Facebook profile images
      'graph.facebook.com' // Facebook profile images alternative
    ],
    unoptimized: true
  }
};

export default withNextIntl({
  ...nextConfig,
  // This ensures that NextAuth.js callbacks work correctly
  async redirects() {
    return [
      {
        source: '/api/auth/callback/:provider',
        destination: '/api/auth/callback/:provider',
        permanent: true,
      },
    ]
  }
});