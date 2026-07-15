import { forwardRef, type ButtonHTMLAttributes, type ReactNode, isValidElement, cloneElement } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type Size = 'default' | 'sm' | 'lg' | 'icon';

const variantClasses: Record<Variant, string> = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
};

const sizeClasses: Record<Size, string> = {
  default: 'h-10 px-4 py-2',
  sm: 'h-8 rounded-md px-3 text-xs',
  lg: 'h-11 rounded-md px-6 text-base',
  icon: 'h-9 w-9',
};

const baseClasses =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild, children, ...props }, ref) => {
    const classes = cn(baseClasses, variantClasses[variant], sizeClasses[size], className);

    if (asChild && isValidElement(children)) {
      // 把 button 的 className + props 合并到子元素上
      const childEl = children as React.ReactElement<{ className?: string; ref?: React.Ref<unknown> }>;
      return cloneElement(childEl, {
        className: cn(classes, childEl.props.className),
        ref,
        ...props,
      });
    }

    return (
      <button ref={ref} className={classes} {...props}>
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';

// 防止未使用 import 警告
export type { ReactNode };
