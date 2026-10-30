import {
  CardValidationError,
  RANK_NAMES,
  RANK_PLURALS,
  assertValidCards,
  cardRank,
  cardSuit,
  rankFromValue,
  rankValue,
  type CardCode,
} from './cards';

/** Every hand category, weakest first, so an index doubles as its strength. */
export const HAND_CATEGORIES = [
  'high-card',
  'pair',
  'two-pair',
  'three-of-a-kind',
  'straight',
  'flush',
  'full-house',
  'four-of-a-kind',
  'straight-flush',
  'royal-flush',
] as const;

export type HandCategory = (typeof HAND_CATEGORIES)[number];

export const CATEGORY_NAMES: Record<HandCategory, string> = {
  'high-card': 'High Card',
  pair: 'Pair',
  'two-pair': 'Two Pair',
  'three-of-a-kind': 'Three of a Kind',
  straight: 'Straight',
  flush: 'Flush',
  'full-house': 'Full House',
  'four-of-a-kind': 'Four of a Kind',
  'straight-flush': 'Straight Flush',
  'royal-flush': 'Royal Flush',
};

export interface EvaluatedHand {
  category: HandCategory;
  /** Index into HAND_CATEGORIES; higher wins. */
  strength: number;
  /**
   * Rank values compared left to right when categories match: the defining
   * ranks first, then kickers. A wheel's top card is 5, because its ace plays low.
   */
  tiebreak: readonly number[];
  /** The five cards, defining ranks first, then kickers from high to low. */
  cards: readonly CardCode[];
  /** Plain-English description, for example `Full House, Kings full of Sevens`. */
  description: string;
}

const WHEEL_VALUES = [14, 5, 4, 3, 2];
const ACE_VALUE = 14;

/** Top card of a straight, or null. `values` must be sorted high to low. */
function straightTopCard(values: readonly number[]): number | null {
  if (new Set(values).size !== 5) return null;
  if (values[0] - values[4] === 4) return values[0];
  return values.every((value, index) => value === WHEEL_VALUES[index]) ? 5 : null;
}

function describe(category: HandCategory, tiebreak: readonly number[]): string {
  const name = (value: number) => RANK_NAMES[rankFromValue(value)];
  const plural = (value: number) => RANK_PLURALS[rankFromValue(value)];
  const [first, second] = tiebreak;

  switch (category) {
    case 'royal-flush':
      return 'Royal Flush';
    case 'straight-flush':
      return `Straight Flush, ${name(first)}-high`;
    case 'four-of-a-kind':
      return `Four of a Kind, ${plural(first)}`;
    case 'full-house':
      return `Full House, ${plural(first)} full of ${plural(second)}`;
    case 'flush':
      return `Flush, ${name(first)}-high`;
    case 'straight':
      return `Straight, ${name(first)}-high`;
    case 'three-of-a-kind':
      return `Three of a Kind, ${plural(first)}`;
    case 'two-pair':
      return `Two Pair, ${plural(first)} and ${plural(second)}`;
    case 'pair':
      return `Pair of ${plural(first)}`;
    case 'high-card':
      return `High Card, ${name(first)}`;
  }
}

function classify(
  groups: readonly (readonly [value: number, count: number])[],
  values: readonly number[],
  isFlush: boolean,
): { category: HandCategory; tiebreak: number[] } {
  const groupValues = groups.map(([value]) => value);
  const shape = groups.map(([, count]) => count).join('');
  const straightTop = straightTopCard(values);

  if (isFlush && straightTop === ACE_VALUE) {
    return { category: 'royal-flush', tiebreak: [ACE_VALUE] };
  }
  if (isFlush && straightTop !== null) {
    return { category: 'straight-flush', tiebreak: [straightTop] };
  }
  if (shape === '41') return { category: 'four-of-a-kind', tiebreak: groupValues };
  if (shape === '32') return { category: 'full-house', tiebreak: groupValues };
  if (isFlush) return { category: 'flush', tiebreak: [...values] };
  if (straightTop !== null) return { category: 'straight', tiebreak: [straightTop] };
  if (shape === '311') return { category: 'three-of-a-kind', tiebreak: groupValues };
  if (shape === '221') return { category: 'two-pair', tiebreak: groupValues };
  if (shape === '2111') return { category: 'pair', tiebreak: groupValues };
  return { category: 'high-card', tiebreak: [...values] };
}

