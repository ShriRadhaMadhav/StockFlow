import { Plus } from 'lucide-react';
import { Button } from './Button';

interface QuickActionsProps {
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  actions?: { label: string; onClick: () => void }[];
}

export function QuickActions({ 
  primaryActionLabel = 'New', 
  onPrimaryAction, 
  actions 
}: QuickActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {actions && actions.map((action, i) => (
        <Button key={i} variant="secondary" onClick={action.onClick} className="hidden sm:inline-flex">
          {action.label}
        </Button>
      ))}
      <Button onClick={onPrimaryAction} className="gap-2">
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline-block">{primaryActionLabel}</span>
      </Button>
    </div>
  );
}
