import { describe, expect, it } from 'vitest';
import { createDeck, findDuplicateCards, type CardCode } from '../../lib/poker/cards';
import {
  EXAMPLES,
  LAYOUTS,
  PICKER_CARDS,
  comparatorReducer,
  createInitialState,
  deriveView,
  movePickerFocus,
  resultHeadline,
  slotLabel,
  type ComparatorAction,
  type ComparatorState,
} from '../../lib/tools/handComparator';

const run = (state: ComparatorState, ...actions: ComparatorAction[]) =>
  actions.reduce(comparatorReducer, state);
const pick = (card: CardCode): ComparatorAction => ({ type: 'pick-card', card });
const cleared = () => run(createInitialState(), { type: 'clear' });
const cardsOf = (state: ComparatorState) => state.slots[state.mode].filter(Boolean) as CardCode[];

describe('initial state', () => {
  it('opens on a complete example with a real result', () => {
    const view = deriveView(createInitialState());
    expect(view.remaining).toBe(0);
    expect(view.showdown?.outcome).toBe('a');
    expect(view.showdown?.decidedBy).toBe('tiebreak');
  });
});

describe('examples', () => {
  it.each([
    ['kicker', 'Player A wins', 'tiebreak'],
    ['flush-straight', 'Player B wins', 'category'],
    ['wheel', 'Player B wins', 'tiebreak'],
    ['board', 'Split pot', 'tie'],
    ['two-trips', 'Player A wins', 'tiebreak'],
  ])('%s shows what its label promises', (id, headline, decidedBy) => {
    const { showdown } = deriveView(run(createInitialState(), { type: 'load-example', id }));
    expect(showdown && resultHeadline(showdown)).toBe(headline);
    expect(showdown?.decidedBy).toBe(decidedBy);
  });

  it('never repeats a card and fills every slot', () => {
    for (const example of EXAMPLES) {
      const { a, b, board } = LAYOUTS[example.mode];
      expect(example.cards).toHaveLength(a.length + b.length + board.length);
      expect(findDuplicateCards(example.cards)).toEqual([]);
    }
  });

  it('switches to the example’s own mode', () => {
    const state = run(createInitialState(), { type: 'load-example', id: 'wheel' });
    expect(state.mode).toBe('five-card');
  });

  it('ignores an unknown example', () => {
    const state = createInitialState();
    expect(run(state, { type: 'load-example', id: 'nope' })).toBe(state);
  });
});

describe('picking cards', () => {
  it('fills the active slot and moves to the next empty one', () => {
    const state = run(cleared(), pick('As'));
    expect(state.slots.holdem[0]).toBe('As');
    expect(state.active).toBe(1);
  });

  it('skips filled slots and wraps around', () => {
    const state = run(cleared(), { type: 'select-slot', slot: 8 }, pick('As'), pick('Kd'));
    expect(state.slots.holdem[8]).toBe('As');
    expect(state.slots.holdem[0]).toBe('Kd');
    expect(state.active).toBe(1);
  });

  it('refuses a card already used elsewhere, leaving the scenario unchanged', () => {
    const before = run(cleared(), pick('As'));
    const after = run(before, pick('As'));
    expect(after.slots).toBe(before.slots);
    expect(after.active).toBe(before.active);
    expect(after.notice).toBe(
      'Ace of spades is already in Player A card 1. A deck has only one of each card.',
    );
    expect(after.announcement).toBe(after.notice);
  });

  it('clears the notice after the next valid action', () => {
    const state = run(cleared(), pick('As'), pick('As'), pick('Kd'));
    expect(state.notice).toBeNull();
  });

  it('treats re-picking the active slot’s own card as a no-op', () => {
    const before = run(cleared(), pick('As'), { type: 'select-slot', slot: 0 });
    expect(run(before, pick('As'))).toBe(before);
  });

  it('replaces a filled slot and returns the old card to the deck', () => {
    const state = run(cleared(), pick('As'), { type: 'select-slot', slot: 0 }, pick('Kd'));
    expect(cardsOf(state)).toEqual(['Kd']);
    expect(run(state, pick('As')).notice).toBeNull();
  });

  it('stays on the same slot once every slot is full, for quick what-if swaps', () => {
    const state = run(createInitialState(), { type: 'select-slot', slot: 8 }, pick('3s'));
    expect(state.active).toBe(8);
    expect(state.slots.holdem[8]).toBe('3s');
  });

  it('never allows a duplicate across a long sequence of picks', () => {
    let state = cleared();
    const deck = createDeck();
    for (let i = 0; i < 200; i += 1) {
      state = run(state, pick(deck[(i * 7) % 52]), {
        type: 'select-slot',
        slot: (i * 5) % 9,
      });
      expect(findDuplicateCards(cardsOf(state))).toEqual([]);
    }
  });
});

describe('removing and clearing', () => {
  it('removes the active card and keeps that slot active', () => {
    const state = run(cleared(), pick('As'), { type: 'select-slot', slot: 0 }, {
      type: 'remove-card',
    });
    expect(cardsOf(state)).toEqual([]);
    expect(state.active).toBe(0);
  });

  it('does nothing when the active slot is empty', () => {
    const state = cleared();
    expect(run(state, { type: 'remove-card' })).toBe(state);
  });

  it('clears only the current mode', () => {
    const state = run(createInitialState(), { type: 'load-example', id: 'wheel' }, { type: 'clear' });
    expect(cardsOf(state)).toEqual([]);
    expect(state.slots.holdem.every(Boolean)).toBe(true);
  });
});

