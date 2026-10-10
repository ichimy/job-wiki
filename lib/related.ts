import { getJobs } from "@/lib/data";

/**
 * 职责文本相近的岗位。
 *
 * 依据只有一条：`duty` 的字符二元组 TF-IDF 余弦相似度。它回答的是「这两段职责描述
 * 用词接近」，**不代表岗位等价、更不代表要求相同**；页面必须把这句话写出来。
 * 848 篇 × 848 篇的朴素比较在构建期跑一次，之后按 job id 命中缓存。
 */
export interface RelatedJob {
  id: string;
  score: number;
}

const DEFAULT_LIMIT = 5;
const MIN_SCORE = 0.05;

let index: Map<string, RelatedJob[]> | null = null;

function bigrams(text: string) {
  const clean = text.replace(/\s+/g, "");
  const grams: string[] = [];
  for (let i = 0; i < clean.length - 1; i += 1) grams.push(clean.slice(i, i + 2));
  return grams;
}

function buildIndex() {
  const jobs = getJobs();
  const documentFrequency = new Map<string, number>();
  const termFrequencies: Map<string, number>[] = [];

  for (const job of jobs) {
    const counts = new Map<string, number>();
    for (const gram of bigrams(job.duty)) {
      counts.set(gram, (counts.get(gram) ?? 0) + 1);
    }
    termFrequencies.push(counts);
    for (const gram of counts.keys()) {
      documentFrequency.set(gram, (documentFrequency.get(gram) ?? 0) + 1);
    }
  }

  const total = jobs.length;
  const vectors = termFrequencies.map((counts) => {
    const vector = new Map<string, number>();
    for (const [gram, count] of counts) {
      const idf = Math.log(total / (1 + (documentFrequency.get(gram) ?? 0)));
      vector.set(gram, (1 + Math.log(count)) * idf);
    }
    return vector;
  });
  const norms = vectors.map((vector) => {
    let sum = 0;
    for (const value of vector.values()) sum += value * value;
    return Math.sqrt(sum) || 1;
  });

  const result = new Map<string, RelatedJob[]>();
  for (let i = 0; i < jobs.length; i += 1) {
    const a = vectors[i];
    const neighbors: RelatedJob[] = [];
    for (let k = 0; k < jobs.length; k += 1) {
      if (k === i) continue;
      const b = vectors[k];
      const [small, large] = a.size <= b.size ? [a, b] : [b, a];
      let dot = 0;
      for (const [gram, weight] of small) {
        const other = large.get(gram);
        if (other !== undefined) dot += weight * other;
      }
      if (dot <= 0) continue;
      const score = dot / (norms[i] * norms[k]);
      if (score >= MIN_SCORE) neighbors.push({ id: jobs[k].id, score });
    }
    neighbors.sort((x, y) => y.score - x.score || x.id.localeCompare(y.id));
    result.set(jobs[i].id, neighbors.slice(0, DEFAULT_LIMIT));
  }
  return result;
}

export function getRelatedJobs(jobId: string): RelatedJob[] {
  if (!index) index = buildIndex();
  return index.get(jobId) ?? [];
}
