import type { NextConfig } from "next";

const githubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  ...(githubPages
    ? {
        output: "export" as const,
        basePath: "/NoPuntIntendedSite",
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
