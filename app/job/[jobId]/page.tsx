import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cn } from "cn";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { NavTargetPublisher } from "@/components/nav-target-publisher";
import {
  getCounts,
  getDownstream,
  getJob,
  getJobs,
  getMemberships,
  getPeers,
  getStageOf,
  getUpstream,
  getWorkflowsOfJob,
  isHot,
  type Job,
  type WorkflowJobs,
} from "@/lib/data";

export const dynamicParams = false;

export function generateStaticParams() {
  return getJobs().map((job) => ({ jobId: job.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ jobId: string }>;
}): Promise<Metadata> {
  const { jobId } = await params;
  const job = getJob(jobId);
  if (!job) return { title: "岗位不存在" };
  return {
    title: `${job.name}岗位职责`,
    description: job.duty,
    alternates: { canonical: `/job/${job.id}` },
  };
}

function JobLinkList({
  jobs,
  testId,
}: {
  jobs: Job[];
  testId: string;
}) {
  return (
    <ul className="grid gap-1 sm:grid-cols-2">
      {jobs.map((job) => (
        <li key={job.id}>
          <Link
            href={`/job/${job.id}`}
            data-testid={testId}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <span className="truncate">{job.name}</span>
            <span className="ml-auto shrink-0 font-mono text-[0.7rem] opacity-70">
              {job.id}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function NeighbourSection({
  title,
  hint,
  groups,
  testId,
  emptyText,
}: {
  title: string;
  hint: string;
  groups: WorkflowJobs[];
  testId: string;
  emptyText: string;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-sm font-medium">{title}</h2>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      {groups.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-xs text-muted-foreground">
          {emptyText}
        </p>
      ) : (
        groups.map(({ workflow, jobs }) => (
          <div
            key={workflow.id}
            className="flex flex-col gap-1.5 rounded-xl border border-border/70 bg-card/60 p-3"
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Link
                href={`/workflow/${workflow.id}`}
                className="hover:text-foreground"
              >
                {workflow.name}
              </Link>
              <span className="ml-auto font-mono tabular-nums">
                {jobs.length}
              </span>
            </div>
            <JobLinkList jobs={jobs} testId={testId} />
          </div>
        ))
      )}
    </section>
  );
}

export default async function JobPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const job = getJob(jobId);
  if (!job) notFound();

  const memberships = getMemberships(jobId);
  const position = getStageOf(jobId);
  const upstream = getUpstream(jobId);
  const downstream = getDownstream(jobId);
  const peers = getPeers(jobId);
  const primary = memberships[0];
  const counts = getCounts();
  const navTarget = {
    categoryIds: memberships.map((membership) => membership.category.id),
    workflowIds: getWorkflowsOfJob(jobId).map((workflow) => workflow.id),
  };
  const stagePercent = position
    ? Math.round((position.index / position.total) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-6">
      <NavTargetPublisher target={navTarget} />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/" />}>总览</BreadcrumbLink>
          </BreadcrumbItem>
          {primary && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link href={`/c/${primary.category.id}`} />}>
                  {primary.category.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{primary.group.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{job.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-medium tracking-tight">{job.name}</h1>
        {isHot(job.id) && (
          <Badge
            variant="outline"
            className="border-hot/40 bg-hot-soft text-hot"
          >
            热门
          </Badge>
        )}
        <span className="font-mono text-xs text-muted-foreground">
          {job.id}
        </span>
      </div>

      <Card size="sm" className="gap-2">
        <CardHeader className="gap-1">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            职责
          </CardTitle>
          <p className="text-sm leading-relaxed" data-testid="job-duty">
            {job.duty}
          </p>
        </CardHeader>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card size="sm" className="gap-3">
          <CardHeader className="gap-0.5">
            <CardTitle className="text-sm">所属行业与分组</CardTitle>
            <p className="text-xs text-muted-foreground">
              共 {memberships.length} 条归属，点进去看同行业的其他岗位
            </p>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {memberships.map(({ category, group }) => (
              <Badge
                key={group.id}
                variant="outline"
                className="h-6 gap-1 font-normal"
                render={<Link href={`/c/${category.id}`} />}
                data-testid="job-membership"
              >
                <span>{category.name}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">{group.name}</span>
              </Badge>
            ))}
            {memberships.length === 0 && (
              <p className="text-xs text-muted-foreground">
                这个岗位还没有归属到任何行业。
              </p>
            )}
          </CardContent>
        </Card>

        <Card size="sm" className="gap-3" data-testid="job-position">
          <CardHeader className="gap-0.5">
            <CardTitle className="text-sm">协作位置</CardTitle>
            {position ? (
              <p className="text-xs text-muted-foreground">
                在「{position.workflow.name}」的第 {position.index} /{" "}
                {position.total} 阶段
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                未纳入已整理的协作链路
              </p>
            )}
          </CardHeader>
          {position ? (
            <CardContent className="flex flex-col gap-3">
              <Link
                href={`/workflow/${position.workflow.id}`}
                className="text-sm font-medium hover:underline"
              >
                {position.workflow.name}
              </Link>
              <Progress
                value={stagePercent}
                aria-label={`阶段进度 ${stagePercent}%`}
                data-testid="job-progress"
              />
              <ol className="flex flex-col gap-1">
                {position.workflow.stages.map((stage, index) => (
                  <li
                    key={stage.id}
                    className={cn(
                      "flex items-center gap-2 text-xs",
                      index + 1 === position.index
                        ? "font-medium text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    <span className="font-mono tabular-nums">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="truncate">{stage.name}</span>
                    {index + 1 === position.index && (
                      <span className="ml-auto shrink-0 text-[0.7rem] text-primary">
                        当前阶段
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </CardContent>
          ) : (
            <CardContent>
              <p className="text-xs text-muted-foreground">
                数据集里的 {counts.jobs} 个岗位中有一部分只按行业整理，还没有连进协作链路。
              </p>
            </CardContent>
          )}
        </Card>
      </div>

      <Separator />

      <div className="grid gap-6 lg:grid-cols-2">
        <NeighbourSection
          title="上游"
          hint="谁的产出交给它"
          groups={upstream}
          testId="job-upstream-item"
          emptyText="暂无记录的上游岗位。"
        />
        <NeighbourSection
          title="下游"
          hint="它的产出交给谁"
          groups={downstream}
          testId="job-downstream-item"
          emptyText="暂无记录的下游岗位。"
        />
      </div>

      <Separator />

      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-sm font-medium">
            同组岗位
            <span className="ml-2 font-mono text-xs text-muted-foreground tabular-nums">
              {peers.length}
            </span>
          </h2>
          <p className="text-xs text-muted-foreground">
            同一分组里的其他岗位
          </p>
        </div>
        {peers.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-xs text-muted-foreground">
            这个岗位独占一个分组。
          </p>
        ) : (
          <JobLinkList jobs={peers} testId="job-peer" />
        )}
      </section>
    </div>
  );
}
