import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { WorkflowPipeline } from "@/components/workflow-pipeline";
import {
  getStageJobs,
  getWorkflow,
  getWorkflowHandoffs,
  getWorkflowIndustries,
  getWorkflowJobCount,
  getWorkflows,
  isHot,
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

      <WorkflowPipeline
        stages={workflow.stages.map((stage) => ({
          id: stage.id,
          name: stage.name,
          jobs: getStageJobs(stage).map((job) => ({
            id: job.id,
            name: job.name,
            hot: isHot(job.id),
          })),
        }))}
        handoffCounts={handoffs.map((handoff) => handoff.count)}
      />
    </div>
  );
}
