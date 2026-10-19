import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

/**
 * Message — AI Elements–style chat turn (shadcn registry), on the ATLAS tokens.
 * `from="user"` aligns right inside a framed bubble; `from="assistant"` aligns left and
 * is unframed — no border, fill or padding — so AI output reads as plain content.
 */
type From = 'user' | 'assistant';

function Message({ from, className, ...props }: React.ComponentProps<'div'> & { from: From }) {
  return (
    <div
      data-slot="message"
      data-from={from}
      className={cn('group flex w-full items-end gap-2', from === 'user' ? 'flex-row-reverse' : 'flex-row', className)}
      {...props}
    />
  );
}

/** Framed bubble for user turns; plain, full-width content for assistant turns. */
function MessageContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="message-content"
      className={cn(
        'min-w-0 text-[14px] leading-snug text-ink',
        'group-data-[from=user]:max-w-[82%] group-data-[from=user]:rounded-xl group-data-[from=user]:border group-data-[from=user]:border-line group-data-[from=user]:bg-subtle group-data-[from=user]:px-3 group-data-[from=user]:py-2',
        'group-data-[from=assistant]:flex-1',
        className,
      )}
      {...props}
    />
  );
}

/** Small timestamp / meta line under a message. */
function MessageMeta({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="message-meta" className={cn('mt-1 text-[10px] text-faint', className)} {...props} />;
}

function MessageAvatar({
  src,
  name,
  fallback,
  className,
}: {
  src?: string;
  name: string;
  /** Initials or an icon. */
  fallback: React.ReactNode;
  className?: string;
}) {
  return (
    <Avatar className={cn('size-7', className)}>
      {src && <AvatarImage src={src} alt={name} />}
      <AvatarFallback>{fallback}</AvatarFallback>
    </Avatar>
  );
}

export { Message, MessageContent, MessageMeta, MessageAvatar };
