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

test("菜单：一级导航三项，可跳转并高亮当前项", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("nav-overview")).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(page.getByTestId("nav-graph")).toHaveCount(0);

  await page.getByTestId("nav-categories").click();
  await page.waitForURL("**/c");
  await expect(page.getByTestId("category-entry")).toHaveCount(28);
  await expect(page.getByTestId("nav-categories")).toHaveAttribute(
    "aria-current",
    "page",
  );

  await page.getByTestId("nav-workflows").click();
  await page.waitForURL("**/workflow");
  await expect(page.getByTestId("workflow-entry")).toHaveCount(20);
  await expect(page.getByTestId("workflow-entry-stage")).toHaveCount(102);
  await expect(page.getByTestId("workflow-entry-shared").first()).toBeVisible();

});

test("菜单：侧栏随视图切换，岗位页高亮所属行业与链路", async ({ page }) => {
  // 总览是全景页面，不挂侧栏
  await page.goto("/");
  await expect(page.getByTestId("sidebar-category")).toHaveCount(0);
  await expect(page.getByTestId("sidebar-workflow")).toHaveCount(0);
  await expect(page.getByTestId("sidebar-view-overview")).toHaveCount(0);

  // 行业视图：侧栏只给行业清单（可筛选）
  await page.goto("/c/C01");
  const categories = page.getByTestId("sidebar-category");
  await expect(categories).toHaveCount(28);
  await expect(page.getByTestId("sidebar-workflow")).toHaveCount(0);
  await page.getByTestId("sidebar-category-filter").fill("教育");
  await expect(categories).toHaveCount(1);
  await page.getByTestId("sidebar-category-filter").fill("");
  await expect(categories).toHaveCount(28);

  // 协作链路视图：侧栏只给链路清单
  await page.goto("/workflow/W01");
  await expect(page.getByTestId("sidebar-category")).toHaveCount(0);
  const workflows = page.getByTestId("sidebar-workflow");
  await expect(workflows).toHaveCount(20);
  await page.getByTestId("sidebar-workflow-filter").fill("餐饮");
  await expect(workflows).toHaveCount(1);

  // 岗位页跨视图：两份清单都在，并高亮所属行业与链路
  await page.goto("/job/J0001");
  await expect(page.getByTestId("sidebar-workflow")).toHaveCount(1);
  await expect(
    page.locator('[data-testid="sidebar-category"][data-highlighted="true"]'),
  ).toHaveCount(1);
  await expect(
    page.locator('[data-testid="sidebar-workflow"][data-highlighted="true"]'),
  ).toHaveCount(1);
});

test("菜单：深行业 / 深链路的岗位，高亮项也要看得见", async ({ page }) => {
  // J0568 = 平面设计：行业「设计」是第 12 项，链路「品牌营销链路」是第 8 项
  await page.goto("/job/J0568");

  const current = page.getByTestId("sidebar-current");
  await expect(current).toBeVisible();
  await expect(current).toContainText("平面设计");
  await expect(page.getByTestId("sidebar-current-category")).toHaveText("设计");
  await expect(page.getByTestId("sidebar-current-workflow")).toHaveText(
    "品牌营销链路",
  );
  // 岗位页只列相关链路：J0568 只属于 1 条
  await expect(page.getByTestId("sidebar-workflow")).toHaveCount(1);

  // 两份清单里的高亮项都要落在各自滚动容器的可视区内
  const visible = await page.evaluate(() => {
    const check = (selector: string) => {
      const item = document.querySelector(selector);
      if (!item) return null;
      const container =
        item.closest('[data-slot="scroll-area-viewport"]') ??
        item.closest(".overflow-y-auto");
      const itemBox = item.getBoundingClientRect();
      // 岗位页的相关链路不再套滚动容器，直接按视窗判断
      if (!container) {
        return itemBox.top >= 0 && itemBox.bottom <= window.innerHeight;
      }
      const containerBox = container.getBoundingClientRect();
      return (
        itemBox.top >= containerBox.top - 1 &&
        itemBox.bottom <= containerBox.bottom + 1
      );
    };
    return {
      category: check('[data-testid="sidebar-category"][data-highlighted="true"]'),
      workflow: check('[data-testid="sidebar-workflow"][data-highlighted="true"]'),
    };
  });
  expect(visible).toEqual({ category: true, workflow: true });
});

test("菜单：未纳入链路的岗位，侧栏不铺无关链路", async ({ page }) => {
  // J0002 = C/C++，不在任何协作链路里
  await page.goto("/job/J0002");
  await expect(page.getByTestId("sidebar-current")).toContainText("C/C++");
  await expect(page.getByTestId("sidebar-workflow")).toHaveCount(0);
  await expect(page.getByTestId("sidebar-workflow-filter")).toHaveCount(0);
  await expect(page.getByTestId("sidebar-workflow-empty")).toContainText(
    "未纳入已整理的协作链路",
  );
  // 行业清单仍在（岗位属于互联网/AI）
  await expect(
    page.locator('[data-testid="sidebar-category"][data-highlighted="true"]'),
  ).toHaveCount(1);
});

