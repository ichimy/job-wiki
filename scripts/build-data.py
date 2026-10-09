#!/usr/bin/env python3
"""校验 data/jobs.json，派生协作关系边，并生成 data.js。

data/jobs.json 是唯一数据源。其中 workflows 是手工维护的协作链路，
relations（岗位之间的交付边）由本脚本从 workflows 派生后写回，属于生成字段：
改完 workflows 跑一次本脚本即可，不需要手工同步。

用法：python3 scripts/build-data.py
"""
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "data" / "jobs.json"
OUT = ROOT / "data.js"

data = json.loads(SRC.read_text(encoding="utf-8"))
jobs = data["jobs"]
categories = data["categories"]
workflows = data.get("workflows") or []

errors = []

# ---------- 校验岗位与分类 ----------
ids = [j["id"] for j in jobs]
if len(ids) != len(set(ids)):
    errors.append("岗位 id 有重复")
job_ids = set(ids)
cat_ids = {c["id"] for c in categories}

seen_job = set()
for c in categories:
    for g in c["groups"]:
        for jid in g["jobs"]:
            if jid not in job_ids:
                errors.append(f"分类 {c['id']} 分组 {g['id']} 引用了不存在的岗位 {jid}")
            seen_job.add(jid)
orphans = job_ids - seen_job
if orphans:
    errors.append(f"{len(orphans)} 个岗位未被任何分类引用，例如 {sorted(orphans)[:3]}")

# ---------- 校验协作链路 ----------
wf_ids, stage_ids = set(), set()
for w in workflows:
    if w["id"] in wf_ids:
        errors.append(f"链路 id 重复: {w['id']}")
    wf_ids.add(w["id"])
    for cid in w["industries"]:
        if cid not in cat_ids:
            errors.append(f"{w['id']} 引用了不存在的分类 {cid}")
    placed = set()
    for s in w["stages"]:
        if s["id"] in stage_ids:
            errors.append(f"阶段 id 重复: {s['id']}")
        stage_ids.add(s["id"])
        if not s["jobs"]:
            errors.append(f"{s['id']} 阶段没有任何岗位")
        for jid in s["jobs"]:
            if jid not in job_ids:
                errors.append(f"{s['id']} 引用了不存在的岗位 {jid}")
            if jid in placed:
                errors.append(f"{w['id']} 中岗位 {jid} 出现在多个阶段")
            placed.add(jid)

if errors:
    print("校验未通过：")
    for e in errors:
        print("  -", e)
    sys.exit(1)

# ---------- 派生关系边：相邻阶段之间为「交付」关系 ----------
relations, seen_edge = [], set()
for w in workflows:
    for a, b in zip(w["stages"], w["stages"][1:]):
        for src in a["jobs"]:
            for dst in b["jobs"]:
                key = (src, dst, w["id"])
                if key in seen_edge:
                    continue
                seen_edge.add(key)
                relations.append({
                    "from": src, "to": dst, "workflow": w["id"], "type": "handoff",
                })

changed = data.get("relations") != relations
data["relations"] = relations

rel_jobs = {e["from"] for e in relations} | {e["to"] for e in relations}
wf_jobs = {j for w in workflows for s in w["stages"] for j in s["jobs"]}
data["meta"]["counts"].update({
    "workflows": len(workflows),
    "relations": len(relations),
    "jobsInWorkflows": len(wf_jobs),
})

SRC.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

# ---------- 生成浏览器加载的产物 ----------
OUT.write_text(
    "// 构建产物：由 scripts/build-data.py 从 data/jobs.json 生成，请勿手工编辑。\n"
    "window.JOB_DATA = " + json.dumps(data, ensure_ascii=False, indent=2) + ";\n",
    encoding="utf-8",
)

c = data["meta"]["counts"]
print(f"relations: {'已更新' if changed else '无变化'}（{c['relations']} 条边）")
print(f"行业 {c['categories']} / 分组 {c['groups']} / 岗位 {c['jobs']} / 归属 {c['memberships']}")
print(f"协作链路 {c['workflows']} 条，覆盖岗位 {c['jobsInWorkflows']} 个（{len(rel_jobs)} 个岗位有交付关系）")
