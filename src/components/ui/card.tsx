import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import { cn } from '@/lib/utils';

/**
 * Card — re-skinned to the ATLAS/QuoteAI token system (see src/index.css).
 * Rules: cards sit on a surface panel, so they take the canvas fill + 12px radius.
 * A card inside another card (e.g. a Kanban tile in its column) is `nested`:
 * surface fill + 8px radius. Clickable cards add `interactive` (strong border on hover).
 */
const cardVariants = cva('border border-line text-left', {
  variants: {
    variant: {
      default: 'rounded-xl bg-canvas',
      nested: 'rounded-lg bg-surface',
    },
    interactive: {
      true: 'cursor-pointer transition-colors hover:border-line-strong',
      false: '',
    },
  },
  defaultVariants: { variant: 'default', interactive: false },
});

function Card({
  className,
  variant,
  interactive,
  asChild = false,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof cardVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'div';
  return <Comp data-slot="card" className={cn(cardVariants({ variant, interactive }), className)} {...props} />;
}

/** Header band — bottom divider, title on the left, actions/meta on the right. */
function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn('flex items-center justify-between gap-3 border-b border-line px-4 py-2.5', className)}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-title" className={cn('text-[14px] font-semibold text-ink', className)} {...props} />;
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-description" className={cn('text-[12px] text-faint', className)} {...props} />;
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-content" className={cn('px-4 py-3', className)} {...props} />;
}

/** Footer band — top divider, subtle fill (totals, actions). */
function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn('flex items-center justify-between gap-3 border-t border-line bg-subtle/40 px-4 py-2.5', className)}
      {...props}
    />
  );
}

/** Square icon tile used at the start of record rows (documents, linked records). */
function CardIcon({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="card-icon"
      className={cn('grid size-9 shrink-0 place-items-center rounded-lg border border-line text-muted', className)}
      {...props}
    />
  );
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardIcon, cardVariants };
