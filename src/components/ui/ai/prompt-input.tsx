import * as React from 'react';
import { SendHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * PromptInput — AI Elements–style composer (shadcn registry), on the ATLAS tokens.
 * A form wrapping an auto-growing textarea and a toolbar; Enter submits,
 * Shift+Enter adds a line.
 */
function PromptInput({
  className,
  onSubmit,
  ...props
}: Omit<React.ComponentProps<'form'>, 'onSubmit'> & { onSubmit: () => void }) {
  return (
    <form
      data-slot="prompt-input"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className={cn(
        'flex w-full flex-col overflow-hidden rounded-xl border border-line bg-canvas transition-colors focus-within:border-line-strong',
        className,
      )}
      {...props}
    />
  );
}

function PromptInputTextarea({
  className,
  onKeyDown,
  ...props
}: React.ComponentProps<'textarea'>) {
  const ref = React.useRef<HTMLTextAreaElement>(null);

  // Auto-grow up to ~6 lines.
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 144)}px`;
  }, [props.value]);

  return (
    <textarea
      ref={ref}
      data-slot="prompt-input-textarea"
      rows={1}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        if (e.defaultPrevented) return;
        if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
          e.preventDefault();
          e.currentTarget.form?.requestSubmit();
        }
      }}
      className={cn(
        'max-h-36 min-h-10 w-full resize-none bg-transparent px-3 pt-2.5 pb-1 text-[14px] text-ink outline-none placeholder:text-faint',
        className,
      )}
      {...props}
    />
  );
}

/** Bottom row — tools on the left, submit on the right. */
function PromptInputToolbar({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="prompt-input-toolbar" className={cn('flex items-center justify-between gap-2 px-2 pb-2', className)} {...props} />;
}

function PromptInputTools({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="prompt-input-tools" className={cn('flex min-w-0 items-center gap-1', className)} {...props} />;
}

function PromptInputSubmit({ className, children, ...props }: React.ComponentProps<typeof Button>) {
  return (
    <Button type="submit" size="icon-sm" aria-label="Send message" className={cn('rounded-lg', className)} {...props}>
      {children ?? <SendHorizontal size={16} />}
    </Button>
  );
}

export { PromptInput, PromptInputTextarea, PromptInputToolbar, PromptInputTools, PromptInputSubmit };
