// Form logic and wording for the P09 calculator. Pure and UI-free; every number
// comes from lib/poker/potOdds.
import {
  MAX_CHIPS,
  calculatePotOdds,
  formatChips,
  formatPercent,
  formatRatio,
  parseChips,
  type ChipParse,
  type PotOddsResult,
  type ShortCallReason,
} from '../poker/potOdds';

export type PotOddsField = 'pot' | 'bet' | 'call';
export type PotOddsFields = Record<PotOddsField, string>;

export const EMPTY_FIELDS: PotOddsFields = { pot: '', bet: '', call: '' };

export const SHORT_CALL_OPTIONS: readonly { value: ShortCallReason; label: string; hint: string }[] = [
  {
    value: 'chips-in',
    label: 'The whole bet is in play: I already have chips in this round, or more than one opponent has bet',
    hint: 'Uses your amounts as entered.',
  },
  {
    value: 'all-in',
    label: 'I’m all-in for less, against one opponent, with no chips in this round yet',
    hint: 'The part of the bet you can’t match goes back to them.',
  },
  {
    value: 'all-in-other',
    label: 'Any other all-in for less',
    hint: 'For example, two or more opponents and a side pot.',
  },
];

export interface PotOddsExample {
  label: string;
  fields: PotOddsFields;
  shortCall: ShortCallReason | null;
}

export const POT_ODDS_EXAMPLES: readonly PotOddsExample[] = [
  { label: 'Half-pot bet', fields: { pot: '100', bet: '50', call: '50' }, shortCall: null },
  { label: 'Pot-size bet', fields: { pot: '100', bet: '100', call: '100' }, shortCall: null },
  { label: 'Facing a raise', fields: { pot: '120', bet: '60', call: '40' }, shortCall: 'chips-in' },
  { label: 'All-in for less', fields: { pot: '100', bet: '100', call: '40' }, shortCall: 'all-in' },
];

export const LIMITS_NOTE = `Use any one unit: chips, dollars or big blinds. Amounts go up to ${MAX_CHIPS.toLocaleString('en-US')}, with up to 2 decimal places.`;

const CHIP_ERRORS: Record<Exclude<Extract<ChipParse, { ok: false }>['error'], 'empty'>, string> = {
  'not-a-number': 'Enter a number, like 50 or 12.50.',
  negative: 'Amounts can’t be negative.',
  'too-precise': 'Use at most 2 decimal places.',
  'too-large': `Enter ${MAX_CHIPS.toLocaleString('en-US')} or less.`,
};

const MESSAGES = {
  incomplete: 'Enter all three amounts to see the result.',
  fixAmounts: 'Fix the highlighted amount to see the result.',
  emptyPot: 'All three amounts are 0, so there is no pot to work out. Enter the pot and the bet.',
  nothingToCall: 'The amount to call is 0, so staying in costs nothing and needs no equity.',
  callExceedsBet: 'Your call can’t be more than the bet. Chips you already put in belong in the pot.',
  noBet: 'The bet is 0, so there is nothing to call. Enter the opponent’s chips as the bet, not in the pot.',
  needsReason: 'Your call is smaller than the bet. Choose why below, because it changes the answer.',
  unknownWinnablePot:
    'One number from these amounts could be wrong, because you can only win the chips you match and side pots don’t count. Enter the pot you can win as the pot. For the bet, add up the chips you can match from each opponent, counting any you already put in this round. Then choose the first option.',
} as const;

export interface PotOddsView {
  errors: Record<PotOddsField, string | null>;
  /** True when the call is smaller than the bet, so the reason question applies. */
  asksReason: boolean;
  result: PotOddsResult | null;
  /** What to do next when there is no result. */
  message: string;
  announcement: string;
}

function fieldError(parsed: ChipParse): string | null {
  return parsed.ok || parsed.error === 'empty' ? null : CHIP_ERRORS[parsed.error];
}

function withoutResult(
  errors: PotOddsView['errors'],
  message: string,
  asksReason = false,
): PotOddsView {
  return { errors, asksReason, result: null, message, announcement: message };
}

export function evaluateForm(fields: PotOddsFields, shortCall: ShortCallReason | null): PotOddsView {
  const pot = parseChips(fields.pot);
  const bet = parseChips(fields.bet);
  const call = parseChips(fields.call);
  const errors = { pot: fieldError(pot), bet: fieldError(bet), call: fieldError(call) };

  if (errors.pot || errors.bet || errors.call) return withoutResult(errors, MESSAGES.fixAmounts);
  if (!pot.ok || !bet.ok || !call.ok) return withoutResult(errors, MESSAGES.incomplete);

  const outcome = calculatePotOdds({ pot: pot.units, bet: bet.units, call: call.units, shortCall });
  switch (outcome.status) {
    case 'ok': {
      const { requiredEquity, finalPot, ratio } = outcome;
      return {
        errors,
        asksReason: outcome.call < outcome.bet,
        result: outcome,
        message: '',
        announcement: `Required equity ${formatPercent(requiredEquity)}. Final pot ${formatChips(finalPot)}. Pot odds ${formatRatio(ratio)}.`,
      };
    }
    case 'empty-pot':
      return withoutResult(errors, MESSAGES.emptyPot);
    case 'nothing-to-call':
      return withoutResult(errors, MESSAGES.nothingToCall);
    case 'call-exceeds-bet': {
      const message = bet.units === 0 ? MESSAGES.noBet : MESSAGES.callExceedsBet;
      return withoutResult({ ...errors, call: message }, MESSAGES.fixAmounts);
    }
    case 'needs-reason':
      return withoutResult(errors, MESSAGES.needsReason, true);
    case 'unknown-winnable-pot':
      return withoutResult(errors, MESSAGES.unknownWinnablePot, true);
    case 'invalid-amount':
      return withoutResult(errors, MESSAGES.fixAmounts);
  }
}

export interface PotOddsExplanation {
  /** The formula with the actual amounts in place. */
  equation: string;
  /** Present only when part of the bet goes back to the opponent. */
  refundNote: string | null;
  steps: readonly { title: string; working: string }[];
  summary: string;
}

/** Shows `≈` instead of `=` when the displayed value is rounded. */
const equals = (exact: boolean) => (exact ? '=' : '≈');

export function explainResult(result: PotOddsResult): PotOddsExplanation {
  const { pot, bet, call, matchedBet, returnedBet, potToWin, finalPot, requiredEquity, ratio } = result;
  const [P, B, C] = [pot, matchedBet, call].map(formatChips);
  const [win, final] = [potToWin, finalPot].map(formatChips);
  const percent = formatPercent(requiredEquity);
  const percentEquals = equals(requiredEquity.exact);

  return {
    equation: `${C} ÷ (${P} + ${B} + ${C}) ${percentEquals} ${percent}`,
    refundNote:
      returnedBet > 0
        ? `You can match only ${C} of the ${formatChips(bet)} bet, so the other ${formatChips(returnedBet)} goes back to your opponent and isn’t part of the pot you can win.`
        : null,
    steps: [
      { title: 'Add the bet to the pot', working: `${P} + ${B} = ${win}` },
      { title: 'Add your call to get the final pot', working: `${win} + ${C} = ${final}` },
      { title: 'Divide your call by the final pot', working: `${C} ÷ ${final} ${percentEquals} ${percent}` },
      {
        title: 'Compare what you can win with what you pay',
        working: `${win} to ${C} ${equals(ratio.exact)} ${formatRatio(ratio)}`,
      },
    ],
    summary: `You need to win the pot at least ${percent} of the time for this call to break even.`,
  };
}
