import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, description, children, footer, className }: ModalProps) {
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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, type: 'spring', bounce: 0 }}
            className={cn(
              'relative z-50 w-full max-w-lg max-h-[90vh] flex flex-col bg-surface border border-border shadow-lg rounded-xl overflow-hidden',
              className
            )}
          >
            <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-border/50">
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
            
            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
              {children}
            </div>

            {footer && (
              <div className="flex-shrink-0 px-6 py-4 bg-background-secondary border-t border-border flex items-center justify-end gap-2">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
