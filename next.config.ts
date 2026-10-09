import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* 路由用 generateStaticParams + dynamicParams=false 全量预渲染，
     与 cacheComponents 不兼容，因此不开 Cache Components。 */
  /* next dev 默认会往 AGENTS.md 追加 Next 自己的 agent 说明；本仓库用自维护的
     AGENTS.md，关掉自动写入，避免每次跑 dev 都在工作区留下未提交改动。 */
  agentRules: false,
};

export default nextConfig;
