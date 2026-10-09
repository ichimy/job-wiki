# Repository Guidelines

## Project Positioning

This project provides a panoramic view of the job landscape: which jobs exist, how they group into industries, and how one job can belong to several industries. It is **not** a job board. Do not add recruiting, application, resume, or outbound job-search links, and do not reintroduce any third-party platform's identifiers, codes, or URLs.

## Project Structure & Module Organization

- `index.html` — the whole view: markup, CSS, and the render/search/nav script.
- `data/jobs.json` — the single source of truth for all data.
- `scripts/build-data.py` — regenerates `data.js` from `data/jobs.json`.
- `data.js` — generated artifact loaded by the browser. Never edit it by hand.
- `assets/` — brand images.

Dataset: 28 industries, 161 groups, 848 jobs, 1098 category memberships. Job ids are `J0001`-style, categories `C07`, groups `C07-G02`.

## Build, Test, and Development Commands

No package manager or build system is required.

```sh
python3 -m http.server 8000    # preview at http://localhost:8000
python3 scripts/build-data.py  # regenerate data.js after editing jobs.json
```

Always rerun the build script after touching `data/jobs.json`, or the page will render stale data.

## Data Model

`jobs` holds each job once (`id`, `name`, `duty`). `categories[].groups[].jobs` holds arrays of job ids, so a job belonging to several industries is referenced, never duplicated. `hot` is a top-level list of job ids shown with a 热门 badge. Keep new fields on `jobs` entries so the record shape stays uniform.

## Coding Style & Naming Conventions

- 2-space indentation in HTML, JS, JSON, and Python.
- `data/jobs.json` is written with `json.dumps(..., ensure_ascii=False, indent=2)`; keep that formatting so diffs stay readable.
- Keep `index.html` dependency-free: vanilla ES5-style JS in one IIFE, inline CSS using the `--*` custom properties for theming.
- Escape all dynamic text through the existing `esc()` helper.
- Write Chinese for display names and content fields; keep ids and keys ASCII.

## Testing Guidelines

No automated test suite. After any data change, verify in the browser: search matches both `name` and `duty`, category chips and scroll-spy highlight correctly, 热门 badges appear, the theme toggle persists, and the header counts match `meta.counts` in `data/jobs.json`. Also confirm the page renders no outbound links.

## Commit & Pull Request Guidelines

Prefer short imperative subjects with a scope, e.g. `data: 补充新能源行业岗位`. Pull requests should state which industries or jobs changed, report the updated `meta.counts`, and include a screenshot for any `index.html` change.

## Security & Configuration Tips

No secrets or configuration files are needed. Keep the site free of external requests and outbound links to third-party sites.
