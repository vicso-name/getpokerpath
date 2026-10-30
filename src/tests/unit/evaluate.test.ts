import { describe, expect, it } from 'vitest';
import { CardValidationError, createDeck, type CardCode } from '../../lib/poker/cards';
import {
  HAND_CATEGORIES,
  compareHands,
  evaluateBest,
  evaluateFive,
  type HandCategory,
} from '../../lib/poker/evaluate';
import { HAND_RANKINGS, FIVE_CARD_HANDS, formatHandShare } from '../../lib/poker/handRankings';

/** Reads a space-separated hand such as `As Kd Qh Jc 9s`. */
const hand = (text: string) => text.split(' ') as CardCode[];
const five = (text: string) => evaluateFive(hand(text));
const best = (text: string) => evaluateBest(hand(text));

/** Asserts `stronger` beats `weaker` in both argument orders. */
function expectBeats(stronger: string, weaker: string) {
  const a = hand(stronger).length === 5 ? five(stronger) : best(stronger);
  const b = hand(weaker).length === 5 ? five(weaker) : best(weaker);
  expect(compareHands(a, b)).toBeGreaterThan(0);
  expect(compareHands(b, a)).toBeLessThan(0);
}

function expectTie(first: string, second: string) {
  const a = hand(first).length === 5 ? five(first) : best(first);
  const b = hand(second).length === 5 ? five(second) : best(second);
  expect(compareHands(a, b)).toBe(0);
  expect(compareHands(b, a)).toBe(0);
}

describe('all 10 hand categories', () => {
  it.each<[HandCategory, string, string]>([
    ['royal-flush', 'As Ks Qs Js Ts', 'Royal Flush'],
    ['straight-flush', '9h 8h 7h 6h 5h', 'Straight Flush, Nine-high'],
    ['four-of-a-kind', 'Qc Qd Qh Qs 7d', 'Four of a Kind, Queens'],
    ['full-house', 'Kc Kd Kh 7c 7s', 'Full House, Kings full of Sevens'],
    ['flush', 'Ad Jd 9d 6d 3d', 'Flush, Ace-high'],
    ['straight', 'Tc 9d 8h 7s 6c', 'Straight, Ten-high'],
    ['three-of-a-kind', '8c 8d 8s Kh 4d', 'Three of a Kind, Eights'],
    ['two-pair', 'Jc Jh 5d 5s Ac', 'Two Pair, Jacks and Fives'],
    ['pair', 'Tc Th Ad 8s 3c', 'Pair of Tens'],
    ['high-card', 'Ah Jc 8d 6s 2c', 'High Card, Ace'],
  ])('recognizes %s', (category, cards, description) => {
    const result = five(cards);
    expect(result.category).toBe(category);
    expect(result.description).toBe(description);
  });

  it('ranks every category above the one below it', () => {
    const strongestFirst = [
      'As Ks Qs Js Ts',
      '9h 8h 7h 6h 5h',
      'Qc Qd Qh Qs 7d',
      'Kc Kd Kh 7c 7s',
      'Ad Jd 9d 6d 3d',
      'Tc 9d 8h 7s 6c',
      '8c 8d 8s Kh 4d',
      'Jc Jh 5d 5s Ac',
      'Tc Th Ad 8s 3c',
      'Ah Jc 8d 6s 2c',
    ];
    for (let i = 0; i < strongestFirst.length - 1; i += 1) {
      expectBeats(strongestFirst[i], strongestFirst[i + 1]);
    }
  });

  it('uses readable plurals', () => {
    expect(five('6c 6d 6h 6s 2c').description).toBe('Four of a Kind, Sixes');
    expect(five('2c 2d Ks Qh 9d').description).toBe('Pair of Twos');
  });
});

describe('acceptance golden cases', () => {
  it('straight flush beats quads', () => {
    expectBeats('6s 5s 4s 3s 2s', 'Ac Ad Ah As Kd');
  });

  it('flush beats straight', () => {
    expectBeats('Kd Jd 8d 5d 2d', 'As Kd Qh Jc Ts');
  });

  it('full house beats flush', () => {
    expectBeats('2c 2d 2h 3c 3d', 'Ad Kd Qd Jd 9d');
  });

  it('three of a kind beats two pair', () => {
    expectBeats('2c 2d 2h 7s 9c', 'Ac Ad Kc Kd Qs');
  });
});

