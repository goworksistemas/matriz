import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning';
  compact?: boolean;
}

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
  variant = 'default',
  compact = false,
}: KPICardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border',
        compact ? 'p-3' : 'p-4',
        'transition-all duration-300 hover:shadow-lg',
        variant === 'default' && 'border-gray-700 bg-gray-800 hover:border-gray-600 hover:shadow-primary-500/5',
        variant === 'primary' && 'border-primary-500/30 bg-gradient-to-br from-primary-500/10 to-primary-600/5 hover:border-primary-500/50',
        variant === 'success' && 'border-green-500/30 bg-gradient-to-br from-green-500/10 to-green-600/5 hover:border-green-500/50',
        variant === 'warning' && 'border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-amber-600/5 hover:border-amber-500/50',
        className
      )}
    >
      <div className="relative z-10">
        {/* Header: Título + Ícone */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <span className={cn(
            'font-medium text-gray-400',
            compact ? 'text-xs' : 'text-sm'
          )}>
            {title}
          </span>
          
          {Icon && (
            <div
              className={cn(
                'rounded-lg flex-shrink-0',
                compact ? 'p-1.5' : 'p-2',
                variant === 'default' && 'bg-gray-700/50 text-gray-400',
                variant === 'primary' && 'bg-primary-500/20 text-primary-400',
                variant === 'success' && 'bg-green-500/20 text-green-400',
                variant === 'warning' && 'bg-amber-500/20 text-amber-400',
              )}
            >
              <Icon className={cn(compact ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
            </div>
          )}
        </div>
        
        {/* Valor */}
        <span
          className={cn(
            'font-bold block',
            compact ? 'text-base' : 'text-2xl',
            variant === 'default' && 'text-gray-100',
            variant === 'primary' && 'text-primary-400',
            variant === 'success' && 'text-green-400',
            variant === 'warning' && 'text-amber-400',
          )}
        >
          {value}
        </span>
        
        {subtitle && (
          <span className="text-xs text-gray-500 mt-1 block">{subtitle}</span>
        )}
        
        {trend && (
          <div
            className={cn(
              'flex items-center gap-1 text-xs font-medium mt-1',
              trend.isPositive ? 'text-green-400' : 'text-red-400'
            )}
          >
            <span>{trend.isPositive ? '↑' : '↓'}</span>
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
