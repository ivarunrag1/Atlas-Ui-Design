import { useState } from 'react';
import { Building2, Mail, Phone, MapPin, Pencil, Check, X } from 'lucide-react';
import type { ContactSummary } from '../data/contacts';

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

export function ContactInfoPane({ contact }: { contact: ContactSummary }) {
  const base = { role: contact.role, email: contact.email, phone: contact.phone };
  const [info, setInfo] = useState(base);
  const [draft, setDraft] = useState(base);
  const [editing, setEditing] = useState(false);

  const save = () => {
    setInfo(draft);
    setEditing(false);
  };

  return (
    <aside className="flex w-[300px] shrink-0 flex-col overflow-y-auto border-r border-line bg-surface">
      {/* Identity */}
      <div className="px-5 py-4">
        <h2 className="t-page text-ink">{contact.name}</h2>
        <p className="mt-1 text-[14px] text-muted">{info.role}</p>
        <p className="mt-1 flex items-center gap-1.5 text-[14px] text-ink">
          <Building2 size={15} className="text-muted" />
          {contact.company}
        </p>
      </div>

      {/* Contact details */}
      <div className="border-t border-line px-5 py-4">
        <div className="mb-2 flex items-center justify-between">
          <span className={labelCls}>Contact details</span>
          {!editing && (
            <button
              onClick={() => {
                setDraft(info);
                setEditing(true);
              }}
              className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[12px] font-medium text-faint hover:bg-subtle hover:text-ink"
            >
              <Pencil size={12} /> Edit
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-2.5">
            <Field label="Role" value={draft.role} onChange={(v) => setDraft({ ...draft, role: v })} />
            <Field label="Email" value={draft.email} onChange={(v) => setDraft({ ...draft, email: v })} />
            <Field label="Phone" value={draft.phone} onChange={(v) => setDraft({ ...draft, phone: v })} />
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
          <div className="space-y-2.5">
            <a
              href={`mailto:${info.email}`}
              className="flex items-center gap-2 text-[14px] text-ink hover:underline"
            >
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
      </div>

      {/* Meta */}
      <div className="space-y-4 border-t border-line px-5 py-4">
        <Fact label="Owner">{contact.owner}</Fact>
        <Fact label="Deals">{contact.dealsCount}</Fact>
        <Fact label="Last deal">{contact.lastDealDate}</Fact>
        <Fact label="Created">{contact.created}</Fact>
        <div className="flex flex-col gap-1.5">
          <span className={labelCls}>Tags</span>
          <div className="flex flex-wrap gap-1.5">
            {contact.tags.map((t) => (
              <span
                key={t}
                className="rounded-full border border-line px-2 py-0.5 text-[12px] font-medium text-muted"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <Fact label="Contact ID">
          <span className="text-[14px] font-medium text-muted">{contact.id}</span>
        </Fact>
      </div>
    </aside>
  );
}
