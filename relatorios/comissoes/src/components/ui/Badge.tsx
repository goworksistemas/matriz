import { cn, getStatusColor } from '@/lib/utils';
import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  status?: string;
  className?: string;
}

export function Badge({ children, variant = 'default', status, className }: BadgeProps) {
  // Se passou status, usa as cores do status
  if (status) {
    const colors = getStatusColor(status);
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
          colors.bg,
          colors.text,
          `border ${colors.border}`,
          className
        )}
      >
        {children}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
        variant === 'default' && 'bg-gray-500/15 text-gray-400 border border-gray-500/25',
        variant === 'success' && 'bg-green-500/15 text-green-400 border border-green-500/25',
        variant === 'warning' && 'bg-amber-500/15 text-amber-400 border border-amber-500/25',
        variant === 'error' && 'bg-red-500/15 text-red-400 border border-red-500/25',
        variant === 'info' && 'bg-primary-500/15 text-primary-400 border border-primary-500/25',
        className
      )}
    >
      {children}
    </span>
  );
}
