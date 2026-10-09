"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Maximize2Icon,
  Minimize2Icon,
  MinusIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  XIcon,
} from "lucide-react";
import { cn } from "cn";
import {
  bezierPoint,
  canvasFont,
  curveMidpoint,
  readCanvasColors,
  roundRect,
  truncate,
  type CanvasBounds,
  type CanvasPoint,
} from "@/lib/canvas";
import { useCanvasViewport } from "@/lib/use-canvas-viewport";
import { useFullscreen } from "@/lib/use-fullscreen";
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

type Selection =
  | { kind: "stage"; index: number }
  | { kind: "job"; index: number; jobId: string }
  | { kind: "handoff"; index: number }
  | null;

interface StageRect {
  x: number;
  y: number;
}

interface JobNode {
  job: PipelineJob;
  stageIndex: number;
  x: number;
  y: number;
}

interface EdgeGeometry {
  p0: CanvasPoint;
  c1: CanvasPoint;
  c2: CanvasPoint;
  p3: CanvasPoint;
}

const STAGE_W = 208;
const STAGE_H = 74;
const GAP_X = 132;
const GAP_Y = 196;
const JOB_SPREAD = 96;
const JOB_R = 6;
const JOB_LABEL_MIN_SCALE = 1.05;
const JOB_DOT_MIN_SCALE = 1;
const PADDING = 56;

/** 世界坐标布局：第一行从左到右，第二行从右到左，形成蛇形主链。 */
function computeLayout(stages: PipelineStage[]) {
  const columns = Math.max(1, Math.ceil(stages.length / 2));
  const stageRects: StageRect[] = stages.map((_, index) => {
    if (index < columns) return { x: index * (STAGE_W + GAP_X), y: 0 };
    const j = index - columns;
    return { x: (columns - 1 - j) * (STAGE_W + GAP_X), y: STAGE_H + GAP_Y };
  });

  const jobNodes: JobNode[][] = stages.map((stage, index) => {
    const base = stageRects[index];
    const count = stage.jobs.length;
    const startX = base.x + STAGE_W / 2 - ((count - 1) * JOB_SPREAD) / 2;
    return stage.jobs.map((job, k) => ({
      job,
      stageIndex: index,
      x: startX + k * JOB_SPREAD,
      y: base.y + STAGE_H + 54,
    }));
  });

  return { stageRects, jobNodes, columns };
}

function edgeGeometry(a: StageRect, b: StageRect): EdgeGeometry {
  const ay = a.y + STAGE_H / 2;
  const by = b.y + STAGE_H / 2;
  const aMid = a.x + STAGE_W / 2;
  const bMid = b.x + STAGE_W / 2;

  // 折返：上下相邻
  if (Math.abs(aMid - bMid) < 1) {
    const p0 = { x: aMid, y: a.y + STAGE_H };
    const p3 = { x: bMid, y: b.y };
    return { p0, p3, c1: { x: p0.x, y: p0.y + 64 }, c2: { x: p3.x, y: p3.y - 64 } };
  }

  const dir = bMid > aMid ? 1 : -1;
  const p0 = { x: dir > 0 ? a.x + STAGE_W : a.x, y: ay };
  const p3 = { x: dir > 0 ? b.x : b.x + STAGE_W, y: by };
  return {
    p0,
    p3,
    c1: { x: p0.x + dir * 64, y: ay },
    c2: { x: p3.x - dir * 64, y: by },
  };
}

/**
 * 单条链路的画布视图：信息由浅到深。
 *   远景：只有阶段节点与交付条数；
 *   放大：阶段下方散出岗位节点，再放大出现岗位名与岗位级连线；
 *   悬停/点击：高亮相邻交付路径，下方给出明细卡片。
 * 画布只负责画与交互，文本与链接留在 DOM（读屏与检索依赖下面那份文本层）。
 */
