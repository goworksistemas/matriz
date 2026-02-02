import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckboxProps {
  checked: boolean | 'indeterminate';
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}

export function Checkbox({
  checked,
  onCheckedChange,
  label,
  className,
}: CheckboxProps) {
  return (
    <div className="flex items-center gap-2">
      <CheckboxPrimitive.Root
        checked={checked}
        onCheckedChange={onCheckedChange}
        className={cn(
          'h-4 w-4 shrink-0 rounded border border-gray-600',
          'bg-gray-700 transition-colors',
          'hover:border-gray-500',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'data-[state=checked]:bg-primary-500 data-[state=checked]:border-primary-500',
          className
        )}
      >
        <CheckboxPrimitive.Indicator className="flex items-center justify-center text-white">
          {checked === 'indeterminate' ? (
            <Minus className="h-3 w-3" />
          ) : (
            <Check className="h-3 w-3" />
          )}
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {label && (
        <label className="text-sm text-gray-300 cursor-pointer">{label}</label>
      )}
    </div>
  );
}
