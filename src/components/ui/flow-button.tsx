'use client';

import { ArrowRight } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type FlowButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
};

export function FlowButton({
  children,
  className,
  disabled = false,
  loading = false,
  type = 'button',
  ...props
}: FlowButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      {...props}
      aria-busy={loading || undefined}
      className={cn(
        'group relative inline-flex h-12 cursor-pointer touch-manipulation select-none items-center justify-center overflow-hidden rounded-full border-[1.5px] border-[var(--flow-accent)] bg-transparent px-8 text-sm font-semibold text-slate-900 transition-[border-radius,color,border-color] duration-500 ease-out hover:rounded-xl hover:border-transparent hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--flow-accent)] focus-visible:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
        className
      )}
      disabled={isDisabled}
      type={type}
    >
      <ArrowRight
        aria-hidden="true"
        className="absolute left-[-25%] z-10 h-4 w-4 text-current transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:left-4 group-hover:text-white group-focus-visible:left-4 group-focus-visible:text-white"
      />
      <span className="relative z-10 inline-flex -translate-x-3 items-center justify-center gap-2 transition-transform duration-700 ease-out group-hover:translate-x-3 group-focus-visible:translate-x-3">
        {children}
      </span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--flow-accent)] opacity-0 transition-[width,height,opacity] duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:h-[600px] group-hover:w-[600px] group-hover:opacity-100 group-focus-visible:h-[600px] group-focus-visible:w-[600px] group-focus-visible:opacity-100"
      />
      <ArrowRight
        aria-hidden="true"
        className="absolute right-4 z-10 h-4 w-4 text-current transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:right-[-25%] group-hover:text-white group-focus-visible:right-[-25%] group-focus-visible:text-white"
      />
    </button>
  );
}