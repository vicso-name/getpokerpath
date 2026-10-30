import { describe, expect, it } from 'vitest';
import {
  RANKS,
  SUITS,
  SUIT_SYMBOLS,
  cardName,
  cardRank,
  cardSuit,
  type CardCode,
} from '../../lib/poker/cards';

describe('card vocabulary', () => {
  it('defines 13 ranks and 4 suits, giving 52 distinct codes', () => {
    const codes = RANKS.flatMap((rank) => SUITS.map((suit) => `${rank}${suit}`));
    expect(new Set(codes).size).toBe(52);
  });

  it('orders ranks from two up to ace', () => {
    expect(RANKS[0]).toBe('2');
    expect(RANKS.at(-1)).toBe('A');
  });

  it('splits a card code into rank and suit', () => {
    expect(cardRank('Td')).toBe('T');
    expect(cardSuit('Td')).toBe('d');
  });

  it.each<[CardCode, string]>([
    ['As', 'Ace of spades'],
    ['Td', 'Ten of diamonds'],
    ['2c', 'Two of clubs'],
    ['Qh', 'Queen of hearts'],
  ])('names %s as %s', (card, name) => {
    expect(cardName(card)).toBe(name);
  });

  it('forces text presentation on every suit symbol', () => {
    for (const suit of SUITS) expect(SUIT_SYMBOLS[suit].endsWith('︎')).toBe(true);
  });
});
