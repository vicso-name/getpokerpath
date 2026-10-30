# Implementation plan for Claude Code

Work in small **reviewable** stages. Report filenames, tests, what works and what does not at the end of each stage. Do not launch all 15 tools in one coding pass.

## Stage 0 — Project foundation

**Create** the Astro + React + TypeScript app, `BaseLayout`, home and tools directory, semantic design tokens, site navigation, SEO head helper, `/docs/PROGRESS.md`, base unit/E2E test setup, README local commands, `.gitignore` and `.env.example` (no actual keys).

**Done when:** local development works; `build` and type checks succeed; responsive Home/Tools pages display; published SEO metadata is structurally correct; no placeholder tool pages indexed.

## Stage 1 — Poker card domain and P01

**Create** card schema + uniqueness guard + evaluator + 5/7-card comparisons + unit fixtures, card picker, hand ranking explorer and original explanatory content.

**Done when:** golden tests and invalid states pass, UI works keyboard/mobile, SSR text and structured content are present, E2E test completes selection→result.

## Stage 2 — P05 Poker Positions Trainer

**Create** reusable table/seat component, 6-max/9-max mapping, dealer rotation, practice question generator, feedback and explanatory content.

**Done when:** blinds/positions are consistent, answer feedback is correct, mobile controls work and tests pass.

## Stage 3 — P09 Pot Odds Calculator

**Create** pure pot-odds function, typed numeric inputs, calculation explanation, examples, invalid state handling and content.

**Done when:** golden math cases pass exactly to expected display precision, no double counting, E2E interaction works.

## Stage 4 — Launch readiness

**Create** cross-links, sitemap/robots scoped to live routes, preview-friendly SEO tags, accessibility pass, mobile QA and analytics adapter (no event spam). Document deployment steps but **do not deploy** without user instruction.

**Done when:** tests + checks + production build run successfully; no broken links, fake content or unimplemented public routes; security/secrets and content proofread; remaining issues listed in `docs/PROGRESS.md`.

## Stage 5 — Later (do not start without approval)

P03 guided learning, P04 Hold'em simulator, P11 quiz (Wave 2); P06/07/08 range system (Wave 3); P10/P12/P02/P13 (Wave 4); P14/P15 (Wave 5). Specific details are in the research Excel. Complex mathematical tools need their own reviewed engineering specs before work starts.

## Engineering decisions to record

- Chosen card evaluator strategy/dependency and how its accuracy was verified.
- Treatment of 5-card versus 7-card user flows in P01.
- Position naming conventions for different table sizes.
- Numeric precision, rounding and definitions for P09.
- Analytics strategy and cookie/privacy choices if tracking is added.
- Deployment adapter and domain only after user approval.
