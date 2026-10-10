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
import { CategoryJobs, type GroupJobs } from "@/components/category-jobs";
import {
  getCategory,
  getCategoryJobCount,
  getCategories,
  getGroupStats,
  getHotIds,
  getJob,
  getWorkflows,
  type Job,
} from "@/lib/data";

export const dynamicParams = false;

export function generateStaticParams() {
  return getCategories().map((category) => ({ categoryId: category.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}): Promise<Metadata> {
  const { categoryId } = await params;
  const category = getCategory(categoryId);
  if (!category) return { title: "行业不存在" };
  const jobCount = getCategoryJobCount(category);
  return {
    title: `${category.name}岗位（${jobCount}）`,
    description: `${category.name}下的 ${category.groups.length} 个分组、${jobCount} 个岗位，含岗位职责与所在协作链路。`,
    alternates: { canonical: `/c/${category.id}` },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const { categoryId } = await params;
  const category = getCategory(categoryId);
  if (!category) notFound();

  const groups: GroupJobs[] = category.groups.map((group) => ({
    id: group.id,
    name: group.name,
    crossCount:
      getGroupStats(category).find((stat) => stat.id === group.id)?.crossCount ?? 0,
    jobs: group.jobs
      .map((id) => getJob(id))
      .filter((job): job is Job => Boolean(job)),
  }));
  const jobCount = getCategoryJobCount(category);
  const relatedWorkflows = getWorkflows().filter((workflow) =>
    workflow.industries.includes(category.id),
  );

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/" />}>总览</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{category.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-medium tracking-tight">
            {category.name}
          </h1>
          <span className="font-mono text-xs text-muted-foreground">
            {category.id}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {jobCount} 个岗位 · {category.groups.length} 个分组
        </p>
        {relatedWorkflows.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground">相关链路</span>
            {relatedWorkflows.map((workflow) => (
              <Badge
                key={workflow.id}
                variant="outline"
                className="h-5 font-normal"
                render={<Link href={`/workflow/${workflow.id}`} />}
              >
                {workflow.name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <Separator />

      <CategoryJobs
        categoryName={category.name}
        groups={groups}
        hotIds={getHotIds()}
      />
    </div>
  );
}
