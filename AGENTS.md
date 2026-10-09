# Repository Guidelines

## Project Positioning

This project provides a panoramic view of the job landscape: which jobs exist, how they group into industries, and how one job can belong to several industries. It is **not** a job board. Do not add recruiting, application, resume, or outbound job-search links, and do not reintroduce any third-party platform's identifiers, codes, or URLs.

## Project Structure & Module Organization

- `data/jobs.json` — the single source of truth for all data.
- `lib/data.ts` — typed access layer; imports `data/jobs.json`, builds indexes at module load, and serves every page. Server-only: never import it from a `"use client"` component (it would pull the whole dataset into the browser bundle). Pass plain props from a server component instead.
- `lib/nav.ts` — small serializable nav payloads handed to client components.
- `app/` — App Router pages: `/`, `/c/[categoryId]`, `/job/[jobId]`, `/workflow/[workflowId]`, plus `sitemap.ts`, `robots.ts`, `icon.svg`.
- `components/` — page-level pieces; `components/ui/` holds shadcn/ui (Base UI style) primitives. Keep generated primitives close to upstream and put layout choices in the page-level components.
- `scripts/check-data.mts` — validates `data/jobs.json` and derives `relations` / `meta.counts`.
- `scripts/build-search-index.mts` — generates `public/search-index.json` for the ⌘K palette.
- `public/` — static assets. `search-index.json` is generated, not committed.

Dataset: 28 industries, 161 groups, 848 jobs, 1098 category memberships. Job ids are `J0001`-style, categories `C07`, groups `C07-G02`.

## Build, Test, and Development Commands

```sh
pnpm install                  # dependencies (Node 22.18+ / 24)
pnpm dev                      # preview at http://localhost:3000
pnpm data:check               # validate jobs.json, assert relations + counts
pnpm data:sync                # rewrite relations + counts from workflows
pnpm data:index               # regenerate public/search-index.json (runs on predev/prebuild)
pnpm lint                     # eslint
pnpm typecheck                # tsc --noEmit
pnpm build                    # production build
pnpm test:e2e                 # Playwright smoke tests (builds and starts the app)
```

Always rerun `pnpm data:sync` after editing `workflows`, and `pnpm data:check` before committing data changes.

## Data Model

`jobs` holds each job once (`id`, `name`, `duty`). `categories[].groups[].jobs` holds arrays of job ids, so a job belonging to several industries is referenced, never duplicated. `hot` is a top-level list of job ids shown with a 热门 badge. Keep new fields on `jobs` entries so the record shape stays uniform.

`workflows` describes collaboration chains: each has ordered `stages`, and each stage lists the job ids that work in it. A job must appear in at most one stage per workflow. `relations` holds the delivery edges between adjacent stages and is a **generated field** — `scripts/check-data.mts` rewrites it from `workflows`, so author changes in `workflows` and never hand-edit `relations`.

## Coding Style & Naming Conventions

- 2-space indentation in TS/TSX/JSON.
- `data/jobs.json` is written with `JSON.stringify(data, null, 2)`; keep that formatting so diffs stay readable.
- Server components by default; add `"use client"` only where interaction demands it (search, theme, filters, shadcn primitives).
- Style with Tailwind utility classes and the shadcn tokens defined in `app/globals.css` (`bg-card`, `text-muted-foreground`, `ring-border/70`, …). Avoid new hex colours outside the token block.
- Write Chinese for display names and content fields; keep ids and keys ASCII.
- Every route is statically prerendered via `generateStaticParams` + `dynamicParams = false`; keep params as raw ids (`C01`, `J0001`, `W01`) with no slugs or pinyin.

## Testing Guidelines

`tests/smoke.spec.ts` (Playwright, chromium) is the gate: homepage counts, industry filtering, job upstream/downstream/peers, workflow stage order, ⌘K search navigation, theme persistence, and a check that no page links out to a third party. Add a case there when you change a route's contract.

Beyond the suite, verify visually at 1280 / 768 / 375 px in both themes, and confirm the header counts still match `meta.counts` in `data/jobs.json`.

## Commit & Pull Request Guidelines

Prefer short imperative subjects with a scope, e.g. `data: 补充新能源行业岗位`. Pull requests should state which industries or jobs changed, report the updated `meta.counts`, and include a screenshot for any visual change.

## Security & Configuration Tips

No secrets are needed in the repo. Keep the site free of external requests and outbound links to third-party sites; the only external URL is the canonical site origin in `lib/site.ts` (`NEXT_PUBLIC_SITE_URL` overrides it on Vercel).

Vercel Web Analytics and Speed Insights are wired in `app/layout.tsx` and render only when `VERCEL_ENV === "production"`, so production gets same-origin observability scripts (`/_vercel/insights/*`, `/_vercel/speed-insights/*`) while local and preview runs load nothing — their development mode would otherwise call `va.vercel-scripts.com`.

Next.js 16 has breaking changes versus older conventions; before writing framework code, check the bundled docs under `node_modules/next/dist/docs/`.
