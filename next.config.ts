import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 静的エクスポート: out/ に完全な静的サイトを吐く。
  // Vercel / Cloudflare Pages / GitHub Pages のどこにでもそのまま置ける。
  output: "export",
  // 静的ホスティングでのパス解決を安定させる (/foo -> /foo/index.html)
  trailingSlash: true,
  eslint: {
    // Lint は npm run lint で独立して回す (Flat Config を直接使うため)
    ignoreDuringBuilds: true,
  },
  images: {
    // next/image の最適化サーバーは静的エクスポートでは使えない
    unoptimized: true,
  },
};

export default nextConfig;
