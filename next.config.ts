import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
