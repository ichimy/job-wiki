import {
  getStageJobs,
  getWorkflowIndustries,
  getWorkflowJobCount,
  getWorkflowJobs,
  getWorkflows,
  isHot,
} from "@/lib/data";

/** 地图坐标常量（世界坐标，画布负责缩放平移） */
export const MAP_X0 = 170;
export const MAP_SLOT_X = 210;
export const MAP_LANE_GAP = 130;
export const MAP_STAGE_W = 170;
export const MAP_STAGE_H = 46;
export const MAP_JOB_SPREAD = 64;

export interface MapJob {
  id: string;
  name: string;
  duty: string;
  hot: boolean;
  x: number;
  y: number;
  lane: number;
  /** 是否出现在多条链路（换乘岗位） */
  shared: boolean;
}

export interface MapStage {
  id: string;
  name: string;
  x: number;
  y: number;
  jobs: MapJob[];
}

export interface MapLane {
  id: string;
  name: string;
  description: string;
  stageCount: number;
  jobCount: number;
  industries: string[];
  sharedCount: number;
  y: number;
  stages: MapStage[];
}

export interface MapTransfer {
  jobId: string;
  name: string;
  from: { x: number; y: number; lane: number; laneName: string };
  to: { x: number; y: number; lane: number; laneName: string };
}

export interface MapSharedJob {
  id: string;
  name: string;
  duty: string;
  lanes: { id: string; name: string; stageName: string }[];
}

export interface WorkflowMapData {
  lanes: MapLane[];
  transfers: MapTransfer[];
  sharedJobs: MapSharedJob[];
  counts: {
    lanes: number;
    stages: number;
    jobs: number;
    sharedJobs: number;
    transfers: number;
  };
}

/**
 * 把 20 条链路排成地铁图：
 *   - 每条链路一条车道，车道顺序按「共享岗位」贪心排列，让相交的线路尽量挨着；
 *   - 阶段按固定槽位排布，跨链路的同一个岗位画成换乘连线。
 * 布局在服务端算好，画布只负责画，避免每次加载重排。
 */
