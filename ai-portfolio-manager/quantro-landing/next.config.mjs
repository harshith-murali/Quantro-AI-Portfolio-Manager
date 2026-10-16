const BACKEND_URL = process.env.BACKEND_URL ?? "http://13.211.53.39:8080";

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