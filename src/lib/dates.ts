/* Date helpers for mock data — "today" is fixed so relative labels stay stable. */

export const TODAY = new Date('2026-10-21T12:00:00');

const MS_DAY = 86_400_000;

/** Whole days from today to an ISO date (negative = in the past). */
export const daysFromToday = (iso: string) => Math.round((new Date(`${iso.slice(0, 10)}T12:00:00`).getTime() - TODAY.getTime()) / MS_DAY);

/** "2026-12-07" → "07 Dec 2026". */
export const fmtDate = (iso?: string) =>
  iso ? new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

/** "in 47 days" / "12 days ago" / "today". */
export function relDays(iso: string) {
  const d = daysFromToday(iso);
  if (d === 0) return 'today';
  const n = Math.abs(d);
  const unit = n >= 60 ? `${Math.round(n / 30)} months` : `${n} day${n === 1 ? '' : 's'}`;
  return d > 0 ? `in ${unit}` : `${unit} ago`;
}
