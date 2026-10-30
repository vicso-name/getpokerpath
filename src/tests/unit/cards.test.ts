import { describe, expect, it } from 'vitest';
import {
  CardValidationError,
  RANKS,
  SUITS,
  SUIT_SYMBOLS,
  assertValidCards,
  cardControlName,
  cardName,
  cardRank,
  cardRankLabel,
  cardSuit,
  createDeck,
  findDuplicateCards,
  isCardCode,
  parseCard,
  rankFromValue,
  rankValue,
  shuffleDeck,
  type CardCode,
} from '../../lib/poker/cards';

describe('card vocabulary', () => {
  it('defines 13 ranks and 4 suits', () => {
    expect(RANKS).toHaveLength(13);
    expect(SUITS).toHaveLength(4);
  });

  it('orders ranks from two up to ace', () => {
    expect(RANKS[0]).toBe('2');
    expect(RANKS.at(-1)).toBe('A');
  });

  it('maps ranks to values and back', () => {
    expect(rankValue('2')).toBe(2);
    expect(rankValue('T')).toBe(10);
    expect(rankValue('A')).toBe(14);
    for (const rank of RANKS) expect(rankFromValue(rankValue(rank))).toBe(rank);
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

  it('prints a ten as 10 and every other rank as its letter', () => {
    expect(cardRankLabel('Td')).toBe('10');
    expect(cardRankLabel('Kh')).toBe('K');
    expect(cardRankLabel('2c')).toBe('2');
  });

  it('includes the printed rank in control names for voice control', () => {
    expect(cardControlName('Kh')).toBe('King of hearts, K');
    expect(cardControlName('Td')).toBe('Ten of diamonds, 10');
  });

  it('forces text presentation on every suit symbol', () => {
    for (const suit of SUITS) expect(SUIT_SYMBOLS[suit].endsWith('︎')).toBe(true);
  });
});

describe('parseCard', () => {
  it.each([
    ['As', 'As'],
    ['as', 'As'],
    ['AS', 'As'],
    [' Td ', 'Td'],
    ['td', 'Td'],
    ['10h', 'Th'],
    ['10H', 'Th'],
    ['2c', '2c'],
  ])('reads %j as %s', (input, expected) => {
    expect(parseCard(input)).toBe(expected);
  });

  it.each(['', 'A', '1s', '0h', '11d', 'Ax', 'sA', 'Ass', '10', 'A s', '♠A'])(
    'rejects %j',
    (input) => {
      expect(() => parseCard(input)).toThrow(CardValidationError);
    },
  );
});

describe('isCardCode', () => {
  it('accepts only canonical codes', () => {
    expect(isCardCode('As')).toBe(true);
    for (const value of ['as', 'AS', '10h', 'Ax', '', null, undefined, 7, {}]) {
      expect(isCardCode(value)).toBe(false);
    }
  });
});

describe('deck', () => {
  it('holds 52 unique, canonical cards', () => {
    const deck = createDeck();
    expect(deck).toHaveLength(52);
    expect(new Set(deck).size).toBe(52);
    expect(deck.every(isCardCode)).toBe(true);
    expect(findDuplicateCards(deck)).toEqual([]);
  });

  it('holds 4 cards of each rank and 13 of each suit', () => {
    const deck = createDeck();
    for (const rank of RANKS) expect(deck.filter((c) => cardRank(c) === rank)).toHaveLength(4);
    for (const suit of SUITS) expect(deck.filter((c) => cardSuit(c) === suit)).toHaveLength(13);
  });

  it('shuffles without losing or duplicating a card', () => {
    const shuffled = shuffleDeck();
    expect(new Set(shuffled).size).toBe(52);
    expect([...shuffled].sort()).toEqual([...createDeck()].sort());
  });

  it('shuffles reproducibly from a fixed random source', () => {
    const seeded = () => {
      let state = 42;
      return () => {
        state = (state * 1_664_525 + 1_013_904_223) % 2 ** 32;
        return state / 2 ** 32;
      };
    };
    expect(shuffleDeck(seeded())).toEqual(shuffleDeck(seeded()));
    expect(shuffleDeck(seeded())).not.toEqual(createDeck());
  });
});

describe('duplicate guard', () => {
  it('reports each repeated card once', () => {
    expect(findDuplicateCards(['As', 'Kd', 'As', 'As', 'Kd', '2c'])).toEqual(['As', 'Kd']);
    expect(findDuplicateCards(['As', 'Ah', 'Ad', 'Ac'])).toEqual([]);
  });

  it('rejects the same physical card twice', () => {
    expect(() => assertValidCards(['As', 'Kd', 'As'])).toThrow(/Duplicate cards: As/);
  });

  it('allows repeated ranks and repeated suits', () => {
    expect(() => assertValidCards(['As', 'Ah', 'Ks', 'Qs'])).not.toThrow();
  });

  it('rejects malformed codes that bypass the type system', () => {
    expect(() => assertValidCards(['Zz' as CardCode])).toThrow(CardValidationError);
  });
});
