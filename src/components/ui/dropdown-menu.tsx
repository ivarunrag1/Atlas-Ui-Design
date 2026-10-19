import * as React from 'react';
import { DropdownMenu as DropdownMenuPrimitive } from 'radix-ui';
import { Check } from 'lucide-react';
import { CheckboxBox } from '@/components/ui/checkbox';
import { SectionLabel } from '@/components/ui/field';
import { cn } from '@/lib/utils';

/**
 * DropdownMenu — re-skinned to the ATLAS/QuoteAI token system (see src/index.css).
 * One popover panel style: surface fill, default line border, 8px radius, shadow.
 * Rows share Button's ghost treatment (neutral subtle highlight).
 */
const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

function DropdownMenuContent({
  className,
  align = 'end',
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-44 overflow-y-auto rounded-lg border border-line bg-surface p-1 text-ink shadow-xl outline-none',
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

const itemCls =
  'relative flex h-8 cursor-pointer select-none items-center gap-2 rounded-[6px] px-2.5 text-sm text-ink outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-40 data-[highlighted]:bg-subtle [&_svg]:shrink-0';

function DropdownMenuItem({ className, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Item>) {
  return <DropdownMenuPrimitive.Item data-slot="dropdown-menu-item" className={cn(itemCls, className)} {...props} />;
}

/** Multi-select row. Stays open on toggle so several options can be picked in one go. */
function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  onSelect,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      checked={checked}
      onSelect={(e) => {
        e.preventDefault();
        onSelect?.(e);
      }}
      className={cn(itemCls, className)}
      {...props}
    >
      <CheckboxBox checked={checked === true} />
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
}

/** Single-select row — check mark on the right of the chosen option. */
function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(itemCls, 'justify-between', className)}
      {...props}
    >
      {children}
      <DropdownMenuPrimitive.ItemIndicator>
        <Check size={14} />
      </DropdownMenuPrimitive.ItemIndicator>
    </DropdownMenuPrimitive.RadioItem>
  );
}

function DropdownMenuLabel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <DropdownMenuPrimitive.Label asChild>
      <SectionLabel as="div" className={cn('px-2.5 py-1', className)}>
        {children}
      </SectionLabel>
    </DropdownMenuPrimitive.Label>
  );
}

function DropdownMenuSeparator({ className, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn('my-1 h-px bg-line', className)}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
};
