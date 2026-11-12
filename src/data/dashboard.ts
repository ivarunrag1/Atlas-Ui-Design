/*
 * Dashboard metrics (mock). One row per day per scope (mine / team) from 1 Apr 2026
 * to today, so any past or custom range can be summed. In the real app each number
 * is a count or sum over existing fields:
 *   enquiries        deals created (ENQUIRY_RECEIVED)
 *   quotes           deals reaching Quote sent (quoted_at) · split by flow AUTOMATIC / MANUAL
 *   won / value      deals marked Won · deal value · margin
 *   ttq              time_to_quote (hours)
 *   rhea*            SDR agent: leads selected, converted to deals, Strong fit
 *   maxFollowups     follow-ups sent after a quote (followup_count)
 *   maya*            CRM agent: records updated, alerts raised / acted on, alerted deals that moved stage
 */
import { TODAY } from '@/lib/dates';

export type Scope = 'mine' | 'team';

export interface DayMetrics {
  date: string; // ISO yyyy-mm-dd
  enquiries: number;
  quotesAuto: number;
  quotesManual: number;
  won: number;
  wonValue: number;
  margin: number;
  ttqAutoH: number;
  ttqManualH: number;
  rheaLeads: number;
  rheaConverted: number;
  rheaStrong: number;
  maxFollowups: number;
  mayaRecords: number;
  mayaAlerts: number;
  mayaActed: number;
  mayaSaved: number;
}

export const DATA_START = '2026-04-01';
export const iso = (d: Date) => d.toISOString().slice(0, 10);
export const TODAY_ISO = iso(TODAY);

/** Deterministic PRNG so the mock numbers don't change between renders. */
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function build(scale: number, seed: number): DayMetrics[] {
  const rnd = mulberry32(seed);
  const out: DayMetrics[] = [];
  const start = new Date(`${DATA_START}T12:00:00`);
  const days = Math.round((TODAY.getTime() - start.getTime()) / 86_400_000);
  for (let i = 0; i <= days; i++) {
    const d = new Date(start.getTime() + i * 86_400_000);
    const progress = i / days; // agents get better over time
    const weekday = d.getDay() === 0 || d.getDay() === 6 ? 0.25 : 1;
    const n = (base: number) => Math.max(0, Math.round(base * scale * weekday * (0.7 + rnd() * 0.6)));
    const enquiries = n(9 + progress * 4);
    const quotes = Math.min(enquiries, n(6 + progress * 4));
    const autoShare = 0.35 + progress * 0.35;
    const quotesAuto = Math.round(quotes * autoShare);
    const won = Math.min(quotes, n(1.6 + progress * 0.9));
    const avgValue = 52_000 + rnd() * 30_000;
    const wonValue = Math.round(won * avgValue);
    const rheaLeads = n(5 + progress * 3);
    const rheaConverted = Math.min(rheaLeads, n(0.9 + progress * 0.8));
    const mayaAlerts = n(3);
    const mayaActed = Math.min(mayaAlerts, Math.round(mayaAlerts * (0.55 + progress * 0.25)));
    out.push({
      date: iso(d),
      enquiries,
      quotesAuto,
      quotesManual: quotes - quotesAuto,
      won,
      wonValue,
      margin: Math.round(wonValue * (0.1 + rnd() * 0.04)),
      ttqAutoH: +(0.6 + (1 - progress) * 1.2 + rnd() * 0.5).toFixed(1),
      ttqManualH: +(9 + (1 - progress) * 4 + rnd() * 4).toFixed(1),
      rheaLeads,
      rheaConverted,
      rheaStrong: Math.round(rheaLeads * (0.3 + rnd() * 0.15)),
      maxFollowups: n(7 + progress * 5),
      mayaRecords: n(28 + progress * 10),
      mayaAlerts,
      mayaActed,
      mayaSaved: Math.min(mayaActed, Math.round(mayaActed * 0.4)),
    });
  }
  return out;
}

export const series: Record<Scope, DayMetrics[]> = {
  team: build(3.1, 7),
  mine: build(1, 21),
};

/* ── Ranges ────────────────────────────────────────────────────────────────── */

export type RangePreset = 'today' | 'week' | 'month' | 'quarter' | 'custom';
export interface Range {
  from: string;
  to: string;
}

