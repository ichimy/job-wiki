"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronRightIcon,
  PlayIcon,
  RotateCcwIcon,
  XIcon,
} from "lucide-react";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface PipelineJob {
  id: string;
  name: string;
  duty: string;
  hot: boolean;
}

export interface PipelineStage {
  id: string;
  name: string;
  jobs: PipelineJob[];
}

type Selection = { kind: "stage" | "handoff"; index: number } | null;

/**
 * 信息由浅到深：
 *   第一层（默认）只给核心节点与协作关系——阶段名、岗位数、两段之间的交付条数；
 *   第二层（点阶段）展开该阶段的岗位；
 *   第二层（点交接口）展开「谁交给谁」；
 *   第三层是岗位页本身，职责与上下游都在那里。
 * 桌面端按 Z 字折返排布，一屏看完整条链路；窄屏自动退化为纵向堆叠。
 */
export function WorkflowPipeline({
  stages,
  handoffCounts,
}: {
  stages: PipelineStage[];
  handoffCounts: number[];
}) {
  const [playing, setPlaying] = useState(false);
  const [runId, setRunId] = useState(0);
  const [selection, setSelection] = useState<Selection>(null);

  const columns = Math.ceil(stages.length / 2);
  const gridTemplateColumns = `minmax(0,1fr)${" 4.5rem minmax(0,1fr)".repeat(Math.max(0, columns - 1))}`;
  const densest = Math.max(1, ...handoffCounts);

  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(
      () => setPlaying(false),
      900 + handoffCounts.length * 700,
    );
    return () => clearTimeout(timer);
  }, [playing, runId, handoffCounts.length]);

  function play() {
    setRunId((value) => value + 1);
    setPlaying(true);
  }

  function toggle(next: Selection) {
    setSelection((current) =>
      current && next && current.kind === next.kind && current.index === next.index
        ? null
        : next,
    );
  }

  const openStage =
    selection?.kind === "stage" ? stages[selection.index] : null;
  const openHandoff = selection?.kind === "handoff" ? selection.index : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={play}
          data-testid="pipeline-play"
          className="gap-1.5"
        >
          {playing ? (
            <RotateCcwIcon className="size-3.5" />
          ) : (
            <PlayIcon className="size-3.5" />
          )}
          {playing ? "重放交付流" : "播放交付流"}
        </Button>
        <p className="text-xs text-muted-foreground">
          点阶段看岗位，点交接口看「谁交给谁」。
        </p>
      </div>

      <div
        className="flex flex-col gap-2 lg:grid lg:gap-x-0 lg:gap-y-2"
        style={{ gridTemplateColumns }}
      >
        {stages.map((stage, index) => {
          const inFirstRow = index < columns;
          const row = inFirstRow ? 1 : 3;
          const column = inFirstRow
            ? index * 2 + 1
            : (index - columns) * 2 + 1;
          const isTurn = index + 1 === columns;
          const handoffRow = inFirstRow ? 1 : 3;
          const handoffColumn = inFirstRow
            ? index * 2 + 2
            : (index - columns) * 2 + 2;
          const stageOpen =
            selection?.kind === "stage" && selection.index === index;

          return (
            <Fragment key={stage.id}>
              <button
                type="button"
                data-testid="workflow-stage"
                data-stage={stage.id}
                aria-expanded={stageOpen}
                onClick={() => toggle({ kind: "stage", index })}
                style={{ gridRow: row, gridColumn: column }}
                className={cn(
                  "group flex cursor-pointer flex-col gap-1.5 rounded-xl bg-card p-3 text-left ring-1 transition-all",
                  stageOpen
                    ? "ring-2 ring-primary/60"
                    : "ring-border/70 hover:ring-primary/40",
                )}
              >
                <span className="flex items-center gap-2 font-mono text-[0.7rem] text-muted-foreground tabular-nums">
                  阶段 {String(index + 1).padStart(2, "0")}
                  <span
                    className={cn(
                      "ml-auto flex items-center gap-0.5 transition-colors",
                      stageOpen
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-foreground",
                    )}
                  >
                    {stage.jobs.length} 岗位
                    <ChevronRightIcon
                      className={cn(
                        "size-3 transition-transform",
                        stageOpen && "rotate-90",
                      )}
                    />
                  </span>
                </span>
                <span className="text-sm leading-snug font-medium">
                  {stage.name}
                </span>
              </button>

              {index < stages.length - 1 && (
                <div
                  data-testid="workflow-handoff"
                  style={
                    isTurn
                      ? { gridRow: 2, gridColumn: "1 / -1" }
                      : { gridRow: handoffRow, gridColumn: handoffColumn }
                  }
                  className={
                    isTurn
                      ? "flex flex-col gap-1"
                      : "flex flex-col justify-center gap-1 lg:items-center"
                  }
                >
                  <HandoffButton
                    index={index}
                    count={handoffCounts[index]}
                    densest={densest}
                    playing={playing}
                    runId={runId}
                    selected={openHandoff === index}
                    onToggle={toggle}
                    align={isTurn ? "end" : "center"}
                    arrow={isTurn ? "down" : "right"}
                  />
                  {isTurn && (
                    <div className="hidden items-center gap-2 text-[0.7rem] text-muted-foreground/60 lg:flex">
                      <ArrowLeftIcon className="size-3.5 shrink-0" />
                      <span className="shrink-0">折返到第二行</span>
                      <span className="workflow-return-line flex-1" />
                    </div>
                  )}
                </div>
              )}
            </Fragment>
          );
        })}
      </div>

      {openStage && (
        <Card size="sm" data-testid="stage-detail" className="gap-2">
          <CardHeader className="gap-1">
            <div className="flex items-start gap-2">
              <CardTitle className="text-sm">{openStage.name}</CardTitle>
              <span className="font-mono text-xs text-muted-foreground tabular-nums">
                {openStage.jobs.length} 个岗位
              </span>
              <Button
                size="icon-xs"
                variant="ghost"
                className="ml-auto"
                aria-label="收起岗位"
                onClick={() => setSelection(null)}
              >
                <XIcon />
              </Button>
            </div>
          </CardHeader>
          <div className="flex flex-wrap gap-1.5 px-3 pb-3">
            {openStage.jobs.map((job) => (
              <Tooltip key={job.id}>
                <TooltipTrigger
                  render={
                    <Badge
                      variant={job.hot ? "outline" : "secondary"}
                      className={cn(
                        "h-7 cursor-pointer gap-1 font-normal",
                        job.hot && "border-hot/40 bg-hot-soft text-hot",
                      )}
                      render={<Link href={`/job/${job.id}`} />}
                    />
                  }
                >
                  {job.name}
                </TooltipTrigger>
                <TooltipContent className="max-w-xs leading-relaxed">
                  {job.duty}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </Card>
      )}

      {openHandoff !== null && (
        <Card size="sm" data-testid="handoff-detail" className="gap-2">
          <CardHeader className="gap-1">
            <div className="flex items-start gap-2">
              <CardTitle className="text-sm">
                {stages[openHandoff].name} → {stages[openHandoff + 1].name}
              </CardTitle>
              <span className="font-mono text-xs text-muted-foreground tabular-nums">
                {handoffCounts[openHandoff]} 条交付关系
              </span>
              <Button
                size="icon-xs"
                variant="ghost"
                className="ml-auto"
                aria-label="收起交付明细"
                onClick={() => setSelection(null)}
              >
                <XIcon />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              上一阶段每个人的产出，交给下一阶段的这几个人。
            </p>
          </CardHeader>
          <div className="grid gap-1.5 px-3 pb-3 sm:grid-cols-2">
            {stages[openHandoff].jobs.map((job) => (
              <div key={job.id} className="flex items-start gap-1.5 text-xs">
                <Link
                  href={`/job/${job.id}`}
                  className="shrink-0 font-medium hover:underline"
                >
                  {job.name}
                </Link>
                <span className="text-muted-foreground">→</span>
                <span className="text-muted-foreground">
                  {stages[openHandoff + 1].jobs
                    .map((target) => target.name)
                    .join("、")}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function HandoffButton({
  index,
  count,
  densest,
  playing,
  runId,
  selected,
  onToggle,
  align,
  arrow,
}: {
  index: number;
  count: number;
  densest: number;
  playing: boolean;
  runId: number;
  selected: boolean;
  onToggle: (next: Selection) => void;
  align: "center" | "end";
  arrow: "right" | "down";
}) {
  const pct = Math.round((count / densest) * 100);

  return (
    <button
      type="button"
      data-testid="handoff-toggle"
      aria-expanded={selected}
      aria-label={`查看这一段交付明细（${count} 条）`}
      onClick={() => onToggle({ kind: "handoff", index })}
      className={cn(
        "group flex cursor-pointer flex-row items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:flex-col lg:gap-1 lg:px-1",
        align === "end" && "lg:ml-auto lg:w-40 lg:items-end",
        align === "center" && "lg:w-full",
        selected && "bg-muted text-foreground",
      )}
    >
      <span className="shrink-0 font-mono tabular-nums">{count} 条</span>
      <span className="relative hidden h-1.5 w-full overflow-hidden rounded-full bg-muted lg:block">
        <span
          className="absolute inset-y-0 left-0 rounded-full bg-primary/45 transition-all"
          style={{ width: `${pct}%` }}
        />
        {playing && (
          <span
            key={runId}
            data-testid="workflow-pip"
            className="workflow-pip"
            style={{ animationDelay: `${index * 0.55}s` }}
          />
        )}
      </span>
      {arrow === "right" ? (
        <ArrowRightIcon className="size-3.5 shrink-0" />
      ) : (
        <ArrowDownIcon className="size-3.5 shrink-0" />
      )}
    </button>
  );
}
