import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../utils/cn';

interface DropdownItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'start' | 'end';
}

export function Dropdown({ trigger, items, align = 'start' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleItemClick = (onClick: () => void) => {
    onClick();
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}>
        {trigger}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={cn(
              "absolute z-50 mt-2 w-48 rounded-md shadow-lg bg-surface border border-border ring-1 ring-black ring-opacity-5 divide-y divide-border/50",
              align === 'end' ? 'right-0 origin-top-right' : 'left-0 origin-top-left'
            )}
            style={{ zIndex: 999 }} // Ensure it shows above table rows
          >
            <div className="py-1">
              {items.map((item, index) => (
                <button
                  key={index}
                  onClick={(e) => { e.stopPropagation(); handleItemClick(item.onClick); }}
                  className={cn(
                    "group flex w-full items-center px-4 py-2 text-sm transition-colors",
                    item.variant === 'danger' 
                      ? "text-red-600 hover:bg-red-50" 
                      : "text-foreground hover:bg-surface-hover hover:text-accent"
                  )}
                >
                  {item.icon && (
                    <span className={cn("mr-2 flex-shrink-0 h-4 w-4", item.variant === 'danger' ? 'text-red-500' : 'text-foreground-secondary group-hover:text-accent')}>
                      {item.icon}
                    </span>
                  )}
                  {item.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
