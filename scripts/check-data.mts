/**
 * 校验 data/jobs.json，并从 workflows 重算 relations 与 meta.counts。
 *
 * data/jobs.json 是唯一数据源：workflows 手工维护，relations 由相邻阶段派生，
 * 属于生成字段。改完 workflows 跑 `pnpm data:sync` 回写，跑 `pnpm data:check` 断言一致。
 *
 * 用法：
 *   node scripts/check-data.mts          仅校验（CI 门禁）
 *   node scripts/check-data.mts --sync   校验通过后回写 relations 与 counts
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const source = path.join(root, "data", "jobs.json");
const sync = process.argv.includes("--sync");

interface Job {
  id: string;
  name: string;
  duty: string;
}

interface Group {
  id: string;
  name: string;
  jobs: string[];
}

interface Category {
  id: string;
  name: string;
  groups: Group[];
}

interface Stage {
  id: string;
  name: string;
  jobs: string[];
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  industries: string[];
  stages: Stage[];
}

interface Relation {
  from: string;
  to: string;
  workflow: string;
  type: string;
}

interface DataSet {
  meta: { counts: Record<string, number>; [key: string]: unknown };
  categories: Category[];
  jobs: Job[];
  hot: string[];
  workflows: Workflow[];
  relations: Relation[];
  [key: string]: unknown;
}

const data: DataSet = JSON.parse(readFileSync(source, "utf8"));
const { jobs, categories, hot } = data;
const workflows = data.workflows ?? [];

const errors: string[] = [];

const jobIds = new Set(jobs.map((job) => job.id));
if (jobIds.size !== jobs.length) {
  errors.push("岗位 id 有重复");
}
const categoryIds = new Set(categories.map((category) => category.id));
if (categoryIds.size !== categories.length) {
  errors.push("分类 id 有重复");
}
if (new Set(hot).size !== hot.length) {
  errors.push("热门岗位有重复");
}
for (const id of hot) {
  if (!jobIds.has(id)) errors.push(`热门岗位引用了不存在的岗位 ${id}`);
}

const seenJob = new Set<string>();
const groupIds = new Set<string>();
for (const category of categories) {
  for (const group of category.groups) {
    if (groupIds.has(group.id)) {
      errors.push(`分组 id 重复: ${group.id}`);
    }
    groupIds.add(group.id);
    for (const jobId of group.jobs) {
      if (!jobIds.has(jobId)) {
        errors.push(`分类 ${category.id} 分组 ${group.id} 引用了不存在的岗位 ${jobId}`);
      }
      seenJob.add(jobId);
    }
  }
}
const orphans = [...jobIds].filter((id) => !seenJob.has(id));
if (orphans.length > 0) {
  errors.push(`${orphans.length} 个岗位未被任何分类引用，例如 ${orphans.slice(0, 3).join(", ")}`);
}

const workflowIds = new Set<string>();
const stageIds = new Set<string>();
for (const workflow of workflows) {
  if (workflowIds.has(workflow.id)) {
    errors.push(`链路 id 重复: ${workflow.id}`);
  }
  workflowIds.add(workflow.id);
  for (const categoryId of workflow.industries) {
    if (!categoryIds.has(categoryId)) {
      errors.push(`${workflow.id} 引用了不存在的分类 ${categoryId}`);
    }
  }
  const placed = new Set<string>();
  for (const stage of workflow.stages) {
    if (stageIds.has(stage.id)) {
      errors.push(`阶段 id 重复: ${stage.id}`);
    }
    stageIds.add(stage.id);
    if (stage.jobs.length === 0) {
      errors.push(`${stage.id} 阶段没有任何岗位`);
    }
    for (const jobId of stage.jobs) {
      if (!jobIds.has(jobId)) {
        errors.push(`${stage.id} 引用了不存在的岗位 ${jobId}`);
      }
      if (placed.has(jobId)) {
        errors.push(`${workflow.id} 中岗位 ${jobId} 出现在多个阶段`);
      }
      placed.add(jobId);
    }
  }
}

// ---------- 派生关系边：相邻阶段之间为「交付」关系 ----------
const relations: Relation[] = [];
const seenEdge = new Set<string>();
for (const workflow of workflows) {
  for (let i = 0; i < workflow.stages.length - 1; i += 1) {
    for (const from of workflow.stages[i].jobs) {
      for (const to of workflow.stages[i + 1].jobs) {
        const key = `${from}->${to}@${workflow.id}`;
        if (seenEdge.has(key)) continue;
        seenEdge.add(key);
        relations.push({ from, to, workflow: workflow.id, type: "handoff" });
      }
    }
  }
}

const counts = {
  categories: categories.length,
  groups: categories.reduce((sum, category) => sum + category.groups.length, 0),
  jobs: jobs.length,
  memberships: categories.reduce(
    (sum, category) =>
      sum + category.groups.reduce((inner, group) => inner + group.jobs.length, 0),
    0,
  ),
  workflows: workflows.length,
  relations: relations.length,
  jobsInWorkflows: new Set(
    workflows.flatMap((workflow) => workflow.stages.flatMap((stage) => stage.jobs)),
  ).size,
};

const relationsMatch = JSON.stringify(data.relations ?? []) === JSON.stringify(relations);
if (!relationsMatch) {
  errors.push(
    sync
      ? "relations 与 workflows 的派生结果不一致（本次已按 workflows 重写）"
      : "relations 与 workflows 的派生结果不一致，请运行 pnpm data:sync",
  );
}

for (const [key, value] of Object.entries(counts)) {
  const actual = data.meta.counts?.[key];
  if (actual !== value) {
    errors.push(`meta.counts.${key} 为 ${String(actual)}，实际应为 ${value}`);
  }
}

const blocking = errors.filter((error) => sync ? !error.includes("已按 workflows 重写") : true);
if (blocking.length > 0) {
  console.error("校验未通过：");
  for (const error of blocking) console.error("  -", error);
  process.exit(1);
}

if (sync) {
  data.relations = relations;
  data.meta.counts = { ...data.meta.counts, ...counts };
  writeFileSync(source, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

console.log(`relations: ${sync ? "已同步" : "一致"}（${counts.relations} 条边）`);
console.log(
  `行业 ${counts.categories} / 分组 ${counts.groups} / 岗位 ${counts.jobs} / 归属 ${counts.memberships}`,
);
console.log(`协作链路 ${counts.workflows} 条，覆盖岗位 ${counts.jobsInWorkflows} 个`);
