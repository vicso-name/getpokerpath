// The single source of truth for table positions. Seats are numbered from 0 in
// clockwise order, and every label, blind and acting order derives from
// `clockwiseFromButton` below, so no other file should define its own table.

export type PositionId = 'BTN' | 'SB' | 'BB' | 'UTG' | 'UTG1' | 'MP' | 'LJ' | 'HJ' | 'CO';
export type PositionGroup = 'early' | 'middle' | 'late' | 'blinds';
export type TableFormat = 'heads-up' | '6-max' | '9-max';
export type Street = 'preflop' | 'postflop';

export interface Position {
  id: PositionId;
  /** Short table label, for example `UTG+1`. */
  label: string;
  name: string;
  /** Name as used mid-sentence, for example `the Cutoff`. */
  reference: string;
  group: PositionGroup;
  description: string;
}

export const POSITIONS: Record<PositionId, Position> = {
  BTN: {
    id: 'BTN',
    label: 'BTN',
    name: 'Button',
    reference: 'the Button',
    group: 'late',
    description:
      'Marked by the dealer button. It acts last on every betting round after the flop, which makes it the most favorable seat at the table.',
  },
  SB: {
    id: 'SB',
    label: 'SB',
    name: 'Small Blind',
    reference: 'the Small Blind',
    group: 'blinds',
    description:
      'Posts the smaller forced bet before the cards are dealt, usually half the big blind. It acts first on every betting round after the flop.',
  },
  BB: {
    id: 'BB',
    label: 'BB',
    name: 'Big Blind',
    reference: 'the Big Blind',
    group: 'blinds',
    description:
      'Posts the larger forced bet before the cards are dealt. It acts last before the flop, then early on every later betting round.',
  },
  UTG: {
    id: 'UTG',
    label: 'UTG',
    name: 'Under the Gun',
    reference: 'Under the Gun',
    group: 'early',
    description:
      'First to act before the flop, with every other player still to act behind this seat.',
  },
  UTG1: {
    id: 'UTG1',
    label: 'UTG+1',
    name: 'Under the Gun +1',
    reference: 'Under the Gun +1',
    group: 'early',
    description: 'Acts straight after UTG. Most of the table is still to act behind this seat.',
  },
  MP: {
    id: 'MP',
    label: 'MP',
    name: 'Middle Position',
    reference: 'Middle Position',
    group: 'middle',
    description:
      'The first of the middle seats on a full table, also called UTG+2. Several players are still to act behind it.',
  },
  LJ: {
    id: 'LJ',
    label: 'LJ',
    name: 'Lojack',
    reference: 'the Lojack',
    group: 'middle',
    description: 'Sits just before the Hijack. Only a few players are left to act behind it.',
  },
  HJ: {
    id: 'HJ',
    label: 'HJ',
    name: 'Hijack',
    reference: 'the Hijack',
    group: 'middle',
    description:
      'The last middle seat, sitting just before the Cutoff. On a 6-max table it is also called MP.',
  },
  CO: {
    id: 'CO',
    label: 'CO',
    name: 'Cutoff',
    reference: 'the Cutoff',
    group: 'late',
    description:
      'Sits directly before the Button. Only the Button and the blinds act after it before the flop.',
  },
};

export const POSITION_GROUP_NAMES: Record<PositionGroup, string> = {
  early: 'Early position',
  middle: 'Middle position',
  late: 'Late position',
  blinds: 'Blinds',
};

interface FormatDefinition {
  name: string;
  /** Position at each seat, walking clockwise from the dealer button. */
  clockwiseFromButton: readonly PositionId[];
}

export const TABLE_FORMATS: Record<TableFormat, FormatDefinition> = {
  'heads-up': { name: 'Heads-up', clockwiseFromButton: ['BTN', 'BB'] },
  '6-max': { name: '6-max', clockwiseFromButton: ['BTN', 'SB', 'BB', 'UTG', 'HJ', 'CO'] },
  '9-max': {
    name: '9-max',
    clockwiseFromButton: ['BTN', 'SB', 'BB', 'UTG', 'UTG1', 'MP', 'LJ', 'HJ', 'CO'],
  },
};

export function seatCount(format: TableFormat): number {
  return TABLE_FORMATS[format].clockwiseFromButton.length;
}

function assertSeat(format: TableFormat, seat: number): void {
  if (!Number.isInteger(seat) || seat < 0 || seat >= seatCount(format)) {
    throw new RangeError(`No seat ${seat} at a ${format} table`);
  }
}

/** The position at a seat, given where the dealer button is. */
export function positionOfSeat(format: TableFormat, button: number, seat: number): PositionId {
  assertSeat(format, button);
  assertSeat(format, seat);
  const count = seatCount(format);
  return TABLE_FORMATS[format].clockwiseFromButton[(seat - button + count) % count];
}

/** The seat holding a position. Throws if the format has no such position. */
export function seatOfPosition(
  format: TableFormat,
  button: number,
  position: PositionId,
): number {
  assertSeat(format, button);
  const offset = TABLE_FORMATS[format].clockwiseFromButton.indexOf(position);
  if (offset === -1) throw new RangeError(`${position} does not exist at a ${format} table`);
  return (button + offset) % seatCount(format);
}

/** The button moves one seat clockwise after each hand. */
export function moveButton(format: TableFormat, button: number): number {
  assertSeat(format, button);
  return (button + 1) % seatCount(format);
}

/** Who posts each blind. Heads-up, the Button posts the small blind. */
export function blindSeats(
  format: TableFormat,
  button: number,
): { smallBlind: number; bigBlind: number } {
  return {
    smallBlind: seatOfPosition(format, button, format === 'heads-up' ? 'BTN' : 'SB'),
    bigBlind: seatOfPosition(format, button, 'BB'),
  };
}

/**
 * Acting order on a street, with every player still in the hand. Before the flop
 * action starts left of the big blind; after it, left of the button.
 */
export function actingOrder(format: TableFormat, street: Street): PositionId[] {
  const positions = TABLE_FORMATS[format].clockwiseFromButton;
  const start = street === 'preflop' ? positions.indexOf('BB') + 1 : 1;
  return positions.map((_, index) => positions[(start + index) % positions.length]);
}

/** 1-based turn in the acting order. */
export function actingTurn(format: TableFormat, street: Street, position: PositionId): number {
  return actingOrder(format, street).indexOf(position) + 1;
}

/** Where a position sits relative to the button, by the shorter way round. */
export function describeLocation(format: TableFormat, position: PositionId): string {
  const offset = TABLE_FORMATS[format].clockwiseFromButton.indexOf(position);
  if (offset === 0) return 'the seat with the dealer button';

  const count = seatCount(format);
  const clockwise = offset <= count / 2;
  const seats = clockwise ? offset : count - offset;
  return `${seats} ${seats === 1 ? 'seat' : 'seats'} ${clockwise ? 'clockwise' : 'counterclockwise'} from the button`;
}

/** `Cutoff (CO)` style title. */
export function positionTitle(position: PositionId): string {
  const { name, label } = POSITIONS[position];
  return `${name} (${label})`;
}

/** `the Cutoff (CO)` style mid-sentence reference. */
export function positionReference(position: PositionId): string {
  const { reference, label } = POSITIONS[position];
  return `${reference} (${label})`;
}
