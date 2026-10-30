import { describe, expect, it } from 'vitest';
import {
  POSITIONS,
  TABLE_FORMATS,
  actingOrder,
  actingTurn,
  blindSeats,
  describeLocation,
  moveButton,
  positionOfSeat,
  positionReference,
  positionTitle,
  seatCount,
  seatOfPosition,
  type PositionId,
  type TableFormat,
} from '../../lib/poker/positions';

const FORMATS: readonly TableFormat[] = ['heads-up', '6-max', '9-max'];
const seatsAround = (format: TableFormat) =>
  Array.from({ length: seatCount(format) }, (_, seat) => seat);

describe('table formats', () => {
  it('seats 2, 6 and 9 players', () => {
    expect(seatCount('heads-up')).toBe(2);
    expect(seatCount('6-max')).toBe(6);
    expect(seatCount('9-max')).toBe(9);
  });

  it('uses each position once per table', () => {
    for (const format of FORMATS) {
      const positions = TABLE_FORMATS[format].clockwiseFromButton;
      expect(new Set(positions).size).toBe(positions.length);
    }
  });

  it('has only the seats a 6-max table really has', () => {
    const positions = TABLE_FORMATS['6-max'].clockwiseFromButton;
    for (const missing of ['UTG1', 'MP', 'LJ'] as const) {
      expect(positions).not.toContain(missing);
    }
  });

  it('defines every position in the central model', () => {
    for (const format of FORMATS) {
      for (const id of TABLE_FORMATS[format].clockwiseFromButton) {
        expect(POSITIONS[id].id).toBe(id);
      }
    }
  });
});

describe('6-max positions', () => {
  it('runs BTN, SB, BB, UTG, HJ, CO clockwise from the button', () => {
    const labels = seatsAround('6-max').map((seat) => positionOfSeat('6-max', 0, seat));
    expect(labels).toEqual(['BTN', 'SB', 'BB', 'UTG', 'HJ', 'CO']);
  });

  it('wraps around the table when the button is on a later seat', () => {
    const labels = seatsAround('6-max').map((seat) => positionOfSeat('6-max', 4, seat));
    expect(labels).toEqual(['BB', 'UTG', 'HJ', 'CO', 'BTN', 'SB']);
  });
});

describe('9-max positions', () => {
  it('runs BTN through CO clockwise from the button', () => {
    const labels = seatsAround('9-max').map((seat) => positionOfSeat('9-max', 0, seat));
    expect(labels).toEqual(['BTN', 'SB', 'BB', 'UTG', 'UTG1', 'MP', 'LJ', 'HJ', 'CO']);
  });

  it('wraps around the table when the button is on a later seat', () => {
    const labels = seatsAround('9-max').map((seat) => positionOfSeat('9-max', 7, seat));
    expect(labels).toEqual(['BB', 'UTG', 'UTG1', 'MP', 'LJ', 'HJ', 'CO', 'BTN', 'SB']);
  });
});

describe('seat and position lookups', () => {
  it('are exact inverses for every button and seat', () => {
    for (const format of FORMATS) {
      for (const button of seatsAround(format)) {
        for (const seat of seatsAround(format)) {
          const position = positionOfSeat(format, button, seat);
          expect(seatOfPosition(format, button, position)).toBe(seat);
        }
      }
    }
  });

  it('give every seat a different position for any button', () => {
    for (const format of FORMATS) {
      for (const button of seatsAround(format)) {
        const positions = seatsAround(format).map((seat) => positionOfSeat(format, button, seat));
        expect(new Set(positions).size).toBe(seatCount(format));
      }
    }
  });

  it('rejects seats that do not exist', () => {
    expect(() => positionOfSeat('6-max', 6, 0)).toThrow(RangeError);
    expect(() => positionOfSeat('6-max', 0, 6)).toThrow(RangeError);
    expect(() => positionOfSeat('6-max', 0, -1)).toThrow(RangeError);
    expect(() => positionOfSeat('6-max', 0, 1.5)).toThrow(RangeError);
    expect(() => moveButton('9-max', 9)).toThrow(RangeError);
  });

  it('rejects positions the format does not have', () => {
    expect(() => seatOfPosition('6-max', 0, 'LJ')).toThrow(/does not exist/);
    expect(() => seatOfPosition('heads-up', 0, 'SB')).toThrow(/does not exist/);
  });
});

describe('dealer button movement', () => {
  it('moves one seat clockwise and wraps to the first seat', () => {
    expect(moveButton('6-max', 0)).toBe(1);
    expect(moveButton('6-max', 5)).toBe(0);
    expect(moveButton('9-max', 8)).toBe(0);
    expect(moveButton('heads-up', 1)).toBe(0);
  });

  it('visits every seat once per orbit', () => {
    for (const format of FORMATS) {
      const visited = [];
      let button = 0;
      for (let hand = 0; hand < seatCount(format); hand += 1) {
        visited.push(button);
        button = moveButton(format, button);
      }
      expect(new Set(visited).size).toBe(seatCount(format));
      expect(button).toBe(0);
    }
  });

  it('shifts every position one seat clockwise', () => {
    for (const format of FORMATS) {
      for (const button of seatsAround(format)) {
        const next = moveButton(format, button);
        for (const seat of seatsAround(format)) {
          const later = (seat + 1) % seatCount(format);
          expect(positionOfSeat(format, next, later)).toBe(positionOfSeat(format, button, seat));
        }
      }
    }
  });

  it('turns last hand’s small blind into the button', () => {
    const { smallBlind } = blindSeats('9-max', 2);
    expect(moveButton('9-max', 2)).toBe(smallBlind);
  });

  it('turns last hand’s big blind into the small blind', () => {
    const before = blindSeats('6-max', 3);
    const after = blindSeats('6-max', moveButton('6-max', 3));
    expect(after.smallBlind).toBe(before.bigBlind);
  });
});

