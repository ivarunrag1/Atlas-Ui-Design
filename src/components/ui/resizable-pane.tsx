import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * ResizablePane — a side panel with a drag handle on its inner edge.
 * Drag (or focus the handle and use ←/→) to resize between `min` and `max` px;
 * double-click the handle to reset to `defaultWidth`.
 *
 * `side` is where the pane sits in the layout: a `left` pane resizes from its right
 * edge, a `right` pane from its left edge. Pass `storageKey` to remember the width
 * per viewer (browser storage; falls back to `defaultWidth` if unavailable).
 */
function ResizablePane({
  min,
  max,
  defaultWidth = min,
  side = 'left',
  storageKey,
  className,
  children,
}: {
  min: number;
  max: number;
  defaultWidth?: number;
  side?: 'left' | 'right';
  storageKey?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const clamp = React.useCallback((w: number) => Math.min(max, Math.max(min, w)), [min, max]);

  const [width, setWidth] = React.useState(() => {
    if (!storageKey) return defaultWidth;
    try {
      const saved = Number(localStorage.getItem(storageKey));
      return saved ? clamp(saved) : defaultWidth;
    } catch {
      return defaultWidth;
    }
  });
  const [dragging, setDragging] = React.useState(false);

  React.useEffect(() => {
    if (!storageKey || dragging) return;
    try {
      localStorage.setItem(storageKey, String(width));
    } catch {
      /* storage unavailable — width just won't persist */
    }
  }, [storageKey, width, dragging]);

  // Dragging toward the pane's outer edge shrinks it, so a right pane flips the delta.
  const dir = side === 'left' ? 1 : -1;

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = width;
    setDragging(true);
    const onMove = (ev: PointerEvent) => setWidth(clamp(startW + (ev.clientX - startX) * dir));
    const onUp = () => {
      setDragging(false);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <aside
      data-slot="resizable-pane"
      className={cn(
        'relative flex shrink-0 flex-col border-line',
        side === 'left' ? 'border-r' : 'border-l',
        className,
      )}
      style={{ width }}
    >
      {/* Scroll lives inside so the edge handle isn't clipped. */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</div>
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize panel"
        aria-valuenow={width}
        aria-valuemin={min}
        aria-valuemax={max}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onDoubleClick={() => setWidth(clamp(defaultWidth))}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') setWidth(clamp(width - 16 * dir));
          if (e.key === 'ArrowRight') setWidth(clamp(width + 16 * dir));
        }}
        className={cn(
          'group absolute inset-y-0 z-10 w-3 cursor-col-resize outline-none',
          side === 'left' ? '-right-1.5' : '-left-1.5',
        )}
      >
        <span
          className={cn(
            'absolute inset-y-0 left-1/2 w-px -translate-x-1/2 transition-colors group-hover:bg-line-strong group-focus-visible:bg-line-strong',
            dragging && 'bg-ink group-hover:bg-ink',
          )}
        />
      </div>
      {/* Keeps the resize cursor and blocks text selection while dragging. */}
      {dragging && <div className="fixed inset-0 z-50 cursor-col-resize select-none" />}
    </aside>
  );
}

export { ResizablePane };
