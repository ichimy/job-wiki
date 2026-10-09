/** canvas 画布共用的纯函数：视口、圆角矩形、文字截断、贝塞尔取点。 */

export interface CanvasView {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export interface CanvasPoint {
  x: number;
  y: number;
}

export interface CanvasBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function fitView(
  bounds: CanvasBounds,
  width: number,
  height: number,
  padding: number,
  maxScale = 1.5,
): CanvasView {
  const boundsWidth = Math.max(1, bounds.maxX - bounds.minX);
  const boundsHeight = Math.max(1, bounds.maxY - bounds.minY);
  const scale = Math.max(
    0.12,
    Math.min(
      (width - padding * 2) / boundsWidth,
      (height - padding * 2) / boundsHeight,
      maxScale,
    ),
  );
  return {
    scale,
    offsetX: (width - boundsWidth * scale) / 2 - bounds.minX * scale,
    offsetY: (height - boundsHeight * scale) / 2 - bounds.minY * scale,
  };
}

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function truncate(
  ctx: CanvasRenderingContext2D,
  text: string,
  max: number,
) {
  if (ctx.measureText(text).width <= max) return text;
  let out = text;
  while (out.length > 1 && ctx.measureText(`${out}…`).width > max) {
    out = out.slice(0, -1);
  }
  return `${out}…`;
}

export function bezierPoint(
  p0: CanvasPoint,
  c1: CanvasPoint,
  c2: CanvasPoint,
  p3: CanvasPoint,
  t: number,
): CanvasPoint {
  const mt = 1 - t;
  return {
    x:
      mt * mt * mt * p0.x +
      3 * mt * mt * t * c1.x +
      3 * mt * t * t * c2.x +
      t * t * t * p3.x,
    y:
      mt * mt * mt * p0.y +
      3 * mt * mt * t * c1.y +
      3 * mt * t * t * c2.y +
      t * t * t * p3.y,
  };
}

export function curveMidpoint(
  p0: CanvasPoint,
  c1: CanvasPoint,
  c2: CanvasPoint,
  p3: CanvasPoint,
): CanvasPoint {
  return bezierPoint(p0, c1, c2, p3, 0.5);
}

/** 读取当前主题下的颜色变量，画布在明暗主题下都用同一套 token。 */
export function readCanvasColors() {
  const styles = getComputedStyle(document.documentElement);
  const token = (name: string, fallback: string) =>
    styles.getPropertyValue(name).trim() || fallback;
  return {
    card: token("--card", "#ffffff"),
    border: token("--border", "#e6e2d9"),
    primary: token("--primary", "#4c5fd5"),
    foreground: token("--foreground", "#1f1d1a"),
    mutedForeground: token("--muted-foreground", "#6b6459"),
    muted: token("--muted", "#f1efe9"),
    hot: token("--hot", "#b5713f"),
  };
}

export const canvasFont = (size: number, weight = 500) =>
  `${weight} ${size}px "PingFang SC", "Microsoft YaHei", system-ui, sans-serif`;
