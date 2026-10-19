import { type DealSummary } from '../data/deals';
import { Card } from '@/components/ui/card';
import { SectionLabel } from '@/components/ui/field';

export function AttributesTab({ deal }: { deal: DealSummary }) {
  const groups: { title: string; rows: [string, string][] }[] = [
    {
      title: 'Shipment',
      rows: [
        ['Trade lane', `${deal.origin} → ${deal.destination}`],
        ['Mode', 'FCL · Ocean'],
        ['Equipment', deal.equipment],
        ['Volume', deal.teu],
        ['Incoterm', 'FCA'],
        ['Commodity', 'General cargo'],
        ['Target sailing', 'Early November 2026'],
      ],
    },
    {
      title: 'Commercial',
      rows: [
        ['Deal value', deal.value],
        ['Currency', 'USD'],
        ['Payment terms', 'Net 30'],
        ['Margin', '—'],
      ],
    },
    {
      title: 'Record',
      rows: [
        ['Deal ID', deal.id],
        ['Stage', deal.stage],
        ['Owner', deal.owner],
        ['Source', 'Web form'],
        ['Priority', deal.alert ? 'High' : 'Normal'],
        ['Last updated', deal.updated],
      ],
    },
  ];

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="border-b border-line px-5 py-3">
        <h2 className="text-[16px] font-semibold text-ink">Attributes</h2>
        <p className="text-[12px] text-faint">Structured fields on this deal</p>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
        {groups.map((g) => (
          <section key={g.title}>
            <SectionLabel as="h3" className="mb-2">
              {g.title}
            </SectionLabel>
            <Card className="divide-y divide-line overflow-hidden">
              {g.rows.map(([k, v]) => (
                <div key={k} className="grid grid-cols-[160px_1fr] gap-4 px-4 py-2.5 text-[14px]">
                  <span className="text-faint">{k}</span>
                  <span className="text-ink">{v}</span>
                </div>
              ))}
            </Card>
          </section>
        ))}
      </div>
    </div>
  );
}
