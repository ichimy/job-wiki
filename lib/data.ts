import raw from "@/data/jobs.json";

export interface Job {
  id: string;
  name: string;
  duty: string;
}

export interface Group {
  id: string;
  name: string;
  jobs: string[];
}

export interface Category {
  id: string;
  name: string;
  groups: Group[];
}

export interface Stage {
  id: string;
  name: string;
  jobs: string[];
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  industries: string[];
  stages: Stage[];
}

export interface Relation {
  from: string;
  to: string;
  workflow: string;
  type: string;
}

export interface Counts {
  categories: number;
  groups: number;
  jobs: number;
  memberships: number;
  workflows: number;
  relations: number;
  jobsInWorkflows: number;
}

export interface Meta {
  title: string;
  version: string;
  updated: string;
  counts: Counts;
  idScheme: string;
  note: string;
}

interface DataSet {
  meta: Meta;
  categories: Category[];
  jobs: Job[];
  hot: string[];
  workflows: Workflow[];
  relations: Relation[];
}

/** 岗位所属的行业与分组。 */
export interface Membership {
  category: Category;
  group: Group;
}

/** 岗位在协作链路中的位置。 */
export interface StagePosition {
  workflow: Workflow;
  stage: Stage;
  /** 阶段序号，从 1 开始。 */
  index: number;
  total: number;
}

/** 按链路聚合的一组岗位（用于上游、下游）。 */
export interface WorkflowJobs {
  workflow: Workflow;
  jobs: Job[];
}

/** 相邻阶段之间的交付关系。 */
export interface Handoff {
  from: Stage;
  to: Stage;
  count: number;
}

const data = raw as unknown as DataSet;

const jobById = new Map<string, Job>(data.jobs.map((job) => [job.id, job]));
const categoryById = new Map<string, Category>(
  data.categories.map((category) => [category.id, category]),
);
const workflowById = new Map<string, Workflow>(
  data.workflows.map((workflow) => [workflow.id, workflow]),
);
const hotIds = new Set<string>(data.hot);

const membershipByJob = new Map<string, Membership[]>();
const groupById = new Map<string, Group>();
for (const category of data.categories) {
  for (const group of category.groups) {
    groupById.set(group.id, group);
    for (const jobId of group.jobs) {
      const list = membershipByJob.get(jobId) ?? [];
      list.push({ category, group });
      membershipByJob.set(jobId, list);
    }
  }
}

const stageByJob = new Map<string, StagePosition>();
for (const workflow of data.workflows) {
  workflow.stages.forEach((stage, i) => {
    for (const jobId of stage.jobs) {
      stageByJob.set(jobId, {
        workflow,
        stage,
        index: i + 1,
        total: workflow.stages.length,
      });
    }
  });
}

const upstreamByJob = new Map<string, Map<string, Set<string>>>();
const downstreamByJob = new Map<string, Map<string, Set<string>>>();
for (const relation of data.relations) {
  if (!jobById.has(relation.from) || !jobById.has(relation.to)) continue;
  push(upstreamByJob, relation.to, relation.workflow, relation.from);
  push(downstreamByJob, relation.from, relation.workflow, relation.to);
}

function push(
  index: Map<string, Map<string, Set<string>>>,
  jobId: string,
  workflowId: string,
  otherId: string,
) {
  let byWorkflow = index.get(jobId);
  if (!byWorkflow) {
    byWorkflow = new Map<string, Set<string>>();
    index.set(jobId, byWorkflow);
  }
  let ids = byWorkflow.get(workflowId);
  if (!ids) {
    ids = new Set<string>();
    byWorkflow.set(workflowId, ids);
  }
  ids.add(otherId);
}

function collect(
  index: Map<string, Map<string, Set<string>>>,
  jobId: string,
): WorkflowJobs[] {
  const byWorkflow = index.get(jobId);
  if (!byWorkflow) return [];
  return data.workflows
    .filter((workflow) => byWorkflow.has(workflow.id))
    .map((workflow) => ({
      workflow,
      jobs: [...(byWorkflow.get(workflow.id) ?? [])]
        .map((id) => jobById.get(id))
        .filter((job): job is Job => Boolean(job))
        .sort((a, b) => a.id.localeCompare(b.id)),
    }));
}

export function getMeta(): Meta {
  return data.meta;
}

export function getCounts(): Counts {
  return data.meta.counts;
}

export function getJobs(): Job[] {
  return data.jobs;
}

export function getJob(jobId: string): Job | undefined {
  return jobById.get(jobId);
}

