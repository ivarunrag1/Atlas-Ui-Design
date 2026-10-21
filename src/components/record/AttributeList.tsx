import { Lock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { SectionLabel } from '@/components/ui/field';
import { cn } from '@/lib/utils';

/**
 * Attribute layout shared by record pages (deal Attributes, lead Match details, …):
 * titled sections, each a card of label | value rows. Read-only rows carry a lock tag
 * naming who sets the value (Pipeline, Calculated, SDR agent, …).
 */
export function AttributeSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex items-baseline gap-2">
        <SectionLabel as="h3">{title}</SectionLabel>
        {description && <span className="text-[10px] text-faint">{description}</span>}
      </div>
      <Card className="divide-y divide-line overflow-hidden">{children}</Card>
    </section>
  );
}

export function AttributeRow({
  label,
  hint,
  lockedBy,
  editing = false,
  children,
}: {
  label: string;
  /** Hover text for the label (e.g. the field's notes). */
  hint?: string;
  /** Read-only: who sets the value — shown as a lock tag. */
  lockedBy?: string;
  /** Row holds an inline input (tighter vertical padding). */
  editing?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('grid grid-cols-[minmax(0,12rem)_minmax(0,1fr)] items-center gap-4 px-4', editing ? 'py-1.5' : 'py-2')}>
      <span className="truncate text-[12px] text-faint" title={hint ?? label}>
        {label}
      </span>
      {lockedBy ? (
        <span className="flex min-w-0 items-center justify-between gap-3">
          <span className="min-w-0 text-[14px] text-ink">{children}</span>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-line px-2 py-0.5 text-[10px] text-faint">
            <Lock size={10} /> {lockedBy}
          </span>
        </span>
      ) : (
        <span className="min-w-0 text-[14px] text-ink">{children}</span>
      )}
    </div>
  );
}
