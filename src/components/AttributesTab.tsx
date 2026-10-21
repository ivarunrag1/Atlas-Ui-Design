import { type DealSummary } from '../data/deals';
import { dealFieldGroups, dealFields, type DealFieldSpec, type DealFieldValues } from '../data/dealFields';
import { CheckboxField } from '@/components/ui/checkbox';
import { Input, Select } from '@/components/ui/input';
import { AttributeRow, AttributeSection } from './record/AttributeList';

const money = (n: number) => `$${n.toLocaleString('en-US')}`;

/** Read-only display of a field value by type. */
export function formatFieldValue(f: DealFieldSpec, v: string): string {
  if (!v) return '—';
  switch (f.type) {
    case 'Currency':
      return money(Number(v) || 0);
    case 'Date':
      return new Date(`${v}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    case 'Datetime':
      return new Date(v).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    case 'Check':
      return v === '1' ? 'Yes' : 'No';
    case 'Int':
    case 'Float':
      return Number(v).toLocaleString('en-US');
    default:
      return v;
  }
}

/** Inline editor for an editable field, by type. */
function FieldInput({ f, value, onChange }: { f: DealFieldSpec; value: string; onChange: (v: string) => void }) {
  const common = { size: 'sm' as const, 'aria-label': f.label, value };
  switch (f.type) {
    case 'Select':
      return <Select {...common} onChange={(e) => onChange(e.target.value)} options={['', ...(f.options ?? [])]} />;
    case 'Check':
      return <CheckboxField checked={value === '1'} onCheckedChange={(on) => onChange(on ? '1' : '0')} label={value === '1' ? 'Yes' : 'No'} />;
    case 'Date':
      return <Input {...common} type="date" onChange={(e) => onChange(e.target.value)} />;
    case 'Datetime':
      return <Input {...common} type="datetime-local" onChange={(e) => onChange(e.target.value)} />;
    case 'Currency':
      return <Input {...common} type="number" min={0} start="$" onChange={(e) => onChange(e.target.value)} />;
    case 'Int':
    case 'Float':
      return <Input {...common} type="number" min={0} step={f.type === 'Int' ? 1 : 'any'} onChange={(e) => onChange(e.target.value)} />;
    default:
      return <Input {...common} onChange={(e) => onChange(e.target.value)} />;
  }
}

/**
 * Deal attributes — the Atlas CRM Deal fields (commercial, shipment, follow-up, pipeline)
 * from the field spec. Editable fields edit inline; pipeline / calculated fields are
 * read-only and say who sets them. Frappe record fields follow under "Record".
 */
export function AttributesTab({
  deal,
  values,
  onChange,
}: {
  deal: DealSummary;
  values: DealFieldValues;
  onChange: (key: string, value: string) => void;
}) {
  const record: [string, string][] = [
    ['Deal ID', deal.id],
    ['Stage', deal.stage],
    ['Deal value', deal.value],
    ['Owner', deal.owner],
    ['Priority', deal.alert ? 'High' : 'Normal'],
    ['Last updated', deal.updated],
  ];

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="border-b border-line px-5 py-3">
        <h2 className="text-[16px] font-semibold text-ink">Attributes</h2>
        <p className="text-[12px] text-faint">Atlas deal fields — edit inline; locked fields are set by the pipeline or calculated</p>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
        {dealFieldGroups.map((g) => (
          <AttributeSection key={g.key} title={g.title} description={g.description}>
            {dealFields
              .filter((f) => f.group === g.key)
              .map((f) =>
                f.editable ? (
                  <AttributeRow key={f.key} label={f.label} hint={f.notes} editing>
                    <span className="block max-w-sm">
                      <FieldInput f={f} value={values[f.key] ?? ''} onChange={(v) => onChange(f.key, v)} />
                    </span>
                  </AttributeRow>
                ) : (
                  <AttributeRow key={f.key} label={f.label} hint={f.notes} lockedBy={f.lockedBy}>
                    <span className="block truncate" title={f.notes}>
                      {formatFieldValue(f, values[f.key] ?? '')}
                    </span>
                  </AttributeRow>
                ),
              )}
          </AttributeSection>
        ))}

        <AttributeSection title="Record" description="Frappe CRM deal fields">
          {record.map(([k, v]) => (
            <AttributeRow key={k} label={k}>
              {v}
            </AttributeRow>
          ))}
        </AttributeSection>
      </div>
    </div>
  );
}
