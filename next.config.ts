import type { NextConfig } from 'next';
import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
});

const nextConfig: NextConfig = {
  turbopack: {},
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn-icons-png.flaticon.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self';",
              "upgrade-insecure-requests;",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://pagead2.googlesyndication.com https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/;",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;",
              "img-src 'self' data: blob: https: http:;",
              "connect-src 'self' https://router.project-osrm.org https://pagead2.googlesyndication.com https://nominatim.openstreetmap.org https://*.tile.openstreetmap.org https://api.cloudinary.com https://ep1.adtrafficquality.google https://*.googleadservices.com https://*.google.com https://cdnjs.cloudflare.com https://unpkg.com;",
              "frame-src 'self' https://googleads.g.doubleclick.net https://www.google.com/recaptcha/;",
              "font-src 'self' https://fonts.gstatic.com data:;",
              "object-src 'none';",
              "base-uri 'self';"
            ].join(' '),
          },
        ],
      },
    ];
  },
};

export default withPWA(nextConfig);
