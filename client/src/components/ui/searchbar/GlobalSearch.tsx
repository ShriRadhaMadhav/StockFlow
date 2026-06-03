import { Search } from 'lucide-react';
import { cn } from '../../../utils/cn';

export function GlobalSearch() {
  return (
    <div className="hidden sm:flex items-center w-full max-w-md relative group">
      <Search className="w-4 h-4 text-foreground-secondary absolute left-3 transition-colors group-focus-within:text-foreground" />
      <input
        type="text"
        placeholder="Search inventory, bills, or customers..."
        className={cn(
          'w-full bg-background-secondary border border-transparent focus:border-border focus:bg-background rounded-md pl-9 pr-12 py-1.5 text-sm outline-none transition-all placeholder:text-foreground-secondary shadow-sm focus:shadow-md'
        )}
      />
      <div className="absolute right-2 top-1.5 flex items-center">
        <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-foreground-secondary opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </div>
    </div>
  );
}
