import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
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
  getCrossIndustryJobs,
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


  const topIndustries = categories.slice(0, 3);
  const crossIndustryJobs = getCrossIndustryJobs(10);

  return (
    <div className="flex flex-col gap-14">
      {/* Hero：左侧定位与入口，右侧用真实数据画一张行业分布指纹 */}
      <section className="relative overflow-hidden rounded-2xl bg-card/70 ring-1 ring-border/70">
        <div className="dot-grid pointer-events-none absolute inset-0 opacity-70" />
        <div className="pointer-events-none absolute -top-32 -right-24 size-[420px] rounded-full bg-primary/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-24 size-[320px] rounded-full bg-hot/5 blur-3xl" />

        <div className="relative grid gap-10 px-6 py-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-14 lg:px-10 lg:py-14">
          <div className="flex flex-col">
            <p className="flex items-center gap-2 text-xs tracking-[0.12em] text-muted-foreground">
              <span className="size-1.5 rounded-full bg-hot" />
              岗位全景 · JOBWIKI
            </p>
            <h1 className="mt-5 text-4xl leading-[1.15] font-medium tracking-tight sm:text-5xl">
              看清一个岗位
              <br />
              属于哪里，站在哪一段
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-foreground/90">
              以行业分组为骨架，把 {counts.jobs} 个岗位收进 {counts.categories}{" "}
              个行业、{counts.groups} 个分组，逐层可查；再用 {counts.workflows}{" "}
              条协作链路，标明相邻岗位之间的交付顺序。
            </p>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              同一份数据回答两类问题：某个岗位属于哪些行业、和谁是同组；它在一条交付流程里站在哪一段、上游把产出交给谁、它的产出又交给谁。
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/c"
                className={cn(buttonVariants(), "gap-1.5")}
              >
                按行业查岗位
                <ArrowRightIcon className="size-3.5" />
              </Link>
              <Link
                href="/workflow"
                className={buttonVariants({ variant: "outline" })}
              >
                沿链路看协作
              </Link>
              <span className="text-xs text-muted-foreground">
                或按 ⌘K 直接搜岗位 ·{" "}
                <Link href="/start" className="text-primary hover:underline">
                  第一次来？从哪开始 →
                </Link>
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-xl bg-background/80 p-5 ring-1 ring-border/70">
            <div className="flex items-baseline justify-between">
              <p className="text-xs font-medium tracking-wide text-muted-foreground">
                行业岗位分布
              </p>
              <p className="font-mono text-xs text-muted-foreground tabular-nums">
                {counts.categories} 个行业
              </p>
            </div>
            <div className="flex h-32 items-end gap-1" aria-hidden="true">
              {categories.map(({ category, jobCount }, index) => (
                <div
                  key={category.id}
                  title={`${category.name} · ${jobCount} 岗位`}
                  className={cn(
                    "flex-1 rounded-t-[3px]",
                    index < 3 ? "bg-primary" : "bg-primary/25",
                  )}
                  style={{
                    height: `${Math.max(5, Math.round((jobCount / busiest) * 100))}%`,
                  }}
                />
              ))}
            </div>
            <div className="flex flex-col gap-1.5 border-t border-border/70 pt-3">
              {topIndustries.map(({ category, jobCount }, index) => (
                <div key={category.id} className="flex items-center gap-2 text-xs">
                  <span
                    className={cn(
                      "w-4 shrink-0 text-right font-mono tabular-nums",
                      index === 0
                        ? "text-primary"
                        : "text-muted-foreground",
                    )}
                  >
                    {index + 1}
                  </span>
                  <span className="truncate">{category.name}</span>
                  <span className="ml-auto shrink-0 font-mono text-muted-foreground tabular-nums">
                    {jobCount} 岗位
                  </span>
                </div>
              ))}
              <p className="pt-1 text-[0.7rem] leading-relaxed text-muted-foreground">
                条形高度为岗位条目数，按岗位数从多到少排列；跨行业归属会在多个行业重复计入。
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-medium tracking-wide text-muted-foreground">
          数据概况
        </h2>
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
      </section>

      <Separator />

      <section className="flex flex-col gap-4" data-testid="cross-industry">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-medium">跨行业复用</h2>
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
            同一个岗位出现在多个行业里，说明这套职责在不同行业都有位置。下面是覆盖行业最多的{" "}
            {crossIndustryJobs.length} 个岗位（同一行业的两个分组只算一个行业）。
          </p>
        </div>
        <ul className="grid gap-2 sm:grid-cols-2">
          {crossIndustryJobs.map(({ job, categories: jobCategories }) => (
            <li key={job.id}>
              <Link
                href={`/job/${job.id}`}
                data-testid="cross-industry-job"
                className="flex items-start gap-3 rounded-xl border border-border/70 bg-card px-3 py-2 transition-colors hover:border-primary/40"
              >
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="truncate text-sm font-medium">{job.name}</span>
                  <span className="flex flex-wrap gap-1">
                    {jobCategories.map((category) => (
                      <Badge
                        key={category.id}
                        variant="secondary"
                        className="h-5 font-normal"
                      >
                        {category.name}
                      </Badge>
                    ))}
                  </span>
                </span>
                <span className="ml-auto shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
                  {jobCategories.length} 个行业
                </span>
              </Link>
            </li>
          ))}
        </ul>
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
