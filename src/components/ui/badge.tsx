import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import { cn } from '@/lib/utils';

/**
 * Badge — shadcn/ui, re-skinned to the ATLAS/QuoteAI tokens. Outlined (colour in the
 * stroke + text, never a loud fill) per the minimal treatment.
 */
const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium whitespace-nowrap [&>svg]:pointer-events-none [&>svg]:size-3',
  {
    variants: {
      variant: {
        default: 'border-line text-muted',
        atlas: 'border-atlas/40 bg-atlas/10 text-atlas',
        success: 'border-success/40 text-success',
        danger: 'border-danger/40 text-danger',
        outline: 'border-line-strong text-ink',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'span';
  return <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
