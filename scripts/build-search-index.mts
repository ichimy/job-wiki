/**
 * 生成 public/search-index.json，供 ⌘K 面板首次打开时懒加载。
 *
 * 产物不进版本库（见 .gitignore），由 predev / prebuild 自动触发。
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const source = path.join(root, "data", "jobs.json");
const output = path.join(root, "public", "search-index.json");

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

interface SearchEntry {
  id: string;
  name: string;
  duty: string;
  cat: string;
  group: string;
}

const data: { jobs: Job[]; categories: Category[] } = JSON.parse(
  readFileSync(source, "utf8"),
);

const catsByJob = new Map<string, Set<string>>();
const groupsByJob = new Map<string, Set<string>>();
for (const category of data.categories) {
  for (const group of category.groups) {
    for (const jobId of group.jobs) {
      if (!catsByJob.has(jobId)) catsByJob.set(jobId, new Set());
      if (!groupsByJob.has(jobId)) groupsByJob.set(jobId, new Set());
      catsByJob.get(jobId)!.add(category.name);
      groupsByJob.get(jobId)!.add(group.name);
    }
  }
}

const entries: SearchEntry[] = data.jobs.map((job) => ({
  id: job.id,
  name: job.name,
  duty: job.duty,
  cat: [...(catsByJob.get(job.id) ?? [])].join("、"),
  group: [...(groupsByJob.get(job.id) ?? [])].join("、"),
}));

mkdirSync(path.dirname(output), { recursive: true });
const payload = JSON.stringify(entries);
writeFileSync(output, payload, "utf8");

const kb = Math.round(Buffer.byteLength(payload) / 1024);
console.log(`搜索索引：${entries.length} 条岗位，约 ${kb} KB → public/search-index.json`);
