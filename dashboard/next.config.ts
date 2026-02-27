import type { NextConfig } from "next";

/**
 * Next.js Config — CekatIn Dashboard
 * 
 * Penjelasan:
 * - rewrites() berfungsi sebagai proxy API
 * - Semua request ke /api/* diteruskan ke Flask backend (port 5000)
 * - Ini menghindari masalah CORS saat development
 * - Di production, bisa pakai environment variable NEXT_PUBLIC_API_URL
 */
const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
    ];
  },
};

export default nextConfig;
