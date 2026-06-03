import { forwardRef } from 'react';
import { cn } from '../../../utils/cn';
import { Search } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  leftIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, leftIcon, ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {leftIcon && (
          <div className="absolute left-3 flex items-center justify-center text-foreground-secondary">
            {leftIcon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            'flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-foreground-secondary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50',
            leftIcon && 'pl-9',
            error && 'border-error focus-visible:ring-error',
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = 'Input';

export const SearchInput = forwardRef<HTMLInputElement, Omit<InputProps, 'leftIcon' | 'type'>>(
  ({ className, ...props }, ref) => {
    return (
      <Input
        type="search"
        leftIcon={<Search className="h-4 w-4" />}
        className={cn('bg-background-secondary border-transparent focus-visible:bg-background', className)}
        ref={ref}
        {...props}
      />
    );
  }
);
SearchInput.displayName = 'SearchInput';
