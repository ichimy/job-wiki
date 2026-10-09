# 岗位全景（jobWiki）

一份自持的岗位数据集，加一个 Next.js 站点，用来回答「行业里有哪些岗位、它们怎么分布、同一个岗位为什么会落在不同行业里」。

数据不依赖任何第三方平台的编码、链接或标识，`data/jobs.json` 是唯一数据源。

## 定位

- 提供了解岗位的全景视角：**行业 → 分组 → 岗位**
- 关注岗位的跨行业归属：同一岗位可归属多个行业或分组（848 个岗位对应 1098 条归属）
- 不做求职、招聘、投递一类的 toC 服务，页面不含任何出站跳转

## 数据集

28 个行业、161 个分组、848 个岗位、1098 条分类归属，外加 20 条协作链路与 682 条岗位间的交付关系。岗位 id 形如 `J0001`，分类形如 `C07`，分组形如 `C07-G02`；每个岗位包含名称与一段职责说明。

协作链路按「阶段」描述一个行业里的实际交付顺序，例如「软件产品研发」：需求与产品定义 → 交互与视觉设计 → 研发实现 → 测试验证 → 上线与运维 → 运营与迭代。相邻阶段之间形成上游交付、下游接收的关系边。

## 本地预览

```sh
pnpm install
pnpm dev
# 打开 http://localhost:3000
```

## 目录结构

```
app/                   路由：总览 / 行业 / 岗位 / 协作链路
components/            页面组件；components/ui 为 shadcn 组件
lib/data.ts            数据访问层，服务端专用
data/jobs.json         唯一数据源
scripts/check-data.mts           校验数据并派生 relations / counts
scripts/build-search-index.mts   生成 public/search-index.json
public/                静态资源（search-index.json 为生成物，不入库）
```

技术栈：Next.js 16（App Router，静态预渲染）+ TypeScript + Tailwind v4 + shadcn/ui。848 个岗位、28 个行业、20 条链路各自成页，全站搜索是 ⌘K 命令面板。

## 数据格式

```json
{
  "meta": { "version": "1.0.0", "counts": {} },
  "categories": [
    {
      "id": "C01",
      "name": "互联网/AI",
      "groups": [{ "id": "C01-G01", "name": "后端开发", "jobs": ["J0001", "J0002"] }]
    }
  ],
  "jobs": [{ "id": "J0001", "name": "Java", "duty": "……" }],
  "hot": ["J0001"],
  "workflows": [
    {
      "id": "W01",
      "name": "软件产品研发",
      "industries": ["C01"],
      "stages": [{ "id": "W01-S01", "name": "需求与产品定义", "jobs": ["J0129"] }]
    }
  ],
  "relations": [{ "from": "J0129", "to": "J0001", "workflow": "W01", "type": "handoff" }]
}
```

岗位只在 `jobs` 里存一份，分类与分组通过 id 引用，因此跨行业归属不会产生重复记录。

`workflows` 是手工维护的，`relations` 由 `pnpm data:sync` 从链路的相邻阶段派生后写回，**不要手工编辑 `relations`**。

## 常用命令

```sh
pnpm data:check    # 校验 id、引用、阶段归属，并断言 relations 与 meta.counts
pnpm data:sync     # 改完 workflows 后重写 relations 与 counts
pnpm lint          # eslint
pnpm typecheck     # tsc --noEmit
pnpm build         # 生产构建
pnpm test:e2e      # Playwright 冒烟测试（自动构建并启动）
```

## 协作视图

点击任意岗位卡片进入岗位页，显示它的所属行业与分组、在协作链路中的位置、上游（谁的产出交给它）、下游（它的产出交给谁）以及同组岗位。页面里的岗位名可继续点击跳转。

路由：总览 `/`、行业一览 `/c`（单个行业 `/c/C01`）、协作链路一览 `/workflow`（单条 `/workflow/W01`）、协作地图 `/graph`、岗位 `/job/J0001`。

导航分三层：顶栏是一级视图（总览 / 行业 / 协作链路 / 协作地图）；左侧侧栏随视图切换，行业视图只给行业清单、协作链路视图只给链路清单（都带筛选与换乘标记），总览与协作地图不挂侧栏，岗位页同时给出两份清单并高亮该岗位所属的行业与链路；⌘K 面板与移动端抽屉复用顶栏那一套入口。

## 改数据

1. 编辑 `data/jobs.json`
2. 改过 `workflows` 就跑 `pnpm data:sync`，否则跑 `pnpm data:check` 确认数据一致
3. `pnpm dev` 打开页面，确认统计数字与内容正常

脚本会校验：分类引用、链路阶段、岗位 id、一个岗位在单条链路只出现一个阶段，并把 `relations` 与 `meta.counts` 重算一遍。

## 参与贡献

欢迎补充岗位、修正职责描述、调整行业归属。约定见 [AGENTS.md](./AGENTS.md)。

## 授权

代码采用 [MIT](./LICENSE)。`data/jobs.json` 中的分类体系与职责描述为本项目整理的内容；如需为数据单独指定授权（例如 CC BY-SA），以本节的说明为准。
