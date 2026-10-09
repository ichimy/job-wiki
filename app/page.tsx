import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
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
  getMeta,
  getWorkflowIndustries,
  getWorkflowJobCount,
  getWorkflows,
} from "@/lib/data";
import { siteName } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `${siteName}（jobWiki）` },
  description:
    "28 个行业、161 个分组、848 个岗位的分布，以及 20 条协作链路与 682 条交付关系：按行业查岗位，按链路看协作。",
};

export default function HomePage() {
  const meta = getMeta();
  const counts = getCounts();
  const categories = getCategoriesWithCount();
  const workflows = getWorkflows();
  const busiest = categories[0]?.jobCount ?? 1;

  const stats = [
    {
      label: "行业",
      value: counts.categories,
      scope: `含 ${counts.groups} 个行业分组`,
    },
    {
      label: "岗位",
      value: counts.jobs,
      scope: "去重后的岗位条目，同一岗位跨行业只计一次",
    },
    {
      label: "分类归属",
      value: counts.memberships,
      scope: "岗位与行业分组的关联条数",
    },
    {
      label: "协作链路",
      value: counts.workflows,
      scope: `按阶段描述交付顺序，覆盖 ${counts.jobsInWorkflows} 个岗位`,
    },
    {
      label: "交付关系",
      value: counts.relations,
      scope: "相邻阶段岗位之间的交付边",
    },
  ];

  const entries = [
    {
      href: "/c",
      id: "entry-categories",
      title: "按行业查岗位",
      description: `28 个行业、161 个分组，逐组查看岗位名称与职责。`,
      meta: "行业 → 分组 → 岗位",
    },
    {
      href: "/workflow",
      id: "entry-workflows",
      title: "沿链路看协作",
      description: `20 条链路，每条 4–6 个阶段，标注相邻阶段的交付关系。`,
      meta: "阶段 → 岗位 → 交付关系",
    },
  ];

  return (
    <div className="flex flex-col gap-14">
      <section className="flex flex-col gap-7">
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">
            岗位全景
          </h1>
          <p className="max-w-3xl text-base leading-relaxed text-foreground/90">
            以行业分组为骨架，把 {counts.jobs} 个岗位收进 {counts.categories} 个行业、
            {counts.groups} 个分组，逐层可查；再用 {counts.workflows} 条协作链路，
            标明相邻岗位之间的交付顺序。
          </p>
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
            同一份数据回答两类问题：某个岗位属于哪些行业、和谁是同组；
            它在一条交付流程里站在哪一段、上游把产出交给谁、它的产出又交给谁。
          </p>
        </div>

        <div
          className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5"
          data-testid="stat-counts"
        >
          {stats.map((stat) => (
            <Card key={stat.label} size="sm" className="gap-1.5">
              <CardHeader className="gap-1.5">
                <CardDescription className="text-xs">
                  {stat.label}
                </CardDescription>
                <p
                  className="font-mono text-3xl leading-none tabular-nums"
                  data-testid="stat-value"
                >
                  {stat.value}
                </p>
                <p className="text-[0.7rem] leading-relaxed text-muted-foreground">
                  {stat.scope}
                </p>
              </CardHeader>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {entries.map((entry) => (
            <Link
              key={entry.href}
              href={entry.href}
              data-testid={entry.id}
              className="group"
            >
              <Card
                size="sm"
                className="h-full gap-2 ring-1 ring-border/70 transition-all group-hover:ring-primary/40"
              >
                <CardHeader className="gap-1.5">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm">{entry.title}</CardTitle>
                    <ArrowRightIcon className="ml-auto size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                  </div>
                  <CardDescription className="text-xs leading-relaxed">
                    {entry.description}
                  </CardDescription>
                  <p className="font-mono text-[0.68rem] text-muted-foreground/80">
                    {entry.meta}
                  </p>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <Separator />

      <section className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-medium">行业分布</h2>
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
            按岗位数从多到少排列。数值为岗位条目数；跨行业归属会在多个行业重复计入，
            因此各行业之和大于岗位总数。
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
          <h2 className="text-xl font-medium">协作链路</h2>
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
            每条链路按阶段描述一次完整的交付顺序，阶段之间是「上游产出交给下游」的关系。
            带赭色标记的链路里，有岗位同时出现在别的链路上。
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

      <Separator />

      <section className="flex flex-col gap-4" data-testid="data-scope">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-medium">数据口径</h2>
          <p className="text-sm text-muted-foreground">
            页面上的每个数字都可以按下面这几条复算。
          </p>
        </div>
        <ul className="flex max-w-3xl list-disc flex-col gap-2 pl-4 text-sm leading-relaxed text-muted-foreground">
          <li>
            岗位在数据集中只存一份，行业与分组通过引用关联；同一岗位可归入多个行业，
            因此分类归属（{counts.memberships}）多于岗位数（{counts.jobs}）。
          </li>
          <li>
            协作链路手工维护，交付关系由相邻阶段派生，只表示交付方向，
            不表示频率、时长或协作强度；每个岗位在同一条链路中只出现在一个阶段。
          </li>
          <li>
            {counts.workflows} 条链路覆盖 {counts.jobsInWorkflows} 个岗位，
            其余岗位只按行业归类，尚未接入链路。
          </li>
          <li>{meta.idScheme}</li>
          <li>{meta.note}</li>
          <li>
            当前数据版本 v{meta.version}，最后更新 {meta.updated}。
          </li>
        </ul>
      </section>
    </div>
  );
}