/** Evaluates exactly five already-validated cards. */
function evaluateValidFive(cards: readonly CardCode[]): EvaluatedHand {
  const counts = new Map<number, number>();
  for (const card of cards) {
    const value = rankValue(cardRank(card));
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  const groups = [...counts].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const values = cards.map((card) => rankValue(cardRank(card))).sort((a, b) => b - a);
  const isFlush = cards.every((card) => cardSuit(card) === cardSuit(cards[0]));
  const { category, tiebreak } = classify(groups, values, isFlush);

  // Display order follows the groups, except the wheel's ace, which plays low.
  const isWheel = tiebreak.length === 1 && tiebreak[0] === 5;
  const order = isWheel ? WHEEL_VALUES.slice(1).concat(ACE_VALUE) : groups.map(([value]) => value);
  const ordered = [...cards].sort(
    (a, b) =>
      order.indexOf(rankValue(cardRank(a))) - order.indexOf(rankValue(cardRank(b))) ||
      cardSuit(a).localeCompare(cardSuit(b)),
  );

  return {
    category,
    strength: HAND_CATEGORIES.indexOf(category),
    tiebreak,
    cards: ordered,
    description: describe(category, tiebreak),
  };
}

/** Evaluates a five-card hand. */
export function evaluateFive(cards: readonly CardCode[]): EvaluatedHand {
  if (cards.length !== 5) {
    throw new CardValidationError(`A poker hand needs exactly 5 cards, got ${cards.length}`);
  }
  assertValidCards(cards);
  return evaluateValidFive(cards);
}

/** Orders two hands: positive when `a` wins, negative when `b` wins, 0 for a tie. */
export function compareHands(a: EvaluatedHand, b: EvaluatedHand): number {
  if (a.strength !== b.strength) return a.strength - b.strength;
  for (let i = 0; i < a.tiebreak.length; i += 1) {
    if (a.tiebreak[i] !== b.tiebreak[i]) return a.tiebreak[i] - b.tiebreak[i];
  }
  return 0;
}

/** Yields every five-card subset of `cards`: C(5,5)=1, C(6,5)=6 or C(7,5)=21. */
function* fiveCardSubsets(cards: readonly CardCode[]): Generator<CardCode[]> {
  const n = cards.length;
  for (let a = 0; a < n - 4; a += 1) {
    for (let b = a + 1; b < n - 3; b += 1) {
      for (let c = b + 1; c < n - 2; c += 1) {
        for (let d = c + 1; d < n - 1; d += 1) {
          for (let e = d + 1; e < n; e += 1) {
            yield [cards[a], cards[b], cards[c], cards[d], cards[e]];
          }
        }
      }
    }
  }
}

/** Finds the strongest five-card hand within five, six or seven cards. */
export function evaluateBest(cards: readonly CardCode[]): EvaluatedHand {
  if (cards.length < 5 || cards.length > 7) {
    throw new CardValidationError(`Best-hand evaluation needs 5 to 7 cards, got ${cards.length}`);
  }
  assertValidCards(cards);

  // Sorting first means equal-value subsets resolve the same way for any input order.
  const sorted = [...cards].sort((a, b) => b.localeCompare(a));
  let best: EvaluatedHand | null = null;
  for (const subset of fiveCardSubsets(sorted)) {
    const hand = evaluateValidFive(subset);
    if (best === null || compareHands(hand, best) > 0) best = hand;
  }
  return best as EvaluatedHand;
}
