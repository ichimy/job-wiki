"use client";

import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { CategoryNavList, WorkflowNavList } from "@/components/nav-list";
import type { NavCategory, NavWorkflow } from "@/lib/nav";

export function SidebarNav({
  categories,
  workflows,
  jobCount,
  relationCount,
}: {
  categories: NavCategory[];
  workflows: NavWorkflow[];
  jobCount: number;
  relationCount: number;
}) {
  return (
    <aside className="sticky top-14 hidden h-[calc(100svh-3.5rem)] w-56 shrink-0 flex-col gap-3 overflow-hidden py-8 lg:flex">
      <p className="px-2.5 text-xs font-medium tracking-wide text-muted-foreground">
        行业
      </p>
      <div className="relative min-h-0 flex-1">
        <ScrollArea className="-mr-3 h-full pr-3">
          <CategoryNavList categories={categories} testId="sidebar-category" />
        </ScrollArea>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-background to-transparent" />
      </div>
      <Separator />
      <p className="px-2.5 text-xs font-medium tracking-wide text-muted-foreground">
        协作链路
      </p>
      <div className="max-h-52 overflow-y-auto">
        <WorkflowNavList workflows={workflows} testId="sidebar-workflow" />
      </div>
      <p className="px-2.5 pt-1 text-xs text-muted-foreground">
        {jobCount} 个岗位 · {relationCount} 条交付关系 ·{" "}
        <Link href="/" className="hover:text-foreground">
          总览
        </Link>
      </p>
    </aside>
  );
}
