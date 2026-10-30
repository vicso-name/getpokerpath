// Pot odds math. Amounts are whole hundredths of a chip, so 0.1 + 0.2 is exactly
// 0.3 here and nothing is rounded until a result is formatted for display.

/** Largest amount accepted for a single field, in chips. */
export const MAX_CHIPS = 1_000_000_000;

const UNITS_PER_CHIP = 100;
const MAX_UNITS = MAX_CHIPS * UNITS_PER_CHIP;

export type ChipError = 'empty' | 'not-a-number' | 'negative' | 'too-precise' | 'too-large';

export type ChipParse = { ok: true; units: number } | { ok: false; error: ChipError };

/** Reads typed text as an amount. Accepts `1,000.50`, `.5` and `5.`, but never `1e3`. */
export function parseChips(text: string): ChipParse {
  const value = text.trim();
  if (value === '') return { ok: false, error: 'empty' };
  if (/^[-−]\s*(\d|\.\d)/.test(value)) return { ok: false, error: 'negative' };

  const plain = /^\d{1,3}(,\d{3})+(\.\d*)?$/.test(value) ? value.replaceAll(',', '') : value;
  const match = /^(\d*)\.?(\d*)$/.exec(plain);
  if (!match || match[1] + match[2] === '') return { ok: false, error: 'not-a-number' };

  const [, whole, fraction] = match;
  const cents = fraction.replace(/0+$/, '');
  if (cents.length > 2) return { ok: false, error: 'too-precise' };

  const units = Number(whole || '0') * UNITS_PER_CHIP + Number(cents.padEnd(2, '0'));
  if (units > MAX_UNITS) return { ok: false, error: 'too-large' };
  return { ok: true, units };
}

/**
 * Why a call is smaller than the bet, which the three amounts alone can't show:
 * - `chips-in`: the player already has chips in this round, or several opponents
 *   put chips in. Every chip entered can be won, so the amounts stand as entered.
 * - `all-in`: all-in for less against one opponent, with no chips in this round yet.
 *   The call then matches exactly its own size, and the opponent takes back the rest.
 * - `all-in-other`: any other all-in for less, such as a side pot. How much can be won
 *   depends on amounts this calculator doesn't have.
 */
export type ShortCallReason = 'chips-in' | 'all-in' | 'all-in-other';

export interface PotOddsInput {
  /** Pot before the opponent's bet, including any chips the player already put in. */
  pot: number;
  /** Chips opponents added to that pot. */
  bet: number;
  /** What the player still has to pay. */
  call: number;
  /** Needed only when the call is smaller than the bet. */
  shortCall?: ShortCallReason | null;
}

/** A quotient in hundredths, rounded half up. `exact` is false if rounding changed it. */
export interface RoundedValue {
  hundredths: number;
  exact: boolean;
}

export interface PotOddsResult {
  status: 'ok';
  pot: number;
  bet: number;
  call: number;
  /** Part of the bet the call can win. Equal to `bet` unless the player is all-in for less. */
  matchedBet: number;
  /** Part of the bet that goes back to the opponent. */
  returnedBet: number;
  /** Chips the call can win: the pot plus the matched bet. */
  potToWin: number;
  /** Pot once the call is in. */
  finalPot: number;
  requiredEquity: RoundedValue;
  /** Chips to win for each chip paid, the first number of a `3:1` ratio. */
  ratio: RoundedValue;
}

export type PotOddsOutcome =
  | PotOddsResult
  /** An amount was negative, fractional beyond hundredths, too large, NaN or infinite. */
  | { status: 'invalid-amount' }
  /** Every amount is zero, so the formula has no valid denominator. */
  | { status: 'empty-pot' }
  | { status: 'nothing-to-call' }
  /** The bet is what the player answers, so the call can't be larger. */
  | { status: 'call-exceeds-bet' }
  | { status: 'needs-reason' }
  /** The entered amounts don't show how much can be won, so any number could be wrong. */
  | { status: 'unknown-winnable-pot' };

function divide(numerator: number, denominator: number): RoundedValue {
  const scaled = numerator * 100;
  const quotient = Math.floor(scaled / denominator);
  const remainder = scaled - quotient * denominator;
  return {
    hundredths: remainder * 2 >= denominator ? quotient + 1 : quotient,
    exact: remainder === 0,
  };
}

function isValidAmount(units: number): boolean {
  return Number.isSafeInteger(units) && units >= 0 && units <= MAX_UNITS;
}

/** Break-even equity for an immediate call: C / (P + B + C). */
export function calculatePotOdds({ pot, bet, call, shortCall }: PotOddsInput): PotOddsOutcome {
  if (![pot, bet, call].every(isValidAmount)) return { status: 'invalid-amount' };
  if (pot + bet + call === 0) return { status: 'empty-pot' };
  if (call === 0) return { status: 'nothing-to-call' };
  if (call > bet) return { status: 'call-exceeds-bet' };

  const isShort = call < bet;
  if (isShort && !shortCall) return { status: 'needs-reason' };
  if (isShort && shortCall === 'all-in-other') return { status: 'unknown-winnable-pot' };

  const matchedBet = isShort && shortCall === 'all-in' ? call : bet;
  const potToWin = pot + matchedBet;
  const finalPot = potToWin + call;
  return {
    status: 'ok',
    pot,
    bet,
    call,
    matchedBet,
    returnedBet: bet - matchedBet,
    potToWin,
    finalPot,
    requiredEquity: divide(call * 100, finalPot),
    ratio: divide(potToWin, call),
  };
}

const twoDecimals = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

export function formatChips(units: number): string {
  return twoDecimals.format(units / UNITS_PER_CHIP);
}

export function formatPercent({ hundredths }: RoundedValue): string {
  return hundredths === 0 ? 'under 0.01%' : `${twoDecimals.format(hundredths / 100)}%`;
}

export function formatRatio({ hundredths }: RoundedValue): string {
  return `${twoDecimals.format(hundredths / 100)}:1`;
}