export function getCategories(): Category[] {
  return data.categories;
}

export function getCategory(categoryId: string): Category | undefined {
  return categoryById.get(categoryId);
}

export function getGroup(groupId: string): Group | undefined {
  return groupById.get(groupId);
}

export function getWorkflows(): Workflow[] {
  return data.workflows;
}

export function getWorkflow(workflowId: string): Workflow | undefined {
  return workflowById.get(workflowId);
}

export function isHot(jobId: string): boolean {
  return hotIds.has(jobId);
}

export function getHotIds(): string[] {
  return data.hot;
}

export function getMemberships(jobId: string): Membership[] {
  return membershipByJob.get(jobId) ?? [];
}

export function getStageOf(jobId: string): StagePosition | undefined {
  return stageByJob.get(jobId);
}

export function getUpstream(jobId: string): WorkflowJobs[] {
  return collect(upstreamByJob, jobId);
}

export function getDownstream(jobId: string): WorkflowJobs[] {
  return collect(downstreamByJob, jobId);
}

/** 同分组岗位（去重、不含自己）。 */
export function getPeers(jobId: string): Job[] {
  const ids = new Set<string>();
  for (const { group } of getMemberships(jobId)) {
    for (const id of group.jobs) {
      if (id !== jobId) ids.add(id);
    }
  }
  return [...ids]
    .map((id) => jobById.get(id))
    .filter((job): job is Job => Boolean(job))
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function getCategoryJobs(category: Category): Job[] {
  const ids = new Set<string>();
  for (const group of category.groups) {
    for (const id of group.jobs) ids.add(id);
  }
  return [...ids]
    .map((id) => jobById.get(id))
    .filter((job): job is Job => Boolean(job))
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function getCategoryJobCount(category: Category): number {
  return category.groups.reduce((sum, group) => sum + group.jobs.length, 0);
}

export interface CategoryWithCount {
  category: Category;
  jobCount: number;
  groupCount: number;
}

/** 行业按岗位数从多到少排序。 */
export function getCategoriesWithCount(): CategoryWithCount[] {
  return data.categories
    .map((category) => ({
      category,
      jobCount: getCategoryJobCount(category),
      groupCount: category.groups.length,
    }))
    .sort(
      (a, b) =>
        b.jobCount - a.jobCount || a.category.id.localeCompare(b.category.id),
    );
}

export function getStageJobs(stage: Stage): Job[] {
  return stage.jobs
    .map((id) => jobById.get(id))
    .filter((job): job is Job => Boolean(job))
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function getWorkflowJobCount(workflow: Workflow): number {
  return workflow.stages.reduce((sum, stage) => sum + stage.jobs.length, 0);
}

export function getWorkflowIndustries(workflow: Workflow): Category[] {
  return workflow.industries
    .map((id) => categoryById.get(id))
    .filter((category): category is Category => Boolean(category));
}

/** 相邻阶段之间的交付语义：上一阶段产出交给下一阶段。 */
export function getWorkflowHandoffs(workflow: Workflow): Handoff[] {
  const countByPair = new Map<string, number>();
  for (const relation of data.relations) {
    if (relation.workflow !== workflow.id) continue;
    const key = `${relation.from}->${relation.to}`;
    countByPair.set(key, (countByPair.get(key) ?? 0) + 1);
  }
  const handoffs: Handoff[] = [];
  for (let i = 0; i < workflow.stages.length - 1; i += 1) {
    const from = workflow.stages[i];
    const to = workflow.stages[i + 1];
    let count = 0;
    for (const srcId of from.jobs) {
      for (const dstId of to.jobs) {
        count += countByPair.get(`${srcId}->${dstId}`) ?? 0;
      }
    }
    handoffs.push({ from, to, count });
  }
  return handoffs;
}

/** 该岗位所在的全部链路（去重）。 */
export function getWorkflowsOfJob(jobId: string): Workflow[] {
  return data.workflows.filter((workflow) =>
    workflow.stages.some((stage) => stage.jobs.includes(jobId)),
  );
}

/** 链路里出现过的岗位，按 id 排序。 */
export function getWorkflowJobs(workflow: Workflow): Job[] {
  const ids = new Set<string>();
  for (const stage of workflow.stages) {
    for (const id of stage.jobs) ids.add(id);
  }
  return [...ids]
    .map((id) => jobById.get(id))
    .filter((job): job is Job => Boolean(job))
    .sort((a, b) => a.id.localeCompare(b.id));
}
