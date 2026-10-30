import { describe, expect, it } from 'vitest';
import { CardValidationError, type CardCode } from '../../lib/poker/cards';
import { showdownFiveCard, showdownHoldem } from '../../lib/poker/showdown';

const hand = (text: string) => text.split(' ') as CardCode[];

describe('five-card showdown', () => {
  it('explains a win on hand category', () => {
    const result = showdownFiveCard(hand('9h 8s 7c 6s 5h'), hand('Kd Jd 8d 5d 2d'));
    expect(result.outcome).toBe('b');
    expect(result.decidedBy).toBe('category');
    expect(result.explanation).toBe('Player B wins because a flush beats a straight.');
  });

  it('explains a kicker win, naming what matched and what decided it', () => {
    const result = showdownFiveCard(hand('Ac Ad Ks Qh 3c'), hand('Ah As Kd Qd 2d'));
    expect(result.outcome).toBe('a');
    expect(result.decidedBy).toBe('tiebreak');
    expect(result.explanation).toBe(
      "Both players have a pair. They match on pair of Aces, first kicker (King), second kicker (Queen). Player A's third kicker (Three) beats Player B's third kicker (Two).",
    );
  });

  it('explains a win on the pair itself', () => {
    expect(showdownFiveCard(hand('Ac Ad 7s 5h 2c'), hand('Kc Kd Qs Jh 9c')).explanation).toBe(
      "Both players have a pair. Player A's pair of Aces beats Player B's pair of Kings.",
    );
  });

  it('explains each two pair step', () => {
    expect(showdownFiveCard(hand('Ac Ad Qs Qh 2c'), hand('Ah As Js Jh Kc')).explanation).toBe(
      "Both players have two pair. They match on top pair of Aces. Player A's second pair of Queens beats Player B's second pair of Jacks.",
    );
    expect(showdownFiveCard(hand('Ac Ad Qs Qh 8c'), hand('Ah As Qd Qc 9c')).explanation).toBe(
      "Both players have two pair. They match on top pair of Aces, second pair of Queens. Player B's kicker (Nine) beats Player A's kicker (Eight).",
    );
  });

  it('explains a full house by its three of a kind', () => {
    expect(showdownFiveCard(hand('Kc Kd Kh 2c 2d'), hand('Qc Qd Qh Ac Ad')).explanation).toBe(
      "Both players have a full house. Player A's three Kings beats Player B's three Queens.",
    );
  });

  it('explains flush and straight comparisons', () => {
    expect(showdownFiveCard(hand('Ad Kd 9d 5d 2d'), hand('As Qs Js Ts 8s')).explanation).toBe(
      "Both players have a flush. They match on highest card (Ace). Player A's second-highest card (King) beats Player B's second-highest card (Queen).",
    );
    expect(showdownFiveCard(hand('2c 3d 4h 5s 6d'), hand('Ah 2d 3c 4s 5h')).explanation).toBe(
      "Both players have a straight. Player A's top card (Six) beats Player B's top card (Five).",
    );
  });

  it('reports a split pot when ranks match', () => {
    const result = showdownFiveCard(hand('Ac Kd Qh Js 9c'), hand('Ad Kh Qs Jc 9d'));
    expect(result.outcome).toBe('tie');
    expect(result.decidedBy).toBe('tie');
    expect(result.boardPlays).toBe(false);
    expect(result.explanation).toBe(
      'Both players make the same five-card hand by rank: High Card, Ace. Suits never break a tie, so the pot is split.',
    );
  });

  it('uses custom player names', () => {
    const result = showdownFiveCard(hand('9h 8s 7c 6s 5h'), hand('Kd Jd 8d 5d 2d'), {
      a: 'Ana',
      b: 'Ben',
    });
    expect(result.explanation).toBe('Ben wins because a flush beats a straight.');
  });

  it('rejects a card held by both players', () => {
    expect(() => showdownFiveCard(hand('As Kd Qh Jc 9s'), hand('As 2d 3h 4c 6s'))).toThrow(
      /Duplicate cards: As/,
    );
  });

  it('rejects incomplete hands', () => {
    expect(() => showdownFiveCard(hand('As Kd Qh Jc'), hand('2d 3h 4c 6s 8d'))).toThrow(
      CardValidationError,
    );
  });
});

