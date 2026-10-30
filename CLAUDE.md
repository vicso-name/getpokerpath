# Claude Code — engineering contract

You are implementing **GetPokerPath**, a new English-language poker education product for the US market. Planned canonical site: `https://getpokerpath.com`, repository: `getpokerpath`. Keep the URL configurable and do not claim deployment/DNS is live. Use the documents in `/docs` and the research in `/references`. **This project is not PokerSkill.com**; do not reference its name in public copy except if explicitly needed for a comparison.

## Fixed technical decisions

- Astro: SEO-first pages and static/pre-rendered HTML wherever possible.
- React + TypeScript: interactive islands and reusable UI components.
- Pure TypeScript domain layer: poker rules, evaluation, position logic, pot-odds calculations; **independent of React**.
- No WordPress, mandatory login, database, payment processing or backend dependency for Wave 1.
- Keep raw paid keyword spreadsheets and SERP exports out of the public repository; follow `.gitignore` and the `GITHUB_SETUP.md` security check before committing.
- Markdown/MDX and Astro content collections for editorial material if appropriate.
- Use current stable compatible dependency versions rather than guessing version numbers.
- Prefer minimal dependencies; state the reason for every nontrivial dependency.

## Strict scope

1. Implement the foundation and Wave 1: P01, P05, P09 plus `/` and `/tools/`.
2. Preserve the approved 15-page taxonomy for later waves; **do not build all 15 now**.
3. Do not ship broken/static fakes of functionality, or pretend future tools already exist.
4. Do not modify the 15 canonical paths without recording the reason and asking for approval.
5. Do not deploy, buy services, connect accounts, spend API credits, or commit/push to a remote without explicit approval.
6. Do not request credentials in prompts or put secrets in the repository.

## Workflow

- First inspect the existing repo; if empty, initialize it. Summarize exact changed files and commands.
- Work in small validated milestones from `docs/IMPLEMENTATION_PLAN.md`.
- Prefer a clear working implementation over a speculative abstraction or elaborate architecture.
- Add deterministic unit tests for poker math and rules **before declaring a tool complete**.
- Check `npm run build`, unit tests and relevant E2E checks; report actual runs and failures honestly.
- Keep a concise `docs/PROGRESS.md`: implemented, tests run, unresolved issues, next recommended step.
- Do not invent validated search rankings or guarantee SEO traffic. YepAPI volumes/KD are directional estimates.

## Core quality gates

- Unique 52-card deck; no duplicate cards across hands/board; correct 5- and 7-card hand comparisons with tie-breaks.
- Position labels/BTN/blind movement consistent, including heads-up BTN=small blind.
- Correct pot-odds semantics and math, with divide-by-zero and invalid input states handled.
- Mobile interaction, keyboard access, clear focus, screen-reader announcements.
- Real indexable explanatory HTML and H1 for published tool pages; React enhances, not replaces, their value.
- Metadata: unique title, description, canonical when a real domain is configured, internal links, sitemap and robots on deployment.
- No competitor material plagiarism, fabricated testimonials or unsupported 'GTO optimal' claims.

## Sources of truth when docs conflict

1. User's explicit instructions in conversation / current task.
2. This `CLAUDE.md` and the scope/acceptance in `docs/MVP_WAVE_1.md`.
3. `/docs` implementation and SEO guidance.
4. `references/New_Poker_Project_Final_15_Tools_SEO_SERP_Blueprint_2026-10-30.xlsx` as the comprehensive research ledger.

The Excel roadmap sometimes says 'Sprint 1' for later tools; use the *release waves* and current Wave 1 scope instead. Treat SEO titles and rankings as hypotheses to confirm, not specifications of already-launched pages.
