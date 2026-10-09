import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  getCategoriesWithCount,
  getCounts,
  getWorkflowIndustries,
  getWorkflowJobCount,
  getWorkflows,
} from "@/lib/data";
import { siteDescription, siteName } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `${siteName}（jobWiki）` },
  description: siteDescription,
};

export default function HomePage() {
  const counts = getCounts();
  const categories = getCategoriesWithCount();
  const workflows = getWorkflows();
  const busiest = categories[0]?.jobCount ?? 1;

  const stats = [
    { label: "行业", value: counts.categories, hint: `${counts.groups} 个分组` },
    { label: "岗位", value: counts.jobs, hint: "去重后的岗位数" },
    {
      label: "协作链路",
      value: counts.workflows,
      hint: `${counts.jobsInWorkflows} 个岗位在链路里`,
    },
    { label: "交付关系", value: counts.relations, hint: "相邻阶段之间" },
    { label: "分类归属", value: counts.memberships, hint: "岗位可跨行业" },
  ];

  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <h1 className="text-2xl font-medium tracking-tight sm:text-3xl">
            岗位全景
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {siteDescription}
            <br />
            岗位只在数据集里存一份，行业与分组通过引用关联，所以同一个岗位可以同时出现在几个行业里。
          </p>
        </div>
        <div
          className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5"
          data-testid="stat-counts"
        >
          {stats.map((stat) => (
            <Card key={stat.label} size="sm" className="gap-1">
              <CardHeader className="gap-1">
                <CardDescription className="text-xs">
                  {stat.label}
                </CardDescription>
                <p
                  className="font-mono text-2xl leading-none tabular-nums"
                  data-testid="stat-value"
                >
                  {stat.value}
                </p>
                <p className="text-[0.7rem] text-muted-foreground">
                  {stat.hint}
                </p>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      <section className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-medium">行业总览</h2>
          <p className="text-sm text-muted-foreground">
            按岗位数从多到少排列，点进去看分组与岗位。
          </p>
        </div>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map(({ category, jobCount, groupCount }) => (
            <Link
              key={category.id}
              href={`/c/${category.id}`}
              data-testid="category-card"
              className="group"
            >
              <Card
                size="sm"
                className="h-full gap-2 ring-1 ring-border/70 transition-all group-hover:ring-primary/40"
              >
                <CardHeader className="gap-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm">{category.name}</CardTitle>
                    <span className="ml-auto font-mono text-xs text-muted-foreground tabular-nums">
                      {jobCount} 岗位
                    </span>
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary/60"
                      style={{
                        width: `${Math.max(6, Math.round((jobCount / busiest) * 100))}%`,
                      }}
                    />
                  </div>
                  <CardDescription className="text-xs">
                    {groupCount} 个分组 · {category.id}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <Separator />

      <section className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-medium">协作链路</h2>
          <p className="text-sm text-muted-foreground">
            一个行业里从需求到交付的岗位顺序，相邻阶段之间形成交付关系。
          </p>
        </div>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {workflows.map((workflow) => {
            const industries = getWorkflowIndustries(workflow);
            return (
              <Link
                key={workflow.id}
                href={`/workflow/${workflow.id}`}
                data-testid="workflow-link"
                className="group"
              >
                <Card
                  size="sm"
                  className="h-full gap-2 ring-1 ring-border/70 transition-all group-hover:ring-primary/40"
                >
                  <CardHeader className="gap-1.5">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm">{workflow.name}</CardTitle>
                      <span className="ml-auto font-mono text-xs text-muted-foreground tabular-nums">
                        {workflow.stages.length} 阶段 ·{" "}
                        {getWorkflowJobCount(workflow)} 岗位
                      </span>
                    </div>
                    <CardDescription className="line-clamp-2 text-xs">
                      {workflow.description}
                    </CardDescription>
                  </CardHeader>
                  {industries.length > 0 && (
                    <CardContent className="flex flex-wrap gap-1">
                      {industries.slice(0, 4).map((industry) => (
                        <Badge
                          key={industry.id}
                          variant="secondary"
                          className="h-5 font-normal"
                        >
                          {industry.name}
                        </Badge>
                      ))}
                      {industries.length > 4 && (
                        <Badge variant="ghost" className="h-5 font-normal">
                          +{industries.length - 4}
                        </Badge>
                      )}
                    </CardContent>
                  )}
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
