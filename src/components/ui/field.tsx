import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Form field — label above the control, optional helper text below.
 * Uses the typography scale: `t-label` for the label, `t-desc` for helper text.
 */
function Field({
  label,
  description,
  className,
  children,
}: {
  label: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label data-slot="field" className={cn('flex flex-col gap-1.5', className)}>
      <span className="t-label text-muted">{label}</span>
      {children}
      {description && <span className="t-desc text-faint">{description}</span>}
    </label>
  );
}

/**
 * Section label — the uppercase micro label used for section titles, fact labels,
 * card labels and table headers. One style app-wide.
 */
function SectionLabel({
  as: Comp = 'span',
  className,
  ...props
}: React.HTMLAttributes<HTMLElement> & { as?: 'span' | 'div' | 'h3' | 'dt' }) {
  return (
    <Comp
      data-slot="section-label"
      className={cn('text-[10px] font-semibold uppercase tracking-[0.04em] text-faint', className)}
      {...props}
    />
  );
}

export { Field, SectionLabel };
