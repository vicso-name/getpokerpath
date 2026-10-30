import {
  CardValidationError,
  RANK_NAMES,
  RANK_PLURALS,
  assertValidCards,
  rankFromValue,
  type CardCode,
} from './cards';
import {
  compareHands,
  evaluateBest,
  evaluateFive,
  type EvaluatedHand,
  type HandCategory,
} from './evaluate';

export type ShowdownOutcome = 'a' | 'b' | 'tie';

export interface Showdown {
  outcome: ShowdownOutcome;
  handA: EvaluatedHand;
  handB: EvaluatedHand;
  /** What settled it: the hand category, a rank within the category, or nothing. */
  decidedBy: 'category' | 'tiebreak' | 'tie';
  /** True when the five community cards are the best hand for both players. */
  boardPlays: boolean;
  explanation: string;
}

export interface PlayerNames {
  a: string;
  b: string;
}

const DEFAULT_NAMES: PlayerNames = { a: 'Player A', b: 'Player B' };

const CATEGORY_PHRASES: Record<HandCategory, string> = {
  'high-card': 'high card',
  pair: 'a pair',
  'two-pair': 'two pair',
  'three-of-a-kind': 'three of a kind',
  straight: 'a straight',
  flush: 'a flush',
  'full-house': 'a full house',
  'four-of-a-kind': 'four of a kind',
  'straight-flush': 'a straight flush',
  'royal-flush': 'a royal flush',
};

const KICKER_ORDINALS = ['first', 'second', 'third'];
const CARD_ORDINALS = ['highest', 'second-highest', 'third-highest', 'fourth-highest', 'lowest'];

/** Names one position of a tiebreak, for example `second kicker (Ten)`. */
function describeTiebreakStep(category: HandCategory, index: number, value: number): string {
  const name = RANK_NAMES[rankFromValue(value)];
  const plural = RANK_PLURALS[rankFromValue(value)];

  switch (category) {
    case 'four-of-a-kind':
      return index === 0 ? `four ${plural}` : `kicker (${name})`;
    case 'full-house':
      return index === 0 ? `three ${plural}` : `pair of ${plural}`;
    case 'three-of-a-kind':
      return index === 0 ? `three ${plural}` : `${KICKER_ORDINALS[index - 1]} kicker (${name})`;
    case 'two-pair':
      if (index === 2) return `kicker (${name})`;
      return `${index === 0 ? 'top' : 'second'} pair of ${plural}`;
    case 'pair':
      return index === 0 ? `pair of ${plural}` : `${KICKER_ORDINALS[index - 1]} kicker (${name})`;
    case 'flush':
    case 'high-card':
      return `${CARD_ORDINALS[index]} card (${name})`;
    default:
      return `top card (${name})`;
  }
}

function explainTiebreak(
  winner: EvaluatedHand,
  loser: EvaluatedHand,
  winnerName: string,
  loserName: string,
): string {
  const { category } = winner;
  const step = winner.tiebreak.findIndex((value, index) => value !== loser.tiebreak[index]);
  const matched = winner.tiebreak
    .slice(0, step)
    .map((value, index) => describeTiebreakStep(category, index, value));

  return [
    `Both players have ${CATEGORY_PHRASES[category]}.`,
    matched.length > 0 ? `They match on ${matched.join(', ')}.` : '',
    `${winnerName}'s ${describeTiebreakStep(category, step, winner.tiebreak[step])} beats`,
    `${loserName}'s ${describeTiebreakStep(category, step, loser.tiebreak[step])}.`,
  ]
    .filter(Boolean)
    .join(' ');
}

function buildShowdown(
  handA: EvaluatedHand,
  handB: EvaluatedHand,
  boardPlays: boolean,
  names: PlayerNames,
): Showdown {
  const comparison = compareHands(handA, handB);

  if (comparison === 0) {
    const shared = boardPlays
      ? `The board is the best hand for both players: ${handA.description}.`
      : `Both players make the same five-card hand by rank: ${handA.description}.`;
    return {
      outcome: 'tie',
      handA,
      handB,
      decidedBy: 'tie',
      boardPlays,
      explanation: `${shared} Suits never break a tie, so the pot is split.`,
    };
  }

  const [winner, loser, winnerName, loserName] =
    comparison > 0
      ? [handA, handB, names.a, names.b]
      : [handB, handA, names.b, names.a];
  const sameCategory = winner.strength === loser.strength;

  return {
    outcome: comparison > 0 ? 'a' : 'b',
    handA,
    handB,
    decidedBy: sameCategory ? 'tiebreak' : 'category',
    boardPlays: false,
    explanation: sameCategory
      ? explainTiebreak(winner, loser, winnerName, loserName)
      : `${winnerName} wins because ${CATEGORY_PHRASES[winner.category]} beats ${CATEGORY_PHRASES[loser.category]}.`,
  };
}

/** Compares two complete five-card hands drawn from one deck. */
export function showdownFiveCard(
  cardsA: readonly CardCode[],
  cardsB: readonly CardCode[],
  names: PlayerNames = DEFAULT_NAMES,
): Showdown {
  assertValidCards([...cardsA, ...cardsB]);
  return buildShowdown(evaluateFive(cardsA), evaluateFive(cardsB), false, names);
}

/** Compares two Texas Hold'em hands that share a complete five-card board. */
export function showdownHoldem(
  holeA: readonly CardCode[],
  holeB: readonly CardCode[],
  board: readonly CardCode[],
  names: PlayerNames = DEFAULT_NAMES,
): Showdown {
  if (holeA.length !== 2 || holeB.length !== 2) {
    throw new CardValidationError('Each Hold’em player needs exactly 2 hole cards');
  }
  if (board.length !== 5) {
    throw new CardValidationError(`A showdown needs 5 community cards, got ${board.length}`);
  }
  assertValidCards([...holeA, ...holeB, ...board]);

  const handA = evaluateBest([...holeA, ...board]);
  const handB = evaluateBest([...holeB, ...board]);
  const boardHand = evaluateFive(board);
  const boardPlays = compareHands(handA, boardHand) === 0 && compareHands(handB, boardHand) === 0;

  return buildShowdown(handA, handB, boardPlays, names);
}
