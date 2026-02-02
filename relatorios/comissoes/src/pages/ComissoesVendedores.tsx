import { useState, useMemo, Fragment } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  flexRender,
  type ColumnDef,
  type ExpandedState,
} from '@tanstack/react-table';
import {
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Award,
  TrendingUp,
  Target,
  Zap,
  Calculator,
  Scale,
  Trophy,
  DollarSign,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Select, SelectItem } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { KPICard } from '@/components/KPICard';
import {
  formatCurrency,
  formatNumber,
  formatDate,
  cn,
} from '@/lib/utils';
import type { Comissao, FiltrosVendedor, ResumoVendedor } from '@/types';

interface ComissoesVendedoresProps {
  comissoesFiltradas: Comissao[];
  filtrosVendedor: FiltrosVendedor;
  updateFiltroVendedor: <K extends keyof FiltrosVendedor>(
    key: K,
    value: FiltrosVendedor[K]
  ) => void;
  resetFiltrosVendedor: () => void;
  resumoVendedores: ResumoVendedor[];
  resumoConsolidado: {
    totalPosicoesCalc: number;
    totalPeso: number;
    totalComissaoSimples: number;
    totalPremioFisico: number;
    totalPremioVirtual: number;
    totalPremios: number;
    totalAReceber: number;
  };
  vendedoresUnicos: string[];
  etapasUnicas: string[];
}

