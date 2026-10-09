import { expect, test } from "@playwright/test";

test("首页：5 个统计、28 个行业入口、20 条链路入口", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByTestId("stat-value")).toHaveCount(5);
  for (const value of ["28", "848", "20", "682", "1098"]) {
    await expect(
      page.getByTestId("stat-value").filter({ hasText: new RegExp(`^${value}$`) }),
    ).toHaveCount(1);
  }

  await expect(page.getByTestId("category-card")).toHaveCount(28);
  await expect(page.getByTestId("workflow-link")).toHaveCount(20);
});

test("行业页：分组、岗位卡片与即时过滤", async ({ page }) => {
  await page.goto("/c/C01");

  await expect(page.getByTestId("group-section")).toHaveCount(10);
  await expect(page.getByTestId("job-card")).toHaveCount(88);

  await page.getByTestId("category-filter").fill("Java");
  await expect(page.getByTestId("job-card")).not.toHaveCount(88);
  const filtered = await page.getByTestId("job-card").count();
  expect(filtered).toBeGreaterThan(0);
  expect(filtered).toBeLessThan(88);
});

test("岗位页：上游 2、下游 3、同组 14", async ({ page }) => {
  await page.goto("/job/J0001");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Java");
  await expect(page.getByTestId("job-upstream-item")).toHaveCount(2);
  await expect(page.getByTestId("job-downstream-item")).toHaveCount(3);
  await expect(page.getByTestId("job-peer")).toHaveCount(14);
});

test("链路页：W01 的 6 个阶段按顺序排列", async ({ page }) => {
  await page.goto("/workflow/W01");

  const stages = page.getByTestId("workflow-stage");
  await expect(stages).toHaveCount(6);
  await expect(stages.nth(0)).toContainText("需求与产品定义");
  await expect(stages.nth(1)).toContainText("交互与视觉设计");
  await expect(stages.nth(5)).toContainText("运营与迭代");
  await expect(page.getByTestId("workflow-handoff")).toHaveCount(5);
});

test("⌘K 搜岗位并跳转", async ({ page }) => {
  await page.goto("/");

  const input = page.getByTestId("command-input");
  // 快捷键监听挂在客户端 bundle 上，页面刚 load 时可能还没 hydrate，重试即可。
  await expect(async () => {
    await page.keyboard.press("ControlOrMeta+k");
    await expect(input).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 10_000 });
  await expect(input).toBeVisible();

  await input.fill("Java");
  const result = page.getByTestId("command-job-item").filter({ hasText: "Java" }).first();
  await expect(result).toBeVisible();
  await result.click();

  await page.waitForURL("**/job/J0001");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Java");
});

test("主题切换写入 data-theme 并在刷新后保持", async ({ page }) => {
  await page.goto("/");
  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-theme", "light");

  await page.getByTestId("theme-toggle").click();
  await expect(html).toHaveAttribute("data-theme", "dark");

  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "dark");
});

test("全站没有指向第三方的链接", async ({ page }) => {
  const routes = ["/", "/c/C01", "/job/J0001", "/workflow/W01", "/job/J0002"];
  for (const route of routes) {
    await page.goto(route);
    const external = await page
      .locator('a[href^="http"]:not([href^="http://127.0.0.1"]), a[href^="//"]')
      .count();
    expect(external, `${route} 出现了出站链接`).toBe(0);
  }
});

test("线上：Web Analytics 已接入且不外联", async ({ page }) => {
  test.skip(!process.env.PLAYWRIGHT_BASE_URL, "只对线上地址运行");

  const origin = new URL(process.env.PLAYWRIGHT_BASE_URL!).origin;
  const thirdParty = new Set<string>();
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.protocol.startsWith("http") && url.origin !== origin) {
      thirdParty.add(url.origin);
    }
  });

  await page.goto("/");

  // 脚本由 @vercel/analytics 在 hydrate 后注入，具体路径由 Vercel 下发的配置决定
  const script = page.locator('script[data-sdkn^="@vercel/analytics"]');
  await expect(script).toBeAttached({ timeout: 10_000 });
  const src = await script.getAttribute("src");
  expect(src).toBeTruthy();

  // 生产部署上这个同源脚本必须真的存在（确认项目已启用 Web Analytics）
  const status = await page.evaluate(async (url) => {
    const response = await fetch(url!, { method: "GET" });
    return response.status;
  }, src);
  expect(status).toBe(200);

  const sdk = await page.evaluate(() => ({
    mode: (window as unknown as { vam?: string }).vam,
    queued: typeof (window as unknown as { va?: unknown }).va,
  }));
  expect(sdk.mode).toBe("production");
  expect(sdk.queued).toBe("function");
  expect([...thirdParty]).toEqual([]);
});
