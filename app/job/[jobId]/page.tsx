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
import { getRelatedJobs } from "@/lib/related";

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
    label: `${job.name}（${job.id}）`,
    // 岗位可能同属一个行业的两个分组（如 C09 质量管理 + C09 化工），这里按行业去重
    categoryIds: [...new Set(memberships.map((m) => m.category.id))],
    workflowIds: [...new Set(getWorkflowsOfJob(jobId).map((w) => w.id))],
  };
  const workflowsOfJob = getWorkflowsOfJob(jobId);
  const industryCount = [...new Set(memberships.map((m) => m.category.id))].length;
  const related = getRelatedJobs(jobId)
    .map((entry) => ({ job: getJob(entry.id), score: entry.score }))
    .filter((entry): entry is { job: Job; score: number } => Boolean(entry.job));
  const topScore = related[0]?.score ?? 1;
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
              {memberships.length} 条归属 · 出现在 {industryCount} 个行业 ·{" "}
              {workflowsOfJob.length} 条协作链路
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
          {workflowsOfJob.length > 0 && (
            <CardContent className="flex flex-wrap items-center gap-1.5 border-t border-border/60 pt-3 text-xs">
              <span className="text-muted-foreground">所在链路</span>
              {workflowsOfJob.map((workflow) => (
                <Link
                  key={workflow.id}
                  href={`/workflow/${workflow.id}`}
                  data-testid="job-workflow-link"
                  className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {workflow.name}
                </Link>
              ))}
            </CardContent>
          )}
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

      <Separator />

      <section className="flex flex-col gap-3" data-testid="related-jobs">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-sm font-medium">
            职责相近的岗位
            <span className="ml-2 font-mono text-xs text-muted-foreground tabular-nums">
              {related.length}
            </span>
          </h2>
          <p className="text-xs leading-relaxed text-muted-foreground">
            按职责描述的用词接近程度排序，可以横向看看还有哪些岗位在做类似的事。
            它只表示描述相近，<span className="text-foreground/80">不代表岗位等价或要求相同</span>。
          </p>
        </div>
        {related.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-xs text-muted-foreground">
            没有找到描述足够接近的岗位。
          </p>
        ) : (
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {related.map(({ job: relatedJob, score }) => (
              <li key={relatedJob.id}>
                <Link
                  href={`/job/${relatedJob.id}`}
                  data-testid="related-job"
                  className="flex flex-col gap-1.5 rounded-xl border border-border/70 bg-card px-3 py-2 transition-colors hover:border-primary/40"
                >
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm">{relatedJob.name}</span>
                    <span className="ml-auto shrink-0 font-mono text-[0.7rem] text-muted-foreground tabular-nums">
                      {score.toFixed(2)}
                    </span>
                  </span>
                  <span className="h-1 w-full overflow-hidden rounded-full bg-muted">
                    <span
                      className="block h-full rounded-full bg-primary/50"
                      style={{
                        width: `${Math.max(8, Math.round((score / topScore) * 100))}%`,
                      }}
                    />
                  </span>
                  <span className="line-clamp-1 text-[0.7rem] text-muted-foreground">
                    {relatedJob.duty}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
