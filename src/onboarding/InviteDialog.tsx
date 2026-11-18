import { useState } from 'react';
import { AlertTriangle, Info, Plus, RotateCw, Trash2, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SectionLabel } from '@/components/ui/field';
import { Input, Select } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { isEmail, ROLES, type EngineKind, type Invite, type Role } from './model';

interface Row {
  id: number;
  name: string;
  email: string;
  role: Role;
}

/** Emails that exist in the mock existing Freight Engine — inviting them links instead of creating (D8). */
const ENGINE_USERS = ['rahul@acmelogistics.com', 'meera@acmelogistics.com'];

let rowId = 1;
const newRow = (): Row => ({ id: rowId++, name: '', email: '', role: 'Sales Rep' });

/**
 * Invite your team. Rows of name / email / role (Admin can invite Admins — D10).
 * The Freight Engine user is linked when the email already exists there, otherwise
 * created; no Freight Engine validation is shown, only a helper under the email (D8).
 * Sent invites list below with Resend / Revoke (48 h, single use).
 */
export function InviteDialog({
  open,
  onOpenChange,
  engine,
  myEmail,
  invites,
  onSend,
  onResend,
  onRevoke,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  engine: EngineKind;
  myEmail: string;
  invites: Invite[];
  onSend: (rows: Omit<Invite, 'id' | 'status' | 'sentAt'>[]) => void;
  onResend: (id: string) => void;
  onRevoke: (id: string) => void;
}) {
  // Mounted only while open, so every open starts with one empty row.
  const [rows, setRows] = useState<Row[]>(() => [newRow()]);
  const [submitted, setSubmitted] = useState(false);

  const active = invites.filter((i) => i.status !== 'Revoked').map((i) => i.email.toLowerCase());
  const errorFor = (r: Row, i: number): string | undefined => {
    const e = r.email.trim().toLowerCase();
    if (!r.name.trim() && !e) return i === 0 && rows.length === 1 ? 'Add at least one person.' : undefined;
    if (!r.name.trim()) return 'Enter a name.';
    if (!e) return 'Enter an email.';
    if (!isEmail(e)) return 'Enter a valid email address.';
    if (e === myEmail.toLowerCase()) return 'That’s you. You’re already in this workspace.';
    if (active.includes(e)) return 'Already invited. Use Resend below.';
    if (rows.some((x, k) => k < i && x.email.trim().toLowerCase() === e)) return 'Duplicate email in this list.';
    return undefined;
  };
  const filled = rows.filter((r) => r.name.trim() || r.email.trim());
  const errors = rows.map(errorFor);
  const canSend = filled.length > 0 && errors.every((e) => !e);

  const send = () => {
    setSubmitted(true);
    if (!canSend) return;
    onSend(
      filled.map((r) => ({
        name: r.name.trim(),
        email: r.email.trim(),
        role: r.role,
        engineUser: engine === 'existing' && ENGINE_USERS.includes(r.email.trim().toLowerCase()) ? 'linked' : 'created',
      })),
    );
    setRows([newRow()]);
    setSubmitted(false);
  };

  const update = (id: number, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(720px,94vw)]">
        <DialogHeader>
          <DialogTitle>Invite your team</DialogTitle>
          <DialogDescription>Each person gets their own mailbox, calendar and Freight Engine user. Invites expire after 48 hours.</DialogDescription>
        </DialogHeader>
        <DialogBody className="flex max-h-[60vh] flex-col gap-4 overflow-auto">
          <div className="flex flex-col gap-3">
            <div className="hidden grid-cols-[1fr_1.4fr_150px_28px] gap-2 sm:grid">
              <SectionLabel>Name</SectionLabel>
              <SectionLabel>Work email</SectionLabel>
              <SectionLabel>Role</SectionLabel>
              <span />
            </div>
            {rows.map((r, i) => {
              const err = submitted ? errors[i] : undefined;
              return (
                <div key={r.id} className="flex flex-col gap-1">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1.4fr_150px_28px] sm:items-center">
                    <Input
                      size="sm"
                      value={r.name}
                      onChange={(e) => update(r.id, { name: e.target.value })}
                      placeholder="Full name"
                      aria-label="Name"
                    />
                    <Input
                      size="sm"
                      type="email"
                      value={r.email}
                      onChange={(e) => update(r.id, { email: e.target.value })}
                      placeholder="name@company.com"
                      aria-label="Work email"
                      aria-invalid={!!err}
                    />
                    <Select
                      size="sm"
                      value={r.role}
                      onChange={(e) => update(r.id, { role: e.target.value as Role })}
                      options={ROLES}
                      aria-label="Role"
                    />
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label="Remove row"
                      disabled={rows.length === 1}
                      onClick={() => setRows((rs) => rs.filter((x) => x.id !== r.id))}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                  {err && (
                    <p className="t-desc flex items-center gap-1.5 text-danger">
                      <AlertTriangle size={12} /> {err}
                    </p>
                  )}
                </div>
              );
            })}
            {/* D8 helper — no validation against Freight Engine, just guidance */}
            <p className="t-desc flex items-start gap-1.5 text-muted">
              <Info size={12} className="mt-0.5 shrink-0" />
              Use the same email as their Freight Engine account to sync their records. A new email creates a new Freight Engine user.
            </p>
            <Button variant="outline" size="sm" className="self-start" onClick={() => setRows((rs) => [...rs, newRow()])}>
              <Plus /> Add another
            </Button>
          </div>

          {invites.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-line pt-4">
              <SectionLabel>Invited</SectionLabel>
              <ul className="flex flex-col divide-y divide-line rounded-lg border border-line">
                {invites.map((iv) => (
                  <li key={iv.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-ink">
                        {iv.name} <span className="t-desc text-faint">· {iv.role}</span>
                      </p>
                      <p className="t-desc truncate text-faint">
                        {iv.email} · Freight Engine user {iv.engineUser === 'linked' ? 'linked (existing account)' : 'created'} · {iv.sentAt}
                      </p>
                    </div>
                    <Badge variant={iv.status === 'Invited' ? 'atlas' : iv.status === 'Expired' ? 'danger' : 'default'}>{iv.status}</Badge>
                    <div className="flex gap-1">
                      {iv.status === 'Revoked' ? (
                        <Button variant="ghost" size="xs" onClick={() => onResend(iv.id)}>
                          <Undo2 /> Invite again
                        </Button>
                      ) : (
                        <>
                          <Button variant="ghost" size="xs" onClick={() => onResend(iv.id)}>
                            <RotateCw /> Resend
                          </Button>
                          {iv.status === 'Invited' && (
                            <Button variant="ghost" size="xs" className="text-danger hover:text-danger" onClick={() => onRevoke(iv.id)}>
                              Revoke
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              <p className="t-desc text-faint">Resending creates a new link and the old one stops working.</p>
            </div>
          )}
        </DialogBody>
        <DialogFooter className={cn(invites.length > 0 && 'justify-between')}>
          {invites.length > 0 && (
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          )}
          <div className="flex gap-2">
            {invites.length === 0 && (
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            )}
            <Button onClick={send} disabled={submitted && !canSend}>
              Send {filled.length > 1 ? `${filled.length} invites` : 'invite'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
