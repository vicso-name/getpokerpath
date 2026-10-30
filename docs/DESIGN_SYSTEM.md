# UX and design direction (initial, replaceable brand tokens)

## Visual direction

- Credible, contemporary **learning + analytical tool**, not a real-money casino lobby. Avoid decorative overload, flashing jackpots, or false reward urgency.
- Consistent card motifs, restrained felt/table-inspired accents, generous spacing, strong text contrast and a clear type scale.
- Brand name is **GetPokerPath**. Logo and final colors are **unconfirmed**. Use semantic tokens (`--color-brand`, `--color-surface`, `--color-focus`, etc.) so rebranding is easy; do not invent a permanent identity.
- Avoid copying layouts, typography, screenshots or assets from PokerSkill or other competitors.

## Shared components

- Page shell, Header, Footer, Breadcrumbs, SeoHead, ToolHero, ToolIntro, ToolHelp, FAQ, RelatedTools.
- CardFace, CardPicker, DeckValidationMessage, ResultSummary, ExplanationPanel, Reset/Example controls.
- Accessible Button, Input, Toggle, Radio group, numeric amount input and inline error message.
- Consistent success/error/neutral feedback; color must not be sole channel.

## Interaction

- Load a meaningful example state so visitors can understand the tool immediately, then easily reset.
- Explain **what changed**, **why**, and **what assumptions apply**, not only a number.
- On mobile, position calculator controls above long explanatory prose; card selection should work with touch and keyboard.
- Support zoom to 200%, narrow viewport down to 320–375px, and normal OS reduced-motion preferences.
- Responsive tool-first layout, readable table content and horizontally scrollable reference tables where necessary.

## Accessibility

- Semantic buttons for selectable cards/seats; ARIA labels include rank+suit or seat+position.
- Visible keyboard focus, no keyboard trap, results announced via polite live regions where suitable.
- Label all amount inputs; explain which pot/bet value is expected before calculation.
- Text labels alongside suits/colors; no red-vs-black-only distinctions or emoji-only actions.

## States to design

Initial example; editing selection; computed result; tie/split; invalid/duplicate card; no selection; disabled/unavailable option; small screen; keyboard focus. Do not ship the happy path only.
