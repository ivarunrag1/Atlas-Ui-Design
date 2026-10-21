import { useState } from 'react';
import {
  Briefcase,
  Building2,
  Calendar,
  CalendarPlus,
  ChevronRight,
  Clock,
  Hash,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  RefreshCw,
  Smartphone,
  Tag,
  User,
} from 'lucide-react';
import type { ContactSummary } from '../data/contacts';
import type { Organization } from '../data/organizations';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { InfoPane, InfoHeader, InfoSection, EditActions, FactList, FactRow } from '@/components/ui/info-pane';
import { EngagedText, StagePill, SyncText } from './company/parts';

/**
 * Contact left pane — same InfoPane parts as Leads and Companies: how to reach them,
 * how warm they are, what freight they handle, and their company's trade at a glance.
 */
export function ContactInfoPane({
  contact,
  org,
  onOpenCompany,
}: {
  contact: ContactSummary;
  org?: Organization;
  onOpenCompany: (o: Organization) => void;
}) {
  const base = { role: contact.role, email: contact.email, phone: contact.phone, mobileNo: contact.mobileNo ?? '' };
  const [info, setInfo] = useState(base);
  const [draft, setDraft] = useState(base);
  const [editing, setEditing] = useState(false);

  const startEdit = () => {
    setDraft(info);
    setEditing(true);
  };
  const save = () => {
    setInfo(draft);
    setEditing(false);
  };

  return (
    <InfoPane storageKey="atlas.contactInfoPane">
      <InfoHeader title={contact.name}>
        <p className="mt-1 text-[14px] text-muted">
          {info.role}
          {contact.department && <span className="text-faint"> · {contact.department}</span>}
        </p>
        {org ? (
          <button
            onClick={() => onOpenCompany(org)}
            className="group mt-1 flex items-center gap-1.5 text-[14px] text-ink hover:underline"
          >
            <Building2 size={15} className="text-muted" />
            {org.name}
            <ChevronRight size={14} className="text-faint group-hover:text-ink" />
          </button>
        ) : (
          <p className="mt-1 flex items-center gap-1.5 text-[14px] text-ink">
            <Building2 size={15} className="text-muted" />
            {contact.company}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {contact.contactRole && (
            <span className="rounded-full border border-line px-2 py-0.5 text-[12px] font-medium text-muted">{contact.contactRole}</span>
          )}
          {contact.isPrimary && <span className="rounded-full border border-line px-2 py-0.5 text-[12px] text-faint">Primary contact</span>}
          {org && <StagePill stage={org.accountStage} />}
        </div>
      </InfoHeader>

      <InfoSection title="Contact details" onEdit={startEdit} editing={editing}>
        {editing ? (
          <div className="space-y-2.5">
            <Field label="Designation">
              <Input value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} />
            </Field>
            <Field label="Email">
              <Input value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
            </Field>
            <Field label="Phone">
              <Input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
            </Field>
            <Field label="Mobile">
              <Input value={draft.mobileNo} onChange={(e) => setDraft({ ...draft, mobileNo: e.target.value })} />
            </Field>
            <EditActions onSave={save} onCancel={() => setEditing(false)} />
          </div>
        ) : (
          <div className="space-y-2.5">
            <a href={`mailto:${info.email}`} className="flex items-center gap-2 text-[14px] text-ink hover:underline">
              <Mail size={15} className="shrink-0 text-muted" />
              <span className="truncate">{info.email}</span>
            </a>
            <div className="flex items-center gap-2 text-[14px] text-ink">
              <Phone size={15} className="shrink-0 text-muted" />
              {info.phone}
            </div>
            {info.mobileNo && (
              <div className="flex items-center gap-2 text-[14px] text-ink">
                <Smartphone size={15} className="shrink-0 text-muted" />
                {info.mobileNo}
              </div>
            )}
            <div className="flex items-center gap-2 text-[14px] text-ink">
              <MapPin size={15} className="shrink-0 text-muted" />
              {contact.location}
            </div>
          </div>
        )}
      </InfoSection>

      {/* Engagement — how warm this person is */}
      <InfoSection title="Engagement">
        <FactList>
          <FactRow icon={Clock} label="Last engaged" title="Latest email, call, meeting or note">
            <EngagedText iso={contact.lastEngagedAt} />
          </FactRow>
          <FactRow icon={MessageSquare} label="Status">
            {contact.status ?? '—'}
          </FactRow>
          <FactRow icon={User} label="Contact owner">
            {contact.owner}
          </FactRow>
        </FactList>
      </InfoSection>

      <InfoSection title="Record">
        <FactList>
          <FactRow icon={Briefcase} label="Deals">
            {contact.dealsCount}
          </FactRow>
          <FactRow icon={Calendar} label="Last deal">
            {contact.lastDealDate}
          </FactRow>
          <FactRow icon={RefreshCw} label="Freightify sync">
            <SyncText status={contact.freightifySyncStatus} />
          </FactRow>
          <FactRow icon={CalendarPlus} label="Created">
            {contact.created}
          </FactRow>
          <FactRow icon={Hash} label="Contact ID">
            <span className="text-muted">{contact.id}</span>
          </FactRow>
          {contact.tags.length > 0 && (
            <FactRow icon={Tag} label="Tags" wrap>
              {contact.tags.map((t) => (
                <span key={t} className="rounded-full border border-line px-2 py-0.5 text-[10px] font-medium text-muted">
                  {t}
                </span>
              ))}
            </FactRow>
          )}
        </FactList>
      </InfoSection>
    </InfoPane>
  );
}
