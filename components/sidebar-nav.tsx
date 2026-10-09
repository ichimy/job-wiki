"use client";

import { useMemo, useState } from "react";
import { SearchIcon } from "lucide-react";
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
  const [categoryFilter, setCategoryFilter] = useState("");
  const [workflowFilter, setWorkflowFilter] = useState("");

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

  return (
    <aside className="sticky top-14 hidden h-[calc(100svh-3.5rem)] w-56 shrink-0 flex-col gap-2.5 overflow-hidden py-6 lg:flex">
      {/* 一级视图只在顶栏，侧栏只负责「看哪个行业 / 哪条链路」 */}
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

      <Separator />

      <p className="px-2.5 text-xs font-medium tracking-wide text-muted-foreground">
        协作链路
      </p>
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
      <div className="max-h-52 overflow-y-auto">
        <WorkflowNavList
          workflows={visibleWorkflows}
          testId="sidebar-workflow"
          highlightIds={target?.workflowIds}
        />
      </div>

      <p className="px-2.5 pt-1 text-[0.7rem] text-muted-foreground">
        数据 v{version} · {updated} 更新
      </p>
    </aside>
  );
}
