import * as React from 'react';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

type BoxProps = {
  checked: boolean;
  indeterminate?: boolean;
  /** `atlas` for agent-selection contexts (rate cards); `ink` everywhere else. */
  tone?: 'ink' | 'atlas';
  className?: string;
};

/**
 * Visual checkbox — a non-interactive span, so it can sit inside a Button or a
 * clickable Card/row (menu items, rate cards). Use `Checkbox` when it is the control.
 */
function CheckboxBox({ checked, indeterminate, tone = 'ink', className }: BoxProps) {
  const on = checked || indeterminate;
  return (
    <span
      data-slot="checkbox"
      data-state={indeterminate ? 'indeterminate' : checked ? 'checked' : 'unchecked'}
      className={cn(
        'grid size-4 shrink-0 place-items-center rounded border transition-colors',
        on
          ? tone === 'atlas'
            ? 'border-atlas bg-atlas/15 text-atlas'
            : 'border-ink bg-ink text-canvas'
          : 'border-line-strong text-transparent',
        className,
      )}
    >
      {indeterminate ? <Minus size={11} strokeWidth={3} /> : <Check size={11} strokeWidth={3} />}
    </span>
  );
}

/** Standalone checkbox control. Stops propagation so it works inside clickable rows. */
function Checkbox({
  onCheckedChange,
  className,
  'aria-label': ariaLabel,
  ...box
}: BoxProps & { onCheckedChange: () => void; 'aria-label'?: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={box.indeterminate ? 'mixed' : box.checked}
      aria-label={ariaLabel}
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation();
        onCheckedChange();
      }}
      className={cn('group/cb rounded outline-none', className)}
    >
      <CheckboxBox {...box} className="group-hover/cb:border-ink" />
    </button>
  );
}

/** Checkbox with a clickable text label (e.g. “Include local charges”). */
function CheckboxField({
  checked,
  onCheckedChange,
  label,
  tone,
  className,
  'aria-label': ariaLabel,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: React.ReactNode;
  tone?: BoxProps['tone'];
  className?: string;
  /** Fuller accessible name when the visible label relies on context. */
  'aria-label'?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'group/cb inline-flex items-center gap-2 rounded text-[12px] text-muted outline-none hover:text-ink focus-visible:text-ink',
        className,
      )}
    >
      <CheckboxBox checked={checked} tone={tone} className="group-hover/cb:border-ink" />
      {label}
    </button>
  );
}

export { Checkbox, CheckboxBox, CheckboxField };
