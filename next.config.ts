import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    "preview-chat-4f907654-b84c-4e5c-97d9-26deb39cc8d7.space.z.ai",
    "*.space.z.ai",
  ],
};

export default nextConfig;
