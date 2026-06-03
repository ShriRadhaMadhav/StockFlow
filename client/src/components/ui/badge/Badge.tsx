import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../utils/cn';

const badgeVariants = cva(
  'inline-flex items-center whitespace-nowrap text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2',
  {
    variants: {
      variant: {
        neutral: 'text-foreground-secondary',
        success: 'text-foreground',
        warning: 'text-foreground',
        danger: 'text-foreground',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, children, ...props }, ref) => {
    let dotColor = 'bg-slate-400';
    if (variant === 'success') dotColor = 'bg-emerald-500';
    else if (variant === 'warning') dotColor = 'bg-amber-500';
    else if (variant === 'danger') dotColor = 'bg-rose-500';

    return (
      <div ref={ref} className={cn(badgeVariants({ variant }), className)} {...props}>
        <span className={cn('mr-1.5 h-1.5 w-1.5 rounded-full', dotColor)} />
        {children}
      </div>
    );
  }
);
Badge.displayName = 'Badge';
