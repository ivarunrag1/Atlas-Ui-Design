import { type LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { SectionLabel } from '@/components/ui/field';
import { cn } from '@/lib/utils';

/* Small pieces shared by the record tabs (Leads, Companies, Contacts). */

/** Tab body wrapper — header line + scrolling content, like the other record tabs. */
export function TabBody({ title, description, children }: { title: string; description?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="border-b border-line px-5 py-3">
        <h2 className="text-[16px] font-semibold text-ink">{title}</h2>
        {description && <p className="text-[12px] text-faint">{description}</p>}
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">{children}</div>
    </div>
  );
}

export function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'success' | 'warm' | 'faint' }) {
  return (
    <Card className="flex flex-col gap-1.5 p-3">
      <SectionLabel as="div">{label}</SectionLabel>
      <span
        className={cn(
          'text-[18px] leading-none tabular-nums',
          tone === 'success' ? 'text-success' : tone === 'warm' ? 'text-warm' : tone === 'faint' ? 'text-faint' : 'text-ink',
        )}
      >
        {value}
      </span>
      {sub && <span className="text-[12px] text-muted">{sub}</span>}
    </Card>
  );
}

/** A freight signal: icon + headline + detail. */
export function Signal({ icon: Icon, title, detail, tone = 'neutral' }: { icon: LucideIcon; title: string; detail: string; tone?: 'good' | 'watch' | 'neutral' }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <span
        className={cn(
          'grid size-7 shrink-0 place-items-center rounded-lg border',
          tone === 'good' ? 'border-success/40 text-success' : tone === 'watch' ? 'border-warm/50 text-warm' : 'border-line text-muted',
        )}
      >
        <Icon size={14} />
      </span>
      <div className="min-w-0">
        <div className="text-[14px] text-ink">{title}</div>
        <div className="text-[12px] text-muted">{detail}</div>
      </div>
    </div>
  );
}

/** Outlined value chips (HS codes, countries, …). */
export function Chips({ items }: { items: string[] }) {
  return (
    <>
      {items.map((i) => (
        <span key={i} className="rounded-full border border-line px-2 py-0.5 text-[10px] text-muted">
          {i}
        </span>
      ))}
    </>
  );
}

/** Empty state inside a tab. */
export function EmptyNote({ children }: { children: React.ReactNode }) {
  return <div className="grid place-items-center rounded-lg border border-dashed border-line px-4 py-8 text-center text-[12px] text-faint">{children}</div>;
}
