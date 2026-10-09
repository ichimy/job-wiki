import { defineConfig, devices } from "@playwright/test";

const port = 3210;
const localBaseURL = `http://127.0.0.1:${port}`;

/**
 * 传线上地址就跑线上冒烟，例如：
 *   PLAYWRIGHT_BASE_URL=https://job-wiki-jet.vercel.app pnpm exec playwright test
 */
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? localBaseURL;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [["list"], ["html", { open: "never" }]]
    : [["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        // `pnpm test:e2e` 会先构建；CI 里也已经单独跑过 build。
        // 直接调用 next 二进制，少一层 pnpm 包装，Playwright 关闭时能干净回收服务进程。
        command: `./node_modules/.bin/next start --port ${port}`,
        url: localBaseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
});
