import { useEffect, useReducer, useRef } from 'react';
import {
  POSITIONS,
  POSITION_GROUP_NAMES,
  actingTurn,
  describeLocation,
  positionOfSeat,
  positionTitle,
  seatCount,
  seatOfPosition,
} from '../../lib/poker/positions';
import {
  answerVerdict,
  createInitialTrainerState,
  describeAnswer,
  questionPrompt,
  seatName,
  trainerReducer,
  type TrainerFormat,
  type TrainerMode,
} from '../../lib/tools/positionsTrainer';
import { ActingOrder } from '../poker/ActingOrder';
import { PokerTable, type SeatStatus } from '../poker/PokerTable';
import { SegmentedControl } from '../ui/SegmentedControl';
import styles from './PositionsTrainer.module.css';

const MODES = [
  { value: 'explore', label: 'Explore' },
  { value: 'practice', label: 'Practice' },
] as const satisfies readonly { value: TrainerMode; label: string }[];

const FORMATS = [
  { value: '6-max', label: '6-max' },
  { value: '9-max', label: '9-max' },
] as const satisfies readonly { value: TrainerFormat; label: string }[];

export function PositionsTrainer() {
  const [state, dispatch] = useReducer(trainerReducer, undefined, createInitialTrainerState);
  const { mode, format, button, selectedSeat, target, answer, round, score, announcement } = state;
  const isPractice = mode === 'practice';

  // Keep keyboard users in the flow: answer, then Next, then the new question.
  const nextRef = useRef<HTMLButtonElement>(null);
  const promptRef = useRef<HTMLHeadingElement>(null);
  const hasAnswer = answer !== null;
  useEffect(() => {
    if (hasAnswer) nextRef.current?.focus();
  }, [hasAnswer]);

  const previousRound = useRef(round);
  useEffect(() => {
    if (round !== previousRound.current && isPractice) promptRef.current?.focus();
    previousRound.current = round;
  }, [round, isPractice]);

  function seatStatus(seat: number): SeatStatus | undefined {
    if (!isPractice) return seat === selectedSeat ? 'selected' : undefined;
    if (!answer) return undefined;
    if (seat === seatOfPosition(format, button, target)) return 'correct';
    return seat === answer.seat ? 'wrong' : undefined;
  }

  const selected = POSITIONS[positionOfSeat(format, button, selectedSeat)];
  const seats = seatCount(format);

  return (
    <div className="tool-panel">
      <h2 className={styles.title}>Poker table trainer</h2>

      <div className={styles.controls}>
        <SegmentedControl
          legend="Trainer mode"
          name="trainer-mode"
          options={MODES}
          value={mode}
          onChange={(value) => dispatch({ type: 'set-mode', mode: value })}
        />
        <SegmentedControl
          legend="Table size"
          name="table-size"
          options={FORMATS}
          value={format}
          onChange={(value) =>
            dispatch({ type: 'set-format', format: value, random: Math.random() })
          }
        />
      </div>

      {isPractice && (
        <div className={styles.prompt}>
          <h3 ref={promptRef} tabIndex={-1} data-testid="prompt">
            {questionPrompt(target)}
          </h3>
          <p>
            <span data-testid="score">
              Score: {score.correct} of {score.answered}
            </span>
            {score.answered > 0 && (
              <button
                type="button"
                className={styles.linkButton}
                onClick={() => dispatch({ type: 'reset-score' })}
              >
                Reset score
              </button>
            )}
          </p>
        </div>
      )}

      <div className={styles.workspace}>
        <PokerTable
          format={format}
          button={button}
          showLabels={!isPractice || hasAnswer}
          seatStatus={seatStatus}
          seatsLocked={isPractice && hasAnswer}
          onSeatSelect={(seat) => dispatch({ type: 'select-seat', seat })}
        />

        <div className={styles.panel}>
          {isPractice ? (
            answer ? (
              <div className={styles.feedback} data-testid="feedback" data-correct={answer.correct}>
                <p className={styles.verdict}>{answerVerdict(answer.correct)}</p>
                <p>{describeAnswer(state)}</p>
                <button
                  ref={nextRef}
                  type="button"
                  className="button"
                  onClick={() => dispatch({ type: 'next-question', random: Math.random() })}
                >
                  Next question
                </button>
              </div>
            ) : (
              <p className={styles.hint}>
                Select the seat. The dealer button is marked D, and it moves one seat clockwise
                after each question.
              </p>
            )
          ) : (
            <>
              <div data-testid="seat-details">
                <p className={styles.seatTag}>
                  {seatName(selectedSeat)} · {POSITION_GROUP_NAMES[selected.group]}
                </p>
                <h3 className={styles.seatTitle}>{positionTitle(selected.id)}</h3>
                <p>{selected.description}</p>
                <dl className={styles.facts}>
                  <div>
                    <dt>Where to find it</dt>
                    <dd>{describeLocation(format, selected.id)}</dd>
                  </div>
                  <div>
                    <dt>Before the flop</dt>
                    <dd>
                      Acts {actingTurn(format, 'preflop', selected.id)} of {seats}
                    </dd>
                  </div>
                  <div>
                    <dt>After the flop</dt>
                    <dd>
                      Acts {actingTurn(format, 'postflop', selected.id)} of {seats}
                    </dd>
                  </div>
                </dl>
              </div>
              <ActingOrder format={format} highlight={selected.id} />
              <button
                type="button"
                className="button button--secondary"
                onClick={() => dispatch({ type: 'move-button' })}
              >
                Move dealer button
              </button>
            </>
          )}
        </div>
      </div>

      <p className="visually-hidden" role="status" data-testid="announcer">
        {announcement}
      </p>
    </div>
  );
}
