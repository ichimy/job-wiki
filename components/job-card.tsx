import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Job } from "@/lib/data";

export interface JobCardData {
  id: string;
  name: string;
  duty: string;
}

export function HotBadge() {
  return (
    <Badge
      variant="outline"
      className="h-4.5 shrink-0 border-hot/40 bg-hot-soft px-1.5 text-[0.68rem] text-hot"
    >
      热门
    </Badge>
  );
}

export function JobCard({
  job,
  hot,
  caption,
}: {
  job: JobCardData | Job;
  hot: boolean;
  caption?: string;
}) {
  return (
    <Link
      href={`/job/${job.id}`}
      data-testid="job-card"
      className="group flex"
      aria-label={`${job.name}（${job.id}）`}
    >
      <Card
        size="sm"
        className="h-full w-full gap-1.5 ring-1 ring-border/70 transition-all group-hover:ring-primary/40 group-focus-visible:ring-2 group-focus-visible:ring-ring/60"
      >
        <CardHeader className="gap-1">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-sm leading-snug">{job.name}</CardTitle>
            {hot && <HotBadge />}
          </div>
          <CardDescription className="line-clamp-2 text-xs leading-relaxed">
            {job.duty}
          </CardDescription>
          {caption && (
            <p className="text-[0.7rem] text-muted-foreground">{caption}</p>
          )}
        </CardHeader>
      </Card>
    </Link>
  );
}
