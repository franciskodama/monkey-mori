import type { NextConfig } from "next";

// @ts-ignore - Next.js 15+ turbopack root setting
const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    // ... other experimental options if any
  },
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
