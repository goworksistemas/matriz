import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
  className?: string;
}

export function Tabs({ value, onValueChange, children, className }: TabsProps) {
  return (
    <TabsPrimitive.Root value={value} onValueChange={onValueChange} className={cn('flex flex-col', className)}>
      {children}
    </TabsPrimitive.Root>
  );
}

interface TabsListProps {
  children: ReactNode;
  className?: string;
}

export function TabsList({ children, className }: TabsListProps) {
  return (
    <TabsPrimitive.List
      className={cn(
        'inline-flex items-center gap-1 p-1 rounded-lg',
        'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
        className
      )}
    >
      {children}
    </TabsPrimitive.List>
  );
}

interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export function TabsTrigger({ value, children, className }: TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      value={value}
      className={cn(
        'px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
        'text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50',
        'data-[state=active]:bg-white dark:data-[state=active]:bg-primary-500 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm',
        'focus:outline-none',
        className
      )}
    >
      {children}
    </TabsPrimitive.Trigger>
  );
}

interface TabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  return (
    <TabsPrimitive.Content value={value} className={cn('mt-6 focus:outline-none', className)}>
      {children}
    </TabsPrimitive.Content>
  );
}
