import * as React from 'react';
import { Check, Pencil, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionLabel } from '@/components/ui/field';
import { ResizablePane } from '@/components/ui/resizable-pane';
import { cn } from '@/lib/utils';

/**
 * InfoPane — the record side panel used on detail pages (deal, contact, …).
 * Resizable; the minimum width fits exactly two fact columns
 * (2 × 100px + 16px gap + 40px padding ≈ 260px).
 *
 *   <InfoPane storageKey="atlas.dealPane">
 *     <InfoHeader title="Orbit Manufacturing">…chips…</InfoHeader>
 *     <InfoSection title="Customer" onEdit={…}>…</InfoSection>
 *     <InfoSection>
 *       <FactGrid><Fact label="Owner">Varun</Fact></FactGrid>
 *     </InfoSection>
 *   </InfoPane>
 */
const INFO_PANE_MIN = 260;
const INFO_PANE_MAX = 560;

function InfoPane({
  min = INFO_PANE_MIN,
  max = INFO_PANE_MAX,
  defaultWidth,
  side = 'left',
  storageKey,
  className,
  children,
}: {
  min?: number;
  max?: number;
  defaultWidth?: number;
  side?: 'left' | 'right';
  storageKey?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <ResizablePane
      min={min}
      max={max}
      defaultWidth={defaultWidth}
      side={side}
      storageKey={storageKey}
      className={cn('bg-surface', className)}
    >
      {children}
    </ResizablePane>
  );
}

/** Identity block at the top — page-level title, then any subtitle/chips below. */
function InfoHeader({ title, children }: { title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div data-slot="info-header" className="px-5 py-4">
      <h2 className="t-page text-ink">{title}</h2>
      {children}
    </div>
  );
}

/**
 * A divided section. Optional `title` (section label) and either a custom `action`
 * or `onEdit` for the standard ghost “Edit” button (hidden while `editing`).
 */
function InfoSection({
  title,
  action,
  onEdit,
  editing = false,
  className,
  children,
}: {
  title?: React.ReactNode;
  action?: React.ReactNode;
  onEdit?: () => void;
  editing?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const trailing =
    action ??
    (onEdit && !editing ? (
      <Button variant="ghost" size="xs" onClick={onEdit} className="font-medium text-faint">
        <Pencil size={12} /> Edit
      </Button>
    ) : null);

  return (
    <section data-slot="info-section" className={cn('border-t border-line px-5 py-4', className)}>
      {(title || trailing) && (
        <div className="mb-2 flex min-h-7 items-center justify-between">
          {title && <SectionLabel>{title}</SectionLabel>}
          {trailing}
        </div>
      )}
      {children}
    </section>
  );
}

/** Save / Cancel row for an InfoSection in edit mode. */
function EditActions({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <Button size="sm" onClick={onSave}>
        <Check size={14} /> Save
      </Button>
      <Button variant="secondary" size="sm" onClick={onCancel} className="text-muted">
        <X size={14} /> Cancel
      </Button>
    </div>
  );
}

/** Responsive fact grid — adds a column every 100px of width (2 at the pane minimum). */
function FactGrid({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="fact-grid"
      className={cn('grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-4', className)}
      {...props}
    />
  );
}

/** Label + value pair. `wide` spans the full grid row (e.g. tags). */
function Fact({
  label,
  wide = false,
  className,
  children,
}: {
  label: React.ReactNode;
  wide?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div data-slot="fact" className={cn('flex min-w-0 flex-col gap-0.5', wide && 'col-span-full', className)}>
      <SectionLabel>{label}</SectionLabel>
      <div className="text-[14px] font-medium text-ink">{children}</div>
    </div>
  );
}

export { InfoPane, InfoHeader, InfoSection, EditActions, FactGrid, Fact, INFO_PANE_MIN, INFO_PANE_MAX };
