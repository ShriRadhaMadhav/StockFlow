import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon?: React.ReactNode;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatCard({ title, value, icon, description, trend }: StatCardProps) {
  return (
    <div className="flex flex-col bg-surface border border-border/80 rounded-xl p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider">{title}</span>
        {icon && (
          <div className="text-foreground-secondary/70 bg-background-secondary/50 p-1.5 rounded-md">
            {icon}
          </div>
        )}
      </div>
      
      <div className="flex items-end gap-3 mt-1">
        <span className="text-2xl font-bold text-foreground leading-none">{value}</span>
        {trend && (
          <span className={`flex items-center text-xs font-semibold ${trend.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend.isPositive ? (
              <svg className="w-3 h-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
            ) : (
              <svg className="w-3 h-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
            )}
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      
      {description && (
        <span className="text-xs text-foreground-secondary/70 mt-2 block font-medium">
          {description}
        </span>
      )}
    </div>
  );
}
