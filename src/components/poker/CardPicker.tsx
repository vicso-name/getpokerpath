import { useRef, useState, type KeyboardEvent } from 'react';
import {
  SUIT_NAMES,
  SUIT_SYMBOLS,
  cardControlName,
  cardRankLabel,
  type CardCode,
} from '../../lib/poker/cards';
import {
  PICKER_CARDS,
  PICKER_RANKS,
  PICKER_SUITS,
  movePickerFocus,
} from '../../lib/tools/handComparator';
import styles from './CardPicker.module.css';

interface CardPickerProps {
  /** Label of the slot that owns each card already in use. */
  usedBy: ReadonlyMap<CardCode, string>;
  onPick: (card: CardCode) => void;
}

const NAVIGATION_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']);

export function CardPicker({ usedBy, onPick }: CardPickerProps) {
  // Roving tabindex: one tab stop for the whole deck, arrow keys inside it.
  const [focusIndex, setFocusIndex] = useState(0);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!NAVIGATION_KEYS.has(event.key)) return;
    event.preventDefault();
    const next = movePickerFocus(focusIndex, event.key);
    setFocusIndex(next);
    buttons.current[next]?.focus();
  }

  return (
    <div className={styles.picker} onKeyDown={handleKeyDown}>
      {PICKER_SUITS.map((suit, suitIndex) => (
        <div key={suit} role="group" aria-label={SUIT_NAMES[suit]} className={styles.suit}>
          <span className={styles.suitName} aria-hidden="true">
            {SUIT_SYMBOLS[suit]} {SUIT_NAMES[suit]}
          </span>
          <div className={styles.cards}>
            {PICKER_RANKS.map((_, rankIndex) => {
              const index = suitIndex * PICKER_RANKS.length + rankIndex;
              const card = PICKER_CARDS[index];
              const owner = usedBy.get(card);
              const isRed = suit === 'd' || suit === 'h';

              return (
                <button
                  key={card}
                  ref={(element) => {
                    buttons.current[index] = element;
                  }}
                  type="button"
                  className={`${styles.card} ${isRed ? styles.red : ''} ${owner ? styles.used : ''}`}
                  tabIndex={index === focusIndex ? 0 : -1}
                  // aria-disabled, not disabled: keyboard focus must survive picking a card.
                  aria-disabled={owner ? true : undefined}
                  aria-label={
                    owner ? `${cardControlName(card)}, in ${owner}` : cardControlName(card)
                  }
                  onClick={() => onPick(card)}
                  onFocus={() => setFocusIndex(index)}
                >
                  {cardRankLabel(card)}
                  <span className={styles.cardSuit} data-symbol={SUIT_SYMBOLS[suit]} />
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
