"use client";

import { useSyncExternalStore } from "react";
import { useEffect } from "react";
import {
  getNavTarget,
  setNavTarget,
  subscribeNavTarget,
  type NavTarget,
} from "@/lib/nav-target";

/** 页面侧发布当前上下文（岗位页用），侧栏订阅后高亮。 */
export function NavTargetPublisher({ target }: { target: NavTarget }) {
  const key = `${target.categoryIds.join(",")}|${target.workflowIds.join(",")}`;

  useEffect(() => {
    setNavTarget(target);
    return () => setNavTarget(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return null;
}

export function useNavTarget() {
  return useSyncExternalStore(subscribeNavTarget, getNavTarget, () => null);
}
