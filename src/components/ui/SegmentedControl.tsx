import styles from './SegmentedControl.module.css';

export interface SegmentOption<Value extends string> {
  value: Value;
  label: string;
  hint?: string;
}

interface SegmentedControlProps<Value extends string> {
  /** Accessible group name. */
  legend: string;
  /** Radio group name; must be unique on the page. */
  name: string;
  options: readonly SegmentOption<Value>[];
  value: Value;
  onChange: (value: Value) => void;
}

/** A native radio group, styled as side-by-side buttons. */
export function SegmentedControl<Value extends string>({
  legend,
  name,
  options,
  value,
  onChange,
}: SegmentedControlProps<Value>) {
  return (
    <fieldset className={styles.control}>
      <legend className="visually-hidden">{legend}</legend>
      {options.map((option) => (
        <label key={option.value} className={styles.option}>
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          />
          <span>
            <strong>{option.label}</strong>
            {option.hint && <small>{option.hint}</small>}
          </span>
        </label>
      ))}
    </fieldset>
  );
}