export function getWorkflowMap(): WorkflowMapData {
  const workflows = getWorkflows();
  const jobIdsByWorkflow = workflows.map(
    (workflow) => new Set(getWorkflowJobs(workflow).map((job) => job.id)),
  );

  // 共享岗位权重
  const weight = workflows.map(() => workflows.map(() => 0));
  for (let i = 0; i < workflows.length; i += 1) {
    for (let j = i + 1; j < workflows.length; j += 1) {
      let shared = 0;
      for (const id of jobIdsByWorkflow[i]) {
        if (jobIdsByWorkflow[j].has(id)) shared += 1;
      }
      weight[i][j] = shared;
      weight[j][i] = shared;
    }
  }

  const total = workflows.map((_, index) =>
    weight[index].reduce((sum, value) => sum + value, 0),
  );
  const order: number[] = [];
  const used = new Set<number>();
  let current = total.indexOf(Math.max(...total));
  while (order.length < workflows.length) {
    order.push(current);
    used.add(current);
    let next = -1;
    let best = 0;
    for (let index = 0; index < workflows.length; index += 1) {
      if (used.has(index)) continue;
      if (weight[current][index] > best) {
        best = weight[current][index];
        next = index;
      }
    }
    if (next === -1) {
      // 没有相邻的共享线路了，从剩下的里挑最“忙”的一条
      let fallback = -1;
      let fallbackScore = -1;
      for (let index = 0; index < workflows.length; index += 1) {
        if (used.has(index)) continue;
        if (total[index] > fallbackScore) {
          fallbackScore = total[index];
          fallback = index;
        }
      }
      next = fallback;
    }
    current = next;
  }

  // 统计岗位出现在哪些链路
  const lanesByJob = new Map<string, number[]>();
  order.forEach((workflowIndex, lane) => {
    for (const jobId of jobIdsByWorkflow[workflowIndex]) {
      const list = lanesByJob.get(jobId) ?? [];
      list.push(lane);
      lanesByJob.set(jobId, list);
    }
  });

  const lanes: MapLane[] = [];
  const nodesByJob = new Map<string, { x: number; y: number }>();
  const stageNameByJob = new Map<string, string>();
  const laneNameByJob = new Map<string, string>();

  order.forEach((workflowIndex, lane) => {
    const workflow = workflows[workflowIndex];
    const y = lane * MAP_LANE_GAP;
    const sharedJobCount = [...jobIdsByWorkflow[workflowIndex]].filter(
      (jobId) => (lanesByJob.get(jobId)?.length ?? 0) > 1,
    ).length;

    const stages: MapStage[] = workflow.stages.map((stage, stageIndex) => {
      const x = MAP_X0 + stageIndex * MAP_SLOT_X;
      const jobs = getStageJobs(stage).map((job, jobIndex) => {
        const count = stage.jobs.length;
        const jobX =
          x + MAP_STAGE_W / 2 + (jobIndex - (count - 1) / 2) * MAP_JOB_SPREAD;
        const jobY = y + MAP_STAGE_H / 2 + 34;
        const node = { x: jobX, y: jobY };
        if (!nodesByJob.has(job.id)) nodesByJob.set(job.id, node);
        stageNameByJob.set(job.id, stage.name);
        laneNameByJob.set(job.id, workflow.name);
        return {
          id: job.id,
          name: job.name,
          duty: job.duty,
          hot: isHot(job.id),
          x: jobX,
          y: jobY,
          lane,
          shared: (lanesByJob.get(job.id)?.length ?? 0) > 1,
        };
      });
      return { id: stage.id, name: stage.name, x, y, jobs };
    });

    lanes.push({
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      stageCount: workflow.stages.length,
      jobCount: getWorkflowJobCount(workflow),
      industries: getWorkflowIndustries(workflow).map((category) => category.name),
      sharedCount: sharedJobCount,
      y,
      stages,
    });
  });

  // 换乘连线：同一个岗位在相邻车道的两个落点之间连一条
  const transfers: MapTransfer[] = [];
  const sharedJobs: MapSharedJob[] = [];
  for (const [jobId, laneIndexes] of lanesByJob) {
    if (laneIndexes.length < 2) continue;
    const sorted = [...laneIndexes].sort((a, b) => a - b);
    const points = sorted.map((lane) => {
      const job = lanes[lane].stages
        .flatMap((stage) => stage.jobs)
        .find((entry) => entry.id === jobId);
      return { lane, point: job ?? { x: 0, y: 0 } };
    });
    for (let i = 0; i < points.length - 1; i += 1) {
      const from = points[i];
      const to = points[i + 1];
      transfers.push({
        jobId,
        name: laneNameByJob.get(jobId) ?? jobId,
        from: { x: from.point.x, y: from.point.y, lane: from.lane, laneName: lanes[from.lane].name },
        to: { x: to.point.x, y: to.point.y, lane: to.lane, laneName: lanes[to.lane].name },
      });
    }
    sharedJobs.push({
      id: jobId,
      name:
        lanes[sorted[0]].stages
          .flatMap((stage) => stage.jobs)
          .find((job) => job.id === jobId)?.name ?? jobId,
      duty:
        lanes[sorted[0]].stages
          .flatMap((stage) => stage.jobs)
          .find((job) => job.id === jobId)?.duty ?? "",
      lanes: sorted.map((lane) => ({
        id: lanes[lane].id,
        name: lanes[lane].name,
        stageName: stageNameByJob.get(jobId) ?? "",
      })),
    });
  }

  return {
    lanes,
    transfers,
    sharedJobs,
    counts: {
      lanes: lanes.length,
      stages: lanes.reduce((sum, lane) => sum + lane.stageCount, 0),
      jobs: lanes.reduce((sum, lane) => sum + lane.jobCount, 0),
      sharedJobs: sharedJobs.length,
      transfers: transfers.length,
    },
  };
}
