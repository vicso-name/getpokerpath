import { useEffect, useRef, useState } from 'react';
import {
  formatChips,
  formatPercent,
  formatRatio,
  type ShortCallReason,
} from '../../lib/poker/potOdds';
import {
  EMPTY_FIELDS,
  LIMITS_NOTE,
  POT_ODDS_EXAMPLES,
  SHORT_CALL_OPTIONS,
  evaluateForm,
  explainResult,
  type PotOddsExample,
  type PotOddsField,
} from '../../lib/tools/potOddsCalculator';
import styles from './PotOddsCalculator.module.css';

const FIELDS: readonly { id: PotOddsField; label: string; help: string }[] = [
  {
    id: 'pot',
    label: 'Pot size before opponent’s bet (P)',
    help: 'Everything already in the middle, including chips you put in.',
  },
  { id: 'bet', label: 'Opponent’s bet (B)', help: 'Chips added on top of that pot.' },
  { id: 'call', label: 'Amount to call (C)', help: 'What you still have to pay to stay in.' },
];

/** Waits for a pause in typing, so screen readers don't read every keystroke. */
const ANNOUNCE_DELAY_MS = 600;

const [defaultExample] = POT_ODDS_EXAMPLES;

export function PotOddsCalculator() {
  const [fields, setFields] = useState(defaultExample.fields);
  const [shortCall, setShortCall] = useState<ShortCallReason | null>(defaultExample.shortCall);
  const view = evaluateForm(fields, shortCall);
  const { errors, asksReason, result, message } = view;
  const explanation = result && explainResult(result);

  const [announcement, setAnnouncement] = useState(view.announcement);
  useEffect(() => {
    const timer = setTimeout(() => setAnnouncement(view.announcement), ANNOUNCE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [view.announcement]);

  const firstField = useRef<HTMLInputElement>(null);

  function applyExample(example: PotOddsExample) {
    setFields(example.fields);
    setShortCall(example.shortCall);
  }

  function reset() {
    setFields(EMPTY_FIELDS);
    setShortCall(null);
    firstField.current?.focus();
  }

  return (
    <div className="tool-panel">
      <h2 className={styles.title}>Calculate your pot odds</h2>

      <div className={styles.workspace}>
        <form className={styles.form} onSubmit={(event) => event.preventDefault()}>
          {FIELDS.map(({ id, label, help }) => {
            const error = errors[id];
            return (
              <div key={id} className={styles.field}>
                <label htmlFor={`pot-odds-${id}`}>{label}</label>
                <input
                  ref={id === 'pot' ? firstField : undefined}
                  id={`pot-odds-${id}`}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={fields[id]}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={`pot-odds-${id}-help${error ? ` pot-odds-${id}-error` : ''}`}
                  onChange={(event) => setFields({ ...fields, [id]: event.target.value })}
                />
                <p id={`pot-odds-${id}-help`} className={styles.help}>
                  {help}
                </p>
                {error && (
                  <p id={`pot-odds-${id}-error`} className={styles.error}>
                    {error}
                  </p>
                )}
              </div>
            );
          })}

          {asksReason && (
            <fieldset className={styles.reasons}>
              <legend>Why is your call smaller than the bet?</legend>
              {SHORT_CALL_OPTIONS.map(({ value, label, hint }) => (
                <label key={value} className={styles.reason}>
                  <input
                    type="radio"
                    name="short-call"
                    value={value}
                    checked={shortCall === value}
                    onChange={() => setShortCall(value)}
                  />
                  <span>
                    {label}
                    <small>{hint}</small>
                  </span>
                </label>
              ))}
            </fieldset>
          )}

          <p className={styles.help}>{LIMITS_NOTE}</p>
        </form>

        <div className={styles.output}>
          {result && explanation ? (
            <div className={styles.result} data-testid="result">
              <dl className={styles.figures}>
                <div className={styles.primary}>
                  <dt>Required equity</dt>
                  <dd data-testid="required-equity">{formatPercent(result.requiredEquity)}</dd>
                </div>
                <div>
                  <dt>Final pot after call</dt>
                  <dd data-testid="final-pot">{formatChips(result.finalPot)}</dd>
                </div>
                <div>
                  <dt>Pot odds</dt>
                  <dd data-testid="ratio">{formatRatio(result.ratio)}</dd>
                </div>
              </dl>
              <p>{explanation.summary}</p>

              <div>
                <h3 className={styles.stepsTitle}>How it works out</h3>
                {explanation.refundNote && <p>{explanation.refundNote}</p>}
                <p className={styles.equation} data-testid="equation">
                  {explanation.equation}
                </p>
                <ol className={styles.steps} data-testid="steps">
                  {explanation.steps.map(({ title, working }) => (
                    <li key={title}>
                      {title}: <span className={styles.working}>{working}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          ) : (
            <p className={styles.message} data-testid="message">
              {message}
            </p>
          )}

          <p className={styles.help}>
            This is the break-even equity for an immediate call. It doesn’t include rake, future
            bets or implied odds.
          </p>

          <div className={styles.examples}>
            <p id="pot-odds-examples" className={styles.examplesTitle}>
              Try an example
            </p>
            <div role="group" aria-labelledby="pot-odds-examples" className={styles.exampleButtons}>
              {POT_ODDS_EXAMPLES.map((example) => (
                <button
                  key={example.label}
                  type="button"
                  className="button button--secondary"
                  onClick={() => applyExample(example)}
                >
                  {example.label}
                </button>
              ))}
            </div>
          </div>

          <button type="button" className="button button--secondary" onClick={reset}>
            Reset
          </button>
        </div>
      </div>

      <p className="visually-hidden" role="status" data-testid="announcer">
        {announcement}
      </p>
    </div>
  );
}
