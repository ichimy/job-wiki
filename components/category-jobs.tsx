"use client";

import { useMemo, useState } from "react";
import { SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { JobCard } from "@/components/job-card";
import { Separator } from "@/components/ui/separator";
import type { Job } from "@/lib/data";

export interface GroupJobs {
  id: string;
  name: string;
  /** 组内同时归属其他行业或分组的岗位数 */
  crossCount: number;
  jobs: Job[];
}

export function CategoryJobs({
  categoryName,
  groups,
  hotIds,
}: {
  categoryName: string;
  groups: GroupJobs[];
  hotIds: string[];
}) {
  const [query, setQuery] = useState("");
  const hot = useMemo(() => new Set(hotIds), [hotIds]);
  const keyword = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!keyword) return groups;
    return groups
      .map((group) => ({
        ...group,
        jobs: group.jobs.filter((job) =>
          `${job.name}\n${job.duty}`.toLowerCase().includes(keyword),
        ),
      }))
      .filter((group) => group.jobs.length > 0);
  }, [groups, keyword]);

  const total = filtered.reduce((sum, group) => sum + group.jobs.length, 0);
  const all = groups.reduce((sum, group) => sum + group.jobs.length, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="relative max-w-sm">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`在「${categoryName}」里过滤岗位`}
            aria-label={`在「${categoryName}」里过滤岗位`}
            data-testid="category-filter"
            className="pl-8"
          />
        </div>
        <p className="text-xs text-muted-foreground" data-testid="filter-summary">
          {keyword
            ? `匹配 ${total} / ${all} 个岗位，${filtered.length} 个分组`
            : `${groups.length} 个分组，共 ${all} 个岗位`}
        </p>
      </div>

      {filtered.length === 0 && (
        <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          没有匹配的岗位，换个关键词试试。
        </p>
      )}

      {filtered.map((group, index) => (
        <section
          key={group.id}
          data-testid="group-section"
          className="flex flex-col gap-3"
        >
          {index > 0 && <Separator className="mb-1" />}
          <div className="flex items-baseline gap-2">
            <h2 className="text-sm font-medium">{group.name}</h2>
            <span className="font-mono text-xs text-muted-foreground tabular-nums">
              {group.jobs.length}
            </span>
            {group.crossCount > 0 && (
              <span
                title={`其中 ${group.crossCount} 个岗位同时归属其他行业或分组`}
                data-testid="group-cross-count"
                className="rounded-full bg-muted px-1.5 py-0.5 text-[0.68rem] text-muted-foreground"
              >
                跨行业 {group.crossCount}
              </span>
            )}
            <span className="ml-auto font-mono text-[0.7rem] text-muted-foreground/70">
              {group.id}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {group.jobs.map((job) => (
              <JobCard key={job.id} job={job} hot={hot.has(job.id)} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