test("菜单：⌘K 空状态含三个视图并能跳转", async ({ page }) => {
  await page.goto("/");
  await expect(async () => {
    await page.keyboard.press("ControlOrMeta+k");
    await expect(page.getByTestId("command-input")).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 10_000 });

  await expect(page.getByTestId("command-view-item")).toHaveCount(3);
  await page
    .getByTestId("command-view-item")
    .filter({ hasText: "协作链路" })
    .first()
    .click();
  await page.waitForURL("**/workflow");
});

test("菜单：移动端抽屉有一级入口并能唤起搜索", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 780 });
  await page.goto("/");
  await page.getByTestId("nav-trigger").click();
  await expect(page.getByTestId("sheet-nav-categories")).toBeVisible();
  await expect(page.getByTestId("sheet-nav-workflows")).toBeVisible();
  await expect(page.getByTestId("sheet-nav-graph")).toHaveCount(0);
  await page.getByTestId("sheet-search").click();
  await expect(page.getByTestId("command-input")).toBeVisible();
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

test("链路页：文本层给出阶段与交付关系，点画布才展开岗位", async ({ page }) => {
  await page.goto("/workflow/W01");

  // 文本层（供读屏/检索）始终可读，浅层视图本身不铺岗位文字
  await expect(page.getByTestId("workflow-stage")).toHaveCount(6);
  await expect(page.getByTestId("workflow-handoff")).toHaveCount(5);
  await expect(page.getByTestId("workflow-handoff").nth(2)).toContainText(
    "12 条交付关系",
  );
  await expect(page.getByTestId("stage-detail")).toHaveCount(0);
});

test("链路页画布：可缩放、点节点出明细", async ({ page }) => {
  await page.goto("/workflow/W01");

  const canvas = page.getByTestId("workflow-canvas");
  await expect(canvas).toBeVisible();
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;

  type Debug = {
    nodes: Record<string, { x: number; y: number }>;
    jobs: Record<string, { x: number; y: number }>;
    handoffs: Record<string, { x: number; y: number }>;
    zoom: number;
  };
  const readDebug = () =>
    page.evaluate(
      () =>
        (window as unknown as { __workflowCanvasDebug?: Debug })
          .__workflowCanvasDebug ?? null,
    );

  // 画布首帧渲染完成后才会写出节点坐标
  await expect
    .poll(async () => Object.keys((await readDebug())?.nodes ?? {}).length)
    .toBeGreaterThan(0);

  // 点画布上的第一个阶段节点（坐标由画布自己给出）
  const debug = await readDebug();
  expect(debug).not.toBeNull();
  const firstStage = Object.values(debug?.nodes ?? {})[0];
  expect(firstStage).toBeTruthy();
  await page.mouse.click(box.x + firstStage.x, box.y + firstStage.y);
  const stageDetail = page.getByTestId("stage-detail");
  await expect(stageDetail).toBeVisible();
  await expect(stageDetail).toContainText("需求与产品定义");

  // 点交付曲线：展开「谁交给谁」
  const handoff = (await readDebug())?.handoffs["2"];
  expect(handoff).toBeDefined();
  if (!handoff) return;
  await page.mouse.click(box.x + handoff.x, box.y + handoff.y);
  const handoffDetail = page.getByTestId("handoff-detail");
  await expect(handoffDetail).toBeVisible();
  await expect(handoffDetail).toContainText("研发实现 → 测试验证");
  await expect(handoffDetail).toContainText("12 条交付关系");
  await expect(stageDetail).toHaveCount(0);

  // 放大到岗位可见（窄画布需要多按几次），点岗位出职责与上下游
  const before = Number(await canvas.getAttribute("data-zoom"));
  for (let i = 0; i < 8; i += 1) {
    await page.getByTestId("canvas-zoom-in").click();
    await page.waitForTimeout(120);
    const zoom = (await readDebug())?.zoom ?? 0;
    if (zoom >= 0.85) break;
  }
  const after = Number(await canvas.getAttribute("data-zoom"));
  expect(after).toBeGreaterThan(before);

  const zoomed = await readDebug();
  // 控制条在画布下方，点它会带动页面滚动，所以重新取一次画布位置
  const boxAfterZoom = (await canvas.boundingBox()) ?? box;
  // 放大后部分节点会移出画布，挑一个还在可见区域里的岗位
  const visibleJob = Object.values(zoomed?.jobs ?? {}).find(
    (node) =>
      node.x > 12 &&
      node.x < boxAfterZoom.width - 12 &&
      node.y > 12 &&
      node.y < boxAfterZoom.height - 12,
  );
  expect(visibleJob).toBeTruthy();
  if (!visibleJob) return;
  await page.mouse.click(
    boxAfterZoom.x + visibleJob.x,
    boxAfterZoom.y + visibleJob.y,
  );
  const jobDetail = page.getByTestId("job-detail");
  await expect(jobDetail).toBeVisible();
  await expect(jobDetail).toContainText(/上游|下游/);

  // 适应画布把缩放拉回初始值
  await page.getByTestId("canvas-fit").click();
  await page.waitForTimeout(200);
  await expect
    .poll(async () => Number(await canvas.getAttribute("data-zoom")))
    .toBeLessThanOrEqual(after);
});