describe('ace-low straight (the wheel)', () => {
  it('reads A-2-3-4-5 as a five-high straight', () => {
    const result = five('Ah 2d 3c 4s 5h');
    expect(result.category).toBe('straight');
    expect(result.tiebreak).toEqual([5]);
    expect(result.description).toBe('Straight, Five-high');
  });

  it('shows the ace at the low end', () => {
    expect(five('Ah 2d 3c 4s 5h').cards).toEqual(['5h', '4s', '3c', '2d', 'Ah']);
  });

  it('loses to 2-3-4-5-6', () => {
    expectBeats('2c 3d 4h 5s 6d', 'Ah 2d 3c 4s 5h');
  });

  it('still beats three of a kind', () => {
    expectBeats('Ah 2d 3c 4s 5h', 'Ac Ad As Kh Qd');
  });

  it('makes a five-high straight flush in one suit, not a royal', () => {
    const result = five('Ad 2d 3d 4d 5d');
    expect(result.category).toBe('straight-flush');
    expect(result.tiebreak).toEqual([5]);
    expectBeats('2s 3s 4s 5s 6s', 'Ad 2d 3d 4d 5d');
  });

  it('does not wrap around the ace', () => {
    expect(five('Qc Kd Ah 2s 3c').category).toBe('high-card');
    expect(five('Kc Ad 2h 3s 4c').category).toBe('high-card');
  });

  it('treats A-K-Q-J-10 as the top straight', () => {
    expect(five('As Kd Qh Jc Ts').tiebreak).toEqual([14]);
    expectBeats('As Kd Qh Jc Ts', 'Ks Qd Jh Tc 9s');
  });
});

describe('tie-breaks within a category', () => {
  it('compares pair rank, then each kicker in turn', () => {
    expectBeats('Ac Ad 7s 5h 2c', 'Kc Kd As Qh Jc');
    expectBeats('Ac Ad Ks 5h 2c', 'Ah As Qs Jh Tc');
    expectBeats('Ac Ad Ks Qh 2c', 'Ah As Kd Jh Tc');
    expectBeats('Ac Ad Ks Qh 3c', 'Ah As Kd Qd 2d');
  });

  it('compares two pair by top pair, second pair, then kicker', () => {
    expectBeats('Ac Ad 3s 3h 2c', 'Kc Kd Qs Qh Ac');
    expectBeats('Ac Ad Qs Qh 2c', 'Ah As Js Jh Kc');
    expectBeats('Ac Ad Qs Qh 9c', 'Ah As Qd Qc 8c');
  });

  it('compares three of a kind by trips, then kickers', () => {
    expectBeats('9c 9d 9s 3h 2c', '8c 8d 8s Ah Kc');
    expectBeats('9c 9d 9h Ah 2c', '9c 9d 9s Kh Qc');
  });

  it('compares a full house by trips first, then the pair', () => {
    expectBeats('3c 3d 3h 2c 2d', '2c 2h 2s Ac Ad');
    expectBeats('Kc Kd Kh Ac Ad', 'Ks Kd Kh Qc Qd');
  });

  it('compares four of a kind by rank, then kicker', () => {
    expectBeats('Kc Kd Kh Ks 2c', 'Qc Qd Qh Qs Ad');
    expectBeats('9c 9d 9h 9s Ad', '9c 9d 9h 9s Kd');
  });

  it('compares flushes card by card down to the last', () => {
    expectBeats('Ad Kd Qd Jd 3d', 'As Ks Qs Js 2s');
    expectBeats('Ad Kd 9d 5d 2d', 'As Qs Js Ts 8s');
  });

  it('compares high-card hands card by card', () => {
    expectBeats('Ah Kc Qd Js 9c', 'As Kd Qh Jc 8s');
    expectBeats('Ah Kc Qd 7s 3c', 'As Kd Qh 6c 5s');
  });

  it('compares straights and straight flushes by top card only', () => {
    expectBeats('Ks Qd Jh Tc 9s', 'Qs Jd Th 9c 8s');
    expectBeats('Ts 9s 8s 7s 6s', '9h 8h 7h 6h 5h');
  });
});

