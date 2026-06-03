import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { Button } from '../button/Button';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ currentPage, totalPages, onPageChange, className }: PaginationProps) {
  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, 'ellipsis', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, 'ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages);
      }
    }

    return pages.map((page, index) => {
      if (page === 'ellipsis') {
        return (
          <span key={`ellipsis-${index}`} className="flex h-9 w-9 items-center justify-center text-foreground-secondary">
            <MoreHorizontal className="h-4 w-4" />
          </span>
        );
      }

      const isCurrentPage = page === currentPage;

      return (
        <Button
          key={page}
          variant={isCurrentPage ? 'primary' : 'ghost'}
          size="icon"
          onClick={() => typeof page === 'number' && onPageChange(page)}
          className={cn(
            'h-9 w-9 text-sm',
            !isCurrentPage && 'text-foreground-secondary hover:text-foreground'
          )}
        >
          {page}
        </Button>
      );
    });
  };

  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn('flex items-center justify-end space-x-2', className)}
    >
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 text-foreground-secondary"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Previous page</span>
      </Button>

      <div className="flex items-center space-x-1">{renderPageNumbers()}</div>

      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 text-foreground-secondary"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Next page</span>
      </Button>
    </nav>
  );
}
