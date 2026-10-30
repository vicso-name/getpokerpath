// State for the P05 positions trainer. Pure and UI-free; every position fact
// comes from the central model in lib/poker/positions.
import {
  TABLE_FORMATS,
  describeLocation,
  moveButton,
  positionOfSeat,
  positionReference,
  seatOfPosition,
  type PositionId,
  type TableFormat,
} from '../poker/positions';

export type TrainerMode = 'explore' | 'practice';
export type TrainerFormat = Extract<TableFormat, '6-max' | '9-max'>;

export interface TrainerAnswer {
  seat: number;
  correct: boolean;
}

export interface TrainerState {
  mode: TrainerMode;
  format: TrainerFormat;
  /** Seat holding the dealer button. */
  button: number;
  /** Seat being inspected in explore mode. */
  selectedSeat: number;
  /** Position the current practice question asks for. */
  target: PositionId;
  /** Null until the current question has been answered. */
  answer: TrainerAnswer | null;
  /** Counts up with each new question, so the UI can move focus to it. */
  round: number;
  score: { correct: number; answered: number };
  /** Screen-reader announcement for the latest change. */
  announcement: string;
}

export type TrainerAction =
  | { type: 'set-mode'; mode: TrainerMode }
  /** `random` is a number in [0, 1) from the caller, keeping this reducer pure. */
  | { type: 'set-format'; format: TrainerFormat; random: number }
  | { type: 'select-seat'; seat: number }
  | { type: 'move-button' }
  | { type: 'next-question'; random: number }
  | { type: 'reset-score' };

/** Seat number as shown to people, counting from 1. */
export function seatName(seat: number): string {
  return `Seat ${seat + 1}`;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function describeSeat(format: TableFormat, button: number, seat: number): string {
  return `${seatName(seat)} is ${positionReference(positionOfSeat(format, button, seat))}`;
}

export function questionPrompt(target: PositionId): string {
  return `Find ${positionReference(target)}`;
}

/** Picks the next position to ask about, leaving out the last target to avoid repeats. */
export function pickTarget(
  format: TableFormat,
  previous: PositionId | null,
  random: number,
): PositionId {
  const options = TABLE_FORMATS[format].clockwiseFromButton.filter(
    (position) => position !== previous,
  );
  return options[Math.floor(random * options.length)];
}

export function answerVerdict(correct: boolean): string {
  return correct ? 'Correct' : 'Not quite';
}

export function describeAnswer(state: TrainerState): string {
  if (!state.answer) return '';
  const { format, button, target, answer } = state;
  const location = describeLocation(format, target);

  if (answer.correct) {
    return `${seatName(answer.seat)} is ${positionReference(target)}: ${location}.`;
  }
  const chosen = positionReference(positionOfSeat(format, button, answer.seat));
  const correctSeat = seatName(seatOfPosition(format, button, target));
  return `${seatName(answer.seat)} is ${chosen}. ${capitalize(positionReference(target))} is ${correctSeat}: ${location}.`;
}

function scoreLine({ correct, answered }: TrainerState['score']): string {
  return `Score: ${correct} of ${answered}.`;
}

function selectSeat(state: TrainerState, seat: number): TrainerState {
  if (state.mode === 'explore') {
    return {
      ...state,
      selectedSeat: seat,
      announcement: `${describeSeat(state.format, state.button, seat)}.`,
    };
  }
  if (state.answer) return state;

  const correct = positionOfSeat(state.format, state.button, seat) === state.target;
  const score = {
    correct: state.score.correct + (correct ? 1 : 0),
    answered: state.score.answered + 1,
  };
  const answered = { ...state, answer: { seat, correct }, score };
  return { ...answered, announcement: `${answerVerdict(correct)}. ${describeAnswer(answered)} ${scoreLine(score)}` };
}

export function trainerReducer(state: TrainerState, action: TrainerAction): TrainerState {
  switch (action.type) {
    case 'set-mode': {
      if (action.mode === state.mode) return state;
      const prompt = action.mode === 'practice' && !state.answer;
      return {
        ...state,
        mode: action.mode,
        announcement: prompt ? `${questionPrompt(state.target)}.` : 'Explore mode.',
      };
    }
    case 'set-format': {
      if (action.format === state.format) return state;
      const target = pickTarget(action.format, null, action.random);
      return {
        ...state,
        format: action.format,
        button: 0,
        selectedSeat: 0,
        target,
        answer: null,
        round: state.round + 1,
        announcement: `${action.format} table. ${state.mode === 'practice' ? `${questionPrompt(target)}.` : ''}`.trim(),
      };
    }
    case 'select-seat':
      return selectSeat(state, action.seat);
    case 'move-button': {
      const button = moveButton(state.format, state.button);
      return {
        ...state,
        button,
        announcement: `Dealer button moved to ${seatName(button)}. ${describeSeat(state.format, button, state.selectedSeat)}.`,
      };
    }
    case 'next-question': {
      if (!state.answer) return state;
      const button = moveButton(state.format, state.button);
      const target = pickTarget(state.format, state.target, action.random);
      return {
        ...state,
        button,
        target,
        answer: null,
        round: state.round + 1,
        announcement: `Dealer button moved to ${seatName(button)}. ${questionPrompt(target)}.`,
      };
    }
    case 'reset-score':
      return { ...state, score: { correct: 0, answered: 0 }, announcement: 'Score reset.' };
  }
}

/** Fixed starting point, so the server and client render the same first question. */
export function createInitialTrainerState(): TrainerState {
  return {
    mode: 'explore',
    format: '6-max',
    button: 0,
    selectedSeat: 0,
    target: 'CO',
    answer: null,
    round: 0,
    score: { correct: 0, answered: 0 },
    announcement: '',
  };
}
