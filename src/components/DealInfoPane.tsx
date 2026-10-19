import { useState } from 'react';
import { AlertTriangle, Ship, Container } from 'lucide-react';
import { stageColor, type DealSummary } from '../data/deals';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { InfoPane, InfoHeader, InfoSection, EditActions, FactGrid, Fact } from '@/components/ui/info-pane';

export function DealInfoPane({ deal }: { deal: DealSummary }) {
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

      {/* Business / shipment */}
      <InfoSection>
        <FactGrid>
          <Fact label="Deal value">
            <span className="text-[18px] font-bold">{deal.value}</span>
          </Fact>
          <Fact label="Trade lane">
            <span className="inline-flex items-center gap-1.5">
              <Ship size={15} className="text-muted" />
              {deal.origin} → {deal.destination}
            </span>
          </Fact>
          <Fact label="Containers">
            <span className="inline-flex items-center gap-1.5">
              <Container size={15} className="text-muted" />
              {deal.teu} · {deal.equipment}
            </span>
          </Fact>
          <Fact label="Owner">{deal.owner}</Fact>
          <Fact label="Deal ID">
            <span className="text-muted">{deal.id}</span>
          </Fact>
          <Fact label="Last updated">
            <span className="text-muted">{deal.updated}</span>
          </Fact>
        </FactGrid>
      </InfoSection>
    </InfoPane>
  );
}
