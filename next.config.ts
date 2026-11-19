import type { NextConfig } from "next";

/** Ordinary Next.js locally; OpenNext generates the Cloudflare Worker separately. */
const nextConfig: NextConfig = {
  ...(process.env.CF_BUILD === "1" ? { output: "standalone" as const } : {}),
  images: { unoptimized: true },
  outputFileTracingExcludes: {
    "/*": [
      "./public/downloads/**",
      "./artifacts/**",
      "./cloudflare-dist/**",
      "./.open-next/**",
      "./your-magazine-cloudflare.zip",
    ],
  },
};

export default nextConfig;
