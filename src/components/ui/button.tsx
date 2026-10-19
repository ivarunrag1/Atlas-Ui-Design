import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import { cn } from '@/lib/utils';

/**
 * Button — re-skinned to the ATLAS/QuoteAI token system (see src/index.css).
 * One token layer: colours resolve to --color-ink / -canvas / -line / -subtle etc.
 * Minimal treatment: solid only for the primary action; everything else is
 * outlined or ghost with neutral (subtle) hover.
 */
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:border-line-strong disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Primary action — solid inverted (white-on-dark).
        default: 'bg-ink font-semibold text-canvas hover:bg-ink/90',
        // Secondary — outlined on a surface fill.
        secondary: 'border border-line bg-surface text-ink hover:bg-subtle',
        // Outline — border only, transparent fill.
        outline: 'border border-line text-ink hover:bg-subtle',
        // Ghost — no chrome; neutral hover. Nav items, menu rows, icon actions.
        ghost: 'text-muted hover:bg-subtle hover:text-ink',
        // Destructive — danger text, outlined (never a loud fill).
        destructive: 'border border-line bg-surface text-danger hover:bg-subtle',
        link: 'text-ink underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-3 has-[>svg]:px-3',
        sm: 'h-8 gap-1.5 px-2.5',
        xs: 'h-7 gap-1 px-2 text-xs',
        lg: 'h-10 px-4',
        icon: 'size-9',
        'icon-sm': 'size-8',
        'icon-xs': 'size-7 rounded-md',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
