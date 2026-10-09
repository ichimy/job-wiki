import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowDownIcon } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import {
  getStageJobs,
  getWorkflow,
  getWorkflowHandoffs,
  getWorkflowIndustries,
  getWorkflowJobCount,
  getWorkflows,
} from "@/lib/data";

export const dynamicParams = false;

export function generateStaticParams() {
  return getWorkflows().map((workflow) => ({ workflowId: workflow.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ workflowId: string }>;
}): Promise<Metadata> {
  const { workflowId } = await params;
  const workflow = getWorkflow(workflowId);
  if (!workflow) return { title: "协作链路不存在" };
  return {
    title: `${workflow.name}协作链路`,
    description: `${workflow.description}，共 ${workflow.stages.length} 个阶段、${getWorkflowJobCount(workflow)} 个岗位。`,
    alternates: { canonical: `/workflow/${workflow.id}` },
  };
}

export default async function WorkflowPage({
  params,
}: {
  params: Promise<{ workflowId: string }>;
}) {
  const { workflowId } = await params;
  const workflow = getWorkflow(workflowId);
  if (!workflow) notFound();

  const handoffs = getWorkflowHandoffs(workflow);
  const industries = getWorkflowIndustries(workflow);

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
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{workflow.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-medium tracking-tight">
            {workflow.name}
          </h1>
          <span className="font-mono text-xs text-muted-foreground">
            {workflow.id}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {workflow.description}
        </p>
        <p className="text-xs text-muted-foreground">
          {workflow.stages.length} 个阶段 · {getWorkflowJobCount(workflow)} 个岗位
        </p>
        {industries.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground">相关行业</span>
            {industries.map((industry) => (
              <Badge
                key={industry.id}
                variant="outline"
                className="h-5 font-normal"
                render={<Link href={`/c/${industry.id}`} />}
              >
                {industry.name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <Separator />

      <ol className="flex flex-col" data-testid="workflow-stages">
        {workflow.stages.map((stage, index) => {
          const jobs = getStageJobs(stage);
          const handoff = handoffs[index];
          return (
            <li key={stage.id} className="flex flex-col">
              <Card
                size="sm"
                className="gap-3 ring-1 ring-border/70"
                data-testid="workflow-stage"
                data-stage={stage.id}
              >
                <CardHeader className="gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground tabular-nums">
                      阶段 {String(index + 1).padStart(2, "0")}
                    </span>
                    <CardTitle className="text-sm">{stage.name}</CardTitle>
                    <span className="ml-auto font-mono text-xs text-muted-foreground tabular-nums">
                      {jobs.length} 岗位
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-1.5">
                  {jobs.map((job) => (
                    <Badge
                      key={job.id}
                      variant="secondary"
                      className="h-6 font-normal"
                      render={<Link href={`/job/${job.id}`} />}
                    >
                      {job.name}
                    </Badge>
                  ))}
                </CardContent>
              </Card>
              {handoff && (
                <div
                  className="flex flex-wrap items-center gap-2 px-3 py-2 text-xs text-muted-foreground"
                  data-testid="workflow-handoff"
                >
                  <ArrowDownIcon className="size-3.5" />
                  <span>交付：{handoff.from.name} → {handoff.to.name}</span>
                  <span className="ml-auto font-mono tabular-nums">
                    {handoff.count} 条关系
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
