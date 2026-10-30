import { describe, expect, it } from 'vitest';
import {
  TABLE_FORMATS,
  positionOfSeat,
  seatOfPosition,
  type PositionId,
} from '../../lib/poker/positions';
import {
  createInitialTrainerState,
  describeAnswer,
  describeSeat,
  pickTarget,
  questionPrompt,
  seatName,
  trainerReducer,
  type TrainerAction,
  type TrainerState,
} from '../../lib/tools/positionsTrainer';
import { SEAT_RADIUS, seatPoint } from '../../lib/tools/tableLayout';

const run = (state: TrainerState, ...actions: TrainerAction[]) =>
  actions.reduce(trainerReducer, state);
const practice = () => run(createInitialTrainerState(), { type: 'set-mode', mode: 'practice' });
const select = (seat: number): TrainerAction => ({ type: 'select-seat', seat });
const answerCorrectly = (state: TrainerState) =>
  run(state, select(seatOfPosition(state.format, state.button, state.target)));
const answerWrongly = (state: TrainerState) => {
  const right = seatOfPosition(state.format, state.button, state.target);
  return run(state, select(right === 0 ? 1 : 0));
};

describe('initial state', () => {
  it('opens on a valid example with the Button selected', () => {
    const state = createInitialTrainerState();
    expect(state.mode).toBe('explore');
    expect(positionOfSeat(state.format, state.button, state.selectedSeat)).toBe('BTN');
    expect(questionPrompt(state.target)).toBe('Find the Cutoff (CO)');
  });
});

describe('explore mode', () => {
  it('selects a seat and announces its position', () => {
    const state = run(createInitialTrainerState(), select(3));
    expect(state.selectedSeat).toBe(3);
    expect(state.announcement).toBe('Seat 4 is Under the Gun (UTG).');
  });

  it('does not touch the score', () => {
    expect(run(createInitialTrainerState(), select(5)).score).toEqual({ correct: 0, answered: 0 });
  });

  it('moves the button clockwise and updates the selected seat’s position', () => {
    const state = run(createInitialTrainerState(), select(3), { type: 'move-button' });
    expect(state.button).toBe(1);
    expect(state.selectedSeat).toBe(3);
    expect(state.announcement).toBe('Dealer button moved to Seat 2. Seat 4 is the Big Blind (BB).');
  });

  it('wraps the button past the last seat', () => {
    const moves: TrainerAction[] = new Array(6).fill({ type: 'move-button' });
    expect(run(createInitialTrainerState(), ...moves).button).toBe(0);
  });
});

describe('table size', () => {
  it('resets the button so it can never sit on a missing seat', () => {
    const nine = run(createInitialTrainerState(), {
      type: 'set-format',
      format: '9-max',
      random: 0,
    });
    const moved = run(nine, ...new Array<TrainerAction>(8).fill({ type: 'move-button' }));
    expect(moved.button).toBe(8);

    const six = run(moved, { type: 'set-format', format: '6-max', random: 0 });
    expect(six.button).toBe(0);
    expect(six.selectedSeat).toBe(0);
  });

  it('always asks about a position the new table has', () => {
    for (let i = 0; i < 20; i += 1) {
      const nine = run(createInitialTrainerState(), {
        type: 'set-format',
        format: '9-max',
        random: i / 20,
      });
      const six = run(nine, { type: 'set-format', format: '6-max', random: i / 20 });
      expect(TABLE_FORMATS['6-max'].clockwiseFromButton).toContain(six.target);
    }
  });

  it('clears an open answer and keeps the session score', () => {
    const answered = answerCorrectly(practice());
    const nine = run(answered, { type: 'set-format', format: '9-max', random: 0 });
    expect(nine.answer).toBeNull();
    expect(nine.score).toEqual({ correct: 1, answered: 1 });
  });

  it('ignores choosing the current size', () => {
    const state = createInitialTrainerState();
    expect(run(state, { type: 'set-format', format: '6-max', random: 0.5 })).toBe(state);
  });
});

