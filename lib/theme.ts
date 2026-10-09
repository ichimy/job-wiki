/** 沿用旧站的存储键，回访用户的主题偏好不丢。 */
export const themeStorageKey = "job-explorer-theme";

export type Theme = "light" | "dark";

/**
 * 首屏前写入 data-theme，避免闪一下浅色再切深色。
 * 未存过偏好时跟随系统。
 */
export const themeInitScript = `(function(){try{var k="${themeStorageKey}";var s=localStorage.getItem(k);var t=s==="light"||s==="dark"?s:(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`;
