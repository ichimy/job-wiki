"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";
import type { NavCategory, NavWorkflow } from "@/lib/nav";

export function CategoryNavList({
  categories,
  testId = "sheet-category",
  highlightIds,
  onNavigate,
}: {
  categories: NavCategory[];
  testId?: string;
  /** 来自当前页面的上下文（岗位所属行业），高亮但不一定等于当前路由 */
  highlightIds?: string[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <ul className="flex flex-col gap-0.5">
      {categories.map((category) => {
        const active = pathname === `/c/${category.id}`;
        const highlighted = highlightIds?.includes(category.id) ?? false;
        return (
          <li key={category.id}>
            <Link
              href={`/c/${category.id}`}
              data-testid={testId}
              data-highlighted={highlighted ? "true" : undefined}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors",
                active
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                highlighted && !active && "bg-primary/10 text-foreground",
              )}
            >
              <span className="truncate">{category.name}</span>
              <span className="ml-auto shrink-0 font-mono text-[0.7rem] tabular-nums opacity-70">
                {category.jobCount}
              </span>
            </Link>
          </li>
        );
      })}
      {categories.length === 0 && (
        <li className="px-2.5 py-2 text-xs text-muted-foreground">没有匹配的行业</li>
      )}
    </ul>
  );
}

export function WorkflowNavList({
  workflows,
  testId = "sheet-workflow",
  highlightIds,
  onNavigate,
}: {
  workflows: NavWorkflow[];
  testId?: string;
  highlightIds?: string[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <ul className="flex flex-col gap-0.5">
      {workflows.map((workflow) => {
        const active = pathname === `/workflow/${workflow.id}`;
        const highlighted = highlightIds?.includes(workflow.id) ?? false;
        return (
          <li key={workflow.id}>
            <Link
              href={`/workflow/${workflow.id}`}
              data-testid={testId}
              data-highlighted={highlighted ? "true" : undefined}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors",
                active
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                highlighted && !active && "bg-primary/10 text-foreground",
              )}
            >
              <span className="truncate">{workflow.name}</span>
              {workflow.sharedCount > 0 && (
                <span
                  title={`含 ${workflow.sharedCount} 个跨链路岗位`}
                  className="size-1.5 shrink-0 rounded-full bg-hot"
                />
              )}
              <span className="ml-auto shrink-0 font-mono text-[0.7rem] tabular-nums opacity-70">
                {workflow.stageCount}
              </span>
            </Link>
          </li>
        );
      })}
      {workflows.length === 0 && (
        <li className="px-2.5 py-2 text-xs text-muted-foreground">没有匹配的链路</li>
      )}
    </ul>
  );
}
