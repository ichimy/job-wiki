"use client";

/**
 * 让页面把「当前上下文」告诉侧边导航：进入岗位页时，侧栏会高亮它所属的行业与链路。
 * 侧栏在 layout 里、拿不到页面参数，所以用一个极小的订阅式 store 传这一条信息。
 */
export interface NavTarget {
  /** 当前岗位名称，用于侧栏顶部的上下文块 */
  label?: string;
  categoryIds: string[];
  workflowIds: string[];
}

let current: NavTarget | null = null;
const listeners = new Set<() => void>();

export function setNavTarget(next: NavTarget | null) {
  current = next;
  for (const listener of listeners) listener();
}

export function getNavTarget() {
  return current;
}

export function subscribeNavTarget(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