export function WorkflowCanvas({
  stages,
  handoffCounts,
}: {
  stages: PipelineStage[];
  handoffCounts: number[];
}) {
  const [selection, setSelection] = useState<Selection>(null);
  const [hover, setHover] = useState<Selection>(null);
  const [flowing, setFlowing] = useState(true);

  const layout = useMemo(() => computeLayout(stages), [stages]);
  const edges = useMemo(
    () =>
      stages
        .slice(0, -1)
        .map((_, index) =>
          edgeGeometry(layout.stageRects[index], layout.stageRects[index + 1]),
        ),
    [layout, stages],
  );
  const densest = Math.max(1, ...handoffCounts);

  const hoverRef = useRef<Selection>(null);
  const selectionRef = useRef<Selection>(null);
  const flowingRef = useRef(true);
  const phaseRef = useRef(0);

  useEffect(() => {
    hoverRef.current = hover;
  }, [hover]);
  useEffect(() => {
    selectionRef.current = selection;
  }, [selection]);
  useEffect(() => {
    flowingRef.current = flowing;
  }, [flowing]);

  const getBounds = (): CanvasBounds => {
    const xs = layout.stageRects.map((rect) => rect.x);
    const ys = layout.stageRects.map((rect) => rect.y);
    return {
      minX: Math.min(...xs) - 140,
      maxX: Math.max(...xs) + STAGE_W + 140,
      minY: Math.min(...ys),
      maxY: Math.max(...ys) + STAGE_H + 70,
    };
  };

  const viewport = useCanvasViewport({
    getBounds,
    padding: PADDING,
    maxScale: 2.4,
    onTap: (clientX, clientY) => setSelection(hitTest(clientX, clientY)),
  });
  const { containerRef, canvasRef, viewRef, sizeRef, zoom, fit, zoomBy, toWorld, handlers } =
    viewport;
  const fullscreen = useFullscreen(() => containerRef.current);

  function hitTest(clientX: number, clientY: number): Selection {
    const { x, y } = toWorld(clientX, clientY);
    const scale = viewRef.current.scale;
    const showJobs = scale >= JOB_DOT_MIN_SCALE;
    const radius = Math.max(JOB_R + 4, 10 / scale);

    if (showJobs) {
      for (const node of layout.jobNodes.flat()) {
        if ((node.x - x) ** 2 + (node.y - y) ** 2 <= radius * radius) {
          return { kind: "job", index: node.stageIndex, jobId: node.job.id };
        }
      }
    }
    for (let index = 0; index < layout.stageRects.length; index += 1) {
      const rect = layout.stageRects[index];
      if (
        x >= rect.x &&
        x <= rect.x + STAGE_W &&
        y >= rect.y &&
        y <= rect.y + STAGE_H
      ) {
        return { kind: "stage", index };
      }
    }
    for (let index = 0; index < edges.length; index += 1) {
      const geo = edges[index];
      for (let t = 0; t <= 1; t += 0.05) {
        const point = bezierPoint(geo.p0, geo.c1, geo.c2, geo.p3, t);
        if ((point.x - x) ** 2 + (point.y - y) ** 2 <= (12 / scale) ** 2) {
          return { kind: "handoff", index };
        }
      }
    }
    return null;
  }

  function onPointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    const dragging = handlers.onPointerMove(event);
    if (dragging === true) return;
    setHover(hitTest(event.clientX, event.clientY));
  }

  // 主循环：粒子相位推进 + 重绘
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function draw() {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      const { width, height } = sizeRef.current;
      if (!canvas || !ctx || !width || !height) return;

      const colors = readCanvasColors();
      const view = viewRef.current;
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      ctx.save();
      ctx.fillStyle = colors.border;
      ctx.globalAlpha = 0.5;
      for (let gx = 12; gx < width; gx += 24) {
        for (let gy = 12; gy < height; gy += 24) ctx.fillRect(gx, gy, 1, 1);
      }
      ctx.restore();

      ctx.save();
      ctx.translate(view.offsetX, view.offsetY);
      ctx.scale(view.scale, view.scale);

      const active = hoverRef.current ?? selectionRef.current;
      const activeStage =
        active?.kind === "stage"
          ? active.index
          : active?.kind === "job"
            ? active.index
            : active?.kind === "handoff"
              ? active.index
              : null;
      const activeJobId = active?.kind === "job" ? active.jobId : null;
      const showJobs = view.scale >= JOB_DOT_MIN_SCALE;
      const showJobLabels = view.scale >= JOB_LABEL_MIN_SCALE;

      // 1. 阶段之间的交付曲线
      edges.forEach((geo, index) => {
        const count = handoffCounts[index];
        const emphasize =
          activeStage === null || activeStage === index || activeStage === index + 1;
        ctx.save();
        ctx.globalAlpha = emphasize ? 1 : 0.22;
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 2 + (count / densest) * 8;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(geo.p0.x, geo.p0.y);
        ctx.bezierCurveTo(geo.c1.x, geo.c1.y, geo.c2.x, geo.c2.y, geo.p3.x, geo.p3.y);
        ctx.stroke();

        // 一条交付关系一颗流动的点
        for (let d = 0; d < count; d += 1) {
          const t = (((phaseRef.current * 0.22 + d / count + index * 0.13) % 1) + 1) % 1;
          const point = bezierPoint(geo.p0, geo.c1, geo.c2, geo.p3, t);
          ctx.globalAlpha = (emphasize ? 0.95 : 0.2) * Math.sin(Math.PI * t);
          ctx.fillStyle = colors.primary;
          ctx.beginPath();
          ctx.arc(point.x, point.y, 3.4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      // 2. 岗位级交付线（放大或选中岗位时出现）
      edges.forEach((_, index) => {
        if (!showJobLabels && !activeJobId) return;
        const sources = layout.jobNodes[index];
        const targets = layout.jobNodes[index + 1];
        sources.forEach((source) => {
          const involved =
            activeJobId === source.job.id ||
            targets.some((target) => target.job.id === activeJobId);
          if (activeJobId && !involved) return;
          targets.forEach((target) => {
            const dim = activeJobId
              ? !(source.job.id === activeJobId || target.job.id === activeJobId)
              : false;
            ctx.save();
            ctx.globalAlpha = activeJobId ? (dim ? 0.08 : 0.8) : 0.16;
            ctx.strokeStyle = colors.primary;
            ctx.lineWidth = activeJobId && !dim ? 1.6 : 1;
            ctx.beginPath();
            ctx.moveTo(source.x, source.y);
            const midX = (source.x + target.x) / 2;
            const midY = (source.y + target.y) / 2 + (target.y > source.y ? 18 : -18);
            ctx.quadraticCurveTo(midX, midY, target.x, target.y);
            ctx.stroke();
            ctx.restore();
          });
        });
      });

      // 3. 阶段节点
      stages.forEach((stage, index) => {
        const rect = layout.stageRects[index];
        const isActive = activeStage === index;
        const isSelected =
          selectionRef.current?.kind === "stage" && selectionRef.current.index === index;
        ctx.save();
        ctx.globalAlpha = activeStage === null || isActive ? 1 : 0.45;
        roundRect(ctx, rect.x, rect.y, STAGE_W, STAGE_H, 14);
        ctx.fillStyle = colors.card;
        ctx.fill();
        ctx.lineWidth = isSelected ? 3 : isActive ? 2.4 : 1.4;
        ctx.strokeStyle = isSelected || isActive ? colors.primary : colors.border;
        ctx.stroke();

        ctx.fillStyle = colors.mutedForeground;
        ctx.font = canvasFont(11);
        ctx.fillText(`阶段 ${String(index + 1).padStart(2, "0")}`, rect.x + 16, rect.y + 26);
        ctx.fillStyle = colors.foreground;
        ctx.font = canvasFont(15);
        ctx.fillText(truncate(ctx, stage.name, STAGE_W - 32), rect.x + 16, rect.y + 52);

        ctx.fillStyle = colors.muted;
        roundRect(ctx, rect.x + STAGE_W - 76, rect.y + 14, 62, 20, 10);
        ctx.fill();
        ctx.fillStyle = colors.mutedForeground;
        ctx.font = canvasFont(11);
        ctx.fillText(`${stage.jobs.length} 岗位`, rect.x + STAGE_W - 68, rect.y + 28);
        ctx.restore();
      });

      // 4. 岗位节点
      if (showJobs) {
        stages.forEach((stage, index) => {
          const emphasizeStage = activeStage === null || activeStage === index;
          layout.jobNodes[index].forEach((node, jobIndex) => {
            const isActiveJob = activeJobId === node.job.id;
            ctx.save();
            ctx.globalAlpha = emphasizeStage || isActiveJob ? 1 : 0.3;
            ctx.beginPath();
            ctx.arc(node.x, node.y, JOB_R, 0, Math.PI * 2);
            ctx.fillStyle = node.job.hot ? colors.hot : colors.primary;
            ctx.globalAlpha *= 0.85;
            ctx.fill();
            ctx.restore();

            if (showJobLabels || isActiveJob) {
              ctx.save();
              ctx.globalAlpha = emphasizeStage ? 1 : 0.35;
              ctx.font = canvasFont(12);
              ctx.fillStyle = colors.foreground;
              ctx.textAlign = "center";
              ctx.fillText(
                truncate(ctx, node.job.name, JOB_SPREAD - 12),
                node.x,
                node.y + (jobIndex % 2 === 0 ? 24 : 40),
              );
              ctx.restore();
            }
          });
        });
      }

      ctx.restore();

      // 层级提示
      ctx.save();
      ctx.fillStyle = colors.mutedForeground;
      ctx.font = canvasFont(11);
      ctx.fillText(
        view.scale < JOB_DOT_MIN_SCALE
          ? "放大可看到每个阶段的岗位"
          : showJobLabels
            ? "已展开岗位，点岗位看职责与上下游"
            : "继续放大可看到岗位名",
        16,
        height - 16,
      );
      ctx.restore();

      // 供冒烟测试定位节点（画布内容无法用选择器定位）
      (window as unknown as { __workflowCanvasDebug?: unknown }).__workflowCanvasDebug = {
        nodes: Object.fromEntries(
          layout.stageRects.map((rect, index) => [
            stages[index].id,
            {
              x: rect.x * view.scale + view.offsetX,
              y: (rect.y + STAGE_H / 2) * view.scale + view.offsetY,
            },
          ]),
        ),
        jobs: Object.fromEntries(
          layout.jobNodes.flat().map((node) => [
            node.job.id,
            {
              x: node.x * view.scale + view.offsetX,
              y: node.y * view.scale + view.offsetY,
            },
          ]),
        ),
        handoffs: Object.fromEntries(
          edges.map((geo, index) => {
            const mid = curveMidpoint(geo.p0, geo.c1, geo.c2, geo.p3);
            return [
              index,
              {
                x: mid.x * view.scale + view.offsetX,
                y: mid.y * view.scale + view.offsetY,
              },
            ];
          }),
        ),
        zoom: view.scale,
      };
    }

    const render = (now: number) => {
      const delta = Math.min(64, now - last);
      last = now;
      if (flowingRef.current && !reduced) phaseRef.current += delta / 1000;
      draw();
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [canvasRef, edges, handoffCounts, layout, stages, sizeRef, viewRef, densest]);

  const selectedStage = selection?.kind === "stage" ? stages[selection.index] : null;
  const selectedJob =
    selection?.kind === "job"
      ? (layout.jobNodes.flat().find((node) => node.job.id === selection.jobId) ?? null)
      : null;
  const selectedHandoff = selection?.kind === "handoff" ? selection.index : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setFlowing((value) => !value)}
          data-testid="pipeline-play"
          className="gap-1.5"
        >
          {flowing ? <PauseIcon className="size-3.5" /> : <PlayIcon className="size-3.5" />}
          {flowing ? "暂停交付流" : "播放交付流"}
        </Button>
        <Button
          size="icon-sm"
          variant="outline"
          aria-label="缩小"
          data-testid="canvas-zoom-out"
          onClick={() => zoomBy(0.8)}
        >
          <MinusIcon className="size-3.5" />
        </Button>
        <Button
          size="icon-sm"
          variant="outline"
          aria-label="放大"
          data-testid="canvas-zoom-in"
          onClick={() => zoomBy(1.25)}
        >
          <PlusIcon className="size-3.5" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          data-testid="canvas-fit"
          onClick={fit}
        >
          <Maximize2Icon className="size-3.5" />
          适应画布
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          data-testid="canvas-fullscreen"
          data-fullscreen={fullscreen.isFullscreen ? "true" : "false"}
          onClick={fullscreen.toggle}
        >
          {fullscreen.isFullscreen ? (
            <Minimize2Icon className="size-3.5" />
          ) : (
            <Maximize2Icon className="size-3.5" />
          )}
          {fullscreen.isFullscreen ? "退出全屏" : "全屏查看"}
        </Button>
        <p className="text-xs text-muted-foreground">
          拖拽平移 · 滚轮缩放 · 点节点看细节
        </p>
      </div>

      <div
        ref={containerRef}
        data-fullscreen={fullscreen.isFullscreen ? "true" : "false"}
        className={cn(
          "relative overflow-hidden rounded-xl bg-background ring-1 ring-border/70",
          fullscreen.isFullscreen
            ? "h-screen w-screen p-6 ring-0"
            : "h-[360px] lg:h-[440px]",
        )}
      >
        <canvas
          ref={canvasRef}
          data-testid="workflow-canvas"
          data-zoom={zoom.toFixed(2)}
          className="size-full cursor-grab touch-none active:cursor-grabbing"
          {...handlers}
          onPointerMove={onPointerMove}
          onPointerLeave={() => {
            handlers.onPointerLeave();
            setHover(null);
          }}
        />
      </div>

      {selectedStage && (
        <Card size="sm" data-testid="stage-detail" className="gap-2">
          <CardHeader className="gap-1">
            <div className="flex items-start gap-2">
              <CardTitle className="text-sm">{selectedStage.name}</CardTitle>
              <span className="font-mono text-xs text-muted-foreground tabular-nums">
                {selectedStage.jobs.length} 个岗位
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
            {selectedStage.jobs.map((job) => (
              <JobChip key={job.id} job={job} />
            ))}
          </div>
        </Card>
      )}

      {selectedJob && (
        <Card size="sm" data-testid="job-detail" className="gap-2">
          <CardHeader className="gap-1">
            <div className="flex items-start gap-2">
              <CardTitle className="text-sm">{selectedJob.job.name}</CardTitle>
              <span className="font-mono text-xs text-muted-foreground">
                阶段 {String(selectedJob.stageIndex + 1).padStart(2, "0")}
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
            <p className="text-xs leading-relaxed text-muted-foreground">
              {selectedJob.job.duty}
            </p>
          </CardHeader>
          <div className="flex flex-col gap-2 px-3 pb-3 text-xs">
            {selectedJob.stageIndex > 0 && (
              <p className="text-muted-foreground">
                上游：
                {layout.jobNodes[selectedJob.stageIndex - 1]
                  .map((node) => node.job.name)
                  .join("、")}
              </p>
            )}
            {selectedJob.stageIndex < stages.length - 1 && (
              <p className="text-muted-foreground">
                下游：
                {layout.jobNodes[selectedJob.stageIndex + 1]
                  .map((node) => node.job.name)
                  .join("、")}
              </p>
            )}
            <div>
              <Button
                size="sm"
                variant="outline"
                render={<Link href={`/job/${selectedJob.job.id}`} />}
              >
                看岗位详情
              </Button>
            </div>
          </div>
        </Card>
      )}

      {selectedHandoff !== null && (
        <Card size="sm" data-testid="handoff-detail" className="gap-2">
          <CardHeader className="gap-1">
            <div className="flex items-start gap-2">
              <CardTitle className="text-sm">
                {stages[selectedHandoff].name} → {stages[selectedHandoff + 1].name}
              </CardTitle>
              <span className="font-mono text-xs text-muted-foreground tabular-nums">
                {handoffCounts[selectedHandoff]} 条交付关系
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
            {stages[selectedHandoff].jobs.map((job) => (
              <div key={job.id} className="flex items-start gap-1.5 text-xs">
                <Link
                  href={`/job/${job.id}`}
                  className="shrink-0 font-medium hover:underline"
                >
                  {job.name}
                </Link>
                <span className="text-muted-foreground">→</span>
                <span className="text-muted-foreground">
                  {stages[selectedHandoff + 1].jobs
                    .map((target) => target.name)
                    .join("、")}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 画布内容无法被读屏和检索工具读到，这里留一份等价的文本层（键盘也能用） */}
      <div className="sr-only" data-testid="workflow-outline">
        <h2>{`${stages.length} 个阶段的岗位链路`}</h2>
        <ol>
          {stages.map((stage, index) => (
            <li key={stage.id}>
              <button
                type="button"
                data-testid="workflow-stage"
                data-stage={stage.id}
                onClick={() => setSelection({ kind: "stage", index })}
              >
                {`阶段 ${index + 1}：${stage.name}，${stage.jobs.length} 个岗位：${stage.jobs
                  .map((job) => job.name)
                  .join("、")}`}
              </button>
              {index < stages.length - 1 && (
                <button
                  type="button"
                  data-testid="workflow-handoff"
                  onClick={() => setSelection({ kind: "handoff", index })}
                >
                  {`${stage.name} 交给 ${stages[index + 1].name}，${handoffCounts[index]} 条交付关系`}
                </button>
              )}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function JobChip({ job }: { job: PipelineJob }) {
  return (
    <Tooltip>
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
  );
}
