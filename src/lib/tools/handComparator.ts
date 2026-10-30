// State for the P01 hand comparator. Pure and UI-free, so the rules that protect
// a scenario, such as "no card twice", can be unit tested without rendering.
import {
  CardValidationError,
  RANKS,
  assertValidCards,
  cardName,
  type CardCode,
  type Suit,
} from '../poker/cards';
import { evaluateBest, type EvaluatedHand } from '../poker/evaluate';
import { showdownFiveCard, showdownHoldem, type Showdown } from '../poker/showdown';

export type Mode = 'holdem' | 'five-card';
export type Slots = readonly (CardCode | null)[];

/** Slot positions per mode. One flat array holds every card in the scenario. */
export const LAYOUTS: Record<Mode, { a: number[]; b: number[]; board: number[] }> = {
  holdem: { a: [0, 1], b: [2, 3], board: [4, 5, 6, 7, 8] },
  'five-card': { a: [0, 1, 2, 3, 4], b: [5, 6, 7, 8, 9], board: [] },
};

const BOARD_LABELS = ['Flop 1', 'Flop 2', 'Flop 3', 'Turn', 'River'];

export function slotLabel(mode: Mode, slot: number): string {
  const { a, b, board } = LAYOUTS[mode];
  if (a.includes(slot)) return `Player A card ${a.indexOf(slot) + 1}`;
  if (b.includes(slot)) return `Player B card ${b.indexOf(slot) + 1}`;
  return BOARD_LABELS[board.indexOf(slot)];
}

function slotCount(mode: Mode): number {
  const { a, b, board } = LAYOUTS[mode];
  return a.length + b.length + board.length;
}

function emptySlots(mode: Mode): Slots {
  return new Array<CardCode | null>(slotCount(mode)).fill(null);
}

export interface Example {
  id: string;
  label: string;
  mode: Mode;
  cards: readonly CardCode[];
}

/** Teaching scenarios. The first one loads on page view. */
export const EXAMPLES: readonly Example[] = [
  {
    id: 'kicker',
    label: 'Kicker decides',
    mode: 'holdem',
    cards: ['As', 'Kd', 'Kh', 'Qc', 'Kc', '9d', '7s', '4h', '2c'],
  },
  {
    id: 'flush-straight',
    label: 'Flush vs. straight',
    mode: 'five-card',
    cards: ['9h', '8s', '7c', '6s', '5h', 'Kd', 'Jd', '8d', '5d', '2d'],
  },
  {
    id: 'wheel',
    label: 'Ace-low straight',
    mode: 'five-card',
    cards: ['Ah', '2d', '3c', '4s', '5h', '2c', '3d', '4h', '5s', '6d'],
  },
  {
    id: 'board',
    label: 'Split pot on the board',
    mode: 'holdem',
    cards: ['2c', '3d', '4h', '5h', 'As', 'Kd', 'Qh', 'Jc', 'Ts'],
  },
  {
    id: 'two-trips',
    label: 'Two sets of trips',
    mode: 'holdem',
    cards: ['9c', '9d', 'Kc', 'Qd', '9s', '4c', '4d', '4h', 'Kd'],
  },
];

export interface ComparatorState {
  mode: Mode;
  /** Each mode keeps its own cards, so switching back loses nothing. */
  slots: Record<Mode, Slots>;
  /** The slot the next picked card goes into. Always a valid slot. */
  active: number;
  /** Screen-reader announcement for the latest change. */
  announcement: string;
  /** Visible explanation when the latest action was refused. */
  notice: string | null;
}

export interface ComparatorView {
  slots: Slots;
  handA: EvaluatedHand | null;
  handB: EvaluatedHand | null;
  /** Set once every slot in the scenario is filled. */
  showdown: Showdown | null;
  /** Empty slots left before a showdown. */
  remaining: number;
}

function filled(slots: Slots, indexes: readonly number[]): CardCode[] {
  return indexes.flatMap((index) => slots[index] ?? []);
}

/** A hand can be read as soon as it has five cards, as on the flop or the turn. */
function partialHand(hole: readonly CardCode[], holeSize: number, board: readonly CardCode[]) {
  if (hole.length !== holeSize) return null;
  const cards = [...hole, ...board];
  return cards.length >= 5 ? evaluateBest(cards) : null;
}

export function deriveView(state: ComparatorState): ComparatorView {
  const { mode } = state;
  const slots = state.slots[mode];
  const layout = LAYOUTS[mode];
  const a = filled(slots, layout.a);
  const b = filled(slots, layout.b);
  const board = filled(slots, layout.board);
  const remaining = slots.filter((card) => card === null).length;

  let showdown: Showdown | null = null;
  if (remaining === 0) {
    showdown = mode === 'holdem' ? showdownHoldem(a, b, board) : showdownFiveCard(a, b);
  }

  return {
    slots,
    handA: showdown?.handA ?? partialHand(a, layout.a.length, board),
    handB: showdown?.handB ?? partialHand(b, layout.b.length, board),
    showdown,
    remaining,
  };
}

/** Short headline for a finished comparison. */
export function resultHeadline(showdown: Showdown): string {
  if (showdown.outcome === 'tie') return 'Split pot';
  return `Player ${showdown.outcome.toUpperCase()} wins`;
}

function describeResult(state: ComparatorState): string {
  const { showdown, remaining } = deriveView(state);
  if (showdown) return `${resultHeadline(showdown)}. ${showdown.explanation}`;
  return `${remaining} ${remaining === 1 ? 'card' : 'cards'} left to choose.`;
}

function nextEmptySlot(slots: Slots, from: number): number | null {
  for (let offset = 1; offset <= slots.length; offset += 1) {
    const slot = (from + offset) % slots.length;
    if (slots[slot] === null) return slot;
  }
  return null;
}

