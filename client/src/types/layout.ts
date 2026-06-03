import type { ElementType } from 'react';

export interface NavItemType {
  name: string;
  href: string;
  icon: ElementType;
}

export interface NavGroupType {
  label: string;
  items: NavItemType[];
}

export interface SidebarLayoutProps {
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export interface TopbarLayoutProps {
  onMobileMenuClick: () => void;
}
