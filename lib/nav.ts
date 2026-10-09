import {
  getCategoriesWithCount,
  getWorkflowJobCount,
  getWorkflowJobs,
  getWorkflows,
} from "@/lib/data";

/** 传给客户端导航组件的最小数据，不把 331 KB 的数据集带进浏览器。 */
export interface NavCategory {
  id: string;
  name: string;
  jobCount: number;
  groupCount: number;
}

export interface NavWorkflow {
  id: string;
  name: string;
  description: string;
  stageCount: number;
  jobCount: number;
  /** 出现在多条链路里的岗位数（换乘岗位），用来在菜单里打点 */
  sharedCount: number;
}

export function getNavCategories(): NavCategory[] {
  return getCategoriesWithCount().map(({ category, jobCount, groupCount }) => ({
    id: category.id,
    name: category.name,
    jobCount,
    groupCount,
  }));
}

export function getNavWorkflows(): NavWorkflow[] {
  const workflows = getWorkflows();
  const jobsByWorkflow = workflows.map((workflow) =>
    getWorkflowJobs(workflow).map((job) => job.id),
  );
  const lanesByJob = new Map<string, number>();
  for (const jobs of jobsByWorkflow) {
    for (const id of jobs) lanesByJob.set(id, (lanesByJob.get(id) ?? 0) + 1);
  }

  return workflows.map((workflow, index) => ({
    id: workflow.id,
    name: workflow.name,
    description: workflow.description,
    stageCount: workflow.stages.length,
    jobCount: getWorkflowJobCount(workflow),
    sharedCount: jobsByWorkflow[index].filter(
      (id) => (lanesByJob.get(id) ?? 0) > 1,
    ).length,
  }));
}
