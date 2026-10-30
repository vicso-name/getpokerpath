import {
  POSITIONS,
  TABLE_FORMATS,
  positionOfSeat,
  seatCount,
  type TableFormat,
} from '../../lib/poker/positions';
import { DEALER_CHIP_RADIUS, seatPoint, type TablePoint } from '../../lib/tools/tableLayout';
import { seatName } from '../../lib/tools/positionsTrainer';
import styles from './PokerTable.module.css';

export type SeatStatus = 'selected' | 'correct' | 'wrong';

interface PokerTableProps {
  format: TableFormat;
  button: number;
  /** Shows position labels. Practice mode hides them until the answer is in. */
  showLabels?: boolean;
  seatStatus?: (seat: number) => SeatStatus | undefined;
  /** Makes seats interactive. Without it the table is a labeled illustration. */
  onSeatSelect?: (seat: number) => void;
  /** Marks seats as finished, for example once a question is answered. */
  seatsLocked?: boolean;
}

const pointStyle = ({ left, top }: TablePoint) => ({ left: `${left}%`, top: `${top}%` });

function describeTable(format: TableFormat, button: number): string {
  const seats = Array.from({ length: seatCount(format) }, (_, seat) => {
    return `${seatName(seat)} ${POSITIONS[positionOfSeat(format, button, seat)].label}`;
  });
  return `${TABLE_FORMATS[format].name} poker table, clockwise: ${seats.join(', ')}.`;
}

export function PokerTable({
  format,
  button,
  showLabels = true,
  seatStatus,
  onSeatSelect,
  seatsLocked = false,
}: PokerTableProps) {
  const seats = seatCount(format);
  const isInteractive = Boolean(onSeatSelect);

  return (
    <div
      className={styles.table}
      {...(isInteractive
        ? { role: 'group', 'aria-label': `${TABLE_FORMATS[format].name} poker table` }
        : { role: 'img', 'aria-label': describeTable(format, button) })}
    >
      <div className={styles.felt} aria-hidden="true">
        <span>Action moves clockwise</span>
      </div>
      <span
        className={styles.dealerChip}
        style={pointStyle(seatPoint(button, seats, DEALER_CHIP_RADIUS))}
        aria-hidden="true"
        data-testid="dealer-chip"
      >
        D
      </span>

      <ul className={styles.seats} aria-hidden={isInteractive ? undefined : true}>
        {Array.from({ length: seats }, (_, seat) => {
          const position = POSITIONS[positionOfSeat(format, button, seat)];
          const status = seatStatus?.(seat);
          const isDealer = seat === button;
          const className = `${styles.seat} ${status ? styles[status] : ''} ${isDealer ? styles.dealerSeat : ''}`;
          const content = (
            <>
              <span className={styles.seatNumber}>{seatName(seat)}</span>{' '}
              {showLabels && <span className={styles.seatLabel}>{position.label}</span>}
            </>
          );

          return (
            <li key={seat} className={styles.seatSlot} style={pointStyle(seatPoint(seat, seats))}>
              {isInteractive ? (
                <button
                  type="button"
                  className={className}
                  aria-label={[
                    showLabels ? `${seatName(seat)} ${position.label}, ${position.name}` : seatName(seat),
                    isDealer ? 'dealer button' : '',
                    status === 'correct' ? 'correct seat' : '',
                    status === 'wrong' ? 'your answer, incorrect' : '',
                  ]
                    .filter(Boolean)
                    .join(', ')}
                  aria-pressed={showLabels && !seatsLocked ? status === 'selected' : undefined}
                  aria-disabled={seatsLocked ? true : undefined}
                  data-testid={`seat-${seat + 1}`}
                  data-status={status}
                  onClick={() => onSeatSelect?.(seat)}
                >
                  {content}
                </button>
              ) : (
                <span className={className}>{content}</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
