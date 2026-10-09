#!/usr/bin/env python3
"""由 data/jobs.json 生成 data.js。

data/jobs.json 是唯一数据源，data.js 是给浏览器直接加载的构建产物（勿手工编辑）。
用法：python3 scripts/build-data.py
"""
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "data" / "jobs.json"
OUT = ROOT / "data.js"

data = json.loads(SRC.read_text(encoding="utf-8"))
OUT.write_text(
    "// 构建产物：由 scripts/build-data.py 从 data/jobs.json 生成，请勿手工编辑。\n"
    "window.JOB_DATA = " + json.dumps(data, ensure_ascii=False, indent=2) + ";\n",
    encoding="utf-8",
)

c = data["meta"]["counts"]
print(f"data.js 已更新：行业 {c['categories']} / 分组 {c['groups']} / 岗位 {c['jobs']} / 归属 {c['memberships']}")
