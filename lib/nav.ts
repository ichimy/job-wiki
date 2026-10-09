import {
  getCategoriesWithCount,
  getWorkflowJobCount,
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
  return getWorkflows().map((workflow) => ({
    id: workflow.id,
    name: workflow.name,
    description: workflow.description,
    stageCount: workflow.stages.length,
    jobCount: getWorkflowJobCount(workflow),
  }));
}
