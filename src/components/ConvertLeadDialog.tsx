import { useState } from 'react';
import { Building2, Handshake, Package, User } from 'lucide-react';
import type { ContactSummary } from '../data/contacts';
import { leads, type LeadSummary } from '../data/leads';
import type { Organization } from '../data/organizations';
import { matchContact, matchOrganization, profileFill, type ConvertInput } from '../data/convert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, SectionLabel } from '@/components/ui/field';
import { Input, Select } from '@/components/ui/input';
import { CheckboxField } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

const MODES: LeadSummary['mode'][] = ['FCL', 'LCL', 'Air', 'FTL', 'LTL'];
const MOVEMENTS: LeadSummary['movement'][] = ['Port-to-Port', 'Door-to-Port', 'Port-to-Door', 'Door-to-Door'];
const CARGO_TYPES = ['FAK', 'General cargo', 'Reefer', 'Hazardous', 'Out of gauge'];
const OWNERS = [...new Set(leads.map((l) => l.owner))];

/**
 * Convert to deal — mirrors Frappe's convert_to_deal: links or creates the company
 * (TradeMo ID → name → email domain), reuses or creates the contact (by email),
 * previews the shipment fields that copy to the deal, and can fill empty company
 * freight-profile fields from the lead's qualification.
 */
export function ConvertLeadDialog({
  lead,
  open,
  onOpenChange,
  organizations,
  contacts,
  onConfirm,
}: {
  lead: LeadSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizations: Organization[];
  contacts: ContactSummary[];
  onConfirm: (input: ConvertInput) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[min(560px,94vw)] flex-col">
        <DialogHeader>
          <DialogTitle>Convert to deal</DialogTitle>
          <DialogDescription>Creates a deal from {lead.company} and marks the lead Qualified.</DialogDescription>
        </DialogHeader>
        {/* Content mounts on open, so the form starts fresh from the lead each time. */}
        <ConvertForm lead={lead} organizations={organizations} contacts={contacts} onConfirm={onConfirm} onCancel={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function ConvertForm({
  lead,
  organizations,
  contacts,
  onConfirm,
  onCancel,
}: {
  lead: LeadSummary;
  organizations: Organization[];
  contacts: ContactSummary[];
  onConfirm: (input: ConvertInput) => void;
  onCancel: () => void;
}) {
  const match = matchOrganization(lead, organizations);
  const existingContact = matchContact(lead, contacts);

  // Sure matches link by default; a possible match waits for the rep to choose.
  const [orgChoice, setOrgChoice] = useState<'link' | 'create' | null>(match ? (match.sure ? 'link' : null) : 'create');
  const [newCompanyName, setNewCompanyName] = useState(lead.company);
  const [deal, setDeal] = useState<ConvertInput['deal']>({
    owner: lead.owner,
    mode: lead.mode,
    movement: lead.movement,
    cargoType: lead.cargoType,
    originCountry: lead.originCountry,
    destinationCountry: lead.destinationCountry,
  });
  const [fillProfile, setFillProfile] = useState(true);

  const linkOrg = orgChoice === 'link' && match ? match.org : null;
  const fill = profileFill(lead, linkOrg);
  const setDealField = <K extends keyof ConvertInput['deal']>(k: K, v: ConvertInput['deal'][K]) => setDeal((d) => ({ ...d, [k]: v }));

  const creates = [
    'deal',
    !existingContact && 'contact',
    orgChoice === 'create' && 'company',
  ].filter(Boolean) as string[];

  return (
    <>
      <DialogBody className="min-h-0 flex-1 space-y-5 overflow-y-auto">
        {/* Company */}
        <Section icon={Building2} title="Company">
          {match ? (
            <div className="space-y-2" role="radiogroup" aria-label="Company">
              {!match.sure && (
                <p className="text-[12px] text-warm">
                  Possible duplicate: {match.org.name} shares the email domain {match.org.domain}. Choose one.
                </p>
              )}
              <Choice
                selected={orgChoice === 'link'}
                onSelect={() => setOrgChoice('link')}
                title={`Link to ${match.org.name}`}
                meta={`${match.org.id} · ${match.org.accountStage} · matched by ${match.basis}`}
              />
              <Choice
                selected={orgChoice === 'create'}
                onSelect={() => setOrgChoice('create')}
                title="Create a new company"
                meta="Use when this is a different legal entity"
              />
            </div>
          ) : (
            <p className="text-[12px] text-muted">No existing company matches by TradeMo ID, name or email domain. A new company will be created.</p>
          )}
          {orgChoice === 'create' && (
            <Field label="Company name" className="mt-3">
              <Input size="sm" value={newCompanyName} onChange={(e) => setNewCompanyName(e.target.value)} />
            </Field>
          )}
        </Section>

        {/* Contact */}
        <Section icon={User} title="Contact">
          <div className="rounded-[6px] border border-line px-3 py-2">
            <div className="text-[14px] text-ink">
              {lead.contactName} <span className="text-muted">· {lead.contactRole}</span>
            </div>
            <div className="text-[12px] text-faint">
              {existingContact
                ? `Links to existing contact ${existingContact.id} (same email)`
                : `Will be created · no contact with ${lead.email}`}
            </div>
          </div>
        </Section>

        {/* Deal */}
        <Section icon={Handshake} title="Deal" hint="Stage: Enquiry received">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Owner">
              <Select size="sm" options={OWNERS} value={deal.owner} onChange={(e) => setDealField('owner', e.target.value)} />
            </Field>
            <Field label="Cargo type">
              <Select
                size="sm"
                options={CARGO_TYPES.includes(deal.cargoType) ? CARGO_TYPES : [deal.cargoType, ...CARGO_TYPES]}
                value={deal.cargoType}
                onChange={(e) => setDealField('cargoType', e.target.value)}
              />
            </Field>
            <Field label="Mode">
              <Select size="sm" options={MODES} value={deal.mode} onChange={(e) => setDealField('mode', e.target.value as LeadSummary['mode'])} />
            </Field>
            <Field label="Movement">
              <Select
                size="sm"
                options={MOVEMENTS}
                value={deal.movement}
                onChange={(e) => setDealField('movement', e.target.value as LeadSummary['movement'])}
              />
            </Field>
            <Field label="Origin country">
              <Input size="sm" value={deal.originCountry} onChange={(e) => setDealField('originCountry', e.target.value)} />
            </Field>
            <Field label="Destination country">
              <Input size="sm" value={deal.destinationCountry} onChange={(e) => setDealField('destinationCountry', e.target.value)} />
            </Field>
          </div>
        </Section>

        {/* Freight profile */}
        {fill.length > 0 && (
          <Section icon={Package} title="Freight profile">
            <CheckboxField
              checked={fillProfile}
              onCheckedChange={setFillProfile}
              label={`Fill ${fill.length} empty company field${fill.length === 1 ? '' : 's'} from this lead`}
            />
            <ul className="mt-2 space-y-1 pl-6 text-[12px]">
              {fill.map((f) => (
                <li key={f.key} className={cn('flex gap-2', !fillProfile && 'opacity-40')}>
                  <span className="w-44 shrink-0 text-faint">{f.label}</span>
                  <span className="min-w-0 truncate text-muted" title={String(f.value)}>
                    {String(f.value).replace(/\n/g, ' · ')}
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        )}
      </DialogBody>

      <DialogFooter className="justify-between">
        <span className="text-[12px] text-faint">Creates {creates.join(', ')}</span>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={orgChoice === null || (orgChoice === 'create' && !newCompanyName.trim())}
            onClick={() => onConfirm({ lead, linkOrg, newCompanyName, existingContact, deal, fillProfile: fillProfile && fill.length > 0 })}
          >
            Convert &amp; open deal
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}

function Section({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: typeof Building2;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <SectionLabel as="h3" className="flex items-center gap-1.5">
          <Icon size={12} /> {title}
        </SectionLabel>
        {hint && <span className="text-[10px] text-faint">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

/** One option in a radio group, as an outlined row. */
function Choice({ selected, onSelect, title, meta }: { selected: boolean; onSelect: () => void; title: string; meta: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        'flex w-full items-start gap-2.5 rounded-[6px] border px-3 py-2 text-left transition-colors outline-none focus-visible:border-line-strong',
        selected ? 'border-line-strong bg-subtle/40' : 'border-line hover:bg-subtle/40',
      )}
    >
      <span className={cn('mt-1 grid size-3.5 shrink-0 place-items-center rounded-full border', selected ? 'border-ink' : 'border-line-strong')}>
        {selected && <span className="size-1.5 rounded-full bg-ink" />}
      </span>
      <span className="min-w-0">
        <span className="block text-[14px] text-ink">{title}</span>
        <span className="block text-[12px] text-faint">{meta}</span>
      </span>
    </button>
  );
}
