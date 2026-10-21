import { Check } from 'lucide-react';
import { accountStageColor, DORMANT_AFTER_DAYS, type AccountStage, type Organization, type SyncStatus } from '../../data/organizations';
import { servedLanes } from '../../data/leads';
import { daysFromToday, fmtDate, relDays } from '@/lib/dates';
import { cn } from '@/lib/utils';

/* Freight-specific pieces shared by the company list, pane and tabs (and contacts). */

export function StagePill({ stage }: { stage: AccountStage }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2 py-0.5 text-[12px] font-medium text-muted">
      <span className="size-2 rounded-full" style={{ background: accountStageColor[stage] }} />
      {stage}
    </span>
  );
}

/** Contract renewal — the re-tender window. Amber inside 90 days, red inside 30. */
export function renewalTone(iso?: string) {
  if (!iso) return 'text-faint';
  const d = daysFromToday(iso);
  return d < 0 ? 'text-faint' : d <= 30 ? 'text-danger' : d <= 90 ? 'text-warm' : 'text-ink';
}

export function RenewalText({ iso, short = false }: { iso?: string; short?: boolean }) {
  if (!iso) return <span className="text-faint">—</span>;
  return (
    <span className={renewalTone(iso)} title={fmtDate(iso)}>
      {short ? relDays(iso) : `${fmtDate(iso)} · ${relDays(iso)}`}
    </span>
  );
}

/** Last engaged — green inside 14 days, amber up to 45, red after. */
export function EngagedText({ iso }: { iso?: string }) {
  if (!iso) return <span className="text-faint">Never</span>;
  const d = -daysFromToday(iso);
  const tone = d <= 14 ? 'text-success' : d <= 45 ? 'text-warm' : 'text-danger';
  return (
    <span className={tone} title={fmtDate(iso)}>
      {relDays(iso)}
    </span>
  );
}

const syncTone: Record<SyncStatus, string> = { SYNCED: 'text-success', PENDING: 'text-faint', FAILED: 'text-danger' };
const syncLabel: Record<SyncStatus, string> = { SYNCED: 'Synced', PENDING: 'Pending', FAILED: 'Failed' };

export function SyncText({ status }: { status?: SyncStatus }) {
  if (!status) return <span className="text-faint">—</span>;
  return <span className={syncTone[status]}>{syncLabel[status]}</span>;
}

/** Days until a Customer turns Dormant (6 months without an enquiry) — when inside 60 days. */
export function dormantIn(o: Organization) {
  if (o.accountStage !== 'Customer' || !o.lastEnquiryDate) return null;
  const left = DORMANT_AFTER_DAYS + daysFromToday(o.lastEnquiryDate);
  return left <= 60 ? Math.max(left, 0) : null;
}

/** A lane as highlighted text — green with a check when we serve it. */
export function LaneText({ lane, className }: { lane: string; className?: string }) {
  const served = servedLanes.has(lane);
  return (
    <span
      className={cn('inline-flex min-w-0 items-center gap-1', served ? 'font-medium text-success' : 'text-muted', className)}
      title={served ? 'Lane we serve' : 'Not in our network'}
    >
      {served && <Check size={11} className="shrink-0" />}
      <span className="truncate">{lane}</span>
    </span>
  );
}

export const money = (n: number) => (n >= 1000 ? `$${Math.round(n / 1000).toLocaleString('en-US')}k` : `$${n.toLocaleString('en-US')}`);
export const splitList = (s?: string) => (s ?? '').split(',').map((x) => x.trim()).filter(Boolean);
