import type { NextConfig } from 'next';

const pages = process.env.GITHUB_PAGES === 'true';
const repo = 'ARC_Ethereum-Launch-Intelligence';

const config: NextConfig = {
  images: { unoptimized: true },
  trailingSlash: true,
  reactStrictMode: true,
  ...(pages ? { output: 'export' as const, basePath: `/${repo}`, assetPrefix: `/${repo}/` } : {}),
};

export default config;
