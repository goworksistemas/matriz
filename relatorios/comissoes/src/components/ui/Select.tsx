import * as SelectPrimitive from '@radix-ui/react-select';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

const EMPTY_VALUE = '__EMPTY__';

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  children: ReactNode;
  className?: string;
}

export function Select({
  value,
  onValueChange,
  placeholder = 'Selecione...',
  children,
  className,
}: SelectProps) {
  // Converter string vazia para valor especial e vice-versa
  const internalValue = value === '' ? EMPTY_VALUE : value;
  
  const handleValueChange = (newValue: string) => {
    onValueChange(newValue === EMPTY_VALUE ? '' : newValue);
  };

  return (
    <SelectPrimitive.Root value={internalValue} onValueChange={handleValueChange}>
      <SelectPrimitive.Trigger
        className={cn(
          'inline-flex items-center justify-between gap-2 rounded-lg',
          'border border-gray-600 bg-gray-700 px-3 py-2 text-sm',
          'text-gray-100 placeholder:text-gray-400',
          'hover:border-gray-500 hover:bg-gray-650',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'min-w-[180px]',
          className
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className={cn(
            'relative z-50 min-w-[180px] overflow-hidden rounded-lg',
            'border border-gray-600 bg-gray-800 shadow-xl shadow-black/20'
          )}
          position="popper"
          sideOffset={4}
        >
          <SelectPrimitive.Viewport className="p-1 max-h-[300px]">
            {children}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

interface SelectItemProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export function SelectItem({ value, children, className }: SelectItemProps) {
  // Converter string vazia para valor especial
  const internalValue = value === '' ? EMPTY_VALUE : value;
  
  return (
    <SelectPrimitive.Item
      value={internalValue}
      className={cn(
        'relative flex cursor-pointer select-none items-center gap-2',
        'rounded-md px-3 py-2 text-sm text-gray-200 outline-none',
        'hover:bg-gray-700 hover:text-gray-100',
        'focus:bg-gray-700 focus:text-gray-100',
        'data-[state=checked]:bg-primary-500/20 data-[state=checked]:text-primary-300',
        className
      )}
    >
      <SelectPrimitive.ItemIndicator className="absolute left-1">
        <Check className="h-3.5 w-3.5" />
      </SelectPrimitive.ItemIndicator>
      <SelectPrimitive.ItemText className="pl-5">{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}
