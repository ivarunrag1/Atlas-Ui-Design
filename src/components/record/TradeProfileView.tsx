import { useState } from 'react';
import { peakMonths, servedLanes, usdOrUndisclosed, type ShareRow, type TradeProfile } from '../../data/leads';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SeasonalityChart, ShareBars } from '../lead/parts';
import { Stat } from './RecordParts';

function ListCard({ title, rows, served }: { title: string; rows: ShareRow[]; served?: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {served && <CardDescription>✓ = lane we serve</CardDescription>}
      </CardHeader>
      <div className="px-4 py-3">
        <ShareBars rows={rows} served={served ? (n) => servedLanes.has(n) : undefined} />
      </div>
    </Card>
  );
}

/**
 * TradeMo trade data for one company — shared by the lead's Trade profile tab and the
 * company's Freight profile tab. Exports and imports are separate data when the company
 * trades both ways.
 */
export function TradeProfileView({ profiles }: { profiles: TradeProfile[] }) {
  const [dir, setDir] = useState<'Export' | 'Import'>(profiles[0].direction);
  const p = profiles.find((x) => x.direction === dir) ?? profiles[0];
  const noun = p.direction === 'Export' ? 'Exports' : 'Imports';

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        {profiles.length > 1 ? (
          <SegmentedControl
            aria-label="Trade direction"
            value={dir}
            onChange={setDir}
            options={profiles.map((x) => ({
              value: x.direction,
              label: `${x.direction === 'Export' ? 'Exports' : 'Imports'} · ${x.shipments.toLocaleString('en-US')}`,
            }))}
          />
        ) : (
          <span className="text-[12px] text-muted">{noun} only</span>
        )}
        <span className="text-[12px] text-faint">Showing {noun.toLowerCase()} · last 12 months</span>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={`${noun} shipments`} value={p.shipments.toLocaleString('en-US')} sub="12 months" />
        <Stat label={`${noun} value`} value={usdOrUndisclosed(p.value)} tone={p.value < 0 ? 'faint' : undefined} />
        <Stat label="Trading partners" value={String(p.partners)} />
        <Stat label="Est. TEU / month" value={String(p.estTeuPerMonth)} sub="estimate" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{noun} per month</CardTitle>
          <CardDescription>Shipments · last 12 months · darker = peak months</CardDescription>
        </CardHeader>
        <div className="px-4 py-3">
          <SeasonalityChart values={p.monthly} peaks={peakMonths(p.monthly)} />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ListCard title="Trade lanes" rows={p.lanes} served />
        <ListCard title="HS codes" rows={p.hsCodes} />
        <ListCard title="Products" rows={p.products} />
        <ListCard title="Ports" rows={p.ports} />
        <ListCard title="Countries" rows={p.countries} />
      </div>
    </>
  );
}
