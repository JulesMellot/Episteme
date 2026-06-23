import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project. An orphan `~/package-lock.json`
  // (a lockfile with no package.json beside it) made Next infer the home dir as
  // the root and resolve dependencies from there — which corrupted local
  // installs/builds. Pinning stops the inference.
  turbopack: {
    root: import.meta.dirname,
  },
  // Emit a minimal self-contained server (.next/standalone/server.js) with only
  // the traced runtime dependencies. Drops the full node_modules from the image:
  // much smaller image, faster cold start, lower RAM per instance.
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "wikipedia.org",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "maps.wikimedia.org",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.wikipedia.org",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "wikimedia.org",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.wikimedia.org",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "blog.mozilla.org",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