test("链路页画布：操作浮层在画布一角，默认视角就能点岗位", async ({ page }) => {
  await page.goto("/workflow/W01");

  const canvas = page.getByTestId("workflow-canvas");
  await expect(canvas).toBeVisible();
  type Debug = {
    jobs: Record<string, { x: number; y: number }>;
    zoom: number;
  };
  const readDebug = () =>
    page.evaluate(
      () =>
        (window as unknown as { __workflowCanvasDebug?: Debug })
          .__workflowCanvasDebug ?? null,
    );
  await expect
    .poll(async () => Object.keys((await readDebug())?.jobs ?? {}).length)
    .toBeGreaterThan(0);

  // 暂停交付流 / 展开岗位 两个按钮已去掉
  await expect(page.getByTestId("pipeline-play")).toHaveCount(0);
  await expect(page.getByTestId("canvas-toggle-jobs")).toHaveCount(0);

  // 四个操作按钮落在画布右下角（浮层内）
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;
  for (const id of ["canvas-zoom-out", "canvas-zoom-in", "canvas-fit", "canvas-fullscreen"]) {
    const btn = page.getByTestId(id);
    await expect(btn).toBeVisible();
    const btnBox = await btn.boundingBox();
    expect(btnBox, `${id} 应在画布内`).not.toBeNull();
    if (btnBox) {
      expect(btnBox.x).toBeGreaterThan(box.x + box.width / 2);
      expect(btnBox.y).toBeGreaterThan(box.y + box.height / 2);
    }
  }

  // 默认视角即可点到岗位
  const job = Object.values((await readDebug())?.jobs ?? {})[0];
  expect(job).toBeTruthy();
  if (!job) return;
  await page.mouse.click(box.x + job.x, box.y + job.y);
  const detail = page.getByTestId("job-detail");
  await expect(detail).toBeVisible();
  await expect(detail).toContainText("阶段");
  await expect(
    detail.getByRole("link", { name: "看岗位详情" }),
  ).toHaveAttribute("href", /\/job\/J\d+/);
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

test("协作地图已下线：路由与入口都不再存在", async ({ page }) => {
  const response = await page.goto("/graph");
  expect(response?.status()).toBe(404);

  await page.goto("/");
  await expect(page.getByTestId("nav-graph")).toHaveCount(0);
  await expect(page.getByTestId("graph-link")).toHaveCount(0);
  await expect(page.locator('a[href="/graph"]')).toHaveCount(0);
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

test("主要页面控制台无报错", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text().slice(0, 200));
  });
  page.on("pageerror", (error) => errors.push(String(error).slice(0, 200)));

  for (const route of ["/", "/c", "/c/C01", "/workflow", "/workflow/W01", "/job/J0568"]) {
    await page.goto(route);
    await page.waitForTimeout(300);
  }
  expect(errors).toEqual([]);
});

test("线上：可观测性脚本已接入且不外联", async ({ page }) => {
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

  // 脚本由 SDK 在 hydrate 后注入，具体路径由 Vercel 下发的配置决定
  for (const sdk of ["@vercel/analytics", "@vercel/speed-insights"]) {
    const script = page.locator(`script[data-sdkn^="${sdk}"]`);
    await expect(script).toBeAttached({ timeout: 10_000 });
    const src = await script.getAttribute("src");
    expect(src).toBeTruthy();

    // 生产部署上这个同源脚本必须真的存在（确认项目已启用该功能）
    const status = await page.evaluate(async (url) => {
      const response = await fetch(url!, { method: "GET" });
      return response.status;
    }, src);
    expect(status, `${sdk} 脚本应可访问`).toBe(200);
  }

  const sdk = await page.evaluate(() => ({
    analyticsMode: (window as unknown as { vam?: string }).vam,
    analyticsQueue: typeof (window as unknown as { va?: unknown }).va,
    speedInsightsQueue: typeof (window as unknown as { si?: unknown }).si,
  }));
  expect(sdk.analyticsMode).toBe("production");
  expect(sdk.analyticsQueue).toBe("function");
  expect(sdk.speedInsightsQueue).toBe("function");
  expect([...thirdParty]).toEqual([]);
});
