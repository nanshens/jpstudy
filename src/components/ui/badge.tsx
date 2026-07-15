import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'default' | 'secondary' | 'outline' | 'destructive' | 'success';

const variantClasses: Record<Variant, string> = {
  default: 'bg-primary text-primary-foreground border-transparent',
  secondary: 'bg-secondary text-secondary-foreground border-transparent',
  outline: 'border-border text-foreground',
  destructive: 'bg-destructive text-destructive-foreground border-transparent',
  success: 'bg-emerald-500 text-white border-transparent',
};

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
