import type { Metadata } from "next";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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
  getStageJobs,
  getWorkflowIndustries,
  getWorkflowJobCount,
  getWorkflows,
} from "@/lib/data";

export const metadata: Metadata = {
  title: "协作链路一览",
  description:
    "20 条协作链路的赛道总览：每条链路的阶段顺序、覆盖岗位数，以及它与别的链路共享了哪些岗位。",
  alternates: { canonical: "/workflow" },
};

export default function WorkflowIndexPage() {
  const workflows = getWorkflows();
  const longest = Math.max(...workflows.map((workflow) => workflow.stages.length));
  const totalJobs = workflows.reduce(
    (sum, workflow) => sum + getWorkflowJobCount(workflow),
    0,
  );
  const lanesByJob = new Map<string, number>();
  for (const workflow of workflows) {
    for (const stage of workflow.stages) {
      for (const jobId of stage.jobs) {
        lanesByJob.set(jobId, (lanesByJob.get(jobId) ?? 0) + 1);
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/" />}>总览</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>协作链路</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-medium tracking-tight">协作链路一览</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          每条链路是一条赛道，长度就是阶段数（最长 {longest} 段）。带赭色圆点的链路里，
          有岗位同时出现在别的链路上，点进链路能看到它站在哪个阶段。
        </p>
        <p className="text-xs text-muted-foreground">
          {workflows.length} 条链路 · {totalJobs} 个岗位次 · 覆盖{" "}
          {new Set(workflows.flatMap((w) => w.stages.flatMap((s) => s.jobs))).size}{" "}
          个岗位
        </p>
      </div>

      <Separator />

      <div className="flex flex-col gap-2.5">
        {workflows.map((workflow) => {
          const industries = getWorkflowIndustries(workflow);
          const sharedCount = workflow.stages
            .flatMap((stage) => stage.jobs)
            .filter((jobId) => (lanesByJob.get(jobId) ?? 0) > 1).length;
          return (
            <Link
              key={workflow.id}
              href={`/workflow/${workflow.id}`}
              data-testid="workflow-entry"
              className="group"
            >
              <Card
                size="sm"
                className="gap-2 ring-1 ring-border/70 transition-all group-hover:ring-primary/40"
              >
                <CardHeader className="gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-sm">{workflow.name}</CardTitle>
                    {sharedCount > 0 && (
                      <span
                        title={`含 ${sharedCount} 个跨链路岗位`}
                        data-testid="workflow-entry-shared"
                        className="size-1.5 rounded-full bg-hot"
                      />
                    )}
                    <span className="font-mono text-xs text-muted-foreground tabular-nums">
                      {workflow.stages.length} 阶段 · {getWorkflowJobCount(workflow)}{" "}
                      岗位
                    </span>
                  </div>
                  <CardDescription className="text-xs">
                    {workflow.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {workflow.stages.map((stage, index) => (
                      <span
                        key={stage.id}
                        data-testid="workflow-entry-stage"
                        className="flex items-center gap-1.5"
                      >
                        {index > 0 && (
                          <span className="text-muted-foreground/50">→</span>
                        )}
                        <Badge
                          variant="secondary"
                          className="h-6 max-w-[11rem] justify-start font-normal"
                        >
                          <span className="truncate">{stage.name}</span>
                          <span className="ml-1 font-mono text-[0.65rem] opacity-70">
                            {getStageJobs(stage).length}
                          </span>
                        </Badge>
                      </span>
                    ))}
                  </div>
                  {industries.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {industries.map((industry) => (
                        <Badge
                          key={industry.id}
                          variant="ghost"
                          className="h-5 font-normal text-muted-foreground"
                        >
                          {industry.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
