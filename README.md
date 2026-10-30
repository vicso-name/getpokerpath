# GetPokerPath

Interactive poker learning tools, trainers and calculators for US/English players. Built with Astro, React and TypeScript as a static site. It needs no backend, database, accounts or API keys.

The planned production origin is `https://getpokerpath.com`. Nothing is deployed yet.

## Requirements

- Node.js 22.23.4 or newer
- npm

## Getting started

```bash
npm install
npx playwright install chromium   # once, for the E2E tests
npm run dev                       # http://localhost:4321
```

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the local dev server |
| `npm run build` | Build the static site into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run check` | Type-check TypeScript and Astro files |
| `npm test` | Run the Vitest unit tests once |
| `npm run test:watch` | Run the unit tests in watch mode |
| `npm run test:e2e` | Build, serve and run the Playwright tests at 1280, 375 and 320px |

## Configuration

Copy `.env.example` to `.env` to override defaults. The only setting is `SITE_URL`, the origin used for canonical, Open Graph and structured-data URLs. It defaults to the planned production origin, and it is defined in one place: `astro.config.ts`.

## Project layout

```text
src/
  pages/            Routes. Only live pages belong here.
  layouts/          BaseLayout (site shell) and ToolLayout (tool page shell)
  components/       layout/, seo/, poker/, tools/
  lib/poker/        Poker rules and math. Pure TypeScript with no UI dependencies.
  lib/seo/          Metadata and structured-data builders
  lib/site/         Site constants and the tool registry
  lib/tools/        UI-free state for individual tools
  styles/           Design tokens and global CSS
  tests/            unit/ (Vitest) and e2e/ (Playwright)
data/seo-pages.json The approved 15-page URL map
docs/               Product, architecture, SEO and QA documents
```

## Publishing a tool

1. Build the page in `src/pages/<canonical-path>/index.astro` using `ToolLayout`. The path must match `data/seo-pages.json`.
2. Add its ID to `LIVE_TOOL_IDS` in `src/lib/site/tools.ts`. Navigation, Home, `/tools/` and related links update from that list.

A unit test fails if a route exists without being live, or a tool is live without a route. The registry covers Wave 1 tools only for now.

See `docs/IMPLEMENTATION_PLAN.md` for the stages and `docs/PROGRESS.md` for the current status.
