# GetPokerPath — Claude Code handoff

**Decision locked:** brand **GetPokerPath**, planned production domain **https://getpokerpath.com**, repository **getpokerpath**, Astro + React + TypeScript; English (US) audience. No WordPress or mandatory database for launch. This repository/package represents a **new independent product**, not an assignment to improve PokerSkill.com. PokerSkill is only a SERP competitor; never copy its assets, prose, code or branding.

## Read order for Claude Code

1. `CLAUDE.md` — authoritative implementation rules, constraints and definition of done.
2. `docs/PRODUCT_VISION.md` — goal, audience, differentiator and scope.
3. `docs/ARCHITECTURE.md` — rendering, code organization and test strategy.
4. `docs/MVP_WAVE_1.md` — build-ready scope of the **first three live tools**.
5. `docs/SEO_SITE_MAP.md` — 15 planned canonical URLs and SEO guardrails.
6. `docs/DESIGN_SYSTEM.md` — UX, styling, responsive layout and accessibility.
7. `docs/IMPLEMENTATION_PLAN.md` — bounded deliverables and checkpoints.
8. `docs/QA_CHECKLIST.md` — acceptance and regression checks.
9. `references/` — full research evidence, not an instruction to implement everything.

## Concrete initial deliverable

Create a working, testable Astro application foundation and **Wave 1 only**:
- P01 — `/poker-hand-rankings/` — interactive rankings and hand comparator;
- P05 — `/poker-positions/` — position learning / practice;
- P09 — `/poker-pot-odds-calculator/` — mathematical calculator with explanation.

Also create Home `/` and Tools index `/tools/`. Do not publish unfinished Wave 2–5 routes as thin or indexable stubs.

## Current decisions still open

- Brand and intended domain: **GetPokerPath** / **https://getpokerpath.com**. Logo and final colors remain open. Use a single `SITE_URL`/Astro site config, not hardcoded URL strings. The domain is not live until DNS and deployment are configured.
- User accounts, premium features, saved cloud progress: **not in Wave 1**.
- Hosting: Cloudflare or Vercel can be chosen after implementation; avoid provider-specific code until necessary.
- Exact UI palette is provisional; deliver readable, distinct, responsive design without copying competitor designs.

## Starting Claude Code

Place the contents of this package in the **root of an empty or dedicated project repo**. Open a terminal there, launch Claude Code, and paste `KICKOFF_PROMPT_FOR_CLAUDE.md`.

No API key is needed for local implementation. YepAPI research was already collected; do not rerun paid API calls.

## Public repository hygiene

The project is intended for the public GitHub repository `vicso-name/getpokerpath`. The bundled `.gitignore` protects environment files, credentials, build output, local Claude settings and purchased raw research spreadsheets/exports. Keep `CLAUDE.md`, `docs/*.md`, `data/seo-pages.json` and application source tracked. The local `references/*.xlsx` research file stays available to Claude Code on your Mac but is intentionally not tracked in this public repo. Never force-add secrets or raw research.

See `GITHUB_SETUP.md` to create the repository from your Mac and make the first commit.
