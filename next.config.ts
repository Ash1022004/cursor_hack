import type { NextConfig } from "next";

const convexSite = process.env.CONVEX_SITE_URL;

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  // Only proxy Convex HTTP routes. Other /api/* handlers stay in Next.js (e.g. symptom-check, medicines).
  async rewrites() {
    if (!convexSite) {
      return [];
    }
    const base = convexSite.replace(/\/$/, "");
    return [
      { source: "/api/health", destination: `${base}/api/health` },
      { source: "/api/auth/:path*", destination: `${base}/api/auth/:path*` },
      { source: "/api/sticky-notes", destination: `${base}/api/sticky-notes` },
      { source: "/api/sticky-notes/:path*", destination: `${base}/api/sticky-notes/:path*` },
      { source: "/api/user/:path*", destination: `${base}/api/user/:path*` },
      { source: "/api/chatbot/:path*", destination: `${base}/api/chatbot/:path*` },
      { source: "/api/counsellor/:path*", destination: `${base}/api/counsellor/:path*` },
      { source: "/api/admin/:path*", destination: `${base}/api/admin/:path*` },
      { source: "/api/apify/:path*", destination: `${base}/api/apify/:path*` },
    ];
  },
};

export default nextConfig;
