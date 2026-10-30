# Wave 1 build specification — P01 / P05 / P09

Wave 1 consists of **three finished, useful, indexable tools**, plus homepage and `/tools/` directory. All visible content must be original English appropriate for US audiences. Scope is a genuine product implementation, not a static design demo.

## P01 — Poker Hand Rankings Explorer

- **Canonical path:** `/poker-hand-rankings/`
- **Primary query:** `poker hands ranked` (YepAPI US approx. 135,000/mo; KD 16; estimates, not traffic forecast).
- **User story:** I can see every hand ranking, select cards, understand which hand wins and why.
- **Immediate UI:** visual ranking list from royal flush (as highest straight flush) through high card; an accessible card picker and two-hand comparison mode.
- **Minimum real interaction:** compare two valid 5-card hands; optionally set 2 hole cards per player + 5 community cards to compare best 5 of 7. Prefer both workflows if feasible without delaying quality.
- **Output:** winning hand, hand category, relevant five cards, precise kicker/tie-break explanation, tie/split state.
- **Constraints:** same physical card cannot be selected twice; no duplicate suits/ranks; clear/reset/random example; deterministic results.
- **Acceptance golden tests:** straight flush beats quads; flush beats straight; A-2-3-4-5 is a five-high straight; A-2-3-4-5 loses to 2-3-4-5-6; two pair compares higher pair then lower pair then kicker; pair kickers work; full house correctly ranks 3+2; ties on shared board; selecting 7 cards chooses best 5.
- **SEO content:** ranking chart, kicker rules, what beats what, FAQ, links to P05 and P09. Do not spawn a duplicate cheat sheet URL in Wave 1.

## P05 — Poker Positions Trainer

- **Canonical path:** `/poker-positions/`
- **Primary query:** `poker positions` (US approx. 3,600/mo; KD 5).
- **User story:** I can view a poker table, identify my position and practice where button / blinds / common seats are.
- **Immediate UI:** responsive table with 6-max and 9-max presets, dealer button, small blind and big blind; clicking seats highlights the position and explains its relevance.
- **Practice mode:** prompt to identify a target position; user picks a seat, gets instant corrective feedback and can rotate button between rounds.
- **Acceptance:** correct clockwise movement and blind placement; heads-up may be an additional preset only if implemented correctly (BTN is SB); seat labels defined in one centralized mapping; a complete practice round works on 375px screens and via keyboard.
- **SEO content:** explained role of button, blinds, early/middle/late position; table illustrations with text equivalents; link to P01 and `/tools/`.
- **Accuracy note:** labels such as LJ/HJ/UTG vary by table size; document chosen conventions and never mislabel blinds as normal acting order.

## P09 — Pot Odds Calculator

- **Canonical path:** `/poker-pot-odds-calculator/`
- **Primary query:** `how to calculate pot odds` (US approx. 260/mo; KD 12).
- **User story:** I can enter a pot and a bet, immediately see the required break-even equity to call, and understand the arithmetic.
- **Input model:** P = pot **before** the current opponent bet, B = the current opponent bet added to that pot, C = additional amount the user must call. In the straightforward single-opponent example, C=B.
- **Formula:** break-even equity = `C / (P + B + C) * 100%`, provided denominator > 0 and all quantities are valid. Display this equation with the actual entered values.
- **Examples:** P=100, B=50, C=50 ⇒ 25%; P=100, B=100, C=100 ⇒ 33.333…%; P=0, B=0, C=0 ⇒ no valid percentage; reject negative/NaN/Infinity.
- **Output:** percent required for an immediate call, total pot after call, concise explanation of what this does and does not mean. Optional user-estimated equity input can explain comparison, but must not invent hand equity.
- **Acceptance:** correct rounding/display, consistent terminology, responsive sliders or inputs with explicit labels, accessible live result, reset/sample scenario.
- **SEO content:** explanation of formula and assumptions; worked examples; difference between pot odds vs hand/equity odds; links to future P02 only once P02 is actually published (or describe it without broken link).

## Shared UX and business rules

- No login and no fake success metrics or gambling predictions.
- Every tool must have an example input, an explicit explanation of the result, keyboard focus states, and safe handling of empty/invalid input.
- The homepage and tools directory link to all **three live** tools only. Future pages stay in documentation until implemented.
- Tool above the fold where reasonably possible, indexable supporting content below, breadcrumb navigation and contextual cross-links.
- Add meaningful component/unit tests and at least one E2E interaction per tool.

## Non-negotiable release gate

Do not mark P01/P05/P09 complete until correctness tests, mobile usability, accessibility basics, and production build all pass. A screenshot or demo animation is not sufficient.
