import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  FileText,
  Users,
  Store,
  ShoppingCart,
  CreditCard,
  ArrowRightLeft,
  ScanText,
  BarChart3,
  X,
  ChevronDown,
} from 'lucide-react';
import { cn } from '../utils/cn';
import type { NavGroupType, NavItemType, SidebarLayoutProps } from '../types/layout';

const navigationGroups: NavGroupType[] = [
  {
    label: 'Main',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Inventory', href: '/inventory', icon: Package },
      { name: 'Stock Movements', href: '/stock-movements', icon: ArrowRightLeft },
      { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Customer',
    items: [
      { name: 'Customer', href: '/customers', icon: Users },
      { name: 'Payments', href: '/payments', icon: CreditCard },
      { name: 'Bills', href: '/bills', icon: FileText },
    ],
  },
  {
    label: 'Vendors',
    items: [
      { name: 'Vendors', href: '/vendors', icon: Store },
      { name: 'Purchase', href: '/purchases', icon: ShoppingCart },
      { name: 'OCR import', href: '/ocr-imports', icon: ScanText },
    ],
  },
];



export function SidebarLayout({ isMobileOpen, onMobileClose }: SidebarLayoutProps) {
  const location = useLocation();

  const NavItem = ({ item }: { item: NavItemType }) => {
    const Icon = item.icon;
    const isActive = location.pathname.startsWith(item.href);

    return (
      <Link
        to={item.href}
        onClick={onMobileClose}
        className={cn(
          'flex items-center gap-3 px-3 py-1.5 rounded-md transition-colors text-sm font-medium group',
          isActive
            ? 'bg-background-secondary text-foreground font-semibold'
            : 'text-foreground-secondary hover:bg-background-secondary hover:text-foreground'
        )}
      >
        <Icon className={cn('w-[18px] h-[18px]', isActive ? 'text-accent' : 'text-foreground-secondary group-hover:text-foreground')} />
        <span>{item.name}</span>
      </Link>
    );
  };

  const NavGroup = ({ group }: { group: NavGroupType }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
      <div className="mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex w-full items-center justify-between px-3 py-1 mb-1 text-xs font-semibold text-foreground-secondary hover:text-foreground transition-colors group uppercase tracking-wider"
        >
          <span>{group.label}</span>
          <ChevronDown
            className={cn(
              'w-3.5 h-3.5 transition-transform duration-200',
              !isExpanded && '-rotate-90'
            )}
          />
        </button>
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden space-y-0.5"
            >
              {group.items.map((item) => (
                <NavItem key={item.name} item={item} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onMobileClose}
          className="fixed inset-0 bg-foreground/20 z-40 lg:hidden backdrop-blur-sm"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 h-screen w-64 bg-background border-r border-border z-50 flex flex-col',
          'transition-transform duration-300 ease-in-out',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <div className="w-6 h-6 rounded bg-accent flex items-center justify-center p-1">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3L4 7L12 11L20 7L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                <path d="M4 7V15L12 19M20 7V15L12 19M12 11V19" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                <path d="M3 18C7 21 17 21 21 13" stroke="#93c5fd" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </div>
            <span>StockFlow</span>
          </div>
          <button
            onClick={onMobileClose}
            aria-label="Close menu"
            className="lg:hidden p-1 rounded hover:bg-background-secondary text-foreground-secondary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
          {navigationGroups.map((group) => (
            <NavGroup key={group.label} group={group} />
          ))}
        </div>


      </aside>
    </>
  );
}
