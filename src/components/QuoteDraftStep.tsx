import { CalendarRange, FileText, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const DAY = 86_400_000;
/** yyyy-mm-dd ± days. */
export const addDaysIso = (iso: string, days: number) => {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const daysBetween = (a: string, b: string) =>
  Math.round((new Date(`${b}T00:00:00`).getTime() - new Date(`${a}T00:00:00`).getTime()) / DAY);

/* ── PDF preview (placeholder) ─────────────────────────────────────────────── */

/** Bar standing in for a line of text on the mock page. */
function Line({ w, strong }: { w: string; strong?: boolean }) {
  return <span className={cn('block h-1.5 rounded-full', strong ? 'bg-paper-line-strong' : 'bg-paper-line')} style={{ width: w }} />;
}

function PdfPreview({ fileName }: { fileName: string }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="min-w-0">
          <CardTitle className="flex items-center gap-2">
            <FileText size={14} className="text-muted" /> {fileName}
          </CardTitle>
          <CardDescription>Preview — placeholder (the generated PDF renders here)</CardDescription>
        </div>
      </CardHeader>
      <div className="bg-subtle/40 p-4">
        {/* A4 page mock */}
        <div className="relative mx-auto aspect-[1/1.414] w-full max-w-[360px] rounded-[4px] bg-paper p-6 shadow-xl">
          <div className="flex items-start justify-between">
            <span className="grid size-8 place-items-center rounded-[4px] bg-paper-ink text-[12px] font-bold text-paper">Q</span>
            <span className="space-y-1 text-right">
              <Line w="5rem" strong />
              <Line w="3.5rem" />
            </span>
          </div>
          <div className="mt-6 space-y-1.5">
            <Line w="45%" strong />
            <Line w="70%" />
            <Line w="60%" />
          </div>
          <div className="mt-5 space-y-1.5 rounded-[3px] border border-paper-line p-2">
            {['90%', '82%', '88%', '76%', '84%'].map((w, i) => (
              <Line key={i} w={w} strong={i === 0} />
            ))}
          </div>
          <div className="mt-5 space-y-1.5">
            <Line w="35%" strong />
            <Line w="80%" />
            <Line w="65%" />
          </div>
          <span className="absolute inset-x-0 bottom-4 text-center text-[10px] text-paper-faint">PDF preview placeholder</span>
        </div>
      </div>
    </Card>
  );
}

/* ── Step 4 — right section ────────────────────────────────────────────────── */

/**
 * Draft quote (step 4), right of the email thread: PDF preview (placeholder),
 * PDF configuration (placeholder button) and the quote's start / expiry dates.
 * Sending lives in the step footer.
 */
export function QuoteDraftStep({
  fileName,
  start,
  expiry,
  onStart,
  onExpiry,
}: {
  fileName: string;
  /** yyyy-mm-dd */
  start: string;
  expiry: string;
  onStart: (v: string) => void;
  onExpiry: (v: string) => void;
}) {
  const days = daysBetween(start, expiry);

  return (
    <div className="space-y-4">
      <PdfPreview fileName={fileName} />

      {/* PDF configuration + validity on one line (stack when the pane is narrow) */}
      <div className="@container">
        <div className="grid grid-cols-1 items-stretch gap-4 @xl:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
          {/* PDF configuration — placeholder */}
          <Card className="flex flex-col justify-between gap-3 px-4 py-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings2 size={14} className="text-muted" /> PDF configuration
              </CardTitle>
              <CardDescription>Template, branding, charge grouping and terms</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="self-start">
              <Settings2 size={14} /> Configure PDF
            </Button>
          </Card>

          {/* Validity */}
          <Card className="px-4 py-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2">
                <CalendarRange size={14} className="text-muted" /> Quote validity
              </CardTitle>
              <span className={cn('text-[12px]', days > 0 ? 'text-muted' : 'text-danger')}>
                {days > 0 ? `Valid for ${days} day${days === 1 ? '' : 's'}` : 'Expiry must be after the start date'}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Start date">
                <Input type="date" value={start} onChange={(e) => onStart(e.target.value)} />
              </Field>
              <Field label="Expiry date">
                <Input type="date" min={start} value={expiry} onChange={(e) => onExpiry(e.target.value)} />
              </Field>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="text-[12px] text-faint">Quick set:</span>
              {[7, 14, 30].map((n) => (
                <Button
                  key={n}
                  variant="outline"
                  size="xs"
                  onClick={() => onExpiry(addDaysIso(start, n))}
                  className={cn('h-6 text-[12px]', days === n && 'border-atlas/50 text-atlas')}
                >
                  {n} days
                </Button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
