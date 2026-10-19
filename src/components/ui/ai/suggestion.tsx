import * as React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Suggestions — AI Elements–style quick prompts (shadcn registry), on the ATLAS tokens.
 * Wrapping row of outlined pill buttons; clicking one sends it.
 */
function Suggestions({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="suggestions" className={cn('flex flex-wrap gap-1.5', className)} {...props} />;
}

function Suggestion({
  suggestion,
  onClick,
  className,
  ...props
}: Omit<React.ComponentProps<typeof Button>, 'onClick' | 'children'> & {
  suggestion: string;
  onClick: (suggestion: string) => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="xs"
      onClick={() => onClick(suggestion)}
      className={cn('h-6 rounded-full bg-surface px-2.5 text-[12px] font-normal text-muted hover:border-atlas/50 hover:text-ink', className)}
      {...props}
    >
      {suggestion}
    </Button>
  );
}

export { Suggestions, Suggestion };
