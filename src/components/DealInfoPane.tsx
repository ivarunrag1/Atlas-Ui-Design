import { useState } from 'react';
import { AlertTriangle, Ship, Container, Pencil, Check, X } from 'lucide-react';
import { stageColor, type DealSummary } from '../data/deals';

const labelCls = 'text-[10px] font-medium uppercase tracking-[0.04em] text-faint';

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className={labelCls}>{label}</span>
      <span className="text-[14px] font-medium text-ink">{children}</span>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="t-label text-muted">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-line bg-canvas px-3 py-1.5 text-[14px] text-ink outline-none focus:border-line-strong"
      />
    </label>
  );
}

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
    <aside className="flex w-[300px] shrink-0 flex-col overflow-y-auto border-r border-line bg-surface">
      {/* Identity */}
      <div className="px-5 py-4">
        <h2 className="t-page text-ink">{deal.company}</h2>
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
      </div>

      {/* Customer */}
      <div className="border-t border-line px-5 py-4">
        <div className="mb-2 flex items-center justify-between">
          <span className={labelCls}>Customer</span>
          {!editing && (
            <button
              onClick={startEdit}
              className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[12px] font-medium text-faint hover:bg-subtle hover:text-ink"
            >
              <Pencil size={12} /> Edit
            </button>
          )}
        </div>
        {editing ? (
          <div className="space-y-2.5">
            <Field label="Contact" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} />
            <Field label="Role" value={draft.role} onChange={(v) => setDraft({ ...draft, role: v })} />
            <Field label="Email" value={draft.email} onChange={(v) => setDraft({ ...draft, email: v })} />
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={save}
                className="flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-[14px] font-semibold text-canvas hover:bg-ink/90"
              >
                <Check size={14} /> Save
              </button>
              <button
                onClick={() => setEditing(false)}
                className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-[14px] font-medium text-muted hover:bg-subtle"
              >
                <X size={14} /> Cancel
              </button>
            </div>
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
      </div>

      {/* Business / shipment */}
      <div className="space-y-4 border-t border-line px-5 py-4">
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
          <span className="text-[14px] font-medium text-muted">{deal.id}</span>
        </Fact>
        <Fact label="Last updated">
          <span className="text-[14px] font-medium text-muted">{deal.updated}</span>
        </Fact>
      </div>
    </aside>
  );
}
