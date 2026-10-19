import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Input / Select — re-skinned to the ATLAS/QuoteAI token system (see src/index.css).
 * One control chrome everywhere: canvas fill, default line border, strong line on
 * focus. Heights match Button sizes (default h-9 · sm h-8 · xs h-7) so controls line up in a row.
 */
const inputVariants = cva(
  'w-full min-w-0 rounded-lg border border-line bg-canvas text-ink outline-none transition-colors placeholder:text-faint focus-visible:border-line-strong disabled:pointer-events-none disabled:opacity-40',
  {
    variants: {
      size: {
        default: 'h-9 px-3 text-[14px]',
        sm: 'h-8 px-2.5 text-[14px]',
        xs: 'h-7 px-2 text-[12px] placeholder:text-[12px]',
      },
    },
    defaultVariants: { size: 'default' },
  },
);

type InputProps = Omit<React.ComponentProps<'input'>, 'size'> &
  VariantProps<typeof inputVariants> & {
    /** Leading addon — an icon or unit (e.g. `$`). */
    start?: React.ReactNode;
    /** Trailing addon — an icon or unit (e.g. `%`). */
    end?: React.ReactNode;
  };

/** Text input. With `start`/`end` the border moves to a wrapper so addons sit inside it. */
function Input({ className, size, start, end, ...props }: InputProps) {
  if (start === undefined && end === undefined) {
    return <input data-slot="input" className={cn(inputVariants({ size }), className)} {...props} />;
  }
  return (
    <div
      data-slot="input-group"
      className={cn(
        inputVariants({ size }),
        'flex items-center gap-2 focus-within:border-line-strong [&_svg]:shrink-0 [&_svg]:text-faint',
        className,
      )}
    >
      {start !== undefined && <span className="flex shrink-0 items-center text-faint">{start}</span>}
      <input data-slot="input" className="h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-faint" {...props} />
      {end !== undefined && <span className="flex shrink-0 items-center text-faint">{end}</span>}
    </div>
  );
}

/** Native select in the same chrome as Input, with a consistent chevron. */
function Select({
  className,
  size,
  options,
  ...props
}: Omit<React.ComponentProps<'select'>, 'size'> &
  VariantProps<typeof inputVariants> & { options: string[] }) {
  return (
    <div className={cn('relative', className)}>
      <select
        data-slot="select"
        className={cn(inputVariants({ size }), 'cursor-pointer appearance-none pr-8')}
        {...props}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-faint" />
    </div>
  );
}

export { Input, Select, inputVariants };
