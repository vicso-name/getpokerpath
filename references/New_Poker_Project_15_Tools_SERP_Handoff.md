# NEW Poker Platform — Final SERP-informed first 15 tools

**Scope:** Independent US/EN poker education platform. PokerSkill.com is a competitor, not the site to promote.
**Evidence:** YepAPI US SERP snapshots from user-provided archive, 2026-10-30. 15 queries; organic rank positions as reported (SERP features may occupy other positions).

## Key competitor findings
- PokerSkill: #1 for `poker ranges` with an opening-range charts / PDF result; #8 for `poker hands ranked`; #10 for `what is a 3 bet in poker` in this snapshot.
- `poker odds calculator`: mixed equity and pot-odds results. Keep separate tasks and outputs on P02 vs P09; cross-link.
- `how to play poker` vs `texas holdem rules`: overlapping competitor URLs. Separate general guided lesson (P03) from mechanics simulator (P04).
- `preflop charts` vs `poker ranges`: keep immutable reviewed range presets on P06 and editable user-defined ranges on P07; monitor keyword cannibalization.
- `poker quiz`: genuine quizzes already rank; adaptive practice + meaningful explanations are essential.
- `poker bankroll calculator`: noisy result composition and low search volume. Lower SEO priority; preserve as a useful later tool.
- `icm poker`: mixed explanation and calculator results; make an educational interactive calculator, clarify model assumptions.
- `omaha poker odds calculator`: specialized established calculators. Start with correct PLO4, not unverified PLO5/6 support.

## Suggested release order
1. **P01 — Poker Hand Rankings Explorer** (Wave 1; M). Path: `/poker-hand-rankings/`. Engine: Hand evaluator, accessible card UI.
2. **P05 — Poker Positions Trainer** (Wave 1; S). Path: `/poker-positions/`. Engine: Table layout, seat taxonomy.
3. **P09 — Pot Odds Calculator** (Wave 1; S). Path: `/poker-pot-odds-calculator/`. Engine: Decimal arithmetic + clear input semantics.
4. **P03 — Learn Poker by Playing** (Wave 2; L). Path: `/how-to-play-poker/`. Engine: Lessons, legal-action state machine.
5. **P04 — Texas Hold'em Rules Simulator** (Wave 2; L). Path: `/texas-holdem-rules/`. Engine: Deal/betting state engine + card UI.
6. **P11 — Poker Quiz & Practice** (Wave 2; M). Path: `/poker-quiz/`. Engine: Verified question bank + learner state.
7. **P06 — Preflop Charts Explorer** (Wave 3; M). Path: `/preflop-charts/`. Engine: Range grid and reviewed datasets.
8. **P07 — Poker Range Builder** (Wave 3; M). Path: `/poker-ranges/`. Engine: 13×13 grid; 1326 combos; suit and weight controls.
9. **P08 — 3-Bet Trainer** (Wave 3; M). Path: `/poker-3-bet/`. Engine: Bet-sequence logic + scenario bank.
10. **P10 — Poker Outs Trainer** (Wave 4; M). Path: `/poker-outs/`. Engine: Card UI; outcome engine.
11. **P12 — Poker EV Calculator** (Wave 4; S). Path: `/poker-ev-calculator/`. Engine: Probability and payout formulas.
12. **P02 — Texas Hold'em Odds & Equity Calculator** (Wave 4; XL). Path: `/poker-odds-calculator/`. Engine: Trusted evaluator, enumeration/Monte Carlo, range weights.
13. **P13 — Poker Bankroll Calculator** (Wave 4; S). Path: `/poker-bankroll-calculator/`. Engine: Planner + variance assumptions.
14. **P14 — Poker ICM Calculator** (Wave 5; L). Path: `/icm-poker/`. Engine: ICM combinatorics/model checks.
15. **P15 — Omaha Odds Calculator** (Wave 5; XL). Path: `/omaha-poker-odds-calculator/`. Engine: Exactly 2 hole + 3 board, Omaha engine.

## Development acceptance rules
- Distinct URL/intents for chart vs builder; equity vs pot odds; broad guide vs Hold’em rules.
- Tool usable above the fold; HTML explanatory content and structured internal linking visible to search engines.
- Poker math/rules tested against deterministic golden cases; no unwarranted “GTO optimal” or guaranteed earning claims.
- Results are based on snippets and title fields, not functional competitor audits. Validate with live page inspection before asserting missing features.

Full audit: `New_Poker_Project_Final_15_Tools_SEO_SERP_Blueprint_2026-10-30.xlsx`.
