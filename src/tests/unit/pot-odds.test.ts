import { describe, expect, it } from 'vitest';
import {
  MAX_CHIPS,
  calculatePotOdds,
  formatChips,
  formatPercent,
  formatRatio,
  parseChips,
  type PotOddsInput,
  type PotOddsResult,
} from '../../lib/poker/potOdds';

/** Whole chips to the hundredths the engine works in. */
const units = (chips: number) => Math.round(chips * 100);

function odds(pot: number, bet: number, call: number, shortCall?: PotOddsInput['shortCall']) {
  return calculatePotOdds({ pot: units(pot), bet: units(bet), call: units(call), shortCall });
}

function ok(outcome: ReturnType<typeof calculatePotOdds>): PotOddsResult {
  if (outcome.status !== 'ok') throw new Error(`Expected a result, got ${outcome.status}`);
  return outcome;
}

describe('parseChips', () => {
  it.each([
    ['0', 0],
    ['50', 5000],
    ['12.5', 1250],
    ['12.50', 1250],
    ['.5', 50],
    ['5.', 500],
    ['0.01', 1],
    ['  7  ', 700],
    ['1,000', 100000],
    ['1,234,567.89', 123456789],
    ['1.500', 150],
    ['1000000000', 100000000000],
  ])('reads %j', (text, expected) => {
    expect(parseChips(text)).toEqual({ ok: true, units: expected });
  });

  it.each([
    ['', 'empty'],
    ['   ', 'empty'],
    ['abc', 'not-a-number'],
    ['.', 'not-a-number'],
    ['-', 'not-a-number'],
    ['1.2.3', 'not-a-number'],
    ['1e3', 'not-a-number'],
    ['0x10', 'not-a-number'],
    ['NaN', 'not-a-number'],
    ['Infinity', 'not-a-number'],
    ['1,5', 'not-a-number'],
    ['12,34', 'not-a-number'],
    ['+5', 'not-a-number'],
    ['$50', 'not-a-number'],
    ['-5', 'negative'],
    ['-0.5', 'negative'],
    ['-.5', 'negative'],
    ['−5', 'negative'],
    ['1.234', 'too-precise'],
    ['1000000000.01', 'too-large'],
    ['1000000001', 'too-large'],
    ['9'.repeat(400), 'too-large'],
  ])('rejects %j as %s', (text, error) => {
    expect(parseChips(text)).toEqual({ ok: false, error });
  });

  it('never picks up binary floating point noise', () => {
    expect(parseChips('0.07')).toEqual({ ok: true, units: 7 });
    expect(parseChips('1.15')).toEqual({ ok: true, units: 115 });
    expect(parseChips('4.35')).toEqual({ ok: true, units: 435 });
    expect(parseChips('1.005')).toEqual({ ok: false, error: 'too-precise' });
  });
});

describe('calculatePotOdds: golden cases', () => {
  it('P=100, B=50, C=50 needs exactly 25%', () => {
    const result = ok(odds(100, 50, 50));
    expect(formatPercent(result.requiredEquity)).toBe('25%');
    expect(result.requiredEquity).toEqual({ hundredths: 2500, exact: true });
    expect(formatChips(result.finalPot)).toBe('200');
    expect(formatChips(result.potToWin)).toBe('150');
    expect(formatRatio(result.ratio)).toBe('3:1');
  });

  it('P=100, B=100, C=100 needs a third, flagged as rounded', () => {
    const result = ok(odds(100, 100, 100));
    expect(formatPercent(result.requiredEquity)).toBe('33.33%');
    expect(result.requiredEquity).toEqual({ hundredths: 3333, exact: false });
    expect(formatChips(result.finalPot)).toBe('300');
    expect(formatRatio(result.ratio)).toBe('2:1');
    expect(result.ratio.exact).toBe(true);
  });

  it('never double counts the bet or the call', () => {
    const result = ok(odds(100, 50, 50));
    expect(result.finalPot).toBe(units(100) + units(50) + units(50));
    expect(result.matchedBet).toBe(units(50));
    expect(result.returnedBet).toBe(0);
  });

  it('accepts an empty starting pot', () => {
    const result = ok(odds(0, 50, 50));
    expect(formatPercent(result.requiredEquity)).toBe('50%');
    expect(formatRatio(result.ratio)).toBe('1:1');
  });

  it('rounds half up at the second decimal', () => {
    // 1 / 16 = 6.25% exactly; 1 / 32 = 3.125%, which sits on the rounding boundary.
    expect(formatPercent(ok(odds(14, 1, 1)).requiredEquity)).toBe('6.25%');
    expect(ok(odds(30, 1, 1)).requiredEquity).toEqual({ hundredths: 313, exact: false });
  });

  it('reports a tiny price without calling it zero', () => {
    const result = ok(odds(MAX_CHIPS, 0.01, 0.01));
    expect(result.requiredEquity.hundredths).toBe(0);
    expect(formatPercent(result.requiredEquity)).toBe('under 0.01%');
  });
});

