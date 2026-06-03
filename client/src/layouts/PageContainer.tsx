import { cn } from '../utils/cn';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn('flex flex-col min-h-full space-y-6', className)}>
      {children}
    </div>
  );
}