describe('ties', () => {
  it('ignores suits when the ranks match', () => {
    expectTie('Ac Kd Qh Js 9c', 'Ad Kh Qs Jc 9d');
    expectTie('Ad Kd Qd Jd 9d', 'As Ks Qs Js 9s');
    expectTie('9c 8d 7h 6s 5c', '9d 8h 7s 6c 5d');
    expectTie('As Ks Qs Js Ts', 'Ah Kh Qh Jh Th');
  });

  it('never lets suit strength settle a hand', () => {
    expect(compareHands(five('As Ks Qs Js 9s'), five('Ac Kc Qc Jc 9c'))).toBe(0);
  });
});

describe('best five of seven', () => {
  it('finds the five cards that make the hand', () => {
    const result = best('As Ks Qs Js Ts 2c 3d');
    expect(result.category).toBe('royal-flush');
    expect([...result.cards].sort()).toEqual(['As', 'Js', 'Ks', 'Qs', 'Ts']);
  });

  it('turns two sets of trips into a full house with the higher trips on top', () => {
    const result = best('9c 9d 9s 4c 4d 4h Kd');
    expect(result.category).toBe('full-house');
    expect(result.tiebreak).toEqual([9, 4]);
    expect(result.cards.slice(0, 3).every((card) => card[0] === '9')).toBe(true);
  });

  it('uses the highest of three pairs and the best remaining kicker', () => {
    const result = best('Ac Ad Kc Kd Qc Qd Jh');
    expect(result.category).toBe('two-pair');
    expect(result.tiebreak).toEqual([14, 13, 12]);
  });

  it('takes a higher kicker over a third pair', () => {
    expect(best('Kc Kd 7c 7d 3c 3d Ah').tiebreak).toEqual([13, 7, 14]);
  });

  it('chooses the best pair for a full house with trips and two pairs', () => {
    const result = best('Tc Td Th 8c 8d 5c 5d');
    expect(result.category).toBe('full-house');
    expect(result.tiebreak).toEqual([10, 8]);
  });

  it('takes the top five of six or seven suited cards', () => {
    const result = best('Ad Kd 9d 7d 5d 3d 2d');
    expect(result.category).toBe('flush');
    expect(result.tiebreak).toEqual([14, 13, 9, 7, 5]);
  });

  it('takes the highest straight from six or seven connected cards', () => {
    expect(best('9c 8d 7h 6s 5c 4d 3h').tiebreak).toEqual([9]);
  });

  it('finds the wheel among seven cards', () => {
    const result = best('Ah 2d 3c 4s 5h Kd Qc');
    expect(result.category).toBe('straight');
    expect(result.tiebreak).toEqual([5]);
  });

  it('prefers a six-high straight over the wheel', () => {
    expect(best('Ah 2d 3c 4s 5h 6d Kc').tiebreak).toEqual([6]);
  });

  it('prefers a flush over a straight in the same seven cards', () => {
    expect(best('9h 8h 7h 6h 2h 5c 4d').category).toBe('flush');
  });

  it('prefers a straight flush over a higher plain flush', () => {
    const result = best('Ah 9h 8h 7h 6h 5h Kc');
    expect(result.category).toBe('straight-flush');
    expect(result.tiebreak).toEqual([9]);
  });

  it('does not build a straight flush from a straight and a separate flush', () => {
    expect(best('9h 8h 7h 6h 2h 5c Ad').category).toBe('flush');
  });

  it('picks the best kicker beside four of a kind', () => {
    expect(best('5c 5d 5h 5s Ac Kc Qc').tiebreak).toEqual([5, 14]);
  });

  it('uses a kicker from outside a pair of trips hand', () => {
    expect(best('Jc Jd Jh Ac Kd 3s 2c').tiebreak).toEqual([11, 14, 13]);
  });

  it('accepts six cards, as on the turn', () => {
    expect(best('Ac Ad Kc Kd Qc 2d').category).toBe('two-pair');
  });

  it('accepts five cards, as on the flop', () => {
    expect(best('Ac Ad Kc Qd 2c').category).toBe('pair');
  });

  it('gives the same answer for any input order', () => {
    const cards = hand('Tc Td Th 8c 8d 5c 5d');
    const expected = evaluateBest(cards);
    for (const shuffled of [[...cards].reverse(), [...cards.slice(3), ...cards.slice(0, 3)]]) {
      expect(evaluateBest(shuffled)).toEqual(expected);
    }
  });

  it('matches the best result from checking all 21 subsets by hand', () => {
    const cards = hand('Ah Kh Qd Jd 9h 7h 2h');
    let strongest = evaluateFive(cards.slice(0, 5));
    let subsets = 0;
    for (let skipA = 0; skipA < 7; skipA += 1) {
      for (let skipB = skipA + 1; skipB < 7; skipB += 1) {
        const subset = cards.filter((_, index) => index !== skipA && index !== skipB);
        const candidate = evaluateFive(subset);
        if (compareHands(candidate, strongest) > 0) strongest = candidate;
        subsets += 1;
      }
    }
    expect(subsets).toBe(21);
    expect(compareHands(evaluateBest(cards), strongest)).toBe(0);
  });
});

