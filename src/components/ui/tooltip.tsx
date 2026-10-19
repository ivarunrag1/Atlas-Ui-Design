import * as React from 'react';
import { Tooltip as TooltipPrimitive } from 'radix-ui';

/**
 * Hint — hover/focus tooltip showing a small label above its value
 * (e.g. “Port of loading” / “INNSA · Port of Nhava Sheva”). Styled like the
 * dropdown panels: surface fill, line border, 6px radius.
 */
function Hint({
  label,
  value,
  side = 'top',
  children,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  /** A single element that can take a ref (DOM element or forwardRef component). */
  children: React.ReactElement;
}) {
  return (
    <TooltipPrimitive.Provider delayDuration={250} skipDelayDuration={150}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={6}
            collisionPadding={8}
            className="z-50 max-w-72 rounded-[6px] border border-line bg-surface px-2.5 py-1.5 shadow-xl"
          >
            <span className="block text-[10px] text-faint">{label}</span>
            <span className="block text-[12px] text-ink">{value}</span>
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}

export { Hint };
