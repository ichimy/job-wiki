"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";
import type { NavCategory, NavWorkflow } from "@/lib/nav";

export function CategoryNavList({
  categories,
  testId = "sheet-category",
  onNavigate,
}: {
  categories: NavCategory[];
  testId?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <ul className="flex flex-col gap-0.5">
      {categories.map((category) => {
        const active = pathname === `/c/${category.id}`;
        return (
          <li key={category.id}>
            <Link
              href={`/c/${category.id}`}
              data-testid={testId}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors",
                active
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
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
    </ul>
  );
}

export function WorkflowNavList({
  workflows,
  testId = "sheet-workflow",
  onNavigate,
}: {
  workflows: NavWorkflow[];
  testId?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <ul className="flex flex-col gap-0.5">
      {workflows.map((workflow) => {
        const active = pathname === `/workflow/${workflow.id}`;
        return (
          <li key={workflow.id}>
            <Link
              href={`/workflow/${workflow.id}`}
              data-testid={testId}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors",
                active
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
              )}
            >
              <span className="truncate">{workflow.name}</span>
              <span className="ml-auto shrink-0 font-mono text-[0.7rem] tabular-nums opacity-70">
                {workflow.stageCount}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
