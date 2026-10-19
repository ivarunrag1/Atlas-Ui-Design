import * as React from 'react';
import { Avatar as AvatarPrimitive } from 'radix-ui';
import { cn } from '@/lib/utils';

/**
 * Avatar — shadcn/ui (Radix Avatar), re-skinned to the ATLAS/QuoteAI tokens:
 * outlined circle (stroke, transparent fill) per the minimal treatment.
 */
function Avatar({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn('relative flex size-8 shrink-0 overflow-hidden rounded-full border border-line-strong', className)}
      {...props}
    />
  );
}

function AvatarImage({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return <AvatarPrimitive.Image data-slot="avatar-image" className={cn('aspect-square size-full', className)} {...props} />;
}

function AvatarFallback({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn('grid size-full place-items-center bg-transparent text-[12px] font-semibold text-ink', className)}
      {...props}
    />
  );
}

export { Avatar, AvatarImage, AvatarFallback };
