import { useState } from 'react';
import { Building2, Mail, Phone, MapPin, User, Briefcase, Calendar, CalendarPlus, Hash, Tag } from 'lucide-react';
import type { ContactSummary } from '../data/contacts';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { InfoPane, InfoHeader, InfoSection, EditActions, FactList, FactRow } from '@/components/ui/info-pane';

export function ContactInfoPane({ contact }: { contact: ContactSummary }) {
  const base = { role: contact.role, email: contact.email, phone: contact.phone };
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
        <p className="mt-1 text-[14px] text-muted">{info.role}</p>
        <p className="mt-1 flex items-center gap-1.5 text-[14px] text-ink">
          <Building2 size={15} className="text-muted" />
          {contact.company}
        </p>
      </InfoHeader>

      <InfoSection title="Contact details" onEdit={startEdit} editing={editing}>
        {editing ? (
          <div className="space-y-2.5">
            <Field label="Role">
              <Input value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} />
            </Field>
            <Field label="Email">
              <Input value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
            </Field>
            <Field label="Phone">
              <Input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
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
            <div className="flex items-center gap-2 text-[14px] text-ink">
              <MapPin size={15} className="shrink-0 text-muted" />
              {contact.location}
            </div>
          </div>
        )}
      </InfoSection>

      {/* Meta */}
      <InfoSection>
        {/* One line per fact: icon + label left, value right */}
        <FactList>
          <FactRow icon={User} label="Owner">
            {contact.owner}
          </FactRow>
          <FactRow icon={Briefcase} label="Deals">
            {contact.dealsCount}
          </FactRow>
          <FactRow icon={Calendar} label="Last deal">
            {contact.lastDealDate}
          </FactRow>
          <FactRow icon={CalendarPlus} label="Created">
            {contact.created}
          </FactRow>
          <FactRow icon={Hash} label="Contact ID">
            <span className="text-muted">{contact.id}</span>
          </FactRow>
          <FactRow icon={Tag} label="Tags" wrap>
            {contact.tags.map((t) => (
              <span key={t} className="rounded-full border border-line px-2 py-0.5 text-[10px] font-medium text-muted">
                {t}
              </span>
            ))}
          </FactRow>
        </FactList>
      </InfoSection>
    </InfoPane>
  );
}
