import { hasValue } from '@/config/studio.config';

export interface ConfigValueProps {
  /** A raw value out of `config/studio.config.ts`. */
  value: string;
  /** Localised hint shown to screen readers when the value is unfilled. */
  note: string;
}

/**
 * Renders a studio fact. An unfilled field stays visible as `[ЧТО-ТО]` in a
 * muted style with `data-placeholder`, so the owner can see what is missing —
 * and no visitor ever reads an invented phone number.
 */
export function ConfigValue({ value, note }: ConfigValueProps) {
  if (hasValue(value)) return <>{value}</>;
  if (value.trim() === '') return null;
  return (
    <span data-placeholder title={note}>
      {value}
    </span>
  );
}
