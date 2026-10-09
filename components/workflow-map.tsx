"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Maximize2Icon,
  Minimize2Icon,
  MinusIcon,
  PlusIcon,
  XIcon,
} from "lucide-react";
import { cn } from "cn";
import {
  bezierPoint,
  canvasFont,
  readCanvasColors,
  roundRect,
  truncate,
  type CanvasBounds,
} from "@/lib/canvas";
import { useCanvasViewport } from "@/lib/use-canvas-viewport";
import { useFullscreen } from "@/lib/use-fullscreen";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MAP_JOB_SPREAD,
  MAP_LANE_GAP,
  MAP_SLOT_X,
  MAP_STAGE_H,
  MAP_STAGE_W,
  MAP_X0,
  type WorkflowMapData,
} from "@/lib/graph";

type Selection =
  | { kind: "lane"; index: number }
  | { kind: "stage"; lane: number; stage: number }
  | { kind: "job"; lane: number; jobId: string }
  | null;

const STAGE_MIN_SCALE = 0.42;
const JOB_MIN_SCALE = 0.72;
const JOB_LABEL_MIN_SCALE = 0.95;
const OVERVIEW_LABEL_MAX_SCALE = 0.72;
const JOB_R = 5;
/** 左侧固定标签栏宽度（屏幕像素） */
const LABEL_GUTTER = 190;

/**
 * 协作地图：20 条链路铺成地铁线路图。
 *   远景：只有线路与线路名，换乘岗位的连线已经在提示哪些线相交；
 *   放大：出现阶段节点；
 *   再放大：出现岗位节点与岗位名，换乘岗位带圆环。
 */
