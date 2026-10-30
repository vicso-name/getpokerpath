import {
  POSITIONS,
  actingOrder,
  type PositionId,
  type Street,
  type TableFormat,
} from '../../lib/poker/positions';
import styles from './ActingOrder.module.css';

const STREETS: readonly { street: Street; title: string }[] = [
  { street: 'preflop', title: 'Before the flop' },
  { street: 'postflop', title: 'After the flop' },
];

interface ActingOrderProps {
  format: TableFormat;
  highlight?: PositionId;
}

/** The order players act in, as text, so it never depends on the table graphic. */
export function ActingOrder({ format, highlight }: ActingOrderProps) {
  return (
    <div className={styles.order}>
      {STREETS.map(({ street, title }) => (
        <div key={street}>
          <p className={styles.title}>{title}</p>
          <ol className={styles.list}>
            {actingOrder(format, street).map((position) => (
              <li
                key={position}
                className={position === highlight ? styles.current : undefined}
                aria-current={position === highlight ? 'true' : undefined}
              >
                {POSITIONS[position].label}
              </li>
            ))}
          </ol>
        </div>
      ))}
      <p className={styles.note}>
        Assumes every player is still in the hand on that betting round. Anyone who has folded is
        skipped.
      </p>
    </div>
  );
}
