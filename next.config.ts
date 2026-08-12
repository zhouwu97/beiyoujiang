import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 开发时允许本机和 ngrok 隧道加载 Next 客户端资源，避免跨源校验阻断 hydration。
  allowedDevOrigins: ['127.0.0.1', '*.ngrok-free.dev'],
};

export default nextConfig;
