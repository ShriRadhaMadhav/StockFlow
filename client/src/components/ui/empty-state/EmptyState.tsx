import { FileX2 } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ElementType;
  className?: string;
}

export function EmptyState({ 
  title, 
  description, 
  action, 
  icon: Icon = FileX2, 
  className 
}: EmptyStateProps) {
  return (
    <div 
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center min-h-[250px] border border-dashed border-border rounded-lg bg-surface',
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-background-secondary mb-4">
        <Icon className="h-6 w-6 text-foreground-secondary" />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-foreground-secondary max-w-sm mb-4">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
