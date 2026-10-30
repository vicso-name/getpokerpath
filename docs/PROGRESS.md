# Development progress

Status: **Stage 0 complete, awaiting approval to start Stage 1.** No tools are live. Nothing has been committed, pushed or deployed.

## Completed

- Locked Astro + React + TypeScript for MVP.
- Approved initial URL taxonomy and Wave 1 scope.
- Produced research/SEO/engineering handoff documents.

## Stage 0 — done

- [x] Astro 7 + React 19 + strict TypeScript project, static output, `trailingSlash: 'always'`.
- [x] `BaseLayout` (skip link, header, footer) and `ToolLayout` (breadcrumbs, H1, tool area above prose, FAQ, related tools).
- [x] Home, `/tools/` and a noindex 404 page.
- [x] Semantic design tokens (`src/styles/tokens.css`) and global CSS. The palette is provisional.
- [x] SEO: `SeoHead`, `buildSeoMeta`, BreadcrumbList and WebSite JSON-LD, with one origin set from `SITE_URL`.
- [x] Tool registry (`src/lib/site/tools.ts`): `LIVE_TOOL_IDS` is the single switch for publishing to nav, Home, `/tools/` and related links.
- [x] Poker domain skeleton (`src/lib/poker/cards.ts`): rank, suit and card-code contract, names and symbols. `CardFace` renders it.
- [x] Vitest and Playwright setup, `README.md`, `.env.example`.

## Last validation (2026-10-30, Node 26.12.1, npm 11.20.0)

| Command | Result |
| --- | --- |
| `npm run check` | 0 errors, 0 warnings, 0 hints |
| `npm test` | 28 passed |
| `npm run build` | 3 static pages built |
| `npm run test:e2e` | 48 passed (16 tests at each of 1280, 375 and 320px; Chromium only) |
| `npm install` | 0 vulnerabilities reported |

E2E covers metadata, canonical URLs, noindex, JSON-LD validity, no-JS rendering, axe accessibility scan, horizontal overflow, internal links, skip link, 404 behavior, and every unpublished canonical path returning 404.

One-off checks in a throwaway copy, not kept in the repo:

- `npm ci` from a clean copy, and `astro dev` serving `/` and `/tools/` with 200 and an unbuilt tool with 404.
- With all three tools switched live on temporary pages: `ToolLayout` rendered, a `client:load` React island hydrated and responded to a click, related links dropped an unpublished tool, and `/tools/` became indexable. The full E2E suite also passed in that state.
- Mutation checks: a stub route without a live ID fails the unit guard, and a live ID outside the plan fails it too.
- Home and Tools screenshots reviewed by eye at 1280, 375 and 320px.

## Decisions recorded

- **Dependencies.** Runtime: `astro`, `@astrojs/react`, `react`, `react-dom` (the fixed stack). Dev: `@astrojs/check` and `typescript` (the `check` script), `vitest` (unit tests), `@playwright/test` (E2E), `@axe-core/playwright` (automated accessibility gate on every page), `@types/*` (typing).
- **TypeScript is held at 6.x.** `@astrojs/check` 0.9.12 supports `^5 || ^6`, not TypeScript 7.
- **No Tailwind, no web fonts, no dark mode.** Plain CSS with tokens and system fonts keeps dependencies and third-party requests at zero. The light palette is the only one to verify while colors are provisional.
- **`/tools/` is noindex while no tool is live**, then becomes indexable automatically. An empty directory is thin content.
- **Home and `/tools/` list the three Wave 1 tools as plain text marked "In development", with no links**, until each one ships. Later-wave tools are not mentioned on the site.
- **React is SSR-only so far.** `CardFace` renders to HTML, so Home, Tools and 404 load no executable scripts. The build still emits an unreferenced React client bundle in `dist/_astro/`.
- **Tests live in `src/tests/`**, as `docs/ARCHITECTURE.md` proposes.
- **`npm run preview` under Playwright uses `--ignore-lock`.** Astro 7 otherwise detaches the preview server when it detects a coding agent, which Playwright reads as a crash.

## Unresolved

- **Deferred to Stage 4, per the plan:** sitemap, `robots.txt`, OG image, analytics adapter.
- **Not set up:** CI and a linter. `docs/ARCHITECTURE.md` expects CI to run lint, but Stage 0 does not list them.
- **Open for Stage 1:** `docs/MVP_WAVE_1.md` says "no duplicate suits/ranks". This is read as no duplicate rank+suit card, because a flush needs repeated suits and a pair needs repeated ranks.
- **Before going public:** `references/New_Poker_Project_15_Tools_SERP_Handoff.md` is tracked and names a competitor. `GITHUB_SETUP.md` asks for a manual review of `references/*.md` before publishing.
- Logo, final palette, hosting and domain go-live remain open.

## Next

Start Stage 1 on approval: card parsing and uniqueness guard, deck, 5- and 7-card evaluator with golden tests, card picker, and P01.
