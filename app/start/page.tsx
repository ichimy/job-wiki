import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  getCounts,
  getCrossIndustryCount,
  getMultiWorkflowJobs,
} from "@/lib/data";

export const metadata: Metadata = {
  title: "从哪开始",
  description:
    "三条使用路径：还没入行先建立岗位名词地图，想换方向先看跨行业复用与职责相近的岗位，已经在行业里则用协作链路找位置感。",
  alternates: { canonical: "/start" },
};

interface Track {
  id: string;
  title: string;
  audience: string;
  steps: { title: string; detail: string; href: string; linkText: string }[];
}

export default function StartPage() {
  const counts = getCounts();
  const crossIndustryCount = getCrossIndustryCount();
  const multi = getMultiWorkflowJobs(1)[0];

  const tracks: Track[] = [
    {
      id: "newcomer",
      title: "还没入行",
      audience: "在校生、应届生，或者只知道几个耳熟能详的岗位名",
      steps: [
        {
          title: "先建立「有哪些岗位」的名词地图",
          detail: `${counts.categories} 个行业、${counts.groups} 个分组，从最熟的行业开始点进去。`,
          href: "/c",
          linkText: "看行业一览",
        },
        {
          title: "挑 3–5 个岗位，读职责原句",
          detail: "每句职责 40–60 字，写的是这个岗位每天在做什么，比岗位名可靠得多。",
          href: "/c/C01",
          linkText: "以互联网/AI 为例",
        },
        {
          title: "再看它在流程里的位置",
          detail: "同一个岗位在不同链路里可能站在不同阶段，先理解它和谁配合。",
          href: "/workflow",
          linkText: "看协作链路",
        },
      ],
    },
    {
      id: "switcher",
      title: "想换方向",
      audience: "转行、跨行业，或者不确定自己现在做的事算不算某个岗位",
      steps: [
        {
          title: "先看哪些岗位本来就能跨行业",
          detail: `${crossIndustryCount} 个岗位同时归属多个行业，说明这套职责在不同行业里都有位置。`,
          href: "/",
          linkText: "看跨行业复用清单",
        },
        {
          title: "再用「职责相近的岗位」横向扩展",
          detail: "岗位页底部会列出职责描述最接近的 5 个岗位，可能来自完全不同的行业。",
          href: "/job/J0568",
          linkText: "以平面设计为例",
        },
        {
          title: "按阶段名搜索，而不是只按岗位名",
          detail:
            "⌘K 里可以直接搜「测试验证」「创意执行」这类阶段名，会列出正在做这件事的岗位。",
          href: "/workflow/W01",
          linkText: "看阶段怎么命名",
        },
      ],
    },
    {
      id: "insider",
      title: "已经在行业里",
      audience: "想看清自己在流程中的位置，或者想知道下一步往哪走",
      steps: [
        {
          title: "看所在分组的密度",
          detail: "分组里有多少同类岗位、有多少岗位已经跨到别的行业，是判断这个方向宽窄的事实依据。",
          href: "/c/C09",
          linkText: "看生产制造的分组",
        },
        {
          title: "看自己的上游与下游",
          detail: "岗位页会列出「谁的产出交给它」「它的产出交给谁」，都是相邻阶段的岗位。",
          href: "/job/J0001",
          linkText: "以 Java 为例",
        },
        {
          title: "看同时出现在多条链路上的岗位",
          detail: multi
            ? `例如 ${multi.job.name} 同时出现在 ${multi.workflows.length} 条链路上，这类岗位往往是流程里的交汇点。`
            : "有些岗位同时出现在多条链路上，往往是流程里的交汇点。",
          href: "/workflow",
          linkText: "看链路一览",
        },
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/" />}>总览</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>从哪开始</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-medium tracking-tight">从哪开始</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          这份数据能回答的是「岗位做什么、在哪里、和谁配合」。按你现在的状态选一条路径，
          每步都直接落到具体的页面上。
        </p>
      </div>

      <Separator />

      <div className="grid gap-3 lg:grid-cols-3" data-testid="start-tracks">
        {tracks.map((track) => (
          <Card key={track.id} size="sm" className="gap-3" data-testid="start-track">
            <CardHeader className="gap-1">
              <CardTitle className="text-base">{track.title}</CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                {track.audience}
              </CardDescription>
            </CardHeader>
            <ol className="flex flex-col gap-3 px-3 pb-3">
              {track.steps.map((step, index) => (
                <li key={step.title} className="flex flex-col gap-1">
                  <span className="flex items-start gap-2 text-sm leading-snug">
                    <span className="mt-0.5 font-mono text-[0.7rem] text-muted-foreground tabular-nums">
                      {index + 1}
                    </span>
                    <span className="font-medium">{step.title}</span>
                  </span>
                  <span className="pl-5 text-xs leading-relaxed text-muted-foreground">
                    {step.detail}
                  </span>
                  <Link
                    href={step.href}
                    className="ml-5 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    {step.linkText}
                    <ArrowRightIcon className="size-3" />
                  </Link>
                </li>
              ))}
            </ol>
          </Card>
        ))}
      </div>

      <Separator />

      <section className="flex flex-col gap-2" data-testid="start-scope">
        <h2 className="text-sm font-medium">这份数据不回答什么</h2>
        <ul className="flex max-w-3xl list-disc flex-col gap-1.5 pl-4 text-xs leading-relaxed text-muted-foreground">
          <li>不提供薪资、学历门槛、招聘量或成功率——数据集里没有这些信息，也不做推测。</li>
          <li>
            「职责相近」只看职责描述的用词接近程度，<span className="text-foreground/80">不代表岗位等价或要求相同</span>。
          </li>
          <li>
            处在链路的第一阶段只说明流程位置，<span className="text-foreground/80">不等于门槛更低</span>。
          </li>
          <li>流程上相邻的两个岗位也不代表技能要求相近，只是产出会交给对方。</li>
        </ul>
      </section>
    </div>
  );
}