describe('calculatePotOdds: decimal amounts', () => {
  it('keeps 0.1 + 0.2 exact', () => {
    const result = ok(odds(0.1, 0.2, 0.2));
    expect(result.finalPot).toBe(50);
    expect(formatChips(result.finalPot)).toBe('0.5');
    expect(formatPercent(result.requiredEquity)).toBe('40%');
  });

  it('agrees whatever the unit', () => {
    const whole = ok(odds(100, 50, 50));
    const fractional = ok(odds(2.5, 1.25, 1.25));
    expect(fractional.requiredEquity).toEqual(whole.requiredEquity);
    expect(fractional.ratio).toEqual(whole.ratio);
  });

  it('adds cents without drift across a large grid', () => {
    for (let pot = 1; pot <= 200; pot += 7) {
      for (let bet = 1; bet <= 200; bet += 11) {
        const result = ok(calculatePotOdds({ pot, bet, call: bet }));
        expect(result.finalPot).toBe(pot + 2 * bet);
        expect(Number.isInteger(result.finalPot)).toBe(true);
      }
    }
  });

  it('formats amounts without stray digits', () => {
    expect(formatChips(30)).toBe('0.3');
    expect(formatChips(1250)).toBe('12.5');
    expect(formatChips(123456789)).toBe('1,234,567.89');
  });

  it('stays exact at the largest amounts', () => {
    const result = ok(odds(MAX_CHIPS, MAX_CHIPS, MAX_CHIPS));
    expect(formatChips(result.finalPot)).toBe('3,000,000,000');
    expect(formatPercent(result.requiredEquity)).toBe('33.33%');
    expect(formatRatio(result.ratio)).toBe('2:1');
  });
});

describe('calculatePotOdds: invalid and empty input', () => {
  it('has no percentage when everything is zero', () => {
    expect(odds(0, 0, 0)).toEqual({ status: 'empty-pot' });
  });

  it.each([
    ['negative pot', { pot: -1, bet: 100, call: 100 }],
    ['negative bet', { pot: 100, bet: -1, call: 100 }],
    ['negative call', { pot: 100, bet: 100, call: -1 }],
    ['NaN', { pot: Number.NaN, bet: 100, call: 100 }],
    ['Infinity', { pot: Number.POSITIVE_INFINITY, bet: 100, call: 100 }],
    ['-Infinity', { pot: 100, bet: Number.NEGATIVE_INFINITY, call: 100 }],
    ['fractional units', { pot: 100.5, bet: 100, call: 100 }],
    ['over the limit', { pot: (MAX_CHIPS + 1) * 100, bet: 100, call: 100 }],
  ])('rejects %s', (_name, input) => {
    expect(calculatePotOdds(input)).toEqual({ status: 'invalid-amount' });
  });

  it('gives no price when there is nothing to call', () => {
    expect(odds(100, 0, 0)).toEqual({ status: 'nothing-to-call' });
    expect(odds(100, 50, 0)).toEqual({ status: 'nothing-to-call' });
  });
});

