"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type React from "react";
import { fitView, type CanvasBounds, type CanvasView } from "@/lib/canvas";

/**
 * 画布视口：平移、缩放、适应画布，以及指针事件绑定。
 * 两个画布（单条链路、协作地图）共用这套交互，绘制与命中的部分各自实现。
 */
export function useCanvasViewport({
  getBounds,
  onTap,
  padding = 56,
  gutterX = 0,
  alignX = "center",
  maxScale = 1.6,
  minScale = 0.12,
}: {
  getBounds: () => CanvasBounds;
  onTap?: (clientX: number, clientY: number) => void;
  padding?: number;
  /** 左侧留出的屏幕像素（给固定在屏幕上的标签用），世界内容会被推到它右边 */
  gutterX?: number;
  /** 世界内容比可用区域窄时，水平居中还是靠左（靠左时标签紧贴内容） */
  alignX?: "center" | "start";
  maxScale?: number;
  minScale?: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewRef = useRef<CanvasView>({ scale: 1, offsetX: 0, offsetY: 0 });
  const sizeRef = useRef({ width: 0, height: 0 });
  const pointerRef = useRef<{
    id: number;
    x: number;
    y: number;
    moved: boolean;
  } | null>(null);
  const [zoom, setZoom] = useState(1);

  const boundsRef = useRef(getBounds);
  const tapRef = useRef(onTap);
  useEffect(() => {
    boundsRef.current = getBounds;
    tapRef.current = onTap;
  });

  const fit = useCallback(() => {
    const { width, height } = sizeRef.current;
    if (!width || !height) return;
    const view = fitView(
      boundsRef.current(),
      Math.max(160, width - gutterX),
      height,
      padding,
      maxScale,
    );
    view.offsetX += gutterX;
    if (alignX === "start") view.offsetX = gutterX + padding;
    viewRef.current = view;
    setZoom(viewRef.current.scale);
  }, [alignX, gutterX, maxScale, padding]);

  const zoomBy = useCallback(
    (factor: number, atX?: number, atY?: number) => {
      const view = viewRef.current;
      const { width, height } = sizeRef.current;
      const cx = atX ?? width / 2;
      const cy = atY ?? height / 2;
      const next = Math.max(minScale, Math.min(maxScale, view.scale * factor));
      const ratio = next / view.scale;
      viewRef.current = {
        scale: next,
        offsetX: cx - (cx - view.offsetX) * ratio,
        offsetY: cy - (cy - view.offsetY) * ratio,
      };
      setZoom(next);
    },
    [maxScale, minScale],
  );

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const observer = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      sizeRef.current = { width: rect.width, height: rect.height };
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      fit();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [fit]);

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId);
      pointerRef.current = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        moved: false,
      };
    },
    [],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      const pointer = pointerRef.current;
      if (!pointer || pointer.id !== event.pointerId) return;
      const dx = event.clientX - pointer.x;
      const dy = event.clientY - pointer.y;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) pointer.moved = true;
      viewRef.current = {
        ...viewRef.current,
        offsetX: viewRef.current.offsetX + dx,
        offsetY: viewRef.current.offsetY + dy,
      };
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      return true;
    },
    [],
  );

  const onPointerUp = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    const pointer = pointerRef.current;
    pointerRef.current = null;
    if (!pointer || pointer.moved) return;
    tapRef.current?.(event.clientX, event.clientY);
  }, []);

  const onPointerLeave = useCallback(() => {
    pointerRef.current = null;
  }, []);

  const onWheel = useCallback(
    (event: React.WheelEvent<HTMLCanvasElement>) => {
      event.preventDefault();
      const rect = event.currentTarget.getBoundingClientRect();
      zoomBy(
        Math.exp(-event.deltaY * 0.0016),
        event.clientX - rect.left,
        event.clientY - rect.top,
      );
    },
    [zoomBy],
  );

  /** 屏幕坐标 → 世界坐标 */
  const toWorld = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const view = viewRef.current;
    return {
      x: (clientX - rect.left - view.offsetX) / view.scale,
      y: (clientY - rect.top - view.offsetY) / view.scale,
    };
  }, []);

  return {
    containerRef,
    canvasRef,
    viewRef,
    sizeRef,
    zoom,
    fit,
    zoomBy,
    toWorld,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerLeave,
      onWheel,
    },
  };
}
