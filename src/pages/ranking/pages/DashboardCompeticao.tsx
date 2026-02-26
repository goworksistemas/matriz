import { useMemo } from 'react';
import {
  Trophy,
  Medal,
  Users,
  Info,
  CheckCircle,
  XCircle,
  Flame,
  Layers,
  Crown,
  Briefcase,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { formatNumber } from '@/lib/utils';
import type { VendedorCompeticao } from '@/types';

interface DashboardCompeticaoProps {
  rankingCompeticao: VendedorCompeticao[];
}

function Podium({ ranking }: { ranking: VendedorCompeticao[] }) {
  const top3 = ranking.slice(0, 3);

  if (top3.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 dark:text-gray-600">
        <div className="text-center">
          <Trophy className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nenhum vendedor com dados no período</p>
        </div>
      </div>
    );
  }

  const podiumConfig = [
    {
      gradient: 'from-amber-400 to-amber-600',
      bg: 'bg-gradient-to-b from-amber-50 to-amber-100 dark:from-amber-500/10 dark:to-amber-600/5',
      border: 'border-amber-200 dark:border-amber-500/30',
      icon: '1',
      height: 'h-28',
    },
    {
      gradient: 'from-gray-300 to-gray-500',
      bg: 'bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-500/10 dark:to-gray-600/5',
      border: 'border-gray-200 dark:border-gray-500/30',
      icon: '2',
      height: 'h-20',
    },
    {
      gradient: 'from-orange-400 to-orange-600',
      bg: 'bg-gradient-to-b from-orange-50 to-orange-100 dark:from-orange-500/10 dark:to-orange-600/5',
      border: 'border-orange-200 dark:border-orange-500/30',
      icon: '3',
      height: 'h-16',
    },
  ];

  const displayOrder = top3.length >= 3
    ? [{ data: top3[1], config: podiumConfig[1] }, { data: top3[0], config: podiumConfig[0] }, { data: top3[2], config: podiumConfig[2] }]
    : top3.length === 2
    ? [{ data: top3[1], config: podiumConfig[1] }, { data: top3[0], config: podiumConfig[0] }]
    : [{ data: top3[0], config: podiumConfig[0] }];

  return (
    <div className="flex items-end justify-center gap-4 py-6">
      {displayOrder.map(({ data: v, config }) => (
        <div key={v.ownerId} className="flex flex-col items-center">
          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${config.gradient} flex items-center justify-center mb-2`}>
            <span className="text-xs font-bold text-white">{config.icon}</span>
          </div>

          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 text-center max-w-[120px] truncate">
            {v.ownerNome}
          </span>

          <span className="text-lg font-bold text-primary-600 dark:text-primary-400 mt-1">
            {formatNumber(v.seatsCapped, 1)}
          </span>
          <span className="text-[10px] text-gray-400 mb-2">seats</span>

          <div className={`w-24 ${config.height} rounded-t-lg border ${config.border} ${config.bg} flex items-center justify-center`}>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
              {v.dealsCount} deals
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

const RANKING_BAR_COLORS = [
  '#f59e0b', '#9ca3af', '#f97316',
  '#6366f1', '#0ea5e9', '#10b981', '#ec4899', '#8b5cf6',
  '#14b8a6', '#f43f5e', '#a855f7', '#06b6d4',
];

export function DashboardCompeticao({ rankingCompeticao }: DashboardCompeticaoProps) {
  const kpis = useMemo(() => {
    const totalSeats = rankingCompeticao.reduce((acc, v) => acc + v.seatsCapped, 0);
    const totalDeals = rankingCompeticao.reduce((acc, v) => acc + v.dealsCount, 0);
    const vendedoresCompetindo = rankingCompeticao.filter(v => v.seatsCapped >= v.metaMinima).length;
    const totalVendedores = rankingCompeticao.length;
    const mediaSeats = totalVendedores > 0 ? totalSeats / totalVendedores : 0;
    const ticketMedio = totalDeals > 0 ? totalSeats / totalDeals : 0;

    const melhorVendedor = rankingCompeticao.length > 0 ? rankingCompeticao[0] : null;

    return { totalSeats, totalDeals, vendedoresCompetindo, totalVendedores, mediaSeats, ticketMedio, melhorVendedor };
  }, [rankingCompeticao]);

  const dadosGraficoRanking = useMemo(() => {
    return rankingCompeticao.slice(0, 15).map((v) => ({
      name: v.ownerNome.length > 18 ? v.ownerNome.slice(0, 18) + '...' : v.ownerNome,
      seats: v.seatsCapped,
      meta: v.metaMinima,
    }));
  }, [rankingCompeticao]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Layers className="h-4 w-4 text-sky-500" />
            <span className="text-xs font-medium text-gray-500">Total Seats</span>
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {formatNumber(kpis.totalSeats, 1)}
          </span>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-xs font-medium text-gray-500">Media/Vendedor</span>
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {formatNumber(kpis.mediaSeats, 1)}
          </span>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Briefcase className="h-4 w-4 text-violet-500" />
            <span className="text-xs font-medium text-gray-500">Seats/Deal</span>
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {formatNumber(kpis.ticketMedio, 1)}
          </span>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-primary-500" />
            <span className="text-xs font-medium text-gray-500">Vendedores</span>
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {kpis.totalVendedores}
          </span>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Medal className="h-4 w-4 text-emerald-500" />
            <span className="text-xs font-medium text-gray-500">Competindo</span>
          </div>
          <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {kpis.vendedoresCompetindo}
          </span>
          <span className="text-[11px] text-gray-400 ml-1">
            / {kpis.totalVendedores}
          </span>
        </div>
      </div>

      {kpis.melhorVendedor && (
        <div className="rounded-xl border border-amber-200/60 dark:border-amber-500/20 bg-gradient-to-r from-amber-50 to-white dark:from-amber-500/10 dark:to-gray-900/40 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-500/20">
                <Crown className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-amber-700 dark:text-amber-300">Lider do Periodo</p>
                <p className="text-base font-semibold text-gray-900 dark:text-gray-100">{kpis.melhorVendedor.ownerNome}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{formatNumber(kpis.melhorVendedor.seatsCapped, 1)} seats</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{kpis.melhorVendedor.dealsCount} deals fechados</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Podio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Podium ranking={rankingCompeticao} />
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary-500" />
              Ranking Visual
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dadosGraficoRanking.length === 0 ? (
              <div className="h-[350px] flex items-center justify-center text-sm text-gray-400">
                Nenhum dado no periodo selecionado
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(350, dadosGraficoRanking.length * 40)}>
                <BarChart data={dadosGraficoRanking} layout="vertical" margin={{ top: 5, right: 40, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                  <XAxis type="number" stroke="var(--chart-axis)" fontSize={11} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="var(--chart-axis)"
                    fontSize={11}
                    width={140}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--chart-tooltip-bg)',
                      border: '1px solid var(--chart-tooltip-border)',
                      borderRadius: '8px',
                      color: 'var(--chart-tooltip-text)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                    formatter={(value: number, name: string) => [
                      formatNumber(value, 1),
                      name === 'seats' ? 'Seats (c/ cap)' : 'Meta Minima',
                    ]}
                  />
                  <Bar dataKey="seats" radius={[0, 4, 4, 0]}>
                    <LabelList dataKey="seats" position="right" offset={8} fill="var(--chart-axis)" fontSize={11} formatter={(v: number) => formatNumber(v, 1)} />
                    {dadosGraficoRanking.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={RANKING_BAR_COLORS[index % RANKING_BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ranking Completo</CardTitle>
        </CardHeader>
        <CardContent>
          {rankingCompeticao.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-400">
              Nenhum dado no periodo selecionado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-white/[0.06]">
                    <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 w-12">#</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Vendedor</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 min-w-[200px]">Progresso</th>
                    <th className="text-right py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Seats (c/ cap)</th>
                    <th className="text-right py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Seats (bruto)</th>
                    <th className="text-right py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Deals</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rankingCompeticao.map((v) => {
                    const dentroCompeticao = v.seatsCapped >= v.metaMinima;
                    const progressPercent = Math.min((v.seatsCapped / v.metaMinima) * 100, 100);

                    return (
                      <tr
                        key={v.ownerId}
                        className="border-b border-gray-100 dark:border-white/[0.03] hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                            v.ranking === 1
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                              : v.ranking === 2
                              ? 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400'
                              : v.ranking === 3
                              ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400'
                              : 'bg-gray-50 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                          }`}>
                            {v.ranking}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <span className="font-medium text-gray-800 dark:text-gray-200">{v.ownerNome}</span>
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  dentroCompeticao ? 'bg-emerald-500' : 'bg-amber-500'
                                }`}
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                            <span className="text-[11px] text-gray-400 w-10 text-right">{formatNumber(progressPercent, 0)}%</span>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-right">
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {formatNumber(v.seatsCapped, 1)}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right text-gray-400 dark:text-gray-500">
                          {formatNumber(v.seatsRaw, 1)}
                        </td>

                        <td className="py-3 px-3 text-right text-gray-600 dark:text-gray-300">
                          {v.dealsCount}
                        </td>

                        <td className="py-3 px-3">
                          {dentroCompeticao ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                              <CheckCircle className="h-3.5 w-3.5" />
                              Competindo
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
          )}

          <div className="mt-6 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-white/[0.04]">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mb-2">
              <Info className="h-3.5 w-3.5" />
              Criterios
            </span>
            <ul className="space-y-1">
              {[
                'Seats contados de deals ganhos no periodo',
                'Limite de 30 posicoes por contrato (line item)',
                'Meta minima: 105 seats para competir',
                'Ranking ordenado por total de seats (com cap)',
              ].map((r, i) => (
                <li key={i} className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1.5">
                  <span className="text-primary-500 mt-0.5">•</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
