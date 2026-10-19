import * as React from 'react';
import { ScrollArea as ScrollAreaPrimitive } from 'radix-ui';
import { cn } from '@/lib/utils';

/**
 * ScrollArea — shadcn/ui (Radix ScrollArea), re-skinned to the ATLAS/QuoteAI tokens:
 * thin line-coloured thumb that strengthens on hover. `viewportRef` exposes the
 * scrolling element (e.g. to stick a conversation to the bottom).
 */
function ScrollArea({
  className,
  children,
  viewportRef,
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root> & { viewportRef?: React.Ref<HTMLDivElement> }) {
  return (
    <ScrollAreaPrimitive.Root data-slot="scroll-area" className={cn('relative overflow-hidden', className)} {...props}>
      <ScrollAreaPrimitive.Viewport
        ref={viewportRef}
        data-slot="scroll-area-viewport"
        className="size-full rounded-[inherit] outline-none"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}

function ScrollBar({
  className,
  orientation = 'vertical',
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className={cn(
        'flex touch-none p-px transition-colors select-none',
        orientation === 'vertical' ? 'h-full w-2 border-l border-l-transparent' : 'h-2 flex-col border-t border-t-transparent',
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-line hover:bg-line-strong" />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  );
}

export { ScrollArea, ScrollBar };
