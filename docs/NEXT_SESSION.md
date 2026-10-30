# Next session

Handoff written at the end of 2026-10-30. Read this with `CLAUDE.md` and `docs/PROGRESS.md`.

**Start with Stage 3.5: UI/UX Design Sprint.** It has not been started, and it needs approval before work begins. It changes how the tools look and read. **Don't rework the current functionality.**

Stage 3.5 isn't in `docs/IMPLEMENTATION_PLAN.md` yet. It sits between Stage 3 and Stage 4.

## Where things stand

The three Wave 1 tools work and are on `origin/main`. Nothing has been deployed, and DNS and hosting are not set up.

| ID | Tool | URL |
| --- | --- | --- |
| P01 | Poker Hand Rankings Explorer | `/poker-hand-rankings/` |
| P05 | Poker Positions Trainer | `/poker-positions/` |
| P09 | Pot Odds Calculator | `/poker-pot-odds-calculator/` |

Other routes: `/`, `/tools/` and the 404 page. The planned origin is `https://getpokerpath.com`, set through `SITE_URL`.

## Stack

- Astro 7 for static pages, React 19 islands for the tools, TypeScript 6.
- Vitest for unit tests. Playwright with axe for E2E, in Chromium at 1280, 375 and 320px.
- CSS modules and tokens in `src/styles/tokens.css`. No Tailwind, web fonts or dark mode.
- No backend, login, database or analytics.

```bash
npm run dev
npm run check
npm test
npm run build
npm run test:e2e
```

## Architecture decisions

- **Domain layer:** `src/lib/poker/` is pure TypeScript with no UI imports. A guard test enforces this.
- **Tool state:** `src/lib/tools/` holds each tool's UI-free reducer or form logic, with its own tests.
- **Positions:** `src/lib/poker/positions.ts` is the only source of position data. A guard test fails if another file defines a position list.
- **Page copy:** worked examples, charts and tables are generated from the engines at build time, so copy can't drift from the rules.
- **Publishing:** adding an ID to `LIVE_TOOL_IDS` in `src/lib/site/tools.ts` publishes a tool to the navigation, Home, `/tools/` and related links. Links never point to unbuilt routes.
- **Rendering:** every tool page renders its first state and all its explanatory text as HTML, and works as reference content without JavaScript.
- **P09 amounts:** whole hundredths of a chip, so decimals carry no binary rounding error. Values are rounded only for display.
- **P09 calls smaller than the bet:** the calculator gives no number until it knows the reason, because the same amounts can mean different things. The reasoning is in `docs/PROGRESS.md`.

## Shared components

| Area | Components |
| --- | --- |
| Layout | `BaseLayout`, `ToolLayout`, `SiteHeader`, `SiteFooter`, `Breadcrumbs`, `SeoHead` |
| UI | `SegmentedControl`, plus global `.button`, `.button--secondary`, `.tool-panel`, `.visually-hidden` |
| Poker | `CardFace`, `CardPicker`, `PokerTable`, `ActingOrder` |
| Tool pages | `Faq`, `RelatedTools`, `ToolCard`, `HandRankingChart`, `ShowdownExample`, `PositionChart` |

Field, error and result styles in P09 and the result panels in P01 and P05 are still local to each tool. These are the obvious candidates for Design System V2.

## Known technical limits

- **Dependencies:** TypeScript stays on 6.x until `@astrojs/check` supports 7.
- **Browsers:** tested in Chromium only.
- **Tooling:** no CI and no linter.
- **E2E server:** Playwright reuses anything already listening on `127.0.0.1:4321`, so a dev server bound there would be tested instead of the production build. Stop it before `npm run test:e2e`.
- **Agents:** `astro preview` needs `--ignore-lock` under coding agents.
- **P01:** the evaluator suits a UI, but a future equity engine (P02) needs something faster.
- **P05:** heads-up is in the model and the page text, but isn't a table option. Scores aren't saved.
- **P09:** 2 decimal places and 1,000,000,000 per field. There is no estimated equity field and no shareable URL.
- **Header:** at 320px the navigation wraps onto a second row, which pushes the tools down.

## Before public launch

**Content and SEO**

- [ ] Human proofread of all page text and FAQ answers.
- [ ] Validate titles and descriptions against live SERP snippets.
- [ ] Add `sitemap.xml` and `robots.txt` for live routes only.
- [ ] Add an OG image.
- [ ] Confirm canonical URLs on the real domain.

**Quality**

- [ ] Test on real iOS Safari and Android Chrome.
- [ ] Test with VoiceOver, and with NVDA or JAWS.
- [ ] Add other desktop browsers to the test run.
- [ ] Check 200% zoom and reduced motion by hand.
- [ ] Add CI and a linter.
- [ ] Work through `docs/QA_CHECKLIST.md`.

**Decisions for the owner**

- [ ] Logo, final palette and hosting.
- [ ] Analytics and any cookie or privacy choices.
- [ ] Whether to rewrite Git history for `references/New_Poker_Project_15_Tools_SERP_Handoff.md`. It is ignored and not in the current tree, but it stays in the public history at `4b83e0a`. Don't rewrite history without explicit permission.

## Stage 3.5 plan

### 1. UI/UX audit

Review the current site at 1280, 375 and 320px, using the real tools rather than assumptions.

- Hierarchy, spacing, type scale and consistency across the three tools.
- How quickly each tool can be reached and understood on a phone.
- Every state: example, editing, result, error, empty, small screen, keyboard focus.
- The header at 320px and the height above each tool.
- Write up findings ranked by user impact, with screenshots.

### 2. Design System V2

- Extend `tokens.css` for color, type, spacing and elevation, and keep semantic names so rebranding stays easy.
- Define shared patterns for fields, errors, result panels, explanation steps and example controls.
- The logo and palette are unconfirmed, so don't present any direction as final brand identity.
- Follow `docs/DESIGN_SYSTEM.md`: a credible learning tool, not a casino lobby. Don't copy competitors.

### 3. Pot Odds Calculator redesign prototype

- P09 goes first because it has the fewest parts and the most form states, so it tests the new patterns well.
- Prototype it, review it with the owner, and only then apply anything to P01 or P05.
- Keep every state: empty, invalid, call larger than the bet, the reason question, no-number all-ins and rounded results.
- Keep the break-even assumptions next to the result.

### Guardrails

- Don't change `src/lib/poker/` or the logic in `src/lib/tools/`.
- Don't add tools, routes or Stage 4 work, and don't change the 15 canonical paths.
- Keep accessible names and `data-testid` values, since E2E tests depend on them. If a change needs a test update, the behavior must stay the same.
- All four checks must stay green. Don't commit, push or deploy without permission.
