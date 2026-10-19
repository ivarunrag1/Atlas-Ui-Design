import { cn } from '@/lib/utils';

/**
 * SegmentedControl — a compact single-choice toggle (e.g. Door / CY).
 * Bordered track; the selected segment is filled white (ink) with inverted text.
 * Segment radius = track radius (8px) − track padding (2px), so the corners nest.
 */
function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  size = 'sm',
  stretch = false,
  className,
  'aria-label': ariaLabel,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  size?: 'sm' | 'xs';
  /** Fill the container width at Input height (h-9), segments sharing it equally. */
  stretch?: boolean;
  className?: string;
  'aria-label'?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        'items-center gap-0.5 rounded-lg border border-line p-0.5',
        stretch ? 'flex h-9 w-full' : 'inline-flex',
        className,
      )}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cn(
              'rounded-[6px] font-medium transition-colors outline-none focus-visible:ring-1 focus-visible:ring-line-strong',
              size === 'sm' ? 'h-7 px-3 text-[12px]' : 'h-6 px-2.5 text-[10px]',
              stretch && 'h-full flex-1',
              on ? 'bg-ink text-canvas' : 'text-muted hover:text-ink',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * ToggleGroup — same look as SegmentedControl, but multi-select: each segment
 * toggles independently. `required` keeps at least one segment on.
 */
function ToggleGroup<T extends string>({
  value,
  onChange,
  options,
  required = false,
  stretch = false,
  className,
  'aria-label': ariaLabel,
}: {
  value: T[];
  onChange: (v: T[]) => void;
  options: { value: T; label: string }[];
  required?: boolean;
  stretch?: boolean;
  className?: string;
  'aria-label'?: string;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        'items-center gap-0.5 rounded-lg border border-line p-0.5',
        stretch ? 'flex h-9 w-full' : 'inline-flex',
        className,
      )}
    >
      {options.map((o) => {
        const on = value.includes(o.value);
        const locked = required && on && value.length === 1;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            aria-disabled={locked}
            title={locked ? 'At least one must stay selected' : undefined}
            onClick={() => {
              if (locked) return;
              onChange(on ? value.filter((v) => v !== o.value) : [...value, o.value]);
            }}
            className={cn(
              'h-7 rounded-[6px] px-3 text-[12px] font-medium transition-colors outline-none focus-visible:ring-1 focus-visible:ring-line-strong',
              stretch && 'h-full flex-1',
              on ? 'bg-ink text-canvas' : 'text-muted hover:text-ink',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export { SegmentedControl, ToggleGroup };
