import { useState, useMemo, Fragment } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  flexRender,
  type ColumnDef,
  type ExpandedState,
} from '@tanstack/react-table';
import { RotateCcw, ChevronDown, ChevronRight, Users, DollarSign } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Select, SelectItem } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { KPICard } from '@/components/KPICard';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Comissao, FiltrosSDR, ResumoSDR } from '@/types';

interface ComissoesSDRProps {
  comissoesFiltradas: Comissao[];
  filtrosSDR: FiltrosSDR;
  updateFiltroSDR: <K extends keyof FiltrosSDR>(
    key: K,
    value: FiltrosSDR[K]
  ) => void;
  resetFiltrosSDR: () => void;
  resumoSDRs: ResumoSDR[];
  sdrsUnicos: string[];
  etapasUnicas: string[];
}

export function ComissoesSDR({
  comissoesFiltradas,
  filtrosSDR,
  updateFiltroSDR,
  resetFiltrosSDR,
  resumoSDRs,
  sdrsUnicos,
  etapasUnicas,
}: ComissoesSDRProps) {
  const [expanded, setExpanded] = useState<ExpandedState>({});

  // Total de comissão SDR
  const totalComissaoSDR = useMemo(() => {
    return resumoSDRs.reduce((acc, sdr) => acc + sdr.totalComissaoSDR, 0);
  }, [resumoSDRs]);

  // Total de negócios com SDR
  const totalNegociosSDR = useMemo(() => {
    return resumoSDRs.reduce((acc, sdr) => acc + sdr.comissoes.length, 0);
  }, [resumoSDRs]);

  // Verificar se há filtros ativos
  const hasActiveFilters = useMemo(() => {
    return (
      filtrosSDR.sdr !== '' ||
      filtrosSDR.etapa !== '' ||
      filtrosSDR.tipoProduto !== ''
    );
  }, [filtrosSDR]);

  // Colunas da tabela principal
  const columns = useMemo<ColumnDef<ResumoSDR>[]>(
    () => [
      {
        id: 'expander',
        header: () => null,
        cell: ({ row }) => (
          <button
            onClick={() => row.toggleExpanded()}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            {row.getIsExpanded() ? (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )}
          </button>
        ),
        size: 40,
      },
      {
        accessorKey: 'sdrNome',
        header: 'SDR Responsável',
        cell: ({ getValue }) => (
          <span className="font-medium text-gray-900 dark:text-gray-100">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'sdrEmail',
        header: 'Email',
        cell: ({ getValue }) => (
          <span className="text-gray-400 text-xs">{getValue() as string}</span>
        ),
      },
      {
        id: 'negocios',
        header: 'Negócios',
        cell: ({ row }) => (
          <Badge variant="default">{row.original.comissoes.length}</Badge>
        ),
        size: 100,
      },
      {
        accessorKey: 'totalComissaoSDR',
        header: 'Total Comissão SDR',
        cell: ({ getValue }) => (
          <span className="font-semibold text-primary-400">
            {formatCurrency(getValue() as number)}
          </span>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: resumoSDRs,
    columns,
    state: { expanded },
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
  });

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <Card className="border-primary-200 dark:border-primary-500/30 bg-gradient-to-r from-primary-50 dark:from-primary-500/5 to-white dark:to-primary-600/10">
        <CardContent className="py-4">
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
            <Users className="h-5 w-5 text-primary-400" />
            <span>
              A comissão SDR é calculada como <strong className="text-primary-400">1.5%</strong> do valor do negócio
              para cada venda em que o SDR está envolvido.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card className="!p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">SDR Responsável</label>
            <Select
              value={filtrosSDR.sdr}
              onValueChange={(v) => updateFiltroSDR('sdr', v)}
              placeholder="Todos"
            >
              <SelectItem value="">Todos</SelectItem>
              {sdrsUnicos.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Etapa</label>
            <Select
              value={filtrosSDR.etapa}
              onValueChange={(v) => updateFiltroSDR('etapa', v)}
              placeholder="Todas"
            >
              <SelectItem value="">Todas</SelectItem>
              {etapasUnicas.map((e) => (
                <SelectItem key={e} value={e}>
                  {e}
                </SelectItem>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Tipo Produto</label>
            <Select
              value={filtrosSDR.tipoProduto}
              onValueChange={(v) => updateFiltroSDR('tipoProduto', v)}
              placeholder="Todos"
            >
              <SelectItem value="">Todos</SelectItem>
              <SelectItem value="fisico">Físico</SelectItem>
              <SelectItem value="virtual">Virtual</SelectItem>
            </Select>
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFiltrosSDR}
              className="mb-0.5"
            >
              <RotateCcw className="h-4 w-4 mr-1.5" />
              Limpar
            </Button>
          )}

          <div className="ml-auto text-sm text-gray-400">
            {comissoesFiltradas.length} registros
          </div>
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          title="SDRs Ativos"
          value={resumoSDRs.length}
          icon={Users}
          variant="default"
        />
        <KPICard
          title="Total de Negócios"
          value={totalNegociosSDR}
          variant="default"
        />
        <KPICard
          title="Total Comissão SDR"
          value={formatCurrency(totalComissaoSDR)}
          icon={DollarSign}
          variant="primary"
        />
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Comissões por SDR</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700"
                        style={{ width: header.getSize() }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      Nenhum registro encontrado
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <Fragment key={row.id}>
                      <tr className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-4 py-3">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </td>
                        ))}
                      </tr>
                      {/* Linha expandida com detalhes */}
                      {row.getIsExpanded() && (
                        <tr>
                          <td colSpan={columns.length} className="p-0">
                            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-y border-gray-200 dark:border-gray-700">
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                Negócios vinculados
                              </h4>
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                  <thead className="bg-gray-100 dark:bg-gray-800">
                                    <tr>
                                      <th className="px-3 py-2 text-left text-gray-400">
                                        Cliente
                                      </th>
                                      <th className="px-3 py-2 text-left text-gray-400">
                                        Vendedor
                                      </th>
                                      <th className="px-3 py-2 text-left text-gray-400">
                                        Produto
                                      </th>
                                      <th className="px-3 py-2 text-left text-gray-400">
                                        Data Fech.
                                      </th>
                                      <th className="px-3 py-2 text-right text-gray-400">
                                        Valor Negócio
                                      </th>
                                      <th className="px-3 py-2 text-right text-gray-400">
                                        Comissão SDR (1.5%)
                                      </th>
                                      <th className="px-3 py-2 text-left text-gray-400">
                                        Etapa
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {row.original.comissoes.map((c) => (
                                      <tr
                                        key={c.id}
                                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/30"
                                      >
                                        <td className="px-3 py-2 text-gray-800 dark:text-gray-200 max-w-[200px] truncate">
                                          {c.nomeCliente}
                                        </td>
                                        <td className="px-3 py-2 text-gray-600 dark:text-gray-300">
                                          {c.proprietarioNome}
                                        </td>
                                        <td className="px-3 py-2 text-gray-600 dark:text-gray-300 max-w-[150px] truncate">
                                          {c.produto}
                                        </td>
                                        <td className="px-3 py-2 text-gray-400">
                                          {c.dataFechamento ? formatDate(c.dataFechamento) : '-'}
                                        </td>
                                        <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-300">
                                          {formatCurrency(c.valorNegocio)}
                                        </td>
                                        <td className="px-3 py-2 text-right text-primary-400 font-medium">
                                          {formatCurrency(c.comissaoSimplesSDR)}
                                        </td>
                                        <td className="px-3 py-2">
                                          <Badge
                                            status={
                                              c.nomeEtapa === 'Comissão Aprovada'
                                                ? 'Aprovado'
                                                : 'Pendente'
                                            }
                                          >
                                            {c.nomeEtapa || '-'}
                                          </Badge>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
