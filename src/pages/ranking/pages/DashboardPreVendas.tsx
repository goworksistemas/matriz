import { Fragment, useMemo, useState, type ImgHTMLAttributes } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  flexRender,
  type ColumnDef,
  type ExpandedState,
} from '@tanstack/react-table';
import {
  Trophy,
  Users,
  Info,
  CheckCircle,
  XCircle,
  Flame,
  Crown,
  CalendarDays,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Headphones,
  Monitor,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { cn, formatNumber, formatCurrency } from '@/lib/utils';
import type { VendedorPreVendas, NegocioPreVendas, Proprietario } from '@/types';

interface DashboardPreVendasProps {
  ranking: VendedorPreVendas[];
  negocios: NegocioPreVendas[];
  proprietarios: Proprietario[];
  competicao: 'varejo' | 'macbook';
  periodo: string;
}

function getAvatarUrl(name: string, size = 128, bg = '0ea5e9'): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name.trim() || '?')}&size=${size}&background=${bg}&color=fff&bold=true&format=svg`;
}

const PODIUM_AVATAR_COLORS: Record<number, string> = { 1: '10b981', 2: '9ca3af', 3: 'f97316' };

function OwnerAvatar({ name, size = 32, className, rank, ...rest }: { name: string; size?: number; rank?: number; className?: string } & Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt' | 'className'>) {
  const [errored, setErrored] = useState(false);
  const bg = rank ? (PODIUM_AVATAR_COLORS[rank] || '0ea5e9') : '0ea5e9';
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  if (errored) {
    return (
      <div className={cn('rounded-full flex items-center justify-center text-white font-bold', className)} style={{ width: size, height: size, backgroundColor: `#${bg}`, fontSize: size * 0.35 }}>
        {initials}
      </div>
    );
  }

  return (
    <img
      src={getAvatarUrl(name, size * 2, bg)}
      alt={name}
      className={cn('rounded-full object-cover', className)}
      style={{ width: size, height: size }}
      onError={() => setErrored(true)}
      loading="lazy"
      {...rest}
    />
  );
}

/** Está elegível a “competir” (metas da campanha atendidas) */
function estaDentroPreVendas(v: VendedorPreVendas): boolean {
  if (v.metaMinimaVirtuais !== undefined) {
    return v.reunioes >= v.metaMinima && v.virtuais >= v.metaMinimaVirtuais;
  }
  return v.reunioes >= v.metaMinima;
}

function progressoPreVendasPct(v: VendedorPreVendas): number {
  if (v.metaMinimaVirtuais !== undefined) {
    return Math.min(
      (v.reunioes / v.metaMinima) * 100,
      (v.virtuais / v.metaMinimaVirtuais) * 100,
      100,
    );
  }
  return Math.min((v.reunioes / v.metaMinima) * 100, 100);
}