describe('calculatePotOdds: call different from the bet', () => {
  it('refuses a call larger than the bet', () => {
    expect(odds(100, 50, 60)).toEqual({ status: 'call-exceeds-bet' });
    expect(odds(100, 0, 50)).toEqual({ status: 'call-exceeds-bet' });
  });

  it('gives no number until it knows why the call is smaller', () => {
    expect(odds(100, 100, 40)).toEqual({ status: 'needs-reason' });
    expect(odds(100, 100, 40, null)).toEqual({ status: 'needs-reason' });
  });

  it('counts every chip when you already have chips in the round', () => {
    // Pot of 100, you bet 20, the opponent raises to 60. You owe 40 of the 60.
    const result = ok(odds(120, 60, 40, 'chips-in'));
    expect(formatChips(result.finalPot)).toBe('220');
    expect(formatPercent(result.requiredEquity)).toBe('18.18%');
    expect(formatRatio(result.ratio)).toBe('4.5:1');
  });

  it('counts every chip when more than one opponent has bet', () => {
    const result = ok(odds(100, 100, 50, 'chips-in'));
    expect(formatChips(result.finalPot)).toBe('250');
    expect(formatPercent(result.requiredEquity)).toBe('20%');
  });

  it('removes the uncalled part when all-in for less', () => {
    const result = ok(odds(100, 100, 40, 'all-in'));
    expect(result.matchedBet).toBe(units(40));
    expect(result.returnedBet).toBe(units(60));
    expect(formatChips(result.finalPot)).toBe('180');
    expect(formatPercent(result.requiredEquity)).toBe('22.22%');
    expect(formatRatio(result.ratio)).toBe('3.5:1');
  });

  it('asks for more equity all-in than the unadjusted formula would', () => {
    const allIn = ok(odds(100, 100, 40, 'all-in'));
    const unadjusted = ok(odds(100, 100, 40, 'chips-in'));
    expect(formatPercent(unadjusted.requiredEquity)).toBe('16.67%');
    expect(allIn.requiredEquity.hundredths).toBeGreaterThan(unadjusted.requiredEquity.hundredths);
  });

  it('reports no number when the winnable pot is unknown', () => {
    expect(odds(100, 200, 40, 'all-in-other')).toEqual({ status: 'unknown-winnable-pot' });
  });

  it('prices a side pot once only the winnable chips are entered', () => {
    // Pot of 100, two opponents bet 100 each, you are all-in for 40.
    const result = ok(odds(100, 80, 40, 'chips-in'));
    expect(formatChips(result.finalPot)).toBe('220');
    expect(formatPercent(result.requiredEquity)).toBe('18.18%');
  });

  it('prices an all-in with chips already in once only the matched chips are entered', () => {
    // Pot of 100, you bet 20, the opponent raises to 60, and you have 30 left.
    // You match 50 of the 60: 100 + 50 + 50 = 200.
    const result = ok(odds(120, 50, 30, 'chips-in'));
    expect(formatChips(result.finalPot)).toBe('200');
    expect(formatPercent(result.requiredEquity)).toBe('15%');
  });

  it('ignores a stale reason once the call equals the bet', () => {
    for (const reason of ['chips-in', 'all-in', 'all-in-other'] as const) {
      expect(ok(odds(100, 50, 50, reason))).toEqual(ok(odds(100, 50, 50)));
    }
  });
});

describe('calculatePotOdds: invariants', () => {
  const amounts = [0, 1, 7, 50, 99, 100, 333, 1250, 99999];

  it('matches the formula and its own ratio across a grid', () => {
    for (const pot of amounts) {
      for (const bet of amounts) {
        for (const call of amounts) {
          if (call === 0 || call > bet) continue;
          const result = ok(calculatePotOdds({ pot, bet, call, shortCall: 'chips-in' }));
          const expected = (call / (pot + bet + call)) * 10000;
          expect(Math.abs(result.requiredEquity.hundredths - expected)).toBeLessThanOrEqual(0.5);
          expect(result.finalPot).toBe(pot + bet + call);
          expect(result.potToWin).toBe(pot + bet);
          // Ratio r:1 and equity e are the same price: e = 1 / (r + 1).
          const fromRatio = (1 / ((pot + bet) / call + 1)) * 10000;
          expect(fromRatio).toBeCloseTo(expected, 6);
        }
      }
    }
  });

  it('never asks for more than 50%, because a call can never exceed the bet', () => {
    for (const pot of amounts) {
      for (const bet of amounts) {
        if (bet === 0) continue;
        const result = ok(calculatePotOdds({ pot, bet, call: bet }));
        expect(result.requiredEquity.hundredths).toBeLessThanOrEqual(5000);
      }
    }
  });

  it('asks for more equity as the bet grows', () => {
    let previous = 0;
    for (let bet = 10; bet <= 500; bet += 10) {
      const { hundredths } = ok(odds(100, bet, bet)).requiredEquity;
      expect(hundredths).toBeGreaterThan(previous);
      previous = hundredths;
    }
  });
});
