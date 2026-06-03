import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  position?: 'left' | 'right';
}

export function Drawer({ 
  isOpen, 
  onClose, 
  title, 
  description, 
  children, 
  footer, 
  className,
  position = 'right' 
}: DrawerProps) {
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const slideDirection = position === 'right' ? { x: '100%' } : { x: '-100%' };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={slideDirection}
            animate={{ x: 0 }}
            exit={slideDirection}
            transition={{ duration: 0.3, type: 'spring', bounce: 0 }}
            className={cn(
              'fixed top-0 bottom-0 z-50 w-full max-w-md bg-surface border-border shadow-xl flex flex-col',
              position === 'right' ? 'right-0 border-l' : 'left-0 border-r',
              className
            )}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                {description && <p className="text-sm text-foreground-secondary mt-1">{description}</p>}
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-md hover:bg-background-secondary text-foreground-secondary transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              {children}
            </div>

            {footer && (
              <div className="px-6 py-4 bg-background-secondary border-t border-border">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
