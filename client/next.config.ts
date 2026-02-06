import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  output: 'export',
  assetPrefix: isProd ? '/loa_for_me/' : '',
  basePath: isProd ? '/loa_for_me' : '',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
