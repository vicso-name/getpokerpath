# Product vision and launch PRD

## Problem and value proposition

Most visitors who search how to play poker, compare poker hands or calculate pot odds want an **answer they can interact with**. Build an educational platform where users can learn and check rules through functional tools, not pages filled with SEO text. Accuracy and clear teaching are the competitive advantage.

## Audience

- English-speaking users, initially focused on US search demand.
- Beginners learning hand strengths, positions, basic math and game mechanics.
- Improving casual players who want lightweight, trustworthy training aids.

## Product principles

1. Tool immediately visible and usable near the top of the page.
2. Plain-English teaching and worked examples below and around the tool.
3. Shared poker UI and math engine: fix a bug once, all tools benefit.
4. Fast, usable on phone, no login gate for essential functionality.
5. Explicit definitions and assumptions; no ambiguous metrics or invented optimal strategy.
6. Content designed for genuine help, not artificial keyword repetition.

## Locked scope

**Wave 1:** Home, tool directory, P01 hand rankings explorer, P05 poker positions trainer, P09 pot odds calculator. SEO text, navigation, tests and analytics hooks (without requiring an analytics key) are included.

**Later, not in Wave 1:** Full equity calculator, preflop range builder, playable tutorials, preflop charts, ICM, Omaha, bankroll planner, quizzes, profiles, subscriptions.

**Non-goals:** real-money gambling, gambling account integration, betting/payment flows, guarantees of profits, game multiplayer, server-side solver, social community.

## Qualitative success criteria

- A novice can use each Wave 1 tool without registration or an external tutorial.
- All critical rule/maths examples are verified by deterministic tests.
- Every published page offers independent practical usefulness plus clear SEO/crawlable HTML.
- Tools work on mobile and accept keyboard input where practical.

## Measurements to instrument (once analytics is configured)

- `tool_view` (tool ID), `tool_start`, `tool_result`, `tool_error`, `practice_answer` and `share_click` where applicable.
- Record non-sensitive event metadata only; no card/session-level user identifiers by default.
- Track organic landing pages, tool-start rate, completion rate, and return visits; do not equate Keyword Volume with predicted visitors.

## Positioning guardrails

PokerSkill.com is a competitor mentioned only in research. Build fresh educational copy, original interface, tested logic and custom illustrations/assets. No copying of competitor screenshots or content into production.
