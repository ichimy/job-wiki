"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";
import type { NavCategory, NavWorkflow } from "@/lib/nav";

/** 高亮项可能落在滚动区外（岗位页常见），进入页面时把它滚进视野。 */
function useRevealHighlight(
  ref: React.RefObject<HTMLAnchorElement | null>,
  key: string,
) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    // 直接操作列表自己的滚动容器，避免带动整页滚动
    const container = element.closest(
      '[data-slot="scroll-area-viewport"], .overflow-y-auto',
    ) as HTMLElement | null;
    if (!container) return;
    const offset =
      element.getBoundingClientRect().top -
      container.getBoundingClientRect().top +
      container.scrollTop;
    container.scrollTo({
      top: Math.max(0, offset - container.clientHeight / 2 + element.offsetHeight / 2),
    });
  }, [ref, key]);
}

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
  const highlightRef = useRef<HTMLAnchorElement | null>(null);
  const highlightKey = `${pathname}|${(highlightIds ?? []).join(",")}`;
  useRevealHighlight(highlightRef, highlightKey);

  const firstHighlighted = categories.find((category) =>
    highlightIds?.includes(category.id),
  );
  return (
    <ul className="flex flex-col gap-0.5">
      {categories.map((category) => {
        const active = pathname === `/c/${category.id}`;
        const highlighted = highlightIds?.includes(category.id) ?? false;
        const isRevealTarget = highlighted || (active && !firstHighlighted);
        return (
          <li key={category.id}>
            <Link
              ref={isRevealTarget ? highlightRef : undefined}
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
  const highlightRef = useRef<HTMLAnchorElement | null>(null);
  const highlightKey = `${pathname}|${(highlightIds ?? []).join(",")}`;
  useRevealHighlight(highlightRef, highlightKey);

  const firstHighlighted = workflows.find((workflow) =>
    highlightIds?.includes(workflow.id),
  );
  return (
    <ul className="flex flex-col gap-0.5">
      {workflows.map((workflow) => {
        const active = pathname === `/workflow/${workflow.id}`;
        const highlighted = highlightIds?.includes(workflow.id) ?? false;
        const isRevealTarget = highlighted || (active && !firstHighlighted);
        return (
          <li key={workflow.id}>
            <Link
              ref={isRevealTarget ? highlightRef : undefined}
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
