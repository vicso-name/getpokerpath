# Release QA and acceptance checklist

## Build health

- [ ] Astro project builds without errors and TypeScript checks pass.
- [ ] All relevant unit tests pass; major tools have working Playwright E2E tests.
- [ ] App works in a clean environment using README commands and no secrets.
- [ ] No backend, auth or fake third-party API is required for Wave 1.

## P01 — hand evaluation

- [ ] Unique deck validation; prevent duplicate physical cards in one scenario.
- [ ] Ranking hierarchy tested from straight flush through high card.
- [ ] Ace-low straight A-2-3-4-5 evaluated as 5-high.
- [ ] Kicker comparison and multi-step two-pair comparison verified.
- [ ] Full-house determination checked with two triples in 7-card scenarios.
- [ ] 7→5 best hand selection and split/tie cases verified.
- [ ] Accessible card names and selection affordances.

## P05 — positions

- [ ] BTN, SB and BB assigned correctly for 6-max/9-max.
- [ ] BTN rotation increments and position naming is consistent.
- [ ] Heads-up, if shipped, correctly places BTN as SB.
- [ ] Practice question answer and feedback correct.
- [ ] Mobile seat labels remain legible and tappable.

## P09 — pot odds

- [ ] Explicit definition of P, B, C; no double counting of the current bet.
- [ ] 100+50+50 example ⇒ required 25%.
- [ ] 100+100+100 example ⇒ required 33.33…%.
- [ ] All-zero input gets an explanation, not NaN/Infinity.
- [ ] Negative, empty, nonfinite or huge invalid inputs handled safely.
- [ ] 'Pot odds' not falsely presented as hand equity or guaranteed profitability.

## Accessibility and responsive

- [ ] H1, headings, forms, and landmarks are semantic; buttons are real buttons.
- [ ] Cards/seats reachable with keyboard and have descriptive names.
- [ ] Focus visible; results/errors conveyed by text and appropriate announcements.
- [ ] 320/375px layout works without unusable horizontal overflow.
- [ ] Reduced motion honored; no intrusive animation.

## SEO and launch

- [ ] Unique titles, meta descriptions, one H1 each, meaningful indexable English text.
- [ ] Canonicals use an approved production domain; no placeholder URLs.
- [ ] Sitemap only contains working published pages; robots sensible.
- [ ] Internal links to existing pages; no premature links to unbuilt Wave 2+ routes.
- [ ] Any structured data accurately describes visible content.
- [ ] Images/assets have rights to use; no copied competitor content.

## Final check

- [ ] `docs/PROGRESS.md` documents completed work, test commands/results and outstanding tasks.
- [ ] No deployment or use of paid APIs without explicit approval.
