import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, cardVariants } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface KanbanColumn<T> {
  key: string;
  label: string;
  /** Status / stage colour — the column dot and the card's left accent. */
  color: string;
  items: T[];
}

/**
 * KanbanBoard — the shared board for CRM records (Pipeline deals, Leads, …).
 * One framed column per status (dot · label · count · “+”), native drag-and-drop to
 * move a card between columns. Each record type supplies its card variant.
 */
export function KanbanBoard<T extends { id: string }>({
  columns,
  renderCard,
  onMove,
  onAdd,
  noun = 'item',
}: {
  columns: KanbanColumn<T>[];
  renderCard: (item: T, state: { dragging: boolean; color: string }) => React.ReactNode;
  /** Card dropped on another column. */
  onMove: (id: string, columnKey: string) => void;
  /** Per-column “+”. Omit to hide the button. */
  onAdd?: (columnKey: string) => void;
  /** Singular noun for labels, e.g. "deal". */
  noun?: string;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overKey, setOverKey] = useState<string | null>(null);
  const endDrag = () => {
    setDragId(null);
    setOverKey(null);
  };

  return (
    <div className="flex h-full gap-4 overflow-x-auto px-5 py-4">
      {columns.map((col) => {
        const over = overKey === col.key;
        return (
          <div
            key={col.key}
            onDragOver={(e) => {
              e.preventDefault();
              if (overKey !== col.key) setOverKey(col.key);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverKey(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (dragId) onMove(dragId, col.key);
              endDrag();
            }}
            className={cn(cardVariants(), 'flex w-[290px] shrink-0 flex-col overflow-hidden transition-colors', over && 'border-line-strong')}
          >
            {/* Column header — same frame as the tiles */}
            <div className="flex items-center justify-between border-b border-line px-3 py-2">
              <span className="flex items-center gap-2 text-[12px] font-semibold tracking-wide text-muted uppercase">
                <span className="size-2 shrink-0 rounded-full" style={{ background: col.color }} />
                {col.label}
                <span className="rounded-full border border-line px-1.5 text-[10px] font-semibold text-faint">{col.items.length}</span>
              </span>
              {onAdd && (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => onAdd(col.key)}
                  aria-label={`Add ${noun} to ${col.label}`}
                  className="size-6 text-faint"
                >
                  <Plus size={15} />
                </Button>
              )}
            </div>

            {/* Tiles */}
            <div className={cn('flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2', over && 'bg-subtle/40')}>
              {col.items.map((item) => (
                <div key={item.id} draggable onDragStart={() => setDragId(item.id)} onDragEnd={endDrag}>
                  {renderCard(item, { dragging: dragId === item.id, color: col.color })}
                </div>
              ))}
              {col.items.length === 0 && <div className="grid place-items-center py-8 text-[12px] text-faint">Drop {noun}s here</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * KanbanCard — the base board tile (nested card, coloured left accent, faded while
 * dragging). Record types build their card variant inside it.
 */
export function KanbanCard({
  accent,
  dragging,
  onClick,
  className,
  children,
}: {
  accent: string;
  dragging?: boolean;
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card
      variant="nested"
      interactive
      onClick={onClick}
      className={cn('p-3', dragging && 'opacity-40', className)}
      style={{ borderLeftWidth: 3, borderLeftColor: accent }}
    >
      {children}
    </Card>
  );
}
