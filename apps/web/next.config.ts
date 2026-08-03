import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable experimental features
  experimental: {
    // Use React 19 features
    reactCompiler: false,
  },

  // API route rewrites to avoid CORS in development
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/:path*`,
      },
    ];
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
      },
    ],
  },

  // TypeScript and ESLint
  typescript: {
    // Fail the build if there are TypeScript errors
    ignoreBuildErrors: false,
  },
  eslint: {
    // Fail the build if there are ESLint errors
    ignoreDuringBuilds: false,
  },

  // Security headers
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
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  // Output configuration (standalone for Docker containerization)
  ...(process.env.NEXT_STANDALONE ? { output: 'standalone' as const } : {}),

  // Compression
  compress: true,

  // Power the app with Next.js' built-in page router or App Router
  // We use App Router (src/app/)
};

export default nextConfig;