function withSlots(state: ComparatorState, slots: Slots, active: number): ComparatorState {
  return { ...state, slots: { ...state.slots, [state.mode]: slots }, active, notice: null };
}

function announced(state: ComparatorState, prefix: string): ComparatorState {
  return { ...state, announcement: `${prefix} ${describeResult(state)}` };
}

function loadCards(
  state: ComparatorState,
  mode: Mode,
  cards: readonly CardCode[],
  prefix: string,
): ComparatorState {
  if (cards.length !== slotCount(mode)) {
    throw new CardValidationError(`A ${mode} scenario needs ${slotCount(mode)} cards`);
  }
  assertValidCards(cards);
  return announced(
    { ...state, mode, slots: { ...state.slots, [mode]: cards }, active: 0, notice: null },
    prefix,
  );
}

export type ComparatorAction =
  | { type: 'pick-card'; card: CardCode }
  | { type: 'select-slot'; slot: number }
  | { type: 'remove-card' }
  | { type: 'clear' }
  | { type: 'set-mode'; mode: Mode }
  | { type: 'load-example'; id: string }
  /** The deck comes from the caller so this reducer stays deterministic. */
  | { type: 'load-random'; deck: readonly CardCode[] };

export function comparatorReducer(
  state: ComparatorState,
  action: ComparatorAction,
): ComparatorState {
  const slots = state.slots[state.mode];

  switch (action.type) {
    case 'pick-card': {
      const owner = slots.indexOf(action.card);
      if (owner === state.active) return state;
      if (owner !== -1) {
        const notice = `${cardName(action.card)} is already in ${slotLabel(state.mode, owner)}. A deck has only one of each card.`;
        return { ...state, notice, announcement: notice };
      }
      const updated = slots.map((card, index) => (index === state.active ? action.card : card));
      const next = nextEmptySlot(updated, state.active) ?? state.active;
      return announced(
        withSlots(state, updated, next),
        `${cardName(action.card)} placed in ${slotLabel(state.mode, state.active)}.`,
      );
    }
    case 'select-slot': {
      if (action.slot < 0 || action.slot >= slots.length) return state;
      const current = slots[action.slot];
      const label = slotLabel(state.mode, action.slot);
      return {
        ...state,
        active: action.slot,
        notice: null,
        announcement: `${label} selected. ${current ? cardName(current) : 'Empty'}.`,
      };
    }
    case 'remove-card': {
      const current = slots[state.active];
      if (!current) return state;
      const updated = slots.map((card, index) => (index === state.active ? null : card));
      return announced(
        withSlots(state, updated, state.active),
        `${cardName(current)} removed from ${slotLabel(state.mode, state.active)}.`,
      );
    }
    case 'clear':
      return announced(withSlots(state, emptySlots(state.mode), 0), 'All cards cleared.');
    case 'set-mode': {
      if (action.mode === state.mode) return state;
      const target = state.slots[action.mode];
      const active = target.indexOf(null) === -1 ? 0 : target.indexOf(null);
      return announced(
        { ...state, mode: action.mode, active, notice: null },
        action.mode === 'holdem' ? 'Texas Hold’em mode.' : 'Five-card mode.',
      );
    }
    case 'load-example': {
      const example = EXAMPLES.find(({ id }) => id === action.id);
      if (!example) return state;
      return loadCards(state, example.mode, example.cards, `${example.label} example loaded.`);
    }
    case 'load-random':
      return loadCards(
        state,
        state.mode,
        action.deck.slice(0, slotCount(state.mode)),
        'Random cards dealt.',
      );
  }
}

export function createInitialState(): ComparatorState {
  const [first] = EXAMPLES;
  const other: Mode = first.mode === 'holdem' ? 'five-card' : 'holdem';
  return {
    mode: first.mode,
    slots: { [first.mode]: first.cards, [other]: emptySlots(other) } as Record<Mode, Slots>,
    active: 0,
    announcement: '',
    notice: null,
  };
}

/** Picker order: strongest rank first, four suits in the usual bridge order. */
export const PICKER_SUITS: readonly Suit[] = ['s', 'h', 'd', 'c'];
export const PICKER_RANKS = [...RANKS].reverse();
const COLUMNS = 7;

export const PICKER_CARDS: readonly CardCode[] = PICKER_SUITS.flatMap((suit) =>
  PICKER_RANKS.map((rank): CardCode => `${rank}${suit}`),
);

/**
 * Arrow-key movement through the picker. Each suit is drawn as a row of seven
 * ranks over a row of six, so vertical moves cross suits at the row boundary.
 */
export function movePickerFocus(index: number, key: string): number {
  const perSuit = PICKER_RANKS.length;
  const suit = Math.floor(index / perSuit);
  const rank = index % perSuit;
  const at = (nextSuit: number, nextRank: number) =>
    nextSuit < 0 || nextSuit >= PICKER_SUITS.length ? index : nextSuit * perSuit + nextRank;

  switch (key) {
    case 'ArrowRight':
      return Math.min(index + 1, PICKER_CARDS.length - 1);
    case 'ArrowLeft':
      return Math.max(index - 1, 0);
    case 'ArrowDown':
      if (rank < COLUMNS) return at(suit, Math.min(rank + COLUMNS, perSuit - 1));
      return at(suit + 1, rank - COLUMNS);
    case 'ArrowUp':
      if (rank >= COLUMNS) return at(suit, rank - COLUMNS);
      return at(suit - 1, Math.min(rank + COLUMNS, perSuit - 1));
    case 'Home':
      return 0;
    case 'End':
      return PICKER_CARDS.length - 1;
    default:
      return index;
  }
}
