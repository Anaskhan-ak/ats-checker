import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      pdfjs: path.resolve(__dirname, "node_modules/pdfjs-dist"),
    };

    return config;
  },
};

export default nextConfig;
