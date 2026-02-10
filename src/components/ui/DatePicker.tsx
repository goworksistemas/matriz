import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as Popover from '@radix-ui/react-popover';
import { Calendar, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  className?: string;
}

export function DatePicker({ value, onChange, placeholder = 'Selecione uma data', className }: DatePickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          className={cn(
            'inline-flex items-center justify-between gap-2 rounded-lg',
            'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm',
            'text-gray-900 dark:text-gray-100 hover:border-gray-400 dark:hover:border-gray-500',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900',
            'min-w-[180px]',
            className
          )}
        >
          <span className={cn(!value && 'text-gray-400')}>
            {value ? format(value, 'dd/MM/yyyy', { locale: ptBR }) : placeholder}
          </span>
          <div className="flex items-center gap-1">
            {value && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onChange(null); }}
                className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
              >
                <X className="h-3.5 w-3.5 text-gray-400" />
              </button>
            )}
            <Calendar className="h-4 w-4 text-gray-400" />
          </div>
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="z-50 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-3 shadow-xl"
          sideOffset={4}
          align="start"
        >
          <DayPicker
            mode="single"
            selected={value || undefined}
            onSelect={(date) => { onChange(date || null); setOpen(false); }}
            locale={ptBR}
            classNames={{
              months: 'flex flex-col',
              month: 'space-y-4',
              caption: 'flex justify-center pt-1 relative items-center',
              caption_label: 'text-sm font-medium text-gray-700 dark:text-gray-200',
              nav: 'space-x-1 flex items-center',
              nav_button: 'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors inline-flex items-center justify-center',
              nav_button_previous: 'absolute left-1',
              nav_button_next: 'absolute right-1',
              table: 'w-full border-collapse space-y-1',
              head_row: 'flex',
              head_cell: 'text-gray-400 dark:text-gray-500 rounded-md w-9 font-normal text-[0.8rem]',
              row: 'flex w-full mt-2',
              cell: 'h-9 w-9 text-center text-sm p-0 relative',
              day: 'h-9 w-9 p-0 font-normal hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors aria-selected:opacity-100 text-gray-700 dark:text-gray-300',
              day_selected: 'bg-primary-500 text-white hover:bg-primary-600',
              day_today: 'border border-primary-500 text-primary-600 dark:text-primary-400',
              day_outside: 'text-gray-300 dark:text-gray-600 opacity-50',
              day_disabled: 'text-gray-300 dark:text-gray-600 opacity-50 cursor-not-allowed',
              day_hidden: 'invisible',
            }}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
