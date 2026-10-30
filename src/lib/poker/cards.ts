// Card vocabulary shared by every tool. Everything in src/lib/poker/ stays free
// of UI dependencies; parsing, deck building and evaluation arrive in Stage 1.

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

export function cardRank(card: CardCode): Rank {
  return card[0] as Rank;
}

export function cardSuit(card: CardCode): Suit {
  return card[1] as Suit;
}

/** Full English card name, for example `Ace of spades`. */
export function cardName(card: CardCode): string {
  return `${RANK_NAMES[cardRank(card)]} of ${SUIT_NAMES[cardSuit(card)]}`;
}
