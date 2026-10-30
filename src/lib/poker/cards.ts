// Card vocabulary shared by every tool. Everything in src/lib/poker/ stays free
// of UI dependencies.

export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'] as const;
export const SUITS = ['c', 'd', 'h', 's'] as const;

export type Rank = (typeof RANKS)[number];
export type Suit = (typeof SUITS)[number];
/** Rank followed by suit, for example `As` or `Td`. */
export type CardCode = `${Rank}${Suit}`;

export const RANK_NAMES: Record<Rank, string> = {
  '2': 'Two',
  '3': 'Three',
  '4': 'Four',
  '5': 'Five',
  '6': 'Six',
  '7': 'Seven',
  '8': 'Eight',
  '9': 'Nine',
  T: 'Ten',
  J: 'Jack',
  Q: 'Queen',
  K: 'King',
  A: 'Ace',
};

/** Plural rank names for hand descriptions, for example `Sixes`. */
export const RANK_PLURALS: Record<Rank, string> = {
  '2': 'Twos',
  '3': 'Threes',
  '4': 'Fours',
  '5': 'Fives',
  '6': 'Sixes',
  '7': 'Sevens',
  '8': 'Eights',
  '9': 'Nines',
  T: 'Tens',
  J: 'Jacks',
  Q: 'Queens',
  K: 'Kings',
  A: 'Aces',
};

export const SUIT_NAMES: Record<Suit, string> = {
  c: 'clubs',
  d: 'diamonds',
  h: 'hearts',
  s: 'spades',
};

/** Text-style suit glyphs; U+FE0E keeps phones from swapping in emoji. */
export const SUIT_SYMBOLS: Record<Suit, string> = {
  c: '♣︎',
  d: '♦︎',
  h: '♥︎',
  s: '♠︎',
};

const CARD_PATTERN = /^(10|[2-9TJQKA])([CDHS])$/i;

export class CardValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CardValidationError';
  }
}

export function isCardCode(value: unknown): value is CardCode {
  return (
    typeof value === 'string' &&
    value.length === 2 &&
    (RANKS as readonly string[]).includes(value[0]) &&
    (SUITS as readonly string[]).includes(value[1])
  );
}

/** Reads loose input such as `as`, `AS` or `10h` into a canonical card code. */
export function parseCard(text: string): CardCode {
  const match = CARD_PATTERN.exec(text.trim());
  if (!match) throw new CardValidationError(`Not a playing card: "${text}"`);
  const rank = match[1] === '10' ? 'T' : match[1].toUpperCase();
  return `${rank}${match[2].toLowerCase()}` as CardCode;
}

/** The cards that appear more than once, each listed a single time. */
export function findDuplicateCards(cards: readonly CardCode[]): CardCode[] {
  const seen = new Set<CardCode>();
  const duplicates = new Set<CardCode>();
  for (const card of cards) {
    if (seen.has(card)) duplicates.add(card);
    seen.add(card);
  }
  return [...duplicates];
}

/** Guards against malformed codes and the same physical card appearing twice. */
export function assertValidCards(cards: readonly CardCode[]): void {
  for (const card of cards) {
    if (!isCardCode(card)) throw new CardValidationError(`Not a playing card: "${String(card)}"`);
  }
  const duplicates = findDuplicateCards(cards);
  if (duplicates.length > 0) {
    throw new CardValidationError(`Duplicate cards: ${duplicates.join(', ')}`);
  }
}

/** A fresh 52-card deck in rank-then-suit order. */
export function createDeck(): CardCode[] {
  return RANKS.flatMap((rank) => SUITS.map((suit): CardCode => `${rank}${suit}`));
}

/** Fisher-Yates shuffle. Pass `random` for a reproducible order. */
export function shuffleDeck(random: () => number = Math.random): CardCode[] {
  const deck = createDeck();
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function cardRank(card: CardCode): Rank {
  return card[0] as Rank;
}

export function cardSuit(card: CardCode): Suit {
  return card[1] as Suit;
}

/** Numeric strength of a rank: two is 2 and ace is 14. */
export function rankValue(rank: Rank): number {
  return RANKS.indexOf(rank) + 2;
}

/** Inverse of `rankValue`. */
export function rankFromValue(value: number): Rank {
  return RANKS[value - 2];
}

/** Full English card name, for example `Ace of spades`. */
export function cardName(card: CardCode): string {
  return `${RANK_NAMES[cardRank(card)]} of ${SUIT_NAMES[cardSuit(card)]}`;
}

/** The rank as printed on a card face: `T` reads as `10`. */
export function cardRankLabel(card: CardCode): string {
  return cardRank(card) === 'T' ? '10' : cardRank(card);
}

/**
 * Name for a control showing a card face. It carries the printed rank so voice
 * control users can say what they see (WCAG 2.5.3), for example `King of hearts, K`.
 */
export function cardControlName(card: CardCode): string {
  return `${cardName(card)}, ${cardRankLabel(card)}`;
}