describe('invalid input', () => {
  it.each(['As Kd Qh Jc', 'As Kd Qh Jc 9s 8d'])('evaluateFive rejects %s', (cards) => {
    expect(() => five(cards)).toThrow(/exactly 5/);
  });

  it.each(['As Kd Qh Jc', 'As Kd Qh Jc 9s 8d 7c 6h'])('evaluateBest rejects %s', (cards) => {
    expect(() => best(cards)).toThrow(/5 to 7/);
  });

  it('rejects duplicate cards instead of reading them as a pair', () => {
    expect(() => five('As As Kd Qh Jc')).toThrow(/Duplicate cards: As/);
    expect(() => best('As Kd Qh Jc 9s 8d As')).toThrow(/Duplicate cards: As/);
  });

  it('rejects malformed cards', () => {
    expect(() => evaluateFive(['As', 'Kd', 'Qh', 'Jc', 'Zz' as CardCode])).toThrow(
      CardValidationError,
    );
  });
});

describe('exhaustive check of all 2,598,960 five-card hands', () => {
  it('matches the known count for each category and the 7,462 distinct hand values', () => {
    const deck = createDeck();
    const counts = new Map<HandCategory, number>();
    const distinctValues = new Set<string>();

    for (let a = 0; a < 48; a += 1) {
      for (let b = a + 1; b < 49; b += 1) {
        for (let c = b + 1; c < 50; c += 1) {
          for (let d = c + 1; d < 51; d += 1) {
            for (let e = d + 1; e < 52; e += 1) {
              const result = evaluateFive([deck[a], deck[b], deck[c], deck[d], deck[e]]);
              counts.set(result.category, (counts.get(result.category) ?? 0) + 1);
              distinctValues.add(`${result.strength}:${result.tiebreak.join(',')}`);
            }
          }
        }
      }
    }

    for (const ranking of HAND_RANKINGS) {
      expect(counts.get(ranking.category), ranking.category).toBe(ranking.fiveCardCombos);
    }
    expect([...counts.values()].reduce((sum, count) => sum + count, 0)).toBe(FIVE_CARD_HANDS);
    // 7,462 is the standard figure with the royal flush counted as the top straight flush.
    expect(distinctValues.size).toBe(7_462);
  }, 120_000);
});

describe('hand ranking chart data', () => {
  it('lists all 10 categories strongest first', () => {
    expect(HAND_RANKINGS.map((ranking) => ranking.category)).toEqual(
      [...HAND_CATEGORIES].reverse(),
    );
  });

  it.each(HAND_RANKINGS.map((ranking) => [ranking.name, ranking] as const))(
    'shows a real example of %s',
    (_, ranking) => {
      expect(evaluateFive(ranking.example).category).toBe(ranking.category);
    },
  );

  it('formats shares to three significant figures', () => {
    expect(formatHandShare(4)).toBe('0.000154%');
    expect(formatHandShare(123_552)).toBe('4.75%');
    expect(formatHandShare(1_302_540)).toBe('50.1%');
  });
});