const addDays = (isoDate: string, n: number) => iso(new Date(new Date(`${isoDate}T12:00:00`).getTime() + n * 86_400_000));
export const daysIn = (r: Range) => Math.round((new Date(`${r.to}T12:00:00`).getTime() - new Date(`${r.from}T12:00:00`).getTime()) / 86_400_000) + 1;

export function presetRange(p: Exclude<RangePreset, 'custom'>): Range {
  const len = { today: 1, week: 7, month: 30, quarter: 90 }[p];
  return { from: addDays(TODAY_ISO, -(len - 1)), to: TODAY_ISO };
}

/** The same-length period just before a range (for "vs previous"). */
export function previousRange(r: Range): Range {
  const len = daysIn(r);
  return { from: addDays(r.from, -len), to: addDays(r.from, -1) };
}

export const inRange = (rows: DayMetrics[], r: Range) => rows.filter((d) => d.date >= r.from && d.date <= r.to);

/* ── Aggregates ────────────────────────────────────────────────────────────── */

const sum = (rows: DayMetrics[], k: keyof Omit<DayMetrics, 'date'>) => rows.reduce((a, d) => a + d[k], 0);
const median = (xs: number[]) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const ratio = (a: number, b: number) => (b ? a / b : 0);

export interface Summary {
  enquiries: number;
  quotes: number;
  quotesAuto: number;
  won: number;
  wonValue: number;
  margin: number;
  winRate: number;
  enquiryToQuote: number;
  marginPct: number;
  ttqH: number;
  ttqAutoH: number;
  ttqManualH: number;
  rheaLeads: number;
  rheaConverted: number;
  rheaStrong: number;
  leadToDeal: number;
  maxFollowups: number;
  mayaRecords: number;
  mayaAlerts: number;
  mayaActed: number;
  mayaSaved: number;
}

export function summarize(rows: DayMetrics[]): Summary {
  const quotesAuto = sum(rows, 'quotesAuto');
  const quotes = quotesAuto + sum(rows, 'quotesManual');
  const enquiries = sum(rows, 'enquiries');
  const won = sum(rows, 'won');
  const wonValue = sum(rows, 'wonValue');
  const margin = sum(rows, 'margin');
  const quoting = rows.filter((d) => d.quotesAuto + d.quotesManual > 0);
  const rheaLeads = sum(rows, 'rheaLeads');
  const rheaConverted = sum(rows, 'rheaConverted');
  return {
    enquiries,
    quotes,
    quotesAuto,
    won,
    wonValue,
    margin,
    winRate: ratio(won, quotes),
    enquiryToQuote: ratio(quotes, enquiries),
    marginPct: ratio(margin, wonValue),
    ttqH: median(quoting.map((d) => (d.ttqAutoH * d.quotesAuto + d.ttqManualH * d.quotesManual) / (d.quotesAuto + d.quotesManual))),
    ttqAutoH: median(quoting.filter((d) => d.quotesAuto).map((d) => d.ttqAutoH)),
    ttqManualH: median(quoting.filter((d) => d.quotesManual).map((d) => d.ttqManualH)),
    rheaLeads,
    rheaConverted,
    rheaStrong: sum(rows, 'rheaStrong'),
    leadToDeal: ratio(rheaConverted, rheaLeads),
    maxFollowups: sum(rows, 'maxFollowups'),
    mayaRecords: sum(rows, 'mayaRecords'),
    mayaAlerts: sum(rows, 'mayaAlerts'),
    mayaActed: sum(rows, 'mayaActed'),
    mayaSaved: sum(rows, 'mayaSaved'),
  };
}

/** Buckets for trend charts: daily up to 31 days, weekly after that. */
export function buckets(rows: DayMetrics[]): { label: string; rows: DayMetrics[] }[] {
  const fmt = (isoDate: string) => new Date(`${isoDate}T12:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  if (rows.length <= 31) return rows.map((d) => ({ label: fmt(d.date), rows: [d] }));
  const out: { label: string; rows: DayMetrics[] }[] = [];
  for (let i = 0; i < rows.length; i += 7) {
    const chunk = rows.slice(i, i + 7);
    out.push({ label: fmt(chunk[0].date), rows: chunk });
  }
  return out;
}

/** Open pipeline held by other reps (team view adds this to your own open deals). */
export const OTHER_REPS_OPEN_PIPELINE = 1_860_000;
/** Open deals per stage held by other reps. */
export const OTHER_REPS_STAGE_COUNTS = { 'In contact': 9, 'Enquiry received': 14, Quoting: 11, 'Quote sent': 13, Negotiation: 7, Won: 22 };
