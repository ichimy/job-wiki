"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SearchIcon } from "lucide-react";
import { cn } from "cn";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { CategoryNavList, WorkflowNavList } from "@/components/nav-list";
import { useNavTarget } from "@/components/nav-target-publisher";
import type { NavCategory, NavWorkflow } from "@/lib/nav";

export function SidebarNav({
  categories,
  workflows,
  version,
  updated,
}: {
  categories: NavCategory[];
  workflows: NavWorkflow[];
  version: string;
  updated: string;
}) {
  const target = useNavTarget();
  const pathname = usePathname();
  const [categoryFilter, setCategoryFilter] = useState("");
  const [workflowFilter, setWorkflowFilter] = useState("");

  // 侧栏只服务「行业」与「协作链路」两个视图：
  // 总览不挂侧栏；行业与链路视图各给对应清单；岗位页是跨视图的落点，给两份。
  const onIndustryView = pathname === "/c" || pathname.startsWith("/c/");
  const onWorkflowView =
    pathname === "/workflow" || pathname.startsWith("/workflow/");
  const onJobView = pathname.startsWith("/job/");
  const showCategories = onIndustryView || onJobView;
  const showWorkflows = onWorkflowView || onJobView;

  const visibleCategories = useMemo(() => {
    const keyword = categoryFilter.trim().toLowerCase();
    if (!keyword) return categories;
    return categories.filter((category) =>
      category.name.toLowerCase().includes(keyword),
    );
  }, [categories, categoryFilter]);

  const visibleWorkflows = useMemo(() => {
    const keyword = workflowFilter.trim().toLowerCase();
    if (!keyword) return workflows;
    return workflows.filter(
      (workflow) =>
        workflow.name.toLowerCase().includes(keyword) ||
        workflow.description.toLowerCase().includes(keyword),
    );
  }, [workflows, workflowFilter]);

  if (!showCategories && !showWorkflows) return null;

  const currentCategories = (target?.categoryIds ?? [])
    .map((id) => categories.find((category) => category.id === id))
    .filter((category): category is NavCategory => Boolean(category));
  const currentWorkflows = (target?.workflowIds ?? [])
    .map((id) => workflows.find((workflow) => workflow.id === id))
    .filter((workflow): workflow is NavWorkflow => Boolean(workflow));
  const relatedWorkflows = workflows.filter((workflow) =>
    (target?.workflowIds ?? []).includes(workflow.id),
  );

  return (
    <aside className="sticky top-14 hidden h-[calc(100svh-3.5rem)] w-56 shrink-0 flex-col gap-2.5 overflow-hidden py-6 lg:flex">
      {target?.label && (
        <div
          className="mx-1 flex flex-col gap-1.5 rounded-xl bg-muted/60 p-2.5"
          data-testid="sidebar-current"
        >
          <p className="text-[0.7rem] text-muted-foreground">当前岗位</p>
          <p className="text-sm leading-snug font-medium">{target.label}</p>
          <div className="flex flex-wrap gap-1">
            {currentCategories.map((category) => (
              <Link
                key={category.id}
                href={`/c/${category.id}`}
                data-testid="sidebar-current-category"
                className="rounded-full bg-background px-2 py-0.5 text-[0.7rem] text-muted-foreground ring-1 ring-border transition-colors hover:text-foreground"
              >
                {category.name}
              </Link>
            ))}
            {currentWorkflows.length > 0 ? (
              currentWorkflows.map((workflow) => (
                <Link
                  key={workflow.id}
                  href={`/workflow/${workflow.id}`}
                  data-testid="sidebar-current-workflow"
                  className="rounded-full bg-background px-2 py-0.5 text-[0.7rem] text-muted-foreground ring-1 ring-border transition-colors hover:text-foreground"
                >
                  {workflow.name}
                </Link>
              ))
            ) : (
              <span className="text-[0.7rem] text-muted-foreground">
                未纳入已整理的协作链路
              </span>
            )}
          </div>
        </div>
      )}

      {showCategories && (
        <>
          <p className="px-2.5 text-xs font-medium tracking-wide text-muted-foreground">
            行业
          </p>
          <div className="relative px-1">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              placeholder="筛选行业"
              aria-label="筛选行业"
              data-testid="sidebar-category-filter"
              className="h-7 pl-7 text-xs"
            />
          </div>
          <ScrollArea className="-mr-3 min-h-0 flex-1 pr-3">
            <CategoryNavList
              categories={visibleCategories}
              testId="sidebar-category"
              highlightIds={target?.categoryIds}
            />
          </ScrollArea>
        </>
      )}

      {showCategories && showWorkflows && <Separator />}

      {showWorkflows && (
        <>
          <p className="px-2.5 text-xs font-medium tracking-wide text-muted-foreground">
            {onJobView ? "相关链路" : "协作链路"}
          </p>
          {onJobView ? (
            // 岗位页只列它真正所在的链路，不相关的链路不铺出来
            relatedWorkflows.length > 0 ? (
              <WorkflowNavList
                workflows={relatedWorkflows}
                testId="sidebar-workflow"
                highlightIds={target?.workflowIds}
              />
            ) : (
              <p
                className="px-2.5 text-xs leading-relaxed text-muted-foreground"
                data-testid="sidebar-workflow-empty"
              >
                这个岗位未纳入已整理的协作链路。
              </p>
            )
          ) : (
            <>
              <div className="relative px-1">
                <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={workflowFilter}
                  onChange={(event) => setWorkflowFilter(event.target.value)}
                  placeholder="筛选链路"
                  aria-label="筛选链路"
                  data-testid="sidebar-workflow-filter"
                  className="h-7 pl-7 text-xs"
                />
              </div>
              <div
                className={cn(
                  "overflow-y-auto",
                  showCategories ? "max-h-52" : "min-h-0 flex-1",
                )}
              >
                <WorkflowNavList
                  workflows={visibleWorkflows}
                  testId="sidebar-workflow"
                  highlightIds={target?.workflowIds}
                />
              </div>
            </>
          )}
        </>
      )}

      <p className="px-2.5 pt-1 text-[0.7rem] text-muted-foreground">
        数据 v{version} · {updated} 更新
      </p>
    </aside>
  );
}
