import { SUIT_SYMBOLS, cardName, cardRank, cardSuit, type CardCode } from '../../lib/poker/cards';
import styles from './CardFace.module.css';

interface CardFaceProps {
  card: CardCode;
  /** Hides the card from assistive tech when it is purely ornamental. */
  decorative?: boolean;
}

export function CardFace({ card, decorative = false }: CardFaceProps) {
  const suit = cardSuit(card);
  const isRed = suit === 'd' || suit === 'h';
  const accessibility = decorative
    ? { 'aria-hidden': true }
    : { role: 'img', 'aria-label': cardName(card) };

  return (
    <span className={`${styles.card} ${isRed ? styles.red : styles.black}`} {...accessibility}>
      <span className={styles.rank}>{cardRank(card) === 'T' ? '10' : cardRank(card)}</span>
      <span className={styles.suit}>{SUIT_SYMBOLS[suit]}</span>
    </span>
  );
}
