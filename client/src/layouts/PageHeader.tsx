import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, breadcrumbs, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col space-y-4 md:flex-row md:items-end md:justify-between md:space-y-0">
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center text-sm text-foreground-secondary mb-2" aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <div key={crumb.label} className="flex items-center">
                  {crumb.href && !isLast ? (
                    <Link to={crumb.href} className="hover:text-foreground transition-colors">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-foreground">{crumb.label}</span>
                  )}
                  {!isLast && <ChevronRight className="h-4 w-4 mx-1 opacity-50" />}
                </div>
              );
            })}
          </nav>
        )}
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-foreground-secondary mt-1">{subtitle}</p>}
      </div>

      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
