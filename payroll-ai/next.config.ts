import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Explicitly set the turbopack root to the project directory.
  // Without this, Next.js incorrectly infers C:\Users\HP\ as the workspace
  // root (due to a pnpm-lock.yaml there), causing it to watch thousands of
  // unrelated files and making the dev server freeze with 1.2GB+ RAM usage.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;

