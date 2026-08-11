import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 开发时允许通过 127.0.0.1 访问，避免 Next 阻止客户端开发资源导致页面无法完成 hydration。
  allowedDevOrigins: ['127.0.0.1'],
};

export default nextConfig;