describe('hold’em showdown', () => {
  it('decides a shared pair on the kicker', () => {
    const result = showdownHoldem(hand('As Kd'), hand('Kh Qc'), hand('Kc 9d 7s 4h 2c'));
    expect(result.outcome).toBe('a');
    expect(result.handA.tiebreak).toEqual([13, 14, 9, 7]);
    expect(result.handB.tiebreak).toEqual([13, 12, 9, 7]);
    expect(result.explanation).toContain("Player A's first kicker (Ace)");
  });

  it('splits when the board is the best hand for both', () => {
    const result = showdownHoldem(hand('2c 3d'), hand('4h 5h'), hand('As Kd Qh Jc Ts'));
    expect(result.outcome).toBe('tie');
    expect(result.boardPlays).toBe(true);
    expect(result.explanation).toContain('The board is the best hand for both players');
  });

  it('splits when neither hole card improves a board with a pair', () => {
    const result = showdownHoldem(hand('2c 3d'), hand('2h 3s'), hand('Ac Ad Kh Qs Jd'));
    expect(result.outcome).toBe('tie');
    expect(result.boardPlays).toBe(true);
  });

  it('counts a kicker from the board when it outranks the hole cards', () => {
    const result = showdownHoldem(hand('Kc 2d'), hand('Kd 3h'), hand('Kh Ah Qs Js 9c'));
    expect(result.outcome).toBe('tie');
    expect(result.boardPlays).toBe(false);
  });

  it('splits on matching hole-card ranks without calling it a board play', () => {
    const result = showdownHoldem(hand('Ac Kd'), hand('Ad Kc'), hand('Ah 9d 7s 4h 2c'));
    expect(result.outcome).toBe('tie');
    expect(result.boardPlays).toBe(false);
    expect(result.explanation).toContain('same five-card hand');
  });

  it('awards the pot to a player who beats the board', () => {
    const result = showdownHoldem(hand('Ks 9d'), hand('2c 3d'), hand('Ac Qs Js Ts 4d'));
    expect(result.outcome).toBe('a');
    expect(result.handA.category).toBe('straight');
    expect(result.boardPlays).toBe(false);
  });

  it('resolves two sets of trips into competing full houses', () => {
    const result = showdownHoldem(hand('9c 9d'), hand('Kc Qd'), hand('9s 4c 4d 4h Kd'));
    expect(result.outcome).toBe('a');
    expect(result.handA.description).toBe('Full House, Nines full of Fours');
    expect(result.handB.description).toBe('Full House, Fours full of Kings');
    expect(result.explanation).toContain("Player A's three Nines beats Player B's three Fours");
  });

  it('finds a flush using one hole card', () => {
    const result = showdownHoldem(hand('Ah 2c'), hand('Kd Qc'), hand('9h 7h 4h 2h Ks'));
    expect(result.outcome).toBe('a');
    expect(result.handA.category).toBe('flush');
  });

  it('rejects a hole card that is also on the board', () => {
    expect(() => showdownHoldem(hand('As Kd'), hand('Qh Jc'), hand('As 9d 7s 4h 2c'))).toThrow(
      /Duplicate cards: As/,
    );
  });

  it('rejects the wrong number of cards', () => {
    expect(() => showdownHoldem(hand('As'), hand('Qh Jc'), hand('Td 9d 7s 4h 2c'))).toThrow(
      /2 hole cards/,
    );
    expect(() => showdownHoldem(hand('As Kd'), hand('Qh Jc'), hand('Td 9d 7s 4h'))).toThrow(
      /5 community cards/,
    );
  });
});