describe('modes', () => {
  it('keeps each mode’s cards when switching back and forth', () => {
    const state = run(
      createInitialState(),
      { type: 'set-mode', mode: 'five-card' },
      pick('As'),
      { type: 'set-mode', mode: 'holdem' },
      { type: 'set-mode', mode: 'five-card' },
    );
    expect(state.slots['five-card'][0]).toBe('As');
    expect(state.slots.holdem.every(Boolean)).toBe(true);
  });

  it('lets the same card appear in separate modes', () => {
    const state = run(createInitialState(), { type: 'set-mode', mode: 'five-card' }, pick('As'));
    expect(state.notice).toBeNull();
  });

  it('activates the first empty slot on arrival', () => {
    const state = run(createInitialState(), { type: 'set-mode', mode: 'five-card' });
    expect(state.active).toBe(0);
    expect(run(state, pick('As'), { type: 'set-mode', mode: 'holdem' }).active).toBe(0);
  });
});

describe('deriveView', () => {
  it('waits for two hole cards and a flop before reading a Hold’em hand', () => {
    expect(deriveView(run(cleared(), pick('As'), pick('Ad'))).handA).toBeNull();
    const flop = run(
      cleared(),
      pick('As'),
      pick('Ad'),
      { type: 'select-slot', slot: 4 },
      pick('Ks'),
      pick('Kd'),
      pick('2c'),
    );
    expect(deriveView(flop).handA?.description).toBe('Two Pair, Aces and Kings');
    expect(deriveView(flop).handB).toBeNull();
    expect(deriveView(flop).showdown).toBeNull();
    expect(deriveView(flop).remaining).toBe(4);
  });

  it('counts the turn card before the river', () => {
    const turn = run(
      cleared(),
      pick('As'),
      pick('Ad'),
      { type: 'select-slot', slot: 4 },
      pick('Ks'),
      pick('Kd'),
      pick('2c'),
      pick('Kh'),
    );
    expect(deriveView(turn).handA?.description).toBe('Full House, Kings full of Aces');
  });

  it('reads a five-card hand only when complete', () => {
    const start = run(createInitialState(), { type: 'set-mode', mode: 'five-card' });
    const four = run(start, pick('As'), pick('Ks'), pick('Qs'), pick('Js'));
    expect(deriveView(four).handA).toBeNull();
    expect(deriveView(run(four, pick('Ts'))).handA?.category).toBe('royal-flush');
  });
});

describe('random deal', () => {
  it('fills every slot from the given deck', () => {
    const state = run(cleared(), { type: 'load-random', deck: createDeck() });
    expect(deriveView(state).remaining).toBe(0);
    expect(cardsOf(state)).toEqual(createDeck().slice(0, 9));
  });

  it('refuses a deck with repeated cards', () => {
    const deck = new Array<CardCode>(52).fill('As');
    expect(() => run(cleared(), { type: 'load-random', deck })).toThrow(/Duplicate/);
  });
});

describe('accessible announcements', () => {
  it('describes each placement and what remains', () => {
    expect(run(cleared(), pick('As')).announcement).toBe(
      'Ace of spades placed in Player A card 1. 8 cards left to choose.',
    );
  });

  it('announces the result when the last card lands', () => {
    const state = run(
      createInitialState(),
      { type: 'select-slot', slot: 8 },
      { type: 'remove-card' },
      pick('2c'),
    );
    expect(state.announcement).toMatch(/^Two of clubs placed in River\. Player A wins\./);
  });
});

describe('slot labels', () => {
  it('names every position in plain English', () => {
    expect(slotLabel('holdem', 0)).toBe('Player A card 1');
    expect(slotLabel('holdem', 3)).toBe('Player B card 2');
    expect(slotLabel('holdem', 4)).toBe('Flop 1');
    expect(slotLabel('holdem', 7)).toBe('Turn');
    expect(slotLabel('holdem', 8)).toBe('River');
    expect(slotLabel('five-card', 9)).toBe('Player B card 5');
  });
});

describe('picker keyboard movement', () => {
  it('lists all 52 cards once', () => {
    expect(new Set(PICKER_CARDS).size).toBe(52);
  });

  it('moves left and right through the whole deck, stopping at the ends', () => {
    expect(movePickerFocus(0, 'ArrowLeft')).toBe(0);
    expect(movePickerFocus(0, 'ArrowRight')).toBe(1);
    expect(movePickerFocus(12, 'ArrowRight')).toBe(13);
    expect(movePickerFocus(51, 'ArrowRight')).toBe(51);
  });

  it('moves between the two rows of a suit', () => {
    expect(movePickerFocus(0, 'ArrowDown')).toBe(7);
    expect(movePickerFocus(7, 'ArrowUp')).toBe(0);
  });

  it('clamps the seventh column, which has no card below it', () => {
    expect(movePickerFocus(6, 'ArrowDown')).toBe(12);
  });

  it('crosses suits at the row boundary', () => {
    expect(movePickerFocus(7, 'ArrowDown')).toBe(13);
    expect(movePickerFocus(13, 'ArrowUp')).toBe(7);
    expect(movePickerFocus(19, 'ArrowUp')).toBe(12);
  });

  it('stops at the top and bottom', () => {
    expect(movePickerFocus(3, 'ArrowUp')).toBe(3);
    expect(movePickerFocus(48, 'ArrowDown')).toBe(48);
  });

  it('supports Home and End and ignores other keys', () => {
    expect(movePickerFocus(20, 'Home')).toBe(0);
    expect(movePickerFocus(20, 'End')).toBe(51);
    expect(movePickerFocus(20, 'a')).toBe(20);
  });
});