export function ComissoesVendedores({
  comissoesFiltradas,
  filtrosVendedor,
  updateFiltroVendedor,
  resetFiltrosVendedor,
  resumoVendedores,
  resumoConsolidado,
  vendedoresUnicos,
  etapasUnicas,
}: ComissoesVendedoresProps) {
  const [expanded, setExpanded] = useState<ExpandedState>({});

  // Verificar se há filtros ativos
  const hasActiveFilters = useMemo(() => {
    return (
      filtrosVendedor.vendedor !== '' ||
      filtrosVendedor.vendaImpacto !== null ||
      filtrosVendedor.etapa !== '' ||
      filtrosVendedor.tipoProduto !== '' ||
      filtrosVendedor.cliente !== ''
    );
  }, [filtrosVendedor]);

  // Colunas da tabela principal (por vendedor)
  const columns = useMemo<ColumnDef<ResumoVendedor>[]>(
    () => [
      {
        id: 'expander',
        header: () => null,
        cell: ({ row }) => (
          <button
            onClick={() => row.toggleExpanded()}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
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
        accessorKey: 'vendedorNome',
        header: 'Vendedor',
        cell: ({ getValue }) => (
          <span className="font-medium text-gray-100">{getValue() as string}</span>
        ),
      },
      {
        id: 'negocios',
        header: 'Negócios',
        cell: ({ row }) => (
          <span className="text-gray-300">{row.original.comissoes.length}</span>
        ),
        size: 80,
      },
      {
        accessorKey: 'totalPosicoesCalc',
        header: 'Pos. Calc.',
        cell: ({ getValue }) => (
          <span className="text-gray-300">{formatNumber(getValue() as number, 2)}</span>
        ),
        size: 100,
      },
      {
        accessorKey: 'totalPeso',
        header: 'Peso',
        cell: ({ getValue }) => (
          <span className="text-gray-300">{formatNumber(getValue() as number)}</span>
        ),
        size: 80,
      },
      {
        accessorKey: 'totalComissaoSimples',
        header: 'Comissão Simples',
        cell: ({ getValue }) => (
          <span className="text-gray-300">
            {formatCurrency(getValue() as number)}
          </span>
        ),
      },
      {
        accessorKey: 'faixaFisico',
        header: 'Faixa Físico',
        cell: ({ getValue, row }) => {
          const faixa = getValue() as string;
          const premio = row.original.premioFisico;
          return (
            <div className="flex flex-col">
              <Badge
                variant={premio > 0 ? 'success' : 'default'}
                className="text-xs"
              >
                {faixa}
              </Badge>
            </div>
          );
        },
      },
      {
        accessorKey: 'premioFisico',
        header: 'Prêmio Físico',
        cell: ({ getValue }) => {
          const value = getValue() as number;
          return (
            <span className={cn(value > 0 ? 'text-green-400' : 'text-gray-500')}>
              {formatCurrency(value)}
            </span>
          );
        },
      },
      {
        accessorKey: 'faixaVirtual',
        header: 'Faixa Virtual',
        cell: ({ getValue, row }) => {
          const faixa = getValue() as string;
          const premio = row.original.premioVirtual;
          return (
            <Badge
              variant={premio > 0 ? 'info' : 'default'}
              className="text-xs"
            >
              {faixa}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'premioVirtual',
        header: 'Prêmio Virtual',
        cell: ({ getValue }) => {
          const value = getValue() as number;
          return (
            <span className={cn(value > 0 ? 'text-primary-400' : 'text-gray-500')}>
              {formatCurrency(value)}
            </span>
          );
        },
      },
      {
        accessorKey: 'totalAReceber',
        header: 'Total a Receber',
        cell: ({ getValue }) => (
          <span className="font-semibold text-amber-400">
            {formatCurrency(getValue() as number)}
          </span>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: resumoVendedores,
    columns,
    state: { expanded },
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
  });

  return (
    <div className="space-y-6">
      {/* Card de Metas */}
      <Card className="border-primary-500/30 bg-gradient-to-r from-primary-500/5 to-primary-600/10">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-primary-400">
            <Target className="h-5 w-5" />
            Regras de Metas e Prêmios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-200 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                Produto Físico (por Posições Calculadas)
              </h4>
              <ul className="space-y-1 text-gray-400 ml-3.5">
                <li>≥ 65 posições → <span className="text-green-400">35%</span> sobre comissão</li>
                <li>≥ 45 posições → <span className="text-green-400">30%</span> sobre comissão</li>
                <li>≥ 35 posições → <span className="text-green-400">25%</span> sobre comissão</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-200 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary-500"></span>
                Produto Virtual (por Peso + Posições)
              </h4>
              <ul className="space-y-1 text-gray-400 ml-3.5">
                <li>≥ 55 → <span className="text-primary-400">45%</span> sobre comissão</li>
                <li>≥ 45 → <span className="text-primary-400">35%</span> sobre comissão</li>
                <li>≥ 30 → <span className="text-primary-400">25%</span> sobre comissão</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card className="!p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-400">Vendedor</label>
            <Select
              value={filtrosVendedor.vendedor}
              onValueChange={(v) => updateFiltroVendedor('vendedor', v)}
              placeholder="Todos"
            >
              <SelectItem value="">Todos</SelectItem>
              {vendedoresUnicos.map((v) => (
                <SelectItem key={v} value={v}>
                  {v}
                </SelectItem>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-400">Venda Impacto</label>
            <Select
              value={
                filtrosVendedor.vendaImpacto === null
                  ? ''
                  : filtrosVendedor.vendaImpacto
                  ? 'sim'
                  : 'nao'
              }
              onValueChange={(v) =>
                updateFiltroVendedor(
                  'vendaImpacto',
                  v === '' ? null : v === 'sim'
                )
              }
              placeholder="Todos"
            >
              <SelectItem value="">Todos</SelectItem>
              <SelectItem value="sim">Sim</SelectItem>
              <SelectItem value="nao">Não</SelectItem>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-400">Etapa</label>
            <Select
              value={filtrosVendedor.etapa}
              onValueChange={(v) => updateFiltroVendedor('etapa', v)}
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
            <label className="text-xs font-medium text-gray-400">Tipo Produto</label>
            <Select
              value={filtrosVendedor.tipoProduto}
              onValueChange={(v) => updateFiltroVendedor('tipoProduto', v)}
              placeholder="Todos"
            >
              <SelectItem value="">Todos</SelectItem>
              <SelectItem value="fisico">Físico</SelectItem>
              <SelectItem value="virtual">Virtual</SelectItem>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-400">Cliente</label>
            <Input
              value={filtrosVendedor.cliente}
              onChange={(e) => updateFiltroVendedor('cliente', e.target.value)}
              placeholder="Buscar cliente..."
              className="w-48"
            />
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFiltrosVendedor}
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

      {/* KPIs Consolidados */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7 gap-3">
        <KPICard
          title="Pos. Calc."
          value={formatNumber(resumoConsolidado.totalPosicoesCalc, 2)}
          variant="default"
          icon={Calculator}
          compact
        />
        <KPICard
          title="Peso Total"
          value={formatNumber(resumoConsolidado.totalPeso)}
          variant="default"
          icon={Scale}
          compact
        />
        <KPICard
          title="Comissão Simples"
          value={formatCurrency(resumoConsolidado.totalComissaoSimples)}
          variant="default"
          icon={DollarSign}
          compact
        />
        <KPICard
          title="Prêmio Físico"
          value={formatCurrency(resumoConsolidado.totalPremioFisico)}
          variant="success"
          icon={Award}
          compact
        />
        <KPICard
          title="Prêmio Virtual"
          value={formatCurrency(resumoConsolidado.totalPremioVirtual)}
          variant="primary"
          icon={Zap}
          compact
        />
        <KPICard
          title="Total Prêmios"
          value={formatCurrency(resumoConsolidado.totalPremios)}
          variant="default"
          icon={Trophy}
          compact
        />
        <KPICard
          title="Total a Receber"
          value={formatCurrency(resumoConsolidado.totalAReceber)}
          variant="warning"
          icon={TrendingUp}
          compact
        />
      </div>

      {/* Tabela Principal */}
      <Card>
        <CardHeader>
          <CardTitle>Matriz de Comissões por Vendedor</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-800 sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-left font-semibold text-gray-300 border-b border-gray-700"
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
                      <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
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
                        <tr className="bg-gray-850">
                          <td colSpan={columns.length} className="p-0">
                            <div className="p-4 bg-gray-900/50 border-y border-gray-700">
                              <h4 className="text-sm font-medium text-gray-300 mb-3">
                                Detalhes por Cliente
                              </h4>
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                  <thead className="bg-gray-800">
                                    <tr>
                                      <th className="px-3 py-2 text-left text-gray-400">
                                        Impacto
                                      </th>
                                      <th className="px-3 py-2 text-left text-gray-400">
                                        Cliente
                                      </th>
                                      <th className="px-3 py-2 text-left text-gray-400">
                                        Produto
                                      </th>
                                      <th className="px-3 py-2 text-left text-gray-400">
                                        Data Fech.
                                      </th>
                                      <th className="px-3 py-2 text-left text-gray-400">
                                        Tipo
                                      </th>
                                      <th className="px-3 py-2 text-right text-gray-400">
                                        Pos. Calc.
                                      </th>
                                      <th className="px-3 py-2 text-right text-gray-400">
                                        Peso
                                      </th>
                                      <th className="px-3 py-2 text-right text-gray-400">
                                        Valor
                                      </th>
                                      <th className="px-3 py-2 text-right text-gray-400">
                                        Comissão
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
                                        className="border-b border-gray-800 hover:bg-gray-800/30"
                                      >
                                        <td className="px-3 py-2">
                                          {c.vendaImpacto ? (
                                            <Badge variant="warning">SIM</Badge>
                                          ) : (
                                            <span className="text-gray-500">-</span>
                                          )}
                                        </td>
                                        <td className="px-3 py-2 text-gray-200 max-w-[200px] truncate">
                                          {c.nomeCliente}
                                        </td>
                                        <td className="px-3 py-2 text-gray-300 max-w-[150px] truncate">
                                          {c.produto}
                                        </td>
                                        <td className="px-3 py-2 text-gray-400">
                                          {c.dataFechamento ? formatDate(c.dataFechamento) : '-'}
                                        </td>
                                        <td className="px-3 py-2">
                                          <Badge
                                            variant={
                                              c.tipoProduto === 'fisico'
                                                ? 'success'
                                                : 'info'
                                            }
                                          >
                                            {c.tipoProduto}
                                          </Badge>
                                        </td>
                                        <td className="px-3 py-2 text-right text-gray-300">
                                          {formatNumber(c.posicoesCalculadas, 2)}
                                        </td>
                                        <td className="px-3 py-2 text-right text-gray-300">
                                          {c.peso ?? '-'}
                                        </td>
                                        <td className="px-3 py-2 text-right text-gray-300">
                                          {formatCurrency(c.valorNegocio)}
                                        </td>
                                        <td className="px-3 py-2 text-right text-amber-400 font-medium">
                                          {formatCurrency(c.comissaoSimples)}
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