function PodiumPreVendas({ ranking }: { ranking: VendedorPreVendas[] }) {
  const top3 = ranking.slice(0, 3);

  if (top3.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-600">
        <div className="text-center">
          <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum vendedor com dados no período</p>
        </div>
      </div>
    );
  }

  const podiumConfig = [
    { gradient: 'from-amber-100 via-amber-50 to-white dark:from-amber-500/15 dark:via-amber-500/5 dark:to-transparent', border: 'border-amber-300 dark:border-amber-500/40', ring: 'ring-amber-400', shadow: 'shadow-amber-200/50 dark:shadow-amber-500/10', height: 'h-36', avatarSize: 72, rank: 1, badge: 'bg-gradient-to-r from-amber-500 to-yellow-400', textColor: 'text-amber-600 dark:text-amber-400' },
    { gradient: 'from-gray-100 via-gray-50 to-white dark:from-gray-500/15 dark:via-gray-500/5 dark:to-transparent', border: 'border-gray-300 dark:border-gray-500/40', ring: 'ring-gray-400', shadow: 'shadow-gray-200/50 dark:shadow-gray-500/10', height: 'h-24', avatarSize: 56, rank: 2, badge: 'bg-gradient-to-r from-gray-400 to-gray-300', textColor: 'text-gray-600 dark:text-gray-400' },
    { gradient: 'from-orange-100 via-orange-50 to-white dark:from-orange-500/15 dark:via-orange-500/5 dark:to-transparent', border: 'border-orange-300 dark:border-orange-500/40', ring: 'ring-orange-400', shadow: 'shadow-orange-200/50 dark:shadow-orange-500/10', height: 'h-20', avatarSize: 48, rank: 3, badge: 'bg-gradient-to-r from-orange-500 to-amber-400', textColor: 'text-orange-600 dark:text-orange-400' },
  ];

  const displayOrder = top3.length >= 3
    ? [{ data: top3[1], config: podiumConfig[1] }, { data: top3[0], config: podiumConfig[0] }, { data: top3[2], config: podiumConfig[2] }]
    : top3.length === 2
      ? [{ data: top3[1], config: podiumConfig[1] }, { data: top3[0], config: podiumConfig[0] }]
      : [{ data: top3[0], config: podiumConfig[0] }];

  return (
    <div className="flex items-end justify-center gap-4 sm:gap-6 py-8 px-2">
      {displayOrder.map(({ data: v, config }) => (
        <div key={v.ownerId} className="flex flex-col items-center max-w-[33%] sm:max-w-none">
          <div className="relative mb-3">
            {config.rank === 1 && <Crown className="absolute -top-5 left-1/2 -translate-x-1/2 h-7 w-7 text-amber-500 drop-shadow-lg z-10" />}
            <OwnerAvatar
              name={v.ownerNome}
              size={config.avatarSize}
              rank={config.rank}
              className={cn(
                'ring-[3px] ring-offset-[3px] ring-offset-white dark:ring-offset-gray-900',
                config.ring,
                config.rank === 1 && 'shadow-xl shadow-amber-200/60 dark:shadow-amber-500/20',
              )}
            />
            <span className={cn(
              'absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white shadow-lg',
              config.badge,
            )}>
              {config.rank}
            </span>
          </div>

          <span className={cn(
            'font-bold text-center max-w-[140px] truncate',
            config.rank === 1 ? 'text-base text-gray-900 dark:text-gray-100' : 'text-sm text-gray-700 dark:text-gray-300',
          )}>
            {v.ownerNome}
          </span>

          <div className="mt-2 text-center">
            <span className={cn('text-2xl font-black tabular-nums', config.textColor)}>
              {formatNumber(v.reunioes)}
            </span>
            <p className="text-[11px] text-gray-400 font-medium -mt-0.5">reuniões</p>
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 tabular-nums">
            {formatNumber(v.virtuais)} virtuais
          </span>

          <div className={cn(
            'w-24 sm:w-28 rounded-t-xl border-2 flex items-center justify-center mt-3 shadow-lg',
            config.height, config.border,
            `bg-gradient-to-b ${config.gradient}`,
            config.shadow,
          )}>
            <span className={cn('text-lg font-black', config.textColor)}>
              #{config.rank}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

interface MatrizPreVendasRow {
  ownerId: string;
  ownerNome: string;
  negocios: NegocioPreVendas[];
  totalReuniao: number;
  totalVirtuais: number;
  valorTotal: number;
}

function buildMatrizPreVendas(negocios: NegocioPreVendas[]): MatrizPreVendasRow[] {
  const map = new Map<string, NegocioPreVendas[]>();
  negocios.forEach(n => {
    const list = map.get(n.ownerId) || [];
    list.push(n);
    map.set(n.ownerId, list);
  });

  return Array.from(map.entries())
    .map(([ownerId, lista]) => ({
      ownerId,
      ownerNome: lista[0]?.ownerNome ?? '',
      negocios: lista.sort((a, b) => {
        const dA = a.closeDate || a.createDate || '';
        const dB = b.closeDate || b.createDate || '';
        return dB.localeCompare(dA);
      }),
      totalReuniao: lista.length,
      totalVirtuais: Math.floor(lista.length / 2),
      valorTotal: lista.reduce((acc, x) => acc + x.amount, 0),
    }))
    .sort((a, b) => b.totalReuniao - a.totalReuniao || a.ownerNome.localeCompare(b.ownerNome));
}

export function DashboardPreVendas({ ranking, negocios, proprietarios, competicao, periodo }: DashboardPreVendasProps) {
  const [regrasAbertas, setRegrasAbertas] = useState(false);
  const [expandedMatriz, setExpandedMatriz] = useState<ExpandedState>({});

  const isVarejo = competicao === 'varejo';
  const accentColor = isVarejo ? 'emerald' : 'emerald';

  const matrizData = useMemo(() => buildMatrizPreVendas(negocios), [negocios]);

  const colunasMatriz = useMemo<ColumnDef<MatrizPreVendasRow>[]>(
    () => [
      {
        id: 'expander',
        header: () => null,
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => row.toggleExpanded()}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            {row.getIsExpanded() ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
          </button>
        ),
        size: 40,
      },
      {
        accessorKey: 'ownerNome',
        header: 'Vendedor',
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <OwnerAvatar name={row.original.ownerNome} size={28} className="flex-shrink-0" />
            <span className="font-medium text-gray-900 dark:text-gray-100">{row.original.ownerNome}</span>
          </div>
        ),
      },
      {
        id: 'totalReuniao',
        header: 'Reuniões',
        cell: ({ row }) => (
          <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">{row.original.totalReuniao}</span>
        ),
        size: 90,
      },
      {
        id: 'totalVirtuais',
        header: 'Virtuais',
        cell: ({ row }) => (
          <span className="text-gray-600 dark:text-gray-300 tabular-nums">{row.original.totalVirtuais}</span>
        ),
        size: 80,
      },
      {
        id: 'valor',
        header: 'Valor total',
        cell: ({ row }) => (
          <span className="text-gray-600 dark:text-gray-300">{formatCurrency(row.original.valorTotal)}</span>
        ),
      },
    ],
    [],
  );

  const tableMatriz = useReactTable({
    data: matrizData,
    columns: colunasMatriz,
    state: { expanded: expandedMatriz },
    onExpandedChange: setExpandedMatriz,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowId: row => row.ownerId,
    getRowCanExpand: row => row.original.negocios.length > 0,
  });

  const kpis = useMemo(() => {
    const totalReuniao = ranking.reduce((acc, v) => acc + v.reunioes, 0);
    const totalVirtuais = ranking.reduce((acc, v) => acc + v.virtuais, 0);
    const competindo = ranking.filter(estaDentroPreVendas).length;
    const lider = ranking.length > 0 ? ranking[0] : null;
    return { totalReuniao, totalVirtuais, vendedores: ranking.length, competindo, lider };
  }, [ranking]);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className={cn(
        'rounded-xl border p-5',
        'border-emerald-200/60 dark:border-emerald-500/20 bg-gradient-to-r from-emerald-50 via-white to-emerald-50 dark:from-emerald-500/10 dark:via-gray-900/40 dark:to-emerald-500/10',
      )}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Headphones className="h-5 w-5 text-emerald-500" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Pré-vendas e Virtual — {isVarejo ? 'Competição Varejo' : 'Competição MacBook'}
              </h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 max-w-xl">
              {isVarejo ? (
                <>Premiado será quem mais realizar reuniões ou gerar resultado no virtual. 1 virtual = 2 reuniões realizadas.</>
              ) : (
                <>
                  Campanha com foco mais macro: acompanha a performance em um período maior. Premiado será quem mais realizar reuniões ou gerar resultado no virtual.
                  {' '}1 virtual = 2 reuniões realizadas.
                </>
              )}
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 pt-1">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-emerald-500" />
                {periodo}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-500/10 dark:to-gray-900/50 p-3 text-center min-w-[130px]">
            <Trophy className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
            <p className="text-[10px] uppercase tracking-wide text-emerald-600 dark:text-emerald-400 font-semibold">1º colocado</p>
            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300 leading-tight">
              {isVarejo ? 'R$ 500,00' : 'Apple Watch'}
            </p>
            {!isVarejo && (
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">Pré-vendas e Virtual</p>
            )}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Headphones className="h-4 w-4 text-emerald-500" />
            <span className="text-xs font-medium text-gray-500">Reuniões</span>
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatNumber(kpis.totalReuniao)}</span>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Monitor className="h-4 w-4 text-sky-500" />
            <span className="text-xs font-medium text-gray-500">Virtuais</span>
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatNumber(kpis.totalVirtuais)}</span>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-primary-500" />
            <span className="text-xs font-medium text-gray-500">Vendedores</span>
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-gray-100">{kpis.vendedores}</span>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="h-4 w-4 text-emerald-500" />
            <span className="text-xs font-medium text-gray-500">Competindo</span>
          </div>
          <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{kpis.competindo}</span>
          <span className="text-[11px] text-gray-400 ml-1">/ {kpis.vendedores}</span>
        </div>
      </div>

      {/* Líder */}
      {kpis.lider && (
        <div className="rounded-xl border border-emerald-200/60 dark:border-emerald-500/20 bg-gradient-to-r from-emerald-50 to-white dark:from-emerald-500/10 dark:to-gray-900/40 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <OwnerAvatar name={kpis.lider.ownerNome} size={44} rank={1} className="ring-2 ring-emerald-400 ring-offset-2 ring-offset-white dark:ring-offset-gray-900" />
                <Crown className="absolute -top-2 -right-2 h-4 w-4 text-emerald-500 drop-shadow" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Líder Pré-vendas</p>
                <p className="text-base font-semibold text-gray-900 dark:text-gray-100">{kpis.lider.ownerNome}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{kpis.lider.reunioes} reuniões</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{kpis.lider.virtuais} virtuais</p>
            </div>
          </div>
        </div>
      )}

      {/* Pódio — top 3 (mesmo conceito da competição Varejo/MacBook) */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-b from-emerald-50/50 via-white to-white dark:from-emerald-500/5 dark:via-gray-900/50 dark:to-gray-900/50">
          <CardHeader className="text-center pb-0">
            <CardTitle className="flex items-center justify-center gap-2 text-lg">
              <Trophy className="h-5 w-5 text-amber-500" />
              Pódio da Competição
            </CardTitle>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {isVarejo
                ? 'Classificação por reuniões realizadas · desempate por virtuais'
                : 'Classificação por reuniões · desempate por virtuais · mín. 400 reuniões e 250 virtuais para competir'}
            </p>
          </CardHeader>
          <CardContent>
            <PodiumPreVendas ranking={ranking} />
          </CardContent>
        </div>
      </Card>

      {/* Matriz por vendedor */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <Headphones className="h-4 w-4 text-emerald-500" />
              Matriz de Reuniões por Vendedor
            </CardTitle>
            <span className="text-xs text-gray-400">{negocios.length} reuniões · {matrizData.length} vendedores</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {negocios.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400 px-6">
              Nenhuma reunião realizada no período da campanha
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                  {tableMatriz.getHeaderGroups().map(hg => (
                    <tr key={hg.id}>
                      {hg.headers.map(header => (
                        <th
                          key={header.id}
                          className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700"
                          style={{ width: header.getSize() }}
                        >
                          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {tableMatriz.getRowModel().rows.map(row => (
                    <Fragment key={row.id}>
                      <tr className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id} className="px-4 py-3 align-middle">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                      {row.getIsExpanded() && (
                        <tr>
                          <td colSpan={colunasMatriz.length} className="p-0">
                            <div className="px-4 py-4 bg-gray-50 dark:bg-gray-900/50 border-y border-gray-200 dark:border-gray-700">
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                Reuniões — {row.original.ownerNome}
                              </h4>
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                  <thead className="bg-gray-100 dark:bg-gray-800">
                                    <tr>
                                      <th className="px-3 py-2 text-left text-gray-500 dark:text-gray-400 font-semibold">Negócio</th>
                                      <th className="px-3 py-2 text-left text-gray-500 dark:text-gray-400 font-semibold">Etapa</th>
                                      <th className="px-3 py-2 text-right text-gray-500 dark:text-gray-400 font-semibold">Valor</th>
                                      <th className="px-3 py-2 text-left text-gray-500 dark:text-gray-400 font-semibold">Data</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {row.original.negocios.map(n => (
                                      <tr
                                        key={n.dealHubspotId}
                                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/30"
                                      >
                                        <td className="px-3 py-2 text-gray-800 dark:text-gray-200 max-w-[250px]">
                                          <span className="block truncate" title={n.dealName}>{n.dealName}</span>
                                        </td>
                                        <td className="px-3 py-2 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                          {n.stageLabel || '—'}
                                        </td>
                                        <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                          {formatCurrency(n.amount)}
                                        </td>
                                        <td className="px-3 py-2 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                          {(n.closeDate || n.createDate)
                                            ? new Date((n.closeDate || n.createDate)! + (n.closeDate && n.closeDate.length === 10 ? 'T12:00:00' : '')).toLocaleDateString('pt-BR')
                                            : '—'}
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ranking Completo */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Ranking Completo</CardTitle>
            <span className="text-xs text-gray-400">{ranking.length} vendedores</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-white/[0.06]">
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 w-12">#</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Vendedor</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 min-w-[200px]">Progresso</th>
                  <th className="text-right py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Reuniões</th>
                  <th className="text-right py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Virtuais</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((v) => {
                  const dentroCompeticao = estaDentroPreVendas(v);
                  const progressPercent = progressoPreVendasPct(v);
                  const isZero = v.reunioes === 0;

                  return (
                    <tr
                      key={v.ownerId}
                      className={cn(
                        'border-b border-gray-100 dark:border-white/[0.03] hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors',
                        isZero && 'opacity-50',
                      )}
                    >
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                          v.ranking === 1 && !isZero
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                            : v.ranking === 2 && !isZero
                            ? 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400'
                            : v.ranking === 3 && !isZero
                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400'
                            : 'bg-gray-50 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                        }`}>
                          {v.ranking}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <OwnerAvatar name={v.ownerNome} size={28} className="flex-shrink-0" />
                          <span className={cn('font-medium', isZero ? 'text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-gray-200')}>{v.ownerNome}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                dentroCompeticao ? 'bg-emerald-500' : progressPercent > 0 ? 'bg-emerald-400' : ''
                              }`}
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-gray-400 w-10 text-right">{formatNumber(progressPercent, 0)}%</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <span className={cn('font-semibold', isZero ? 'text-gray-300 dark:text-gray-600' : 'text-gray-900 dark:text-gray-100')}>
                          {v.reunioes}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <span className={isZero ? 'text-gray-300 dark:text-gray-600' : 'text-gray-500 dark:text-gray-400'}>
                          {v.virtuais}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        {dentroCompeticao ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            <CheckCircle className="h-3.5 w-3.5" />
                            Competindo
                          </span>
                        ) : isZero ? (
                          <span className="text-[11px] italic text-gray-400 dark:text-gray-500">
                            Aguardando primeira reunião
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 dark:text-gray-500">
                            <XCircle className="h-3.5 w-3.5" />
                            {v.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Regras — retrátil */}
      <Card>
        <button
          onClick={() => setRegrasAbertas(p => !p)}
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors rounded-xl"
        >
          <span className="text-sm font-semibold flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <Info className="h-4 w-4 text-gray-400" />
            Regras — Pré-vendas e Virtual
          </span>
          <svg className={cn('h-4 w-4 text-gray-400 transition-transform duration-200', regrasAbertas && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </button>
        {regrasAbertas && (
          <CardContent className="pt-0 pb-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-wide font-semibold text-gray-500 dark:text-gray-400">Critérios de Participação</h4>
                <ul className="space-y-2">
                  {(isVarejo
                    ? [
                        { icon: ShieldCheck, text: 'Mínimo de 100 reuniões realizadas para participar', color: 'text-emerald-500' },
                        { icon: Monitor, text: 'Pipeline: Virtual · Etapa: Reunião realizada (ou posterior)', color: 'text-sky-500' },
                        { icon: Headphones, text: '1 virtual = 2 reuniões realizadas', color: 'text-violet-500' },
                        { icon: CalendarDays, text: `Período: ${periodo}`, color: 'text-primary-500' },
                      ]
                    : [
                        { icon: ShieldCheck, text: 'Mínimo de 400 reuniões realizadas e 250 virtuais para participar', color: 'text-emerald-500' },
                        { icon: Monitor, text: 'Pipeline: Virtual · Etapa: Reunião realizada (ou posterior)', color: 'text-sky-500' },
                        { icon: Headphones, text: '1 virtual = 2 reuniões realizadas', color: 'text-violet-500' },
                        { icon: CalendarDays, text: `Período: ${periodo} (campanha macro)`, color: 'text-primary-500' },
                      ]
                  ).map((rule, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                      <rule.icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', rule.color)} />
                      {rule.text}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-wide font-semibold text-gray-500 dark:text-gray-400">Premiação e classificação</h4>
                <ul className="space-y-2">
                  {(isVarejo
                    ? [
                        { icon: Trophy, text: 'Ranking ordenado por total de reuniões realizadas; desempate por virtuais', color: 'text-emerald-500' },
                        { icon: Trophy, text: '1º lugar: R$ 500,00', color: 'text-amber-500' },
                      ]
                    : [
                        { icon: Trophy, text: 'Ranking ordenado por total de reuniões realizadas; desempate por virtuais', color: 'text-emerald-500' },
                        { icon: Trophy, text: '1º lugar (Pré-vendas e Virtual): Apple Watch', color: 'text-amber-500' },
                      ]
                  ).map((rule, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                      <rule.icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', rule.color)} />
                      {rule.text}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
