import type { CardCode } from './cards';
import type { HandCategory } from './evaluate';

export interface HandRanking {
  category: HandCategory;
  name: string;
  summary: string;
  example: readonly CardCode[];
  /** How many of the 2,598,960 distinct five-card hands fall in this category. */
  fiveCardCombos: number;
}

export const FIVE_CARD_HANDS = 2_598_960;

/** The ten hand categories, strongest first. Unit tests check every field. */
export const HAND_RANKINGS: readonly HandRanking[] = [
  {
    category: 'royal-flush',
    name: 'Royal Flush',
    summary: 'A, K, Q, J and 10 of one suit. It is simply the highest straight flush.',
    example: ['As', 'Ks', 'Qs', 'Js', 'Ts'],
    fiveCardCombos: 4,
  },
  {
    category: 'straight-flush',
    name: 'Straight Flush',
    summary: 'Five cards in a row, all of one suit. The higher top card wins.',
    example: ['9h', '8h', '7h', '6h', '5h'],
    fiveCardCombos: 36,
  },
  {
    category: 'four-of-a-kind',
    name: 'Four of a Kind',
    summary: 'All four cards of one rank, plus a kicker.',
    example: ['Qc', 'Qd', 'Qh', 'Qs', '7d'],
    fiveCardCombos: 624,
  },
  {
    category: 'full-house',
    name: 'Full House',
    summary: 'Three of one rank plus a pair of another. Compare the three first, then the pair.',
    example: ['Kc', 'Kd', 'Kh', '7c', '7s'],
    fiveCardCombos: 3_744,
  },
  {
    category: 'flush',
    name: 'Flush',
    summary: 'Five cards of one suit, not in a row. Compare from the highest card down.',
    example: ['Ad', 'Jd', '9d', '6d', '3d'],
    fiveCardCombos: 5_108,
  },
  {
    category: 'straight',
    name: 'Straight',
    summary: 'Five cards in a row, in mixed suits. The ace can be high or low, but never both.',
    example: ['Tc', '9d', '8h', '7s', '6c'],
    fiveCardCombos: 10_200,
  },
  {
    category: 'three-of-a-kind',
    name: 'Three of a Kind',
    summary: 'Three cards of one rank and two unrelated kickers.',
    example: ['8c', '8d', '8s', 'Kh', '4d'],
    fiveCardCombos: 54_912,
  },
  {
    category: 'two-pair',
    name: 'Two Pair',
    summary: 'Two different pairs and a kicker. Compare the top pair, then the second, then the kicker.',
    example: ['Jc', 'Jh', '5d', '5s', 'Ac'],
    fiveCardCombos: 123_552,
  },
  {
    category: 'pair',
    name: 'Pair',
    summary: 'Two cards of one rank and three kickers.',
    example: ['Tc', 'Th', 'Ad', '8s', '3c'],
    fiveCardCombos: 1_098_240,
  },
  {
    category: 'high-card',
    name: 'High Card',
    summary: 'None of the above. Compare from the highest card down.',
    example: ['Ah', 'Jc', '8d', '6s', '2c'],
    fiveCardCombos: 1_302_540,
  },
];

/** Share of all five-card hands, to three significant figures, for example `4.75%`. */
export function formatHandShare(combos: number): string {
  const percent = (combos / FIVE_CARD_HANDS) * 100;
  return `${percent.toLocaleString('en-US', {
    maximumSignificantDigits: 3,
    minimumSignificantDigits: 3,
  })}%`;
}
