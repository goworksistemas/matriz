import { cn, getStatusColor } from '@/lib/utils';
import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  status?: string;
  className?: string;
}

export function Badge({ children, variant = 'default', status, className }: BadgeProps) {
  if (status) {
    const colors = getStatusColor(status);
    return (
      <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', colors.bg, colors.text, `border ${colors.border}`, className)}>
        {children}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
        variant === 'default' && 'bg-gray-100 dark:bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-500/25',
        variant === 'success' && 'bg-green-50 dark:bg-green-500/15 text-green-600 dark:text-green-400 border-green-200 dark:border-green-500/25',
        variant === 'warning' && 'bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/25',
        variant === 'error' && 'bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/25',
        variant === 'info' && 'bg-primary-50 dark:bg-primary-500/15 text-primary-600 dark:text-primary-400 border-primary-200 dark:border-primary-500/25',
        className
      )}
    >
      {children}
    </span>
  );
}
