export const siteName = "岗位全景";

export const siteDescription =
  "岗位全景数据集：28 个行业、161 个分组、848 个岗位如何分布，以及 20 条协作链路里岗位之间怎么交接。";

/** 部署地址，Vercel 上可通过 NEXT_PUBLIC_SITE_URL 覆盖。 */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://job-wiki-jet.vercel.app"
).replace(/\/$/, "");
