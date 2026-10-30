import { useEffect, useMemo, useReducer, useRef } from 'react';
import { cardControlName, cardName, shuffleDeck, type CardCode } from '../../lib/poker/cards';
import type { EvaluatedHand } from '../../lib/poker/evaluate';
import {
  EXAMPLES,
  LAYOUTS,
  comparatorReducer,
  createInitialState,
  deriveView,
  resultHeadline,
  slotLabel,
  type Mode,
} from '../../lib/tools/handComparator';
import { CardFace } from '../poker/CardFace';
import { CardPicker } from '../poker/CardPicker';
import { SegmentedControl, type SegmentOption } from '../ui/SegmentedControl';
import styles from './HandComparator.module.css';

const MODES: readonly SegmentOption<Mode>[] = [
  { value: 'holdem', label: 'Texas Hold’em', hint: '2 hole cards + 5 on the board' },
  { value: 'five-card', label: 'Five-card hands', hint: '5 cards each' },
];

interface SlotProps {
  card: CardCode | null;
  label: string;
  active: boolean;
  onSelect: () => void;
}

function Slot({ card, label, active, onSelect }: SlotProps) {
  return (
    <button
      type="button"
      className={`${styles.slot} ${active ? styles.slotActive : ''}`}
      aria-pressed={active}
      aria-label={`${label}: ${card ? cardControlName(card) : 'empty'}`}
      onClick={onSelect}
    >
      {card ? <CardFace card={card} decorative /> : <span className={styles.slotEmpty} aria-hidden="true" />}
    </button>
  );
}

interface HandGroupProps {
  title: string;
  slots: readonly number[];
  mode: Mode;
  cards: readonly (CardCode | null)[];
  active: number;
  hand?: EvaluatedHand | null;
  onSelect: (slot: number) => void;
}

function HandGroup({ title, slots, mode, cards, active, hand, onSelect }: HandGroupProps) {
  return (
    <div className={styles.group} role="group" aria-label={title}>
      <h3 className={styles.groupTitle}>{title}</h3>
      <div className={styles.slots}>
        {slots.map((slot) => (
          <Slot
            key={slot}
            card={cards[slot]}
            label={slotLabel(mode, slot)}
            active={slot === active}
            onSelect={() => onSelect(slot)}
          />
        ))}
      </div>
      {hand !== undefined && (
        <p className={styles.handName} data-testid={`hand-${title}`}>
          {hand ? hand.description : 'Waiting for cards'}
        </p>
      )}
    </div>
  );
}

function BestFive({ name, hand, won }: { name: string; hand: EvaluatedHand; won: boolean }) {
  return (
    <div className={styles.bestFive}>
      <p className={styles.bestFiveName}>
        {name}: <strong>{hand.description}</strong>
        {won && ' (winner)'}
      </p>
      <div
        className={styles.bestFiveCards}
        role="img"
        aria-label={`Best five cards: ${hand.cards.map(cardName).join(', ')}`}
      >
        {hand.cards.map((card) => (
          <CardFace key={card} card={card} decorative />
        ))}
      </div>
    </div>
  );
}

export function HandComparator() {
  const [state, dispatch] = useReducer(comparatorReducer, undefined, createInitialState);
  const view = useMemo(() => deriveView(state), [state]);
  const { mode, active, announcement, notice } = state;
  const { slots, handA, handB, showdown, remaining } = view;
  const layout = LAYOUTS[mode];

  const usedBy = useMemo(() => {
    const owners = new Map<CardCode, string>();
    slots.forEach((card, slot) => {
      if (card) owners.set(card, slotLabel(mode, slot));
    });
    return owners;
  }, [slots, mode]);

  // On phones the result sits above the deck, so bring it into view on completion.
  const resultRef = useRef<HTMLDivElement>(null);
  const previousRemaining = useRef(remaining);
  useEffect(() => {
    if (previousRemaining.current > 0 && remaining === 0) {
      resultRef.current?.scrollIntoView({ block: 'nearest' });
    }
    previousRemaining.current = remaining;
  }, [remaining]);

  const selectSlot = (slot: number) => dispatch({ type: 'select-slot', slot });

  return (
    <div className="tool-panel">
      <h2 className={styles.title}>Compare two poker hands</h2>

      <SegmentedControl
        legend="Game format"
        name="comparator-mode"
        options={MODES}
        value={mode}
        onChange={(value) => dispatch({ type: 'set-mode', mode: value })}
      />

      <div className={styles.workspace}>
        <div className={styles.table}>
          <div className={mode === 'holdem' ? styles.playersSideBySide : styles.playersStacked}>
            <HandGroup
              title="Player A"
              slots={layout.a}
              mode={mode}
              cards={slots}
              active={active}
              hand={handA}
              onSelect={selectSlot}
            />
            <HandGroup
              title="Player B"
              slots={layout.b}
              mode={mode}
              cards={slots}
              active={active}
              hand={handB}
              onSelect={selectSlot}
            />
          </div>
          {layout.board.length > 0 && (
            <HandGroup
              title="Board"
              slots={layout.board}
              mode={mode}
              cards={slots}
              active={active}
              onSelect={selectSlot}
            />
          )}

          <div className={styles.result} ref={resultRef} data-testid="result">
            {showdown ? (
              <>
                <p className={styles.headline}>{resultHeadline(showdown)}</p>
                <p>{showdown.explanation}</p>
                <BestFive name="Player A" hand={showdown.handA} won={showdown.outcome === 'a'} />
                <BestFive name="Player B" hand={showdown.handB} won={showdown.outcome === 'b'} />
              </>
            ) : (
              <>
                <p className={styles.headline}>
                  {remaining} {remaining === 1 ? 'card' : 'cards'} to go
                </p>
                <p>Fill every slot to compare the two hands.</p>
              </>
            )}
          </div>
          <div className={styles.examples} role="group" aria-labelledby="comparator-examples">
            <p id="comparator-examples" className={styles.examplesTitle}>
              Try an example
            </p>
            {EXAMPLES.map((example) => (
              <button
                key={example.id}
                type="button"
                className={styles.chip}
                onClick={() => dispatch({ type: 'load-example', id: example.id })}
              >
                {example.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.deck}>
          <h3 className={styles.deckTitle}>
            Choose a card for <span data-testid="active-slot">{slotLabel(mode, active)}</span>
          </h3>
          <p className={styles.deckHint}>
            Select any slot to change it. With a keyboard, arrow keys move through the deck.
          </p>
          {notice && (
            <p className={styles.notice} data-testid="notice">
              <strong>Not allowed:</strong> {notice}
            </p>
          )}
          <CardPicker usedBy={usedBy} onPick={(card) => dispatch({ type: 'pick-card', card })} />
          <div className={styles.actions}>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => dispatch({ type: 'load-random', deck: shuffleDeck() })}
            >
              Random hands
            </button>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => dispatch({ type: 'remove-card' })}
              disabled={slots[active] === null}
            >
              Remove card
            </button>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => dispatch({ type: 'clear' })}
            >
              Clear all
            </button>
          </div>
        </div>
      </div>

      <p className="visually-hidden" role="status" data-testid="announcer">
        {announcement}
      </p>
    </div>
  );
}
