import * as React from 'react';
import { Switch as SwitchPrimitive } from 'radix-ui';
import { cn } from '@/lib/utils';

/** Switch — on/off toggle. Track fills Atlas violet when on; neutral line when off. */
function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-line bg-line p-0.5 transition-colors outline-none focus-visible:border-line-strong disabled:opacity-40 data-[state=checked]:border-atlas/60 data-[state=checked]:bg-atlas/70',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block size-3.5 rounded-full bg-ink transition-transform data-[state=checked]:translate-x-4" />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
