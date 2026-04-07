import { useState, useMemo, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, ExternalLink, Search, X, Check, ChevronDown as ChevronDownIcon } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export type FiltroTipo = 'text' | 'select' | 'multiselect' | false;

export interface ColunaTabela<T> {
  key: string;
  header: string;
  accessor: (row: T) => string | number | null | undefined;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  filterable?: FiltroTipo;
  options?: string[];
  width?: string;
}

interface TabelaNotionProps<T> {
  data: T[];
  columns: ColunaTabela<T>[];
  titulo?: string;
  icone?: ReactNode;
  defaultSort?: { key: string; dir: 'asc' | 'desc' };
  defaultPageSize?: number;
  keyExtractor: (row: T) => string;
  emptyMessage?: string;
  notionUrlAccessor?: (row: T) => string | null | undefined;
  extraActions?: ReactNode;
}

type SortDir = 'asc' | 'desc' | null;
type FiltroValor = string | string[];

function norm(val: string): string {
  return val.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function MiniSelect({ value, options, onChange, placeholder = 'Todos' }: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { if (open) setTimeout(() => ref.current?.focus(), 0); else setSearch(''); }, [open]);

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const t = norm(search);
    return options.filter(o => norm(o).includes(t));
  }, [options, search]);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button type="button" className={cn(
          'w-full h-7 flex items-center justify-between gap-1 px-2 rounded border text-[11px] truncate',
          'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300',
          'hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-1 focus:ring-primary-500',
          value && 'ring-1 ring-primary-400/40 border-primary-300 dark:border-primary-600',
        )}>
          <span className="truncate">{value || placeholder}</span>
          <span className="flex items-center gap-0.5 shrink-0">
            {value && <X className="h-3 w-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" onClick={e => { e.stopPropagation(); onChange(''); }} />}
            <ChevronDownIcon className={cn('h-3 w-3 text-gray-400 transition-transform', open && 'rotate-180')} />
          </span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className="z-[100] min-w-[180px] max-w-[280px] overflow-hidden rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-xl animate-in fade-in-0 zoom-in-95" sideOffset={4} align="start">
          <div className="p-1.5 border-b border-gray-100 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
              <input ref={ref} type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
                className="w-full pl-7 pr-2 py-1 rounded text-[11px] bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500" />
            </div>
          </div>
          <div className="p-0.5 max-h-[200px] overflow-auto">
            <button type="button" onClick={() => { onChange(''); setOpen(false); }}
              className={cn('flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-[11px] text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700', !value && 'bg-primary-50 dark:bg-primary-500/20 text-primary-600 dark:text-primary-300')}>
              {placeholder}
            </button>
            {filtered.map(opt => (
              <button key={opt} type="button" onClick={() => { onChange(opt); setOpen(false); }}
                className={cn('flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-[11px] text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700', value === opt && 'bg-primary-50 dark:bg-primary-500/20 text-primary-600 dark:text-primary-300')}>
                {opt}
              </button>
            ))}
            {filtered.length === 0 && <div className="px-2.5 py-3 text-center text-[10px] text-gray-400">Nenhum resultado</div>}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function MiniMultiSelect({ selected, options, onChange, placeholder = 'Todos' }: {
  selected: string[];
  options: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { if (open) setTimeout(() => ref.current?.focus(), 0); else setSearch(''); }, [open]);

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const t = norm(search);
    return options.filter(o => norm(o).includes(t));
  }, [options, search]);

  const toggle = (v: string) => {
    onChange(selected.includes(v) ? selected.filter(s => s !== v) : [...selected, v]);
  };

  const label = selected.length === 0 ? placeholder : selected.length === 1 ? selected[0] : `${selected.length} selecionados`;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button type="button" className={cn(
          'w-full h-7 flex items-center justify-between gap-1 px-2 rounded border text-[11px] truncate',
          'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300',
          'hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-1 focus:ring-primary-500',
          selected.length > 0 && 'ring-1 ring-primary-400/40 border-primary-300 dark:border-primary-600',
        )}>
          <span className="truncate">{label}</span>
          <span className="flex items-center gap-0.5 shrink-0">
            {selected.length > 0 && <X className="h-3 w-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" onClick={e => { e.stopPropagation(); onChange([]); }} />}
            <ChevronDownIcon className={cn('h-3 w-3 text-gray-400 transition-transform', open && 'rotate-180')} />
          </span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className="z-[100] min-w-[180px] max-w-[280px] overflow-hidden rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-xl animate-in fade-in-0 zoom-in-95" sideOffset={4} align="start">
          <div className="p-1.5 border-b border-gray-100 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
              <input ref={ref} type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
                className="w-full pl-7 pr-2 py-1 rounded text-[11px] bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500" />
            </div>
          </div>
          <div className="p-0.5 max-h-[200px] overflow-auto">
            {filtered.map(opt => {
              const checked = selected.includes(opt);
              return (
                <button key={opt} type="button" onClick={() => toggle(opt)}
                  className={cn('flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-[11px] text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700', checked && 'bg-primary-50 dark:bg-primary-500/20 text-primary-600 dark:text-primary-300')}>
                  <span className={cn('flex items-center justify-center h-3.5 w-3.5 rounded border shrink-0', checked ? 'bg-primary-500 border-primary-500 text-white' : 'border-gray-300 dark:border-gray-500')}>
                    {checked && <Check className="h-2.5 w-2.5" />}
                  </span>
                  <span className="truncate">{opt}</span>
                </button>
              );
            })}
            {filtered.length === 0 && <div className="px-2.5 py-3 text-center text-[10px] text-gray-400">Nenhum resultado</div>}
          </div>
          {selected.length > 0 && (
            <div className="p-1.5 border-t border-gray-100 dark:border-gray-700">
              <button type="button" onClick={() => onChange([])} className="w-full text-center text-[10px] text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 py-0.5">Limpar</button>
            </div>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export function TabelaNotion<T>({
  data,
  columns,
  titulo,
  icone,
  defaultSort,
  defaultPageSize = 20,
  keyExtractor,
  emptyMessage = 'Nenhum registro encontrado.',
  notionUrlAccessor,
  extraActions,
}: TabelaNotionProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(defaultSort?.key ?? null);
  const [sortDir, setSortDir] = useState<SortDir>(defaultSort?.dir ?? null);
  const [filtros, setFiltros] = useState<Record<string, FiltroValor>>({});
  const [pagina, setPagina] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(defaultPageSize);

  const opcoesColuna = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const col of columns) {
      if (col.filterable === 'select' || col.filterable === 'multiselect') {
        if (col.options) {
          map[col.key] = col.options;
        } else {
          const set = new Set<string>();
          for (const row of data) {
            const v = col.accessor(row);
            if (v != null && String(v).trim()) set.add(String(v));
          }
          map[col.key] = Array.from(set).sort((a, b) => a.localeCompare(b));
        }
      }
    }
    return map;
  }, [columns, data]);

  const handleSort = useCallback((key: string) => {
    if (sortKey !== key) { setSortKey(key); setSortDir('asc'); }
    else if (sortDir === 'asc') setSortDir('desc');
    else { setSortKey(null); setSortDir(null); }
    setPagina(1);
  }, [sortKey, sortDir]);

  const setFiltro = useCallback((key: string, value: FiltroValor) => {
    setFiltros(prev => ({ ...prev, [key]: value }));
    setPagina(1);
  }, []);

  const temFiltrosAtivos = useMemo(() =>
    Object.values(filtros).some(v => (Array.isArray(v) ? v.length > 0 : v.length > 0)),
  [filtros]);

  const limparFiltros = useCallback(() => { setFiltros({}); setPagina(1); }, []);

  const dadosFiltrados = useMemo(() => {
    let resultado = [...data];

    for (const col of columns) {
      const val = filtros[col.key];
      if (!val || !col.filterable) continue;

      if (col.filterable === 'text' && typeof val === 'string' && val) {
        const t = norm(val);
        resultado = resultado.filter(row => {
          const v = col.accessor(row);
          return v != null && norm(String(v)).includes(t);
        });
      } else if (col.filterable === 'select' && typeof val === 'string' && val) {
        resultado = resultado.filter(row => String(col.accessor(row) ?? '') === val);
      } else if (col.filterable === 'multiselect' && Array.isArray(val) && val.length > 0) {
        resultado = resultado.filter(row => {
          const v = String(col.accessor(row) ?? '');
          return val.some(s => norm(v).includes(norm(s)));
        });
      }
    }

    if (sortKey && sortDir) {
      const col = columns.find(c => c.key === sortKey);
      if (col) {
        resultado.sort((a, b) => {
          const va = col.accessor(a);
          const vb = col.accessor(b);
          if (va == null && vb == null) return 0;
          if (va == null) return 1;
          if (vb == null) return -1;
          if (typeof va === 'number' && typeof vb === 'number') return sortDir === 'asc' ? va - vb : vb - va;
          return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
        });
      }
    }

    return resultado;
  }, [data, columns, filtros, sortKey, sortDir]);

  const totalPaginas = Math.max(1, Math.ceil(dadosFiltrados.length / itensPorPagina));
  const paginaCorrigida = Math.min(pagina, totalPaginas);
  const inicio = (paginaCorrigida - 1) * itensPorPagina;
  const dadosPaginados = dadosFiltrados.slice(inicio, inicio + itensPorPagina);

  useEffect(() => { setPagina(1); }, [data, itensPorPagina]);

  const SortIcon = ({ colKey }: { colKey: string }) => {
    if (sortKey !== colKey) return <ChevronsUpDown className="h-3 w-3 opacity-30" />;
    if (sortDir === 'asc') return <ChevronUp className="h-3 w-3 text-primary-500" />;
    return <ChevronDown className="h-3 w-3 text-primary-500" />;
  };

  const hasFiltrableColumns = columns.some(c => c.filterable);

  const conteudo = (
    <>
      {dadosFiltrados.length === 0 && data.length === 0 ? (
        <div className="flex items-center justify-center h-28 text-gray-400 text-sm">{emptyMessage}</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-600">
                {columns.map(col => (
                  <th
                    key={col.key}
                    style={col.width ? { width: col.width } : undefined}
                    className={cn(
                      'text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300',
                      col.sortable && 'cursor-pointer select-none hover:text-gray-900 dark:hover:text-gray-100 transition-colors',
                    )}
                    onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {col.header}
                      {col.sortable && <SortIcon colKey={col.key} />}
                    </span>
                  </th>
                ))}
                {notionUrlAccessor && <th className="py-3 px-3 w-[50px]" />}
              </tr>

              {hasFiltrableColumns && (
                <tr className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-600">
                  {columns.map(col => (
                    <th key={`f-${col.key}`} className="py-2 px-4">
                      {col.filterable === 'text' && (
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                          <input
                            type="text"
                            value={(filtros[col.key] as string) || ''}
                            onChange={e => setFiltro(col.key, e.target.value)}
                            placeholder="Buscar..."
                            className={cn(
                              'w-full h-7 pl-7 pr-7 rounded border text-[11px]',
                              'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 placeholder:text-gray-400',
                              'focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500',
                              (filtros[col.key] as string) && 'ring-1 ring-primary-400/40 border-primary-300 dark:border-primary-600',
                            )}
                          />
                          {(filtros[col.key] as string) && (
                            <button onClick={() => setFiltro(col.key, '')} className="absolute right-2 top-1/2 -translate-y-1/2">
                              <X className="h-3 w-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" />
                            </button>
                          )}
                        </div>
                      )}
                      {col.filterable === 'select' && (
                        <MiniSelect
                          value={(filtros[col.key] as string) || ''}
                          options={opcoesColuna[col.key] || []}
                          onChange={v => setFiltro(col.key, v)}
                        />
                      )}
                      {col.filterable === 'multiselect' && (
                        <MiniMultiSelect
                          selected={(filtros[col.key] as string[]) || []}
                          options={opcoesColuna[col.key] || []}
                          onChange={v => setFiltro(col.key, v)}
                        />
                      )}
                      {!col.filterable && <div className="h-7" />}
                    </th>
                  ))}
                  {notionUrlAccessor && <th className="py-2 px-3"><div className="h-7" /></th>}
                </tr>
              )}
            </thead>
            <tbody>
              {dadosPaginados.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (notionUrlAccessor ? 1 : 0)} className="py-10 text-center text-sm text-gray-400">
                    Nenhum registro encontrado para os filtros aplicados.
                  </td>
                </tr>
              ) : dadosPaginados.map((row, idx) => (
                <tr
                  key={keyExtractor(row)}
                  className={cn(
                    'border-b border-gray-200 dark:border-gray-700 transition-colors',
                    'hover:bg-primary-50/40 dark:hover:bg-primary-500/5',
                    idx % 2 === 1 && 'bg-gray-50/60 dark:bg-gray-800/40',
                  )}
                >
                  {columns.map(col => (
                    <td key={col.key} className="py-3 px-4">
                      {col.render ? col.render(row) : (
                        <span className="text-gray-700 dark:text-gray-300">{col.accessor(row) ?? '-'}</span>
                      )}
                    </td>
                  ))}
                  {notionUrlAccessor && (
                    <td className="py-3 px-3">
                      {notionUrlAccessor(row) && (
                        <a href={notionUrlAccessor(row)!} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(dadosFiltrados.length > 0 || temFiltrosAtivos) && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {dadosFiltrados.length > 0
                ? `${inicio + 1}-${Math.min(inicio + itensPorPagina, dadosFiltrados.length)} de ${dadosFiltrados.length}`
                : `0 resultados`}
              {dadosFiltrados.length !== data.length && ` (${data.length} total)`}
            </span>
            {temFiltrosAtivos && (
              <button onClick={limparFiltros} className="text-[11px] font-medium text-primary-600 dark:text-primary-400 hover:underline">
                Limpar filtros
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={itensPorPagina}
              onChange={e => setItensPorPagina(Number(e.target.value))}
              className="h-7 rounded border border-gray-200 bg-white px-1.5 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <Button variant="ghost" size="sm" onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={paginaCorrigida <= 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-gray-600 dark:text-gray-300 min-w-[50px] text-center">
              {paginaCorrigida}/{totalPaginas}
            </span>
            <Button variant="ghost" size="sm" onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={paginaCorrigida >= totalPaginas}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );

  if (!titulo) return conteudo;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            {icone} {titulo}
            {dadosFiltrados.length !== data.length && (
              <span className="text-[11px] font-normal text-gray-500">({dadosFiltrados.length} de {data.length})</span>
            )}
          </CardTitle>
          {extraActions}
        </div>
      </CardHeader>
      <CardContent>{conteudo}</CardContent>
    </Card>
  );
}
