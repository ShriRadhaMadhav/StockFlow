import { Menu, Bell, User, LogOut } from 'lucide-react';
import { GlobalSearch } from '../components/ui/searchbar/GlobalSearch';
import type { TopbarLayoutProps } from '../types/layout';
import { useAuthStore } from '../store/auth-store';

export function TopbarLayout({ onMobileMenuClick }: TopbarLayoutProps) {
  const { user, logout } = useAuthStore();

  return (
    <header className="h-14 sticky top-0 bg-background/80 backdrop-blur-md border-b border-border z-30 flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={onMobileMenuClick}
          aria-label="Open menu"
          className="lg:hidden p-1.5 -ml-1.5 rounded-md hover:bg-background-secondary text-foreground-secondary transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <GlobalSearch />
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications Placeholder */}
        <button 
          aria-label="Notifications"
          className="p-1.5 rounded-md hover:bg-background-secondary text-foreground-secondary transition-colors relative"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full border-2 border-background"></span>
        </button>

        <div className="w-px h-5 bg-border mx-1"></div>

        {/* Profile */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 p-1 rounded-md bg-background-secondary/50">
            <div className="w-7 h-7 rounded-full bg-border flex items-center justify-center overflow-hidden">
              <User className="w-4 h-4 text-foreground-secondary" />
            </div>
            <div className="hidden md:block text-left text-xs pr-2">
              <div className="font-medium text-foreground">{user?.name || 'User'}</div>
              <div className="text-foreground-secondary text-[10px] uppercase font-semibold tracking-wider text-accent">{user?.role || 'cashier'}</div>
            </div>
          </div>
          
          <button 
            onClick={logout}
            aria-label="Log Out"
            title="Log Out"
            className="p-1.5 rounded-md hover:bg-rose-500/10 text-foreground-secondary hover:text-rose-500 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
