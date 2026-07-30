/** @type {import('next').NextConfig} */
const DEFAULT_BACKEND_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:8080"
    : "https://quantro-api-biwp.onrender.com";

const BACKEND_URL = process.env.BACKEND_URL ?? DEFAULT_BACKEND_URL;

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