export function WorkflowMap({ data }: { data: WorkflowMapData }) {
  const [selection, setSelection] = useState<Selection>(null);
  const [hover, setHover] = useState<Selection>(null);

  const hoverRef = useRef<Selection>(null);
  const selectionRef = useRef<Selection>(null);
  const phaseRef = useRef(0);
  useEffect(() => {
    hoverRef.current = hover;
  }, [hover]);
  useEffect(() => {
    selectionRef.current = selection;
  }, [selection]);

  const maxStageX =
    MAP_X0 + (Math.max(...data.lanes.map((lane) => lane.stageCount)) - 1) * MAP_SLOT_X;

  const getBounds = (): CanvasBounds => ({
    minX: MAP_X0 - 40,
    maxX: maxStageX + MAP_STAGE_W + 60,
    minY: -60,
    maxY: (data.lanes.length - 1) * MAP_LANE_GAP + 120,
  });

  const viewport = useCanvasViewport({
    getBounds,
    padding: 40,
    gutterX: LABEL_GUTTER,
    alignX: "start",
    maxScale: 3,
    onTap: (clientX, clientY) => setSelection(hitTest(clientX, clientY)),
  });
  const { containerRef, canvasRef, viewRef, sizeRef, zoom, fit, zoomBy, toWorld, handlers } =
    viewport;
  const fullscreen = useFullscreen(() => containerRef.current);

  const stageByLane = (lane: number) => data.lanes[lane]?.stages ?? [];

  function hitTest(clientX: number, clientY: number): Selection {
    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect();
    // 左侧标签栏：鼠标停在名字上就高亮对应线路
    if (rect && clientX - rect.left <= LABEL_GUTTER) {
      const localY = clientY - rect.top;
      const laneIndex = Math.round(
        (localY - viewRef.current.offsetY) / (MAP_LANE_GAP * viewRef.current.scale),
      );
      if (laneIndex >= 0 && laneIndex < data.lanes.length) {
        const laneScreenY =
          data.lanes[laneIndex].y * viewRef.current.scale + viewRef.current.offsetY;
        if (Math.abs(localY - laneScreenY) <= 14) {
          return { kind: "lane", index: laneIndex };
        }
      }
    }

    const { x, y } = toWorld(clientX, clientY);
    const scale = viewRef.current.scale;

    if (scale >= JOB_MIN_SCALE) {
      const radius = Math.max(JOB_R + 3, 9 / scale);
      for (const lane of data.lanes) {
        for (const stage of lane.stages) {
          for (const job of stage.jobs) {
            if ((job.x - x) ** 2 + (job.y - y) ** 2 <= radius * radius) {
              return { kind: "job", lane: lane.y / MAP_LANE_GAP, jobId: job.id };
            }
          }
        }
      }
    }

    if (scale >= STAGE_MIN_SCALE) {
      for (const lane of data.lanes) {
        for (const stage of stageByLane(lane.y / MAP_LANE_GAP)) {
          if (
            x >= stage.x &&
            x <= stage.x + MAP_STAGE_W &&
            y >= stage.y &&
            y <= stage.y + MAP_STAGE_H
          ) {
            return { kind: "stage", lane: lane.y / MAP_LANE_GAP, stage: lane.stages.indexOf(stage) };
          }
        }
      }
    }

    if (scale >= STAGE_MIN_SCALE) {
      const tolerance = 12 / scale;
      for (const transfer of data.transfers) {
        const midY = (transfer.from.y + transfer.to.y) / 2;
        for (let t = 0; t <= 1; t += 0.08) {
          const point = bezierPoint(
            { x: transfer.from.x, y: transfer.from.y },
            { x: transfer.from.x, y: midY },
            { x: transfer.to.x, y: midY },
            { x: transfer.to.x, y: transfer.to.y },
            t,
          );
          if ((point.x - x) ** 2 + (point.y - y) ** 2 <= tolerance * tolerance) {
            return { kind: "job", lane: transfer.from.lane, jobId: transfer.jobId };
          }
        }
      }
    }

    const laneIndex = Math.round(y / MAP_LANE_GAP);
    if (laneIndex >= 0 && laneIndex < data.lanes.length) {
      if (Math.abs(y - laneIndex * MAP_LANE_GAP) <= MAP_LANE_GAP / 2) {
        return { kind: "lane", index: laneIndex };
      }
    }
    return null;
  }

  function onPointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    const dragging = handlers.onPointerMove(event);
    if (dragging === true) return;
    setHover(hitTest(event.clientX, event.clientY));
  }

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
      const activeLane =
        active?.kind === "lane"
          ? active.index
          : active?.kind === "stage"
            ? active.lane
            : active?.kind === "job"
              ? active.lane
              : null;
      const activeJobId = active?.kind === "job" ? active.jobId : null;
      const showStages = view.scale >= STAGE_MIN_SCALE;
      const showJobs = view.scale >= JOB_MIN_SCALE;
      const showJobLabels = view.scale >= JOB_LABEL_MIN_SCALE;
      const lineStart = MAP_X0 - 120;
      const lineEnd = maxStageX + MAP_STAGE_W + 40;

      // 1. 线路
      data.lanes.forEach((lane, index) => {
        const dim = activeLane !== null && activeLane !== index;
        ctx.save();
        ctx.globalAlpha = dim ? 0.12 : activeLane === index ? 1 : 0.55;
        ctx.strokeStyle = activeLane === index ? colors.primary : colors.border;
        ctx.lineWidth = activeLane === index ? 6 : 4;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(lineStart, lane.y);
        ctx.lineTo(lineEnd, lane.y);
        ctx.stroke();

        // 放大后线路名跟着世界坐标走；远景改由左侧固定标签栏承担
        if (view.scale > OVERVIEW_LABEL_MAX_SCALE) {
          ctx.fillStyle = colors.foreground;
          ctx.font = canvasFont(13);
          ctx.globalAlpha = dim ? 0.15 : 1;
          ctx.fillText(truncate(ctx, lane.name, 150), lineStart + 6, lane.y - 8);
        }
        ctx.restore();
      });

      // 2. 换乘连线（同一岗位出现在多条链路）
      data.transfers.forEach((transfer) => {
        const emphasize =
          activeJobId === transfer.jobId ||
          (activeLane !== null &&
            (transfer.from.lane === activeLane || transfer.to.lane === activeLane)) ||
          active === null;
        const midY = (transfer.from.y + transfer.to.y) / 2;
        const overview = view.scale < STAGE_MIN_SCALE;
        ctx.save();
        ctx.globalAlpha = emphasize ? (overview ? 0.9 : 0.7) : 0.12;
        ctx.strokeStyle = colors.hot;
        ctx.lineWidth = emphasize ? (overview ? 2.6 : 1.8) : 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(transfer.from.x, transfer.from.y);
        ctx.bezierCurveTo(
          transfer.from.x,
          midY,
          transfer.to.x,
          midY,
          transfer.to.x,
          transfer.to.y,
        );
        ctx.stroke();
        ctx.setLineDash([]);

        // 两端各点一颗，远景也能看出这条换乘线接在哪两条线路上
        if (emphasize) {
          ctx.fillStyle = colors.hot;
          ctx.globalAlpha = overview ? 0.9 : 0.6;
          for (const point of [transfer.from, transfer.to]) {
            ctx.beginPath();
            ctx.arc(point.x, point.y, overview ? 4 : 2.6, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // 换乘线上跑一颗点
        const t = ((phaseRef.current * 0.16) % 1 + 1) % 1;
        const point = bezierPoint(
          { x: transfer.from.x, y: transfer.from.y },
          { x: transfer.from.x, y: midY },
          { x: transfer.to.x, y: midY },
          { x: transfer.to.x, y: transfer.to.y },
          t,
        );
        ctx.globalAlpha = emphasize ? 1 : 0.15;
        ctx.fillStyle = colors.hot;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 3. 阶段
      if (showStages) {
        data.lanes.forEach((lane, laneIndex) => {
          const dim = activeLane !== null && activeLane !== laneIndex;
          lane.stages.forEach((stage) => {
            ctx.save();
            ctx.globalAlpha = dim ? 0.18 : 1;
            roundRect(ctx, stage.x, stage.y, MAP_STAGE_W, MAP_STAGE_H, 10);
            ctx.fillStyle = colors.card;
            ctx.fill();
            ctx.strokeStyle = dim ? colors.border : colors.primary;
            ctx.lineWidth = 1.4;
            ctx.stroke();
            ctx.fillStyle = colors.foreground;
            ctx.font = canvasFont(12);
            ctx.fillText(
              truncate(ctx, stage.name, MAP_STAGE_W - 52),
              stage.x + 12,
              stage.y + 29,
            );
            ctx.fillStyle = colors.mutedForeground;
            ctx.font = canvasFont(10);
            ctx.fillText(
              `${stage.jobs.length}`,
              stage.x + MAP_STAGE_W - 20,
              stage.y + 29,
            );
            ctx.restore();
          });
        });
      }

      // 4. 岗位（换乘岗位带圆环）
      if (showJobs) {
        data.lanes.forEach((lane, laneIndex) => {
          const dim = activeLane !== null && activeLane !== laneIndex;
          lane.stages.forEach((stage) => {
            stage.jobs.forEach((job, jobIndex) => {
              const isActiveJob = activeJobId === job.id;
              ctx.save();
              ctx.globalAlpha = dim && !isActiveJob ? 0.2 : 1;
              ctx.beginPath();
              ctx.arc(job.x, job.y, JOB_R, 0, Math.PI * 2);
              ctx.fillStyle = job.hot ? colors.hot : colors.primary;
              ctx.fill();
              if (job.shared) {
                ctx.strokeStyle = colors.hot;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(job.x, job.y, JOB_R + 3.5, 0, Math.PI * 2);
                ctx.stroke();
              }
              ctx.restore();

              if (showJobLabels || isActiveJob) {
                ctx.save();
                ctx.globalAlpha = dim && !isActiveJob ? 0.25 : 1;
                ctx.fillStyle = job.shared ? colors.hot : colors.foreground;
                ctx.font = canvasFont(11, job.shared ? 500 : 400);
                ctx.textAlign = "center";
                ctx.fillText(
                  truncate(ctx, job.name, MAP_JOB_SPREAD - 6),
                  job.x,
                  job.y + (jobIndex % 2 === 0 ? 20 : 34),
                );
                ctx.restore();
              }
            });
          });
        });
      }

      ctx.restore();

      // 远景时用屏幕坐标在左侧标签栏里写线路名，保证缩到最小也读得清
      if (view.scale <= OVERVIEW_LABEL_MAX_SCALE) {
        const usable = (height - 24) / data.lanes.length;
        const step = usable < 13 ? Math.ceil(13 / usable) : 1;
        ctx.save();
        ctx.font = canvasFont(11);
        ctx.textAlign = "right";
        data.lanes.forEach((lane, index) => {
          if (index % step !== 0) return;
          const screenY = lane.y * view.scale + view.offsetY;
          const isActive = activeLane === index;
          ctx.fillStyle = isActive ? colors.primary : colors.mutedForeground;
          ctx.fillText(
            `${index + 1}. ${lane.name}`,
            LABEL_GUTTER - 14,
            screenY + 4,
          );
        });
        ctx.textAlign = "left";
        ctx.restore();
      }

      ctx.save();
      ctx.fillStyle = colors.mutedForeground;
      ctx.font = canvasFont(11);
      ctx.fillText(
        view.scale < STAGE_MIN_SCALE
          ? `共 ${data.lanes.length} 条链路 · ${data.counts.sharedJobs} 个换乘岗位（虚线）：放大看阶段`
          : showJobLabels
            ? "已展开岗位：带圆环的是跨链路岗位，点它看挂在哪几条链路"
            : "继续放大可看到岗位名",
        16,
        height - 14,
      );
      ctx.restore();

      (window as unknown as { __workflowMapDebug?: unknown }).__workflowMapDebug = {
        lanes: Object.fromEntries(
          data.lanes.map((lane, index) => [
            lane.id,
            { x: MAP_X0 * view.scale + view.offsetX, y: lane.y * view.scale + view.offsetY, index },
          ]),
        ),
        stages: Object.fromEntries(
          data.lanes.flatMap((lane) =>
            lane.stages.map((stage) => [
              stage.id,
              {
                x: (stage.x + MAP_STAGE_W / 2) * view.scale + view.offsetX,
                y: (stage.y + MAP_STAGE_H / 2) * view.scale + view.offsetY,
              },
            ]),
          ),
        ),
        jobs: Object.fromEntries(
          data.lanes.flatMap((lane) =>
            lane.stages.flatMap((stage) =>
              stage.jobs.map((job) => [
                job.id,
                {
                  x: job.x * view.scale + view.offsetX,
                  y: job.y * view.scale + view.offsetY,
                },
              ]),
            ),
          ),
        ),
        names: Object.fromEntries(
          data.lanes.flatMap((lane) =>
            lane.stages.flatMap((stage) =>
              stage.jobs.map((job) => [job.id, job.name]),
            ),
          ),
        ),
        zoom: view.scale,
      };
    }

    const render = (now: number) => {
      const delta = Math.min(64, now - last);
      last = now;
      if (!reduced) phaseRef.current += delta / 1000;
      draw();
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [canvasRef, data, maxStageX, sizeRef, viewRef]);

  const selectedLane = selection?.kind === "lane" ? data.lanes[selection.index] : null;
  const selectedStage =
    selection?.kind === "stage" ? data.lanes[selection.lane]?.stages[selection.stage] : null;
  const selectedJob =
    selection?.kind === "job"
      ? (data.lanes
          .flatMap((lane) => lane.stages)
          .flatMap((stage) => stage.jobs)
          .find((job) => job.id === selection.jobId) ?? null)
      : null;
  const selectedShared = selectedJob
    ? (data.sharedJobs.find((job) => job.id === selectedJob.id) ?? null)
    : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="icon-sm"
          variant="outline"
          aria-label="缩小"
          data-testid="map-zoom-out"
          onClick={() => zoomBy(0.8)}
        >
          <MinusIcon className="size-3.5" />
        </Button>
        <Button
          size="icon-sm"
          variant="outline"
          aria-label="放大"
          data-testid="map-zoom-in"
          onClick={() => zoomBy(1.25)}
        >
          <PlusIcon className="size-3.5" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          data-testid="map-fit"
          onClick={fit}
        >
          <Maximize2Icon className="size-3.5" />
          适应画布
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          data-testid="map-fullscreen"
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
          拖拽平移 · 滚轮缩放 · 点线路 / 阶段 / 岗位看细节
        </p>
      </div>

      <div
        ref={containerRef}
        data-fullscreen={fullscreen.isFullscreen ? "true" : "false"}
        className={cn(
          "relative overflow-hidden rounded-xl bg-background ring-1 ring-border/70",
          fullscreen.isFullscreen ? "h-screen w-screen p-6 ring-0" : "h-[420px] lg:h-[560px]",
        )}
      >
        <canvas
          ref={canvasRef}
          data-testid="map-canvas"
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

      {selectedLane && (
        <Card size="sm" data-testid="lane-detail" className="gap-2">
          <CardHeader className="gap-1">
            <div className="flex items-start gap-2">
              <CardTitle className="text-sm">{selectedLane.name}</CardTitle>
              <span className="font-mono text-xs text-muted-foreground tabular-nums">
                {selectedLane.stageCount} 阶段 · {selectedLane.jobCount} 岗位
              </span>
              <Button
                size="icon-xs"
                variant="ghost"
                className="ml-auto"
                aria-label="收起"
                onClick={() => setSelection(null)}
              >
                <XIcon />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{selectedLane.description}</p>
          </CardHeader>
          <div className="flex flex-wrap items-center gap-1.5 px-3 pb-3">
            {selectedLane.industries.map((industry) => (
              <Badge key={industry} variant="secondary" className="h-6 font-normal">
                {industry}
              </Badge>
            ))}
            <Button
              size="sm"
              variant="outline"
              render={<Link href={`/workflow/${selectedLane.id}`} />}
            >
              打开链路
            </Button>
          </div>
        </Card>
      )}

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
                aria-label="收起"
                onClick={() => setSelection(null)}
              >
                <XIcon />
              </Button>
            </div>
          </CardHeader>
          <div className="flex flex-wrap gap-1.5 px-3 pb-3">
            {selectedStage.jobs.map((job) => (
              <Badge
                key={job.id}
                variant={job.hot ? "outline" : "secondary"}
                className={cn(
                  "h-7 font-normal",
                  job.hot && "border-hot/40 bg-hot-soft text-hot",
                  job.shared && "ring-1 ring-hot/60",
                )}
                render={<Link href={`/job/${job.id}`} />}
              >
                {job.name}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {selectedJob && (
        <Card size="sm" data-testid="job-detail" className="gap-2">
          <CardHeader className="gap-1">
            <div className="flex items-start gap-2">
              <CardTitle className="text-sm">{selectedJob.name}</CardTitle>
              {selectedJob.shared && (
                <Badge
                  variant="outline"
                  className="h-5 border-hot/40 bg-hot-soft font-normal text-hot"
                >
                  换乘岗位
                </Badge>
              )}
              <Button
                size="icon-xs"
                variant="ghost"
                className="ml-auto"
                aria-label="收起"
                onClick={() => setSelection(null)}
              >
                <XIcon />
              </Button>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {selectedJob.duty}
            </p>
          </CardHeader>
          <div className="flex flex-col gap-2 px-3 pb-3 text-xs">
            <p className="text-muted-foreground" data-testid="job-lanes">
              出现在 {selectedShared ? selectedShared.lanes.length : 1} 条链路：
              {selectedShared
                ? selectedShared.lanes
                    .map((lane) => `${lane.name}（${lane.stageName}）`)
                    .join("、")
                : data.lanes.find((lane) => lane.y / MAP_LANE_GAP === selectedJob.lane)?.name}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {selectedShared?.lanes.map((lane) => (
                <Button
                  key={lane.id}
                  size="sm"
                  variant="outline"
                  render={<Link href={`/workflow/${lane.id}`} />}
                >
                  {lane.name}
                </Button>
              ))}
              <Button
                size="sm"
                render={<Link href={`/job/${selectedJob.id}`} />}
              >
                看岗位详情
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* 画布内容读屏读不到，这里留一份等价文本 */}
      <div className="sr-only" data-testid="map-outline">
        <h2>协作地图（{data.counts.lanes} 条链路）</h2>
        <ol>
          {data.lanes.map((lane) => (
            <li key={lane.id} data-testid="map-lane">
              {`${lane.name}：${lane.stages.length} 个阶段，${lane.jobCount} 个岗位。阶段顺序：${lane.stages
                .map(
                  (stage) =>
                    `${stage.name}（${stage.jobs.map((job) => job.name).join("、")}）`,
                )
                .join(" → ")}`}
            </li>
          ))}
        </ol>
        <h3>换乘岗位</h3>
        <ul>
          {data.sharedJobs.map((job) => (
            <li key={job.id} data-testid="map-shared-job">
              {`${job.name}：出现在 ${job.lanes
                .map((lane) => `${lane.name}（${lane.stageName}）`)
                .join("、")}`}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
