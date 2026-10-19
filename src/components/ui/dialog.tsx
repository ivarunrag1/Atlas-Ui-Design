import * as React from 'react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Dialog — re-skinned to the ATLAS/QuoteAI token system (see src/index.css).
 * One modal shell: dimmed backdrop, surface panel with 12px radius, header band
 * (`t-popup` title + close), body, and a footer band for actions. Escape,
 * click-outside and focus trapping come from Radix.
 */
const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.Close;

function DialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay data-slot="dialog-overlay" className="fixed inset-0 z-50 bg-black/60" />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          'fixed top-1/2 left-1/2 z-50 w-[min(440px,94vw)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl border border-line bg-surface text-ink shadow-xl outline-none',
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

/** Header band — title on the left, close button on the right. */
function DialogHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div data-slot="dialog-header" className={cn('flex items-center justify-between gap-3 border-b border-line px-5 py-4', className)}>
      <div className="min-w-0">{children}</div>
      <DialogPrimitive.Close asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Close">
          <X size={18} />
        </Button>
      </DialogPrimitive.Close>
    </div>
  );
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title data-slot="dialog-title" className={cn('t-popup text-ink', className)} {...props} />;
}

function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description data-slot="dialog-description" className={cn('t-desc mt-0.5 text-faint', className)} {...props} />
  );
}

function DialogBody({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="dialog-body" className={cn('px-5 py-4', className)} {...props} />;
}

/** Footer band — actions aligned right. */
function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn('flex items-center justify-end gap-2 border-t border-line px-5 py-3', className)}
      {...props}
    />
  );
}

export { Dialog, DialogTrigger, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter };
