import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* 路由用 generateStaticParams + dynamicParams=false 全量预渲染，
     与 cacheComponents 不兼容，因此不开 Cache Components。 */
};

export default nextConfig;
