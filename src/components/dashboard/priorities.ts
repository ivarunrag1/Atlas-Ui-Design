import { AlarmClock, CalendarClock, FileClock, MessageSquareReply, Sparkles, TrendingDown, type LucideIcon } from 'lucide-react';
import type { DealSummary } from '../../data/deals';
import type { DealFieldValues } from '../../data/dealFields';
import type { LeadSummary } from '../../data/leads';
import type { Organization } from '../../data/organizations';
import { daysFromToday, fmtDate } from '@/lib/dates';
import { dormantIn } from '../company/parts';

export type Agent = 'Rhea' | 'Max' | 'Maya';
export type Level = 'Urgent' | 'High';

export interface Priority {
  id: string;
  level: Level;
  icon: LucideIcon;
  title: string;
  detail: string;
  /** Agent that surfaced it. */
  agent: Agent;
  target: { kind: 'deal'; deal: DealSummary } | { kind: 'company'; org: Organization } | { kind: 'lead'; lead: LeadSummary };
}

/**
 * Urgent and high-priority actions for the signed-in rep, from live records:
 * customer replies waiting, overdue follow-ups, quotes about to expire, contract
 * renewals, customers about to go Dormant and strong-fit leads not yet contacted.
 */
export function buildPriorities({
  deals,
  fieldsFor,
  organizations,
  leads,
  owner,
}: {
  deals: DealSummary[];
  fieldsFor: (d: DealSummary) => DealFieldValues;
  organizations: Organization[];
  leads: LeadSummary[];
  owner: string;
}): Priority[] {
  const out: Priority[] = [];
  const mine = deals.filter((d) => d.owner === owner && d.stage !== 'Won');

  for (const d of mine) {
    const f = fieldsFor(d);
    if (d.alert) {
      out.push({
        id: `reply-${d.id}`,
        level: 'Urgent',
        icon: MessageSquareReply,
        title: `${d.contact} replied on ${d.company}`,
        detail: `${d.stage} · ${d.origin} → ${d.destination} · ${d.value}. Max held the auto-reply for you.`,
        agent: 'Max',
        target: { kind: 'deal', deal: d },
      });
    }
    if (f.next_followup_at) {
      const due = daysFromToday(f.next_followup_at);
      if (due <= 0) {
        out.push({
          id: `fu-${d.id}`,
          level: due < 0 ? 'Urgent' : 'High',
          icon: AlarmClock,
          title: due < 0 ? `Follow-up overdue · ${d.company}` : `Follow-up due today · ${d.company}`,
          detail: `${d.stage} · ${f.followup_count || 0} follow-ups sent so far. ${d.nextTask.detail}.`,
          agent: 'Maya',
          target: { kind: 'deal', deal: d },
        });
      }
    }
    if (f.quote_valid_until && d.stage !== 'Enquiry received') {
      const left = daysFromToday(f.quote_valid_until);
      if (left >= 0 && left <= 14) {
        out.push({
          id: `exp-${d.id}`,
          level: left <= 3 ? 'Urgent' : 'High',
          icon: FileClock,
          title: `Quote expires in ${left} days · ${d.company}`,
          detail: `Valid until ${fmtDate(f.quote_valid_until)} · ${d.value}. Re-confirm the buy rate or extend.`,
          agent: 'Max',
          target: { kind: 'deal', deal: d },
        });
      }
    }
  }

  for (const o of organizations) {
    if (o.contractRenewalDate) {
      const left = daysFromToday(o.contractRenewalDate);
      if (left >= 0 && left <= 90) {
        out.push({
          id: `ren-${o.id}`,
          level: left <= 30 ? 'Urgent' : 'High',
          icon: CalendarClock,
          title: `Contract renews in ${left} days · ${o.name}`,
          detail: `They re-tender on ${fmtDate(o.contractRenewalDate)}. Send a renewal proposal before then.`,
          agent: 'Maya',
          target: { kind: 'company', org: o },
        });
      }
    }
    const dormant = dormantIn(o);
    if (dormant !== null) {
      out.push({
        id: `dor-${o.id}`,
        level: 'High',
        icon: TrendingDown,
        title: `${o.name} turns Dormant in ${dormant} days`,
        detail: `No enquiry since ${fmtDate(o.lastEnquiryDate)}. A check-in call usually surfaces the next shipment.`,
        agent: 'Maya',
        target: { kind: 'company', org: o },
      });
    }
  }

  for (const l of leads) {
    if (l.owner === owner && l.status === 'New' && l.matchFit === 'Strong') {
      out.push({
        id: `lead-${l.id}`,
        level: 'High',
        icon: Sparkles,
        title: `Strong-fit lead not contacted · ${l.company}`,
        detail: `${l.matchReason}. ${l.estTeuPerMonth} TEU/mo estimated.`,
        agent: 'Rhea',
        target: { kind: 'lead', lead: l },
      });
    }
  }

  return out.sort((a, b) => (a.level === b.level ? 0 : a.level === 'Urgent' ? -1 : 1));
}
