import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === 'development';
const isGitHubPages = process.env.GITHUB_ACTIONS === 'true';

// For GitHub Pages project site, default to repo name as basePath.
// Hostinger and other non-CI deployments default to root.
// Can still be overridden with NEXT_PUBLIC_BASE_PATH.
const defaultProdBasePath = isGitHubPages ? '/livedemo-karatetech' : '';
const basePath = isDev ? '' : (process.env.NEXT_PUBLIC_BASE_PATH ?? defaultProdBasePath);
const rawAssetPrefix = process.env.NEXT_PUBLIC_ASSET_PREFIX?.trim();
const assetPrefixOverride = rawAssetPrefix
  ? `/${rawAssetPrefix.replace(/^\/+|\/+$/g, '')}`
  : undefined;

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.56.1'],
  output: 'export',
  trailingSlash: true,
  basePath: basePath,
  assetPrefix: assetPrefixOverride ?? (basePath ? `${basePath}/` : undefined),
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