describe('practice round', () => {
  it('accepts the right seat and scores it', () => {
    const state = answerCorrectly(practice());
    expect(state.answer).toEqual({ seat: 5, correct: true });
    expect(state.score).toEqual({ correct: 1, answered: 1 });
    expect(describeAnswer(state)).toBe(
      'Seat 6 is the Cutoff (CO): 1 seat counterclockwise from the button.',
    );
  });

  it('rejects a wrong seat and explains both seats', () => {
    const state = run(practice(), select(2));
    expect(state.answer).toEqual({ seat: 2, correct: false });
    expect(state.score).toEqual({ correct: 0, answered: 1 });
    expect(describeAnswer(state)).toBe(
      'Seat 3 is the Big Blind (BB). The Cutoff (CO) is Seat 6: 1 seat counterclockwise from the button.',
    );
  });

  it('agrees with the model for every seat, button and target', () => {
    for (const format of ['6-max', '9-max'] as const) {
      const positions = TABLE_FORMATS[format].clockwiseFromButton;
      for (let button = 0; button < positions.length; button += 1) {
        for (const target of positions) {
          for (let seat = 0; seat < positions.length; seat += 1) {
            const state = run({ ...practice(), format, button, target }, select(seat));
            expect(state.answer?.correct).toBe(positionOfSeat(format, button, seat) === target);
          }
        }
      }
    }
  });

  it('announces the feedback and the score', () => {
    expect(answerCorrectly(practice()).announcement).toMatch(/^Correct\..*Score: 1 of 1\.$/);
  });

  it('counts only the first answer to a question', () => {
    const answered = answerWrongly(practice());
    const again = run(answered, select(seatOfPosition('6-max', 0, 'CO')));
    expect(again).toBe(answered);
  });

  it('won’t skip a question that has not been answered', () => {
    const state = practice();
    expect(run(state, { type: 'next-question', random: 0 })).toBe(state);
  });

  it('moves the button clockwise and asks something new', () => {
    const answered = answerCorrectly(practice());
    const next = run(answered, { type: 'next-question', random: 0 });
    expect(next.button).toBe(1);
    expect(next.answer).toBeNull();
    expect(next.target).not.toBe('CO');
    expect(next.round).toBe(answered.round + 1);
    expect(next.announcement).toBe(
      `Dealer button moved to Seat 2. ${questionPrompt(next.target)}.`,
    );
  });

  it('adds up a whole session', () => {
    let state = practice();
    for (const correct of [true, false, true, true]) {
      state = correct ? answerCorrectly(state) : answerWrongly(state);
      state = run(state, { type: 'next-question', random: 0.4 });
    }
    expect(state.score).toEqual({ correct: 3, answered: 4 });
  });

  it('resets the score without changing the question', () => {
    const state = run(answerCorrectly(practice()), { type: 'reset-score' });
    expect(state.score).toEqual({ correct: 0, answered: 0 });
    expect(state.answer).not.toBeNull();
  });

  it('keeps explore and practice selections apart', () => {
    const state = run(answerCorrectly(practice()), { type: 'set-mode', mode: 'explore' }, select(1));
    expect(state.selectedSeat).toBe(1);
    expect(state.score.answered).toBe(1);
  });
});

describe('pickTarget', () => {
  const samples = Array.from({ length: 100 }, (_, index) => index / 100);

  it('can ask for the Button', () => {
    const asked = samples.map((random) => pickTarget('9-max', null, random));
    expect(asked).toContain('BTN');
  });

  it('never repeats the previous target', () => {
    for (const random of samples) expect(pickTarget('6-max', 'CO', random)).not.toBe('CO');
  });

  it('can reach every position on both tables', () => {
    for (const format of ['6-max', '9-max'] as const) {
      const seen = new Set<PositionId>(samples.map((random) => pickTarget(format, null, random)));
      expect(seen.size).toBe(TABLE_FORMATS[format].clockwiseFromButton.length);
    }
  });

  it('stays in range at the top of the random span', () => {
    expect(pickTarget('6-max', null, 0.999999)).toBeDefined();
  });
});

describe('wording', () => {
  it('numbers seats from 1 for people', () => {
    expect(seatName(0)).toBe('Seat 1');
    expect(describeSeat('9-max', 0, 4)).toBe('Seat 5 is Under the Gun +1 (UTG+1)');
  });

  it('uses natural phrasing in prompts', () => {
    expect(questionPrompt('UTG')).toBe('Find Under the Gun (UTG)');
    expect(questionPrompt('SB')).toBe('Find the Small Blind (SB)');
  });
});

describe('table layout', () => {
  it('puts seat 0 at the bottom center', () => {
    expect(seatPoint(0, 6)).toEqual({ left: 50, top: 50 + SEAT_RADIUS });
  });

  it('numbers seats clockwise as seen on screen', () => {
    for (const seats of [6, 9]) {
      const center = { left: 50, top: 50 };
      for (let seat = 0; seat < seats; seat += 1) {
        const a = seatPoint(seat, seats);
        const b = seatPoint((seat + 1) % seats, seats);
        // A positive cross product on a y-down screen is a clockwise turn.
        const cross =
          (a.left - center.left) * (b.top - center.top) -
          (a.top - center.top) * (b.left - center.left);
        expect(cross).toBeGreaterThan(0);
      }
    }
  });

  it('keeps every seat on the table', () => {
    for (const seats of [6, 9]) {
      for (let seat = 0; seat < seats; seat += 1) {
        const { left, top } = seatPoint(seat, seats);
        expect(Math.min(left, top)).toBeGreaterThanOrEqual(0);
        expect(Math.max(left, top)).toBeLessThanOrEqual(100);
      }
    }
  });
});
