import { FileText, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input, Select, inputVariants } from '@/components/ui/input';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { cn } from '@/lib/utils';

/* ── Model ─────────────────────────────────────────────────────────────────── */

/** Max container lines (equipment types) per search. */
export const MAX_CONTAINER_LINES = 4;

export const containerTypes = ["20'GP", "40'GP", "40'HC", "45'HC", "20'RF", "40'RF", "20'OT", "40'FR"];

export const cargoTypes = [
  'General cargo',
  'Hazardous (DG)',
  'Temperature-controlled',
  'Perishable',
  'Oversized (OOG)',
  'Valuable',
];

/** Pallet footprints, cm. */
export const palletTypes: Record<string, { l: number; w: number }> = {
  'Euro 120×80': { l: 120, w: 80 },
  'Standard 120×100': { l: 120, w: 100 },
};

export interface ContainerLine {
  id: string;
  type: string;
  qty: number;
  /** Cargo weight per container, kg. */
  weightKg: number;
}

/** LCL piece entered by dimensions (cm) — volume is derived. */
export interface UnitLine {
  id: string;
  qty: number;
  l: number;
  w: number;
  h: number;
  weightKg: number;
}

/** LCL pallet — footprint from `type`, height entered (cm). */
export interface PalletLine {
  id: string;
  type: string;
  qty: number;
  h: number;
  weightKg: number;
}

/** How LCL cargo is entered — only one method is active at a time. */
export type LclMethod = 'total' | 'units' | 'pallets';

export interface Load {
  mode: 'FCL' | 'LCL';
  containers: ContainerLine[];
  lcl: {
    method: LclMethod;
    total: { packages: number; volumeCbm: number; weightKg: number };
    units: UnitLine[];
    pallets: PalletLine[];
  };
  cargoType: string;
  /** Number of bills of lading required. */
  billsOfLading: number;
}

const num = (s: string) => Math.max(0, Number(s) || 0);
const fmt = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 2 });
const newId = (p: string) => `${p}${Date.now()}`;

/** Totals for the active LCL method. */
function lclTotals(lcl: Load['lcl']) {
  if (lcl.method === 'units')
    return lcl.units.reduce(
      (a, u) => ({
        pieces: a.pieces + u.qty,
        cbm: a.cbm + (u.qty * u.l * u.w * u.h) / 1e6,
        kg: a.kg + u.qty * u.weightKg,
      }),
      { pieces: 0, cbm: 0, kg: 0 },
    );
  if (lcl.method === 'pallets')
    return lcl.pallets.reduce((a, p) => {
      const f = palletTypes[p.type];
      return {
        pieces: a.pieces + p.qty,
        cbm: a.cbm + (p.qty * f.l * f.w * p.h) / 1e6,
        kg: a.kg + p.qty * p.weightKg,
      };
    }, { pieces: 0, cbm: 0, kg: 0 });
  return { pieces: lcl.total.packages, cbm: lcl.total.volumeCbm, kg: lcl.total.weightKg };
}

/* ── Small building blocks ─────────────────────────────────────────────────── */

/** Column labels above a list of line inputs. */
function LineHead({ cols, labels }: { cols: string; labels: string[] }) {
  return (
    <div className={cn('grid gap-2 t-desc text-muted', cols)}>
      {labels.map((l, i) => (
        <span key={i} className="truncate">
          {l}
        </span>
      ))}
    </div>
  );
}

function RemoveLine({ onClick, disabled, label }: { onClick: () => void; disabled: boolean; label: string }) {
  return (
    <Button
      variant="ghost"
      size="icon-xs"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="text-faint hover:text-danger"
    >
      <X size={14} />
    </Button>
  );
}

function AddLine({ onClick, label, max, count }: { onClick: () => void; label: string; max?: number; count?: number }) {
  const atMax = max !== undefined && count !== undefined && count >= max;
  return (
    <Button
      variant="ghost"
      size="xs"
      onClick={onClick}
      disabled={atMax}
      title={atMax ? `Up to ${max} per search` : undefined}
      className="-ml-2 text-[12px]"
    >
      <Plus size={13} /> {label}
      {max !== undefined && (
        <span className="text-faint">
          ({count}/{max})
        </span>
      )}
    </Button>
  );
}

/** L × W × H in one field (cm). */
function DimsInput({
  l,
  w,
  h,
  onChange,
}: {
  l: number;
  w: number;
  h: number;
  onChange: (d: { l: number; w: number; h: number }) => void;
}) {
  const cell = 'h-full w-full min-w-0 bg-transparent text-center outline-none';
  return (
    <div className={cn(inputVariants({ size: 'sm' }), 'flex items-center gap-0.5 px-1.5 focus-within:border-line-strong')}>
      <input type="number" aria-label="Length (cm)" value={l} onChange={(e) => onChange({ l: num(e.target.value), w, h })} className={cell} />
      <span className="text-faint">×</span>
      <input type="number" aria-label="Width (cm)" value={w} onChange={(e) => onChange({ l, w: num(e.target.value), h })} className={cell} />
      <span className="text-faint">×</span>
      <input type="number" aria-label="Height (cm)" value={h} onChange={(e) => onChange({ l, w, h: num(e.target.value) })} className={cell} />
    </div>
  );
}

