/** @type {import('next').NextConfig} */
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:3001";

const nextConfig = {
  reactStrictMode: true,

  // Proxy all /api/* requests to the Express backend.
  // The browser never touches port 3001 — no CORS, no port-mismatch errors.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;