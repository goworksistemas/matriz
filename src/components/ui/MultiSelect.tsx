import { useState, useRef, useEffect, useMemo } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Todos',
  searchPlaceholder = 'Buscar...',
  className,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => searchInputRef.current?.focus(), 0);
    } else {
      setSearch('');
    }
  }, [open]);

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const term = search.toLowerCase();
    return options.filter(o => o.toLowerCase().includes(term));
  }, [options, search]);

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(s => s !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const removeItem = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter(s => s !== value));
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex items-center justify-between gap-2 rounded-lg',
            'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm',
            'text-gray-900 dark:text-gray-100',
            'hover:border-gray-400 dark:hover:border-gray-500',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900',
            'min-w-[180px] min-h-[38px] text-left',
            className,
          )}
        >
          <span className="flex-1 flex flex-wrap items-center gap-1 overflow-hidden">
            {selected.length === 0 ? (
              <span className="text-gray-400 text-sm">{placeholder}</span>
            ) : selected.length <= 2 ? (
              selected.map(s => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 max-w-[120px] px-1.5 py-0.5 rounded bg-primary-50 dark:bg-primary-500/15 text-primary-700 dark:text-primary-300 text-xs font-medium ring-1 ring-primary-200 dark:ring-primary-500/25"
                >
                  <span className="truncate">{s}</span>
                  <X className="h-3 w-3 flex-shrink-0 cursor-pointer hover:text-primary-900 dark:hover:text-primary-100" onClick={(e) => removeItem(s, e)} />
                </span>
              ))
            ) : (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary-50 dark:bg-primary-500/15 text-primary-700 dark:text-primary-300 text-xs font-medium ring-1 ring-primary-200 dark:ring-primary-500/25">
                {selected.length} selecionados
              </span>
            )}
          </span>

          <span className="flex items-center gap-1 flex-shrink-0">
            {selected.length > 0 && (
              <X
                className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                onClick={clearAll}
              />
            )}
            <ChevronDown className={cn('h-4 w-4 text-gray-400 transition-transform', open && 'rotate-180')} />
          </span>
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className={cn(
            'z-50 min-w-[220px] max-w-[320px] overflow-hidden rounded-lg',
            'border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-xl',
            'animate-in fade-in-0 zoom-in-95',
          )}
          sideOffset={4}
          align="start"
        >
          <div className="p-2 border-b border-gray-100 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className={cn(
                  'w-full pl-8 pr-3 py-1.5 rounded-md text-sm',
                  'bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600',
                  'text-gray-900 dark:text-gray-100 placeholder:text-gray-400',
                  'focus:outline-none focus:ring-1 focus:ring-primary-500',
                )}
              />
            </div>
          </div>

          <div className="p-1 max-h-[240px] overflow-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-gray-400">Nenhum resultado</div>
            ) : (
              filtered.map(option => {
                const isSelected = selected.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggle(option)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-left',
                      'text-gray-700 dark:text-gray-200 outline-none cursor-pointer',
                      'hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100',
                      isSelected && 'bg-primary-50 dark:bg-primary-500/20 text-primary-600 dark:text-primary-300',
                    )}
                  >
                    <span className={cn(
                      'flex items-center justify-center h-4 w-4 rounded border flex-shrink-0',
                      isSelected
                        ? 'bg-primary-500 border-primary-500 text-white'
                        : 'border-gray-300 dark:border-gray-500',
                    )}>
                      {isSelected && <Check className="h-3 w-3" />}
                    </span>
                    <span className="truncate">{option}</span>
                  </button>
                );
              })
            )}
          </div>

          {selected.length > 0 && (
            <div className="p-2 border-t border-gray-100 dark:border-gray-700">
              <button
                type="button"
                onClick={() => onChange([])}
                className="w-full text-center text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 py-1"
              >
                Limpar seleção
              </button>
            </div>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
