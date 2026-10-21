import { useState } from 'react';
import {
  AlertTriangle,
  Ship,
  Container,
  User,
  Hash,
  Clock,
  Percent,
  CalendarCheck,
  UserCheck,
  CalendarClock,
  Repeat,
} from 'lucide-react';
import { stageColor, type DealSummary } from '../data/deals';
import { dealFields, isQuoted, type DealFieldValues } from '../data/dealFields';
import { formatFieldValue } from './AttributesTab';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { InfoPane, InfoHeader, InfoSection, EditActions, FactList, FactRow } from '@/components/ui/info-pane';

export function DealInfoPane({ deal, fields }: { deal: DealSummary; fields: DealFieldValues }) {
  // "Now" for the overdue check — read once (not during every render).
  const [now] = useState(() => Date.now());
  const fieldLabel = (key: string) => dealFields.find((f) => f.key === key)!;
  const followUp = fields.next_followup_at;
  const overdue = !!followUp && new Date(followUp).getTime() < now;
  const buy = Number(fields.buy_value) || 0;
  const margin = Number(fields.margin) || 0;
  const quoted = isQuoted(deal); // deal value & quote fields exist from Quote sent onward
  const base = { name: deal.contact, role: deal.contactRole, email: deal.contactEmail };
  const [contact, setContact] = useState(base);
  const [draft, setDraft] = useState(base);
  const [editing, setEditing] = useState(false);

  const startEdit = () => {
    setDraft(contact);
    setEditing(true);
  };
  const save = () => {
    setContact(draft);
    setEditing(false);
  };

  return (
    <InfoPane storageKey="atlas.dealInfoPane.v2">
      <InfoHeader title={deal.company}>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2 py-0.5 text-[12px] font-medium text-muted">
            <span className="size-2 rounded-full" style={{ background: stageColor[deal.stage] }} />
            {deal.stage}
          </span>
          {deal.alert && (
            <span className="inline-flex items-center gap-1 rounded-full border border-danger/40 px-2 py-0.5 text-[10px] font-medium text-danger">
              <AlertTriangle size={11} /> Needs attention
            </span>
          )}
        </div>
        {/* Deal value only exists once the enquiry has been quoted. */}
        {quoted && (
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-[12px] text-faint">Deal value</span>
            <span className="text-[18px] font-semibold text-ink tabular-nums">{deal.value}</span>
          </div>
        )}
      </InfoHeader>

      <InfoSection title="Customer" onEdit={startEdit} editing={editing}>
        {editing ? (
          <div className="space-y-2.5">
            <Field label="Contact">
              <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </Field>
            <Field label="Role">
              <Input value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} />
            </Field>
            <Field label="Email">
              <Input value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
            </Field>
            <EditActions onSave={save} onCancel={() => setEditing(false)} />
          </div>
        ) : (
          <div className="space-y-0.5">
            <div className="text-[14px] font-semibold text-ink">{contact.name}</div>
            <div className="text-[14px] text-muted">{contact.role}</div>
            <a className="block truncate text-[14px] text-ink hover:underline" title={contact.email}>
              {contact.email}
            </a>
          </div>
        )}
      </InfoSection>

      {/* Quote & follow-up — Atlas deal fields the spec puts in the left pane (once quoted) */}
      {quoted && (
        <InfoSection title="Quote & follow-up">
          <FactList>
            <FactRow icon={Percent} label="Margin" title={fieldLabel('margin').notes}>
              {buy ? (
                <>
                  {formatFieldValue(fieldLabel('margin'), fields.margin)}
                  <span className="text-faint"> · {((margin / buy) * 100).toFixed(1)}%</span>
                </>
              ) : (
                '—'
              )}
            </FactRow>
            <FactRow icon={CalendarCheck} label="Quoted at">
              {formatFieldValue(fieldLabel('quoted_at'), fields.quoted_at)}
            </FactRow>
            <FactRow icon={UserCheck} label="Sales person quoted" title={fields.quoted_by}>
              {fields.quoted_by || '—'}
            </FactRow>
            <FactRow icon={CalendarClock} label="Follow-up date" title={overdue ? 'Overdue' : undefined}>
              <span className={overdue ? 'font-medium text-danger' : undefined}>
                {formatFieldValue(fieldLabel('next_followup_at'), followUp)}
                {overdue && ' · overdue'}
              </span>
            </FactRow>
            <FactRow icon={Repeat} label="Follow-ups done">
              {fields.followup_count || '0'}
            </FactRow>
          </FactList>
        </InfoSection>
      )}

      {/* Business / shipment */}
      <InfoSection>
        {/* One line per fact: label left, value right */}
        <FactList>
          <FactRow icon={Ship} label="Trade lane" title={`${deal.origin} → ${deal.destination}`}>
            {deal.origin} → {deal.destination}
          </FactRow>
          <FactRow icon={Container} label="Containers" title={`${deal.teu} · ${deal.equipment}`}>
            {deal.teu} · {deal.equipment}
          </FactRow>
          <FactRow icon={User} label="Owner">
            {deal.owner}
          </FactRow>
          <FactRow icon={Hash} label="Deal ID">
            <span className="text-muted">{deal.id}</span>
          </FactRow>
          <FactRow icon={Clock} label="Last updated">
            <span className="text-muted">{deal.updated}</span>
          </FactRow>
        </FactList>
      </InfoSection>
    </InfoPane>
  );
}
