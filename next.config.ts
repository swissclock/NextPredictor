import path from "node:path";
import type { NextConfig } from "next";

// Fully static site: the Python pipeline writes JSON into public/data and the pages fetch it client-side,
// so refreshing predictions never requires a rebuild. Set NEXT_PUBLIC_BASE_PATH for GitHub Pages sub-paths.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  images: { unoptimized: true },
  // pin the project root: a stray package-lock.json higher up (e.g. in $HOME) would otherwise be picked
  turbopack: { root: path.join(__dirname) },
};

export default nextConfig;
