import { Anchor, ArrowLeftRight, MapPin, Plus } from 'lucide-react';
import { ports, doorLocations, nearbyPorts, type Port, type DoorLocation } from '../data/locations';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckboxField } from '@/components/ui/checkbox';
import { ChipCombobox, ValueChip } from '@/components/ui/combobox';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Field } from '@/components/ui/field';
import { SegmentedControl } from '@/components/ui/segmented-control';

/* ── Model ─────────────────────────────────────────────────────────────────── */

/** Door = pickup/delivery at an address (+ the port it routes via); CY = port container yard only. */
export type LegMode = 'door' | 'cy';

export interface Leg {
  mode: LegMode;
  door: DoorLocation | null;
  port: Port | null;
  /** Extra ports near `port` to also quote from/to. */
  nearby: Port[];
  localCharges: boolean;
}

/* ── Chip content (shared by the chip and the dropdown rows) ───────────────── */

export function PortItem({ port }: { port: Port }) {
  return (
    <>
      <Anchor size={13} className="shrink-0 text-muted" />
      <span className="truncate font-medium text-ink">{port.name}</span>
      <span className="shrink-0 text-faint">{port.code}</span>
    </>
  );
}

export function DoorItem({ door }: { door: DoorLocation }) {
  return (
    <>
      <MapPin size={13} className="shrink-0 text-muted" />
      <span className="truncate font-medium text-ink">
        {door.name}, {door.city}
      </span>
      <span className="shrink-0 text-faint">{door.pincode}</span>
    </>
  );
}

/* ── Pickers ───────────────────────────────────────────────────────────────── */

function PortPicker({ value, onChange }: { value: Port | null; onChange: (p: Port | null) => void }) {
  return (
    <ChipCombobox
      aria-label="Port"
      value={value}
      onChange={onChange}
      options={ports}
      getKey={(p) => p.code}
      matches={(p, q) => `${p.name} ${p.code} ${p.country}`.toLowerCase().includes(q)}
      renderItem={(p) => <PortItem port={p} />}
      placeholder="Search port or code…"
      emptyText="No ports match"
    />
  );
}

function DoorPicker({
  value,
  onChange,
}: {
  value: DoorLocation | null;
  onChange: (d: DoorLocation | null) => void;
}) {
  return (
    <ChipCombobox
      aria-label="Door location"
      value={value}
      onChange={onChange}
      options={doorLocations}
      getKey={(d) => d.id}
      matches={(d, q) => `${d.name} ${d.city} ${d.pincode} ${d.country}`.toLowerCase().includes(q)}
      renderItem={(d) => <DoorItem door={d} />}
      placeholder="Search address or pincode…"
      emptyText="No locations match"
    />
  );
}

const hasPort = (list: Port[], p: Port) => list.some((v) => v.code === p.code);
const togglePort = (list: Port[], p: Port) =>
  hasPort(list, p) ? list.filter((v) => v.code !== p.code) : [...list, p];

/** Chosen nearby ports as removable chips (shown under the Port input). */
function NearbyPortChips({ value, onChange }: { value: Port[]; onChange: (ports: Port[]) => void }) {
  if (value.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {value.map((p) => (
        <ValueChip key={p.code} onRemove={() => onChange(togglePort(value, p))} removeLabel={`Remove ${p.name}`}>
          <PortItem port={p} />
        </ValueChip>
      ))}
    </div>
  );
}

/** “+ Add nearby ports” menu — tick ports near the selected one. */
function NearbyPortsMenu({
  port,
  value,
  onChange,
}: {
  port: Port | null;
  value: Port[];
  onChange: (ports: Port[]) => void;
}) {
  const candidates = port ? nearbyPorts(port.code) : [];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="xs"
          disabled={candidates.length === 0}
          title={!port ? 'Select a port first' : candidates.length === 0 ? 'No nearby ports' : undefined}
          className="-ml-2 text-[12px]" // flush with the card's content edge
        >
          <Plus size={13} /> Add nearby ports
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Near {port?.name}</DropdownMenuLabel>
        {candidates.map((p) => (
          <DropdownMenuCheckboxItem
            key={p.code}
            checked={hasPort(value, p)}
            onCheckedChange={() => onChange(togglePort(value, p))}
          >
            <span className="flex min-w-0 flex-1 items-center gap-1.5">
              <PortItem port={p} />
            </span>
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ── One leg (origin or destination) ───────────────────────────────────────── */

function LegCard({ title, leg, onChange }: { title: string; leg: Leg; onChange: (l: Leg) => void }) {
  return (
    <Card className="flex min-w-0 flex-col gap-3 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="t-subhead text-ink">{title}</span>
        <SegmentedControl
          aria-label={`${title} type`}
          value={leg.mode}
          onChange={(mode) => onChange({ ...leg, mode })}
          options={[
            { value: 'door', label: 'Door' },
            { value: 'cy', label: 'CY' },
          ]}
        />
      </div>

      {leg.mode === 'door' && (
        <Field label="Door location">
          <DoorPicker value={leg.door} onChange={(door) => onChange({ ...leg, door })} />
        </Field>
      )}
      <div className="flex flex-col gap-1.5">
        <Field label="Port">
          <PortPicker
            value={leg.port}
            // Nearby ports are relative to the main port, so reset them when it changes.
            onChange={(port) => onChange({ ...leg, port, nearby: port?.code === leg.port?.code ? leg.nearby : [] })}
          />
        </Field>
        <NearbyPortChips value={leg.nearby} onChange={(nearby) => onChange({ ...leg, nearby })} />
      </div>

      {/* Leg options — one row; wraps only if the card gets very narrow. */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <NearbyPortsMenu port={leg.port} value={leg.nearby} onChange={(nearby) => onChange({ ...leg, nearby })} />
        <CheckboxField
          checked={leg.localCharges}
          onCheckedChange={(localCharges) => onChange({ ...leg, localCharges })}
          label="Include local charges"
          aria-label={`Include ${title.toLowerCase()} local charges`}
        />
      </div>
    </Card>
  );
}

/** Origin ⇄ Destination, side by side with a swap button between them. */
export function LaneFields({
  origin,
  destination,
  onChange,
}: {
  origin: Leg;
  destination: Leg;
  onChange: (origin: Leg, destination: Leg) => void;
}) {
  return (
    // Container query: side by side only when the step pane itself is wide enough.
    <div className="@container">
      {/* Cards top-aligned (Door makes one taller); the swap button stays centred between them. */}
      <div className="grid grid-cols-1 items-start gap-2 @xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <LegCard title="Origin" leg={origin} onChange={(o) => onChange(o, destination)} />
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onChange(destination, origin)}
          aria-label="Swap origin and destination"
          title="Swap origin and destination"
          className="self-center justify-self-center rounded-full bg-surface @max-xl:rotate-90"
        >
          <ArrowLeftRight size={15} />
        </Button>
        <LegCard title="Destination" leg={destination} onChange={(d) => onChange(origin, d)} />
      </div>
    </div>
  );
}
