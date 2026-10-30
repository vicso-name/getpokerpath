import { describe, expect, it } from 'vitest';
import {
  EMPTY_FIELDS,
  POT_ODDS_EXAMPLES,
  evaluateForm,
  explainResult,
  type PotOddsFields,
} from '../../lib/tools/potOddsCalculator';

const form = (pot: string, bet: string, call: string): PotOddsFields => ({ pot, bet, call });
const noErrors = { pot: null, bet: null, call: null };

function explained(fields: PotOddsFields, shortCall: Parameters<typeof evaluateForm>[1] = null) {
  const { result } = evaluateForm(fields, shortCall);
  if (!result) throw new Error('Expected a result');
  return explainResult(result);
}

describe('evaluateForm', () => {
  it('waits quietly while fields are empty', () => {
    const view = evaluateForm(EMPTY_FIELDS, null);
    expect(view.errors).toEqual(noErrors);
    expect(view.result).toBeNull();
    expect(view.message).toBe('Enter all three amounts to see the result.');
  });

  it('waits for the last field without flagging it', () => {
    const view = evaluateForm(form('100', '50', ''), null);
    expect(view.errors).toEqual(noErrors);
    expect(view.result).toBeNull();
  });

  it('flags the bad field and shows no result', () => {
    const view = evaluateForm(form('100', 'abc', '50'), null);
    expect(view.errors.bet).toBe('Enter a number, like 50 or 12.50.');
    expect(view.errors.pot).toBeNull();
    expect(view.result).toBeNull();
  });

  it.each([
    ['-5', 'Amounts can’t be negative.'],
    ['1.234', 'Use at most 2 decimal places.'],
    ['1000000001', 'Enter 1,000,000,000 or less.'],
  ])('explains why %s is refused', (text, error) => {
    expect(evaluateForm(form(text, '50', '50'), null).errors.pot).toBe(error);
  });

  it('prefers a bad amount over a missing one', () => {
    const view = evaluateForm(form('abc', '', ''), null);
    expect(view.message).toBe('Fix the highlighted amount to see the result.');
  });

  it('announces a result', () => {
    expect(evaluateForm(form('100', '50', '50'), null).announcement).toBe(
      'Required equity 25%. Final pot 200. Pot odds 3:1.',
    );
  });

  it('explains all zeros', () => {
    const view = evaluateForm(form('0', '0', '0'), null);
    expect(view.result).toBeNull();
    expect(view.message).toMatch(/no pot/);
    expect(view.announcement).toBe(view.message);
  });

  it('explains a free call', () => {
    const view = evaluateForm(form('100', '0', '0'), null);
    expect(view.result).toBeNull();
    expect(view.message).toMatch(/costs nothing/);
  });

  it('puts an oversized call on the call field', () => {
    const view = evaluateForm(form('100', '50', '60'), null);
    expect(view.errors.call).toMatch(/can’t be more than the bet/);
    expect(view.result).toBeNull();
  });

  it('explains a call with no bet to answer', () => {
    expect(evaluateForm(form('100', '0', '50'), null).errors.call).toMatch(/nothing to call/);
  });

  it('asks why a call is smaller and withholds the number', () => {
    const view = evaluateForm(form('100', '100', '40'), null);
    expect(view.asksReason).toBe(true);
    expect(view.result).toBeNull();
    expect(view.message).toMatch(/Choose why/);
  });

  it('keeps the question visible once answered', () => {
    expect(evaluateForm(form('100', '100', '40'), 'all-in').asksReason).toBe(true);
    expect(evaluateForm(form('100', '100', '40'), 'all-in-other').asksReason).toBe(true);
  });

  it('drops the question when the call matches the bet again', () => {
    const view = evaluateForm(form('100', '100', '100'), 'all-in');
    expect(view.asksReason).toBe(false);
    expect(view.result?.finalPot).toBe(30000);
  });

  it('explains an unknown winnable pot instead of giving a number', () => {
    const view = evaluateForm(form('100', '200', '40'), 'all-in-other');
    expect(view.result).toBeNull();
    expect(view.message).toMatch(/side pot/);
  });
});

describe('explainResult', () => {
  it('shows the formula with the entered amounts', () => {
    const { equation, steps, summary, refundNote } = explained(form('100', '50', '50'));
    expect(equation).toBe('50 ÷ (100 + 50 + 50) = 25%');
    expect(refundNote).toBeNull();
    expect(steps.map(({ working }) => working)).toEqual([
      '100 + 50 = 150',
      '150 + 50 = 200',
      '50 ÷ 200 = 25%',
      '150 to 50 = 3:1',
    ]);
    expect(summary).toBe('You need to win the pot at least 25% of the time for this call to break even.');
  });

  it('marks rounded results with an approximate sign', () => {
    const { equation, steps } = explained(form('100', '100', '100'));
    expect(equation).toBe('100 ÷ (100 + 100 + 100) ≈ 33.33%');
    expect(steps[2].working).toBe('100 ÷ 300 ≈ 33.33%');
    expect(steps[3].working).toBe('200 to 100 = 2:1');
  });

  it('marks a rounded ratio separately', () => {
    expect(explained(form('100', '50', '30'), 'chips-in').steps[3].working).toBe('150 to 30 = 5:1');
    expect(explained(form('10', '7', '7')).steps[3].working).toBe('17 to 7 ≈ 2.43:1');
  });

  it('uses the matched bet and says where the rest went when all-in', () => {
    const { equation, refundNote, steps } = explained(form('100', '100', '40'), 'all-in');
    expect(equation).toBe('40 ÷ (100 + 40 + 40) ≈ 22.22%');
    expect(refundNote).toMatch(/match only 40 of the 100 bet, so the other 60 goes back/);
    expect(steps[0].working).toBe('100 + 40 = 140');
    expect(steps[1].working).toBe('140 + 40 = 180');
  });

  it('prints decimals cleanly', () => {
    const { steps } = explained(form('0.1', '0.2', '0.2'));
    expect(steps[0].working).toBe('0.1 + 0.2 = 0.3');
    expect(steps[1].working).toBe('0.3 + 0.2 = 0.5');
  });
});

describe('examples', () => {
  it.each(POT_ODDS_EXAMPLES.map((example) => [example.label, example] as const))(
    '%s gives a result',
    (_label, example) => {
      expect(evaluateForm(example.fields, example.shortCall).result).not.toBeNull();
    },
  );

  it('match the published golden answers', () => {
    const percents = POT_ODDS_EXAMPLES.map(
      ({ fields, shortCall }) => evaluateForm(fields, shortCall).result?.requiredEquity.hundredths,
    );
    expect(percents).toEqual([2500, 3333, 1818, 2222]);
  });
});
