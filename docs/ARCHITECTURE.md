# Architecture — Astro + React + TypeScript

## Runtime and rendering

- Astro generates SEO-ready page shells, explanatory text, breadcrumbs and internal links.
- React islands hydrate only UI that needs interaction (`client:load` for immediately interactive above-the-fold tools; `client:visible` for nonessential below-the-fold demos).
- The poker/rules domain layer is a set of framework-independent TypeScript functions; no UI dependencies in `src/lib/poker/`.
- Static hosting for Wave 1. Do not introduce a server or database merely to calculate local inputs.
- Avoid heavy simulation libraries in Wave 1. Future exact equity/Monte Carlo computation belongs behind a swappable engine/Web Worker boundary.

## Proposed repository structure

```text
src/
  layouts/BaseLayout.astro
  pages/index.astro
  pages/tools/index.astro
  pages/poker-hand-rankings/index.astro
  pages/poker-positions/index.astro
  pages/poker-pot-odds-calculator/index.astro
  components/ui/             # accessible reusable UI primitives
  components/poker/          # Card, CardPicker, Table, HandResult
  components/tools/          # React islands for P01/P05/P09
  lib/poker/cards.ts         # card IDs, 52-card deck, validation
  lib/poker/evaluate.ts      # compare 5-card hands, best-of-7
  lib/poker/positions.ts     # seat mapping / dealer button
  lib/poker/potOdds.ts       # pure, validated calculation
  lib/seo/                   # metadata / breadcrumbs helpers
  styles/
  content/                   # editorial content if needed
  tests/unit/
  tests/e2e/
docs/PROGRESS.md
```

This is a starting point, not an excuse for excessive abstraction. Adapt to actual Astro conventions.

## Core data contracts

- Card code: rank `2..9,T,J,Q,K,A` + suit `c,d,h,s` (example: `As`, `Td`); parse/validate once.
- Evaluator should return category, comparable rank tuple, selected five cards, display explanation. Use lexicographic ranks for kickers and tiebreakers; evaluate `C(7,5)=21` combinations for a 7-card hand (or a proven equivalent implementation).
- Avoid floating input parsing ambiguity: validate chips as finite nonnegative numbers; define maximum input/precision limits visibly; compute percentage only on valid denominator.
- Position trainer data: player count, BTN index, blinds, seat names, prompt, correct answer, feedback. Heads-up rule differs from 6/9-max.
- Shareable user state: validated compact URL query parameters when useful, never secrets or sensitive IDs.

## Editorial and SEO pipeline

- Pages are statically generated with meaningful visible H1, introduction, how-to, examples, FAQ and related internal links.
- Unique `<title>`, description, Open Graph and canonical derived from central site config / `SITE_URL`. The approved production origin is `https://getpokerpath.com`; deployment/DNS are not yet configured.
- XML sitemap for **published** pages only; robots.txt in launch configuration.
- Avoid duplicate routes, thin placeholder pages and keyword stuffing.
- Structured data: `BreadcrumbList` or suitable `WebPage` where genuine; `WebApplication` only if applicable. Never fake review ratings.

## State, styling and deployment

- Wave 1 does not require auth or persistence. Optional localStorage for user preferences with safe fallback.
- Use reusable design tokens and mobile-first responsive CSS. Tailwind CSS is acceptable if it saves time, but do not couple poker logic to styles.
- Deployment candidate: Cloudflare or Vercel; keep implementation portable. GitHub-based CI should run type checks, tests, lint and build.
- For analytics, support optional environment-based integration; no inline secret keys or external trackers without configuration.

## Tests and maintainability

- Vitest for pure poker functions; Playwright for major UI paths and mobile interactions.
- Tests for duplicate cards, wheel straight, kicker/split, heads-up positions, calculation boundaries and invalid inputs.
- Default scripts: `dev`, `build`, `check`, `test`, `test:e2e` (document exact commands in README).
- Prefer explicit dependency installation after deciding what is necessary; do not guess versions.
