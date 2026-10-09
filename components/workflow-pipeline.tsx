"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  PlayIcon,
  RotateCcwIcon,
  XIcon,
} from "lucide-react";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface PipelineJob {
  id: string;
  name: string;
  hot: boolean;
}

export interface PipelineStage {
  id: string;
  name: string;
  jobs: PipelineJob[];
}

/**
 * 桌面端把阶段排成「Z 字折返」：第一行从左到右，折返线回到左边，第二行继续，
 * 一屏就能看完整条链路；窄屏自动退化为纵向堆叠。
 * DOM 顺序始终是「阶段 1 → 交接口 → 阶段 2 …」，测试与读屏都按顺序拿到。
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
  const [openIndex, setOpenIndex] = useState<number | null>(null);

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

  function toggle(index: number) {
    setOpenIndex((value) => (value === index ? null : index));
  }

  const open = openIndex === null ? null : stages[openIndex];
  const openNext = openIndex === null ? null : stages[openIndex + 1];

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
          点交接口看「谁交给谁」，色带越满表示这一段交接越多。
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
          const handoff = handoffCounts[index];
          const isTurn = index + 1 === columns;
          const handoffRow = inFirstRow ? 1 : 3;
          const handoffColumn = inFirstRow
            ? index * 2 + 2
            : (index - columns) * 2 + 2;

          return (
            <Fragment key={stage.id}>
              <Card
                size="sm"
                data-testid="workflow-stage"
                data-stage={stage.id}
                style={{ gridRow: row, gridColumn: column }}
                className="gap-2 ring-1 ring-border/70"
              >
                <CardHeader className="gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[0.7rem] text-muted-foreground tabular-nums">
                      阶段 {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="ml-auto font-mono text-[0.7rem] text-muted-foreground tabular-nums">
                      {stage.jobs.length} 岗位
                    </span>
                  </div>
                  <CardTitle className="text-sm leading-snug">
                    {stage.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-1">
                  {stage.jobs.map((job) => (
                    <Badge
                      key={job.id}
                      variant={job.hot ? "outline" : "secondary"}
                      className={cn(
                        "h-6 max-w-full gap-1 font-normal",
                        job.hot && "border-hot/40 bg-hot-soft text-hot",
                      )}
                      render={<Link href={`/job/${job.id}`} />}
                    >
                      <span className="truncate">{job.name}</span>
                    </Badge>
                  ))}
                </CardContent>
              </Card>

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
                    count={handoff}
                    densest={densest}
                    playing={playing}
                    runId={runId}
                    openIndex={openIndex}
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

      {open && openNext && openIndex !== null && (
        <Card size="sm" data-testid="handoff-detail" className="gap-2">
          <CardHeader className="gap-1">
            <div className="flex items-start gap-2">
              <CardTitle className="text-sm">
                {open.name} → {openNext.name}
              </CardTitle>
              <span className="font-mono text-xs text-muted-foreground tabular-nums">
                {handoffCounts[openIndex]} 条交付关系
              </span>
              <Button
                size="icon-xs"
                variant="ghost"
                className="ml-auto"
                aria-label="收起交付明细"
                onClick={() => setOpenIndex(null)}
              >
                <XIcon />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              上一阶段每个人的产出，交给下一阶段的这几个人。
            </p>
          </CardHeader>
          <CardContent className="grid gap-1.5 sm:grid-cols-2">
            {open.jobs.map((job) => (
              <div key={job.id} className="flex items-start gap-1.5 text-xs">
                <Link
                  href={`/job/${job.id}`}
                  className="shrink-0 font-medium hover:underline"
                >
                  {job.name}
                </Link>
                <span className="text-muted-foreground">→</span>
                <span className="text-muted-foreground">
                  {openNext.jobs.map((target) => target.name).join("、")}
                </span>
              </div>
            ))}
          </CardContent>
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
  openIndex,
  onToggle,
  align,
  arrow,
}: {
  index: number;
  count: number;
  densest: number;
  playing: boolean;
  runId: number;
  openIndex: number | null;
  onToggle: (index: number) => void;
  align: "center" | "end";
  arrow: "right" | "down";
}) {
  const pct = Math.round((count / densest) * 100);

  return (
    <button
      type="button"
      data-testid="handoff-toggle"
      aria-expanded={openIndex === index}
      aria-label={`查看这一段交付明细（${count} 条）`}
      onClick={() => onToggle(index)}
      className={cn(
        "group flex cursor-pointer flex-row items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:flex-col lg:gap-1 lg:px-1",
        align === "end" && "lg:ml-auto lg:w-40 lg:items-end",
        align === "center" && "lg:w-full",
        openIndex === index && "bg-muted text-foreground",
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
