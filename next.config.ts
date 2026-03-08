import type { NextConfig } from "next";

const BACKEND_ORIGIN =
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  "https://ls-portal-development-backend.up.railway.app";

const nextConfig: NextConfig = {
  // Prevent Next.js from redirecting trailing-slash URLs (breaks API proxy to Django)
  skipTrailingSlashRedirect: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          // Proxy /backend-api/* → Railway Django REST API
          // Must be beforeFiles so it runs before Next.js trailing-slash redirect
          source: "/backend-api/:path*/",
          destination: `${BACKEND_ORIGIN}/api/:path*/`,
        },
        {
          // Also match without trailing slash and forward WITH trailing slash
          // (Django requires trailing slashes with APPEND_SLASH=True)
          source: "/backend-api/:path*",
          destination: `${BACKEND_ORIGIN}/api/:path*/`,
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
} as NextConfig;

export default nextConfig;
