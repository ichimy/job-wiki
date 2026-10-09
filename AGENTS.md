# Repository Guidelines

## Project Structure & Module Organization

This is a dependency-free static site ("职位导航") that lists about 1,098 job positions across 28 categories and links out to zhipin.com searches.

- `index.html` — the whole UI: markup, CSS, and the render/search/nav script.
- `data.js` — runtime data bundle defining `window.JOB_DATA`, loaded via `<script src="data.js">`.
- `categories/NN-名称.json` — per-category source records, numbered `01`–`28` (e.g. `categories/02-互联网-AI.json`).
- `assets/` — brand images (`logo.svg`, `logo.png`).

Record schema: `{ name, hidden, hot[], groups: [{ name, positions: [{ code, cityCode, name, href, duty }] }] }`. `cityCode` is `101280600`; `hot` entries drive the 热门 badge; `hidden` is currently reserved and unused by `index.html`.

## Build, Test, and Development Commands

There is no build step, bundler, or package manager. Open `index.html` directly, or serve the repository root so relative paths resolve cleanly:

```sh
python3 -m http.server 8000   # then visit http://localhost:8000
```

Content changes must be applied in both places: `categories/*.json` (source) and `data.js` (runtime bundle). No generator keeps them in sync, so verify counts after editing.

## Coding Style & Naming Conventions

- Use 2-space indentation in HTML, JS, and JSON; keep trailing commas in `data.js` to match existing style.
- Use Chinese display names with ASCII `code` values. Name category files `NN-名称.json` with a zero-padded index.
- Keep `index.html` dependency-free: vanilla ES5-style JS inside an IIFE, inline CSS using the `--*` custom properties for light/dark theming.
- Escape dynamic text through the existing `esc()` helper. Build links as `/c<cityCode>-p<code>/`; the render layer prefixes `https://www.zhipin.com`.

## Testing Guidelines

No automated tests exist. Verify manually in a browser: search matches `name` and `duty`, category chips and scroll-spy highlight correctly, 热门 tags appear, the theme toggle persists via `localStorage`, and the total entry count still matches the `duty` count (1,098).

## Commit & Pull Request Guidelines

This directory is not a Git repository, so there is no commit history to follow. If version control is added, prefer short imperative subjects with a scope, e.g. `data: 补充 02 互联网/AI 岗位`. Pull requests should list affected categories, report updated counts, and include screenshots for `index.html` changes.

## Security & Configuration Tips

No secrets or config files are needed. External links must keep `target="_blank"` with `rel="noopener"`.
