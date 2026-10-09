"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * 元素级全屏：按钮进入/退出，Esc 或浏览器退出时同步状态。
 * 不支持 Fullscreen API 的环境（如部分内嵌浏览器）只是拿不到全屏，不报错。
 */
export function useFullscreen(getElement: () => HTMLElement | null) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggle = useCallback(async () => {
    const element = getElement();
    if (!element) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await element.requestFullscreen({ navigationUI: "hide" });
      }
    } catch {
      /* 用户拒绝或被浏览器策略拦截时保持原样 */
    }
  }, [getElement]);

  return { isFullscreen, toggle };
}