describe('blinds', () => {
  it('sit directly clockwise of the button at 6-max and 9-max', () => {
    for (const format of ['6-max', '9-max'] as const) {
      for (const button of seatsAround(format)) {
        const count = seatCount(format);
        expect(blindSeats(format, button)).toEqual({
          smallBlind: (button + 1) % count,
          bigBlind: (button + 2) % count,
        });
      }
    }
  });

  it('wrap past the last seat', () => {
    expect(blindSeats('6-max', 5)).toEqual({ smallBlind: 0, bigBlind: 1 });
    expect(blindSeats('9-max', 7)).toEqual({ smallBlind: 8, bigBlind: 0 });
  });

  it('make the button the small blind heads-up', () => {
    expect(blindSeats('heads-up', 0)).toEqual({ smallBlind: 0, bigBlind: 1 });
    expect(blindSeats('heads-up', 1)).toEqual({ smallBlind: 1, bigBlind: 0 });
  });

  it('are never the normal opening seats', () => {
    for (const format of ['6-max', '9-max'] as const) {
      expect(actingOrder(format, 'preflop')[0]).toBe('UTG');
      expect(actingOrder(format, 'preflop').slice(-2)).toEqual(['SB', 'BB']);
    }
  });
});

describe('acting order', () => {
  it('starts left of the big blind before the flop', () => {
    expect(actingOrder('6-max', 'preflop')).toEqual(['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB']);
    expect(actingOrder('9-max', 'preflop')).toEqual([
      'UTG',
      'UTG1',
      'MP',
      'LJ',
      'HJ',
      'CO',
      'BTN',
      'SB',
      'BB',
    ]);
  });

  it('starts left of the button after the flop, ending on it', () => {
    expect(actingOrder('6-max', 'postflop')).toEqual(['SB', 'BB', 'UTG', 'HJ', 'CO', 'BTN']);
    expect(actingOrder('9-max', 'postflop').at(0)).toBe('SB');
    expect(actingOrder('9-max', 'postflop').at(-1)).toBe('BTN');
  });

  it('reverses for heads-up: the button acts first before the flop, last after', () => {
    expect(actingOrder('heads-up', 'preflop')).toEqual(['BTN', 'BB']);
    expect(actingOrder('heads-up', 'postflop')).toEqual(['BB', 'BTN']);
  });

  it('reports turns from 1', () => {
    expect(actingTurn('6-max', 'preflop', 'UTG')).toBe(1);
    expect(actingTurn('6-max', 'preflop', 'BB')).toBe(6);
    expect(actingTurn('6-max', 'postflop', 'CO')).toBe(5);
    expect(actingTurn('9-max', 'postflop', 'BTN')).toBe(9);
  });

  it('includes every player exactly once', () => {
    for (const format of FORMATS) {
      for (const street of ['preflop', 'postflop'] as const) {
        expect([...actingOrder(format, street)].sort()).toEqual(
          [...TABLE_FORMATS[format].clockwiseFromButton].sort(),
        );
      }
    }
  });
});

describe('position wording', () => {
  it.each<[TableFormat, PositionId, string]>([
    ['6-max', 'BTN', 'the seat with the dealer button'],
    ['6-max', 'SB', '1 seat clockwise from the button'],
    ['6-max', 'BB', '2 seats clockwise from the button'],
    ['6-max', 'UTG', '3 seats clockwise from the button'],
    ['6-max', 'HJ', '2 seats counterclockwise from the button'],
    ['6-max', 'CO', '1 seat counterclockwise from the button'],
    ['9-max', 'UTG', '3 seats clockwise from the button'],
    ['9-max', 'UTG1', '4 seats clockwise from the button'],
    ['9-max', 'MP', '4 seats counterclockwise from the button'],
    ['9-max', 'LJ', '3 seats counterclockwise from the button'],
    ['9-max', 'CO', '1 seat counterclockwise from the button'],
  ])('%s %s is %s', (format, position, location) => {
    expect(describeLocation(format, position)).toBe(location);
  });

  it('builds titles and references', () => {
    expect(positionTitle('UTG1')).toBe('Under the Gun +1 (UTG+1)');
    expect(positionReference('CO')).toBe('the Cutoff (CO)');
    expect(positionReference('UTG')).toBe('Under the Gun (UTG)');
  });

  it('groups seats by how late they act', () => {
    const group = (id: PositionId) => POSITIONS[id].group;
    expect(['UTG', 'UTG1'].map((id) => group(id as PositionId))).toEqual(['early', 'early']);
    expect(['MP', 'LJ', 'HJ'].map((id) => group(id as PositionId))).toEqual([
      'middle',
      'middle',
      'middle',
    ]);
    expect(['CO', 'BTN'].map((id) => group(id as PositionId))).toEqual(['late', 'late']);
    expect(['SB', 'BB'].map((id) => group(id as PositionId))).toEqual(['blinds', 'blinds']);
  });
});