/* ── Component ─────────────────────────────────────────────────────────────── */

const fclCols = 'grid-cols-[minmax(0,1fr)_4.5rem_6.5rem_1.75rem]';
const unitCols = 'grid-cols-[3.5rem_minmax(0,1fr)_5.5rem_1.75rem]';
const palletCols = '@sm:grid-cols-[minmax(0,1fr)_3.5rem_5rem_5.5rem_1.75rem]';
/* Narrow cards: pallet lines wrap to two rows — [type · qty · ×] then [height · weight]. */
const palletWrap = {
  type: 'col-span-7 @sm:col-span-1',
  qty: 'col-span-4 @sm:col-span-1',
  remove: 'col-span-1 order-1 @sm:order-none',
  half: 'col-span-6 order-2 @sm:col-span-1 @sm:order-none',
};

/** Load details for the shipment. FCL/LCL is chosen at the top of the form (`load.mode`). */
export function LoadDetails({ load, onChange }: { load: Load; onChange: (l: Load) => void }) {
  const lcl = load.lcl;
  const setLcl = (patch: Partial<Load['lcl']>) => onChange({ ...load, lcl: { ...lcl, ...patch } });

  // FCL lines
  const setContainer = (id: string, patch: Partial<ContainerLine>) =>
    onChange({ ...load, containers: load.containers.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
  const addContainer = () =>
    load.containers.length < MAX_CONTAINER_LINES &&
    onChange({ ...load, containers: [...load.containers, { id: newId('cl'), type: "20'GP", qty: 1, weightKg: 0 }] });

  // LCL unit / pallet lines
  const setUnit = (id: string, patch: Partial<UnitLine>) =>
    setLcl({ units: lcl.units.map((u) => (u.id === id ? { ...u, ...patch } : u)) });
  const setPallet = (id: string, patch: Partial<PalletLine>) =>
    setLcl({ pallets: lcl.pallets.map((p) => (p.id === id ? { ...p, ...patch } : p)) });

  const fclUnits = load.containers.reduce((a, c) => a + c.qty, 0);
  const fclKg = load.containers.reduce((a, c) => a + c.qty * c.weightKg, 0);
  const t = lclTotals(lcl);
  const summary =
    load.mode === 'FCL'
      ? `${fclUnits} container${fclUnits === 1 ? '' : 's'} · ${fmt(fclKg)} kg`
      : `${t.pieces} pcs · ${fmt(t.cbm)} cbm · ${fmt(t.kg)} kg`;

  return (
    // Own container so the inner layout follows the card's width (it may sit in a half column).
    <Card className="@container">
      <CardHeader>
        <div className="flex min-w-0 items-center gap-2">
          <span className="t-subhead shrink-0 text-ink">Load details</span>
          <span className="truncate text-[12px] text-faint">{summary}</span>
        </div>
        <span className="text-[12px] font-medium text-muted">{load.mode}</span>
      </CardHeader>

      <CardContent className="space-y-3">
        {load.mode === 'FCL' ? (
          <div className="space-y-2">
            <LineHead cols={fclCols} labels={['Container type', 'Qty', 'Weight / unit (kg)', '']} />
            {load.containers.map((c) => (
              <div key={c.id} className={cn('grid items-center gap-2', fclCols)}>
                <Select
                  size="sm"
                  aria-label="Container type"
                  value={c.type}
                  onChange={(e) => setContainer(c.id, { type: e.target.value })}
                  options={containerTypes}
                />
                <Input size="sm" type="number" min={1} aria-label="Quantity" value={c.qty} onChange={(e) => setContainer(c.id, { qty: num(e.target.value) })} />
                <Input size="sm" type="number" aria-label="Weight per container in kg" value={c.weightKg} onChange={(e) => setContainer(c.id, { weightKg: num(e.target.value) })} />
                <RemoveLine
                  label="Remove container line"
                  disabled={load.containers.length === 1}
                  onClick={() => onChange({ ...load, containers: load.containers.filter((x) => x.id !== c.id) })}
                />
              </div>
            ))}
            <AddLine onClick={addContainer} label="Add container type" max={MAX_CONTAINER_LINES} count={load.containers.length} />
          </div>
        ) : (
          <div className="space-y-3">
            <SegmentedControl
              stretch
              aria-label="Enter LCL cargo by"
              value={lcl.method}
              onChange={(method) => setLcl({ method })}
              options={[
                { value: 'total', label: 'Total shipment' },
                { value: 'units', label: 'Units' },
                { value: 'pallets', label: 'Pallets' },
              ]}
            />

            {lcl.method === 'total' && (
              <div className="grid grid-cols-1 gap-3 @md:grid-cols-3">
                <Field label="Packages">
                  <Input size="sm" type="number" value={lcl.total.packages} onChange={(e) => setLcl({ total: { ...lcl.total, packages: num(e.target.value) } })} />
                </Field>
                <Field label="Volume">
                  <Input size="sm" type="number" end="cbm" value={lcl.total.volumeCbm} onChange={(e) => setLcl({ total: { ...lcl.total, volumeCbm: num(e.target.value) } })} />
                </Field>
                <Field label="Weight">
                  <Input size="sm" type="number" end="kg" value={lcl.total.weightKg} onChange={(e) => setLcl({ total: { ...lcl.total, weightKg: num(e.target.value) } })} />
                </Field>
              </div>
            )}

            {lcl.method === 'units' && (
              <div className="space-y-2">
                <LineHead cols={unitCols} labels={['Qty', 'L × W × H (cm)', 'Kg / unit', '']} />
                {lcl.units.map((u) => (
                  <div key={u.id} className={cn('grid items-center gap-2', unitCols)}>
                    <Input size="sm" type="number" min={1} aria-label="Quantity" value={u.qty} onChange={(e) => setUnit(u.id, { qty: num(e.target.value) })} />
                    <DimsInput l={u.l} w={u.w} h={u.h} onChange={(d) => setUnit(u.id, d)} />
                    <Input size="sm" type="number" aria-label="Weight per unit in kg" value={u.weightKg} onChange={(e) => setUnit(u.id, { weightKg: num(e.target.value) })} />
                    <RemoveLine
                      label="Remove unit line"
                      disabled={lcl.units.length === 1}
                      onClick={() => setLcl({ units: lcl.units.filter((x) => x.id !== u.id) })}
                    />
                  </div>
                ))}
                <AddLine
                  label="Add unit"
                  onClick={() => setLcl({ units: [...lcl.units, { id: newId('u'), qty: 1, l: 0, w: 0, h: 0, weightKg: 0 }] })}
                />
              </div>
            )}

            {lcl.method === 'pallets' && (
              <div className="space-y-2">
                <div className="hidden @sm:block">
                  <LineHead cols={palletCols} labels={['Pallet type', 'Qty', 'Height', 'Weight / pallet', '']} />
                </div>
                {lcl.pallets.map((p) => (
                  <div key={p.id} className={cn('grid grid-cols-12 items-center gap-2', palletCols)}>
                    <div className={palletWrap.type}>
                      <Select size="sm" aria-label="Pallet type" value={p.type} onChange={(e) => setPallet(p.id, { type: e.target.value })} options={Object.keys(palletTypes)} />
                    </div>
                    <Input size="sm" type="number" min={1} aria-label="Quantity" value={p.qty} onChange={(e) => setPallet(p.id, { qty: num(e.target.value) })} className={palletWrap.qty} />
                    <Input size="sm" type="number" aria-label="Pallet height in cm" end="cm" value={p.h} onChange={(e) => setPallet(p.id, { h: num(e.target.value) })} className={palletWrap.half} />
                    <Input size="sm" type="number" aria-label="Weight per pallet in kg" end="kg" value={p.weightKg} onChange={(e) => setPallet(p.id, { weightKg: num(e.target.value) })} className={palletWrap.half} />
                    <div className={palletWrap.remove}>
                      <RemoveLine
                        label="Remove pallet line"
                        disabled={lcl.pallets.length === 1}
                        onClick={() => setLcl({ pallets: lcl.pallets.filter((x) => x.id !== p.id) })}
                      />
                    </div>
                  </div>
                ))}
                <AddLine
                  label="Add pallet type"
                  onClick={() =>
                    setLcl({ pallets: [...lcl.pallets, { id: newId('p'), type: 'Euro 120×80', qty: 1, h: 0, weightKg: 0 }] })
                  }
                />
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 @md:grid-cols-[minmax(0,1fr)_7rem]">
          <Field label="Cargo type">
            <Select size="sm" value={load.cargoType} onChange={(e) => onChange({ ...load, cargoType: e.target.value })} options={cargoTypes} />
          </Field>
          <Field label="No. of B/Ls">
            <Input
              size="sm"
              type="number"
              min={1}
              required
              start={<FileText size={14} />}
              value={load.billsOfLading}
              // At least one bill of lading is always issued.
              onChange={(e) => onChange({ ...load, billsOfLading: Math.max(1, num(e.target.value)) })}
            />
          </Field>
        </div>
      </CardContent>
    </Card>
  );
}
