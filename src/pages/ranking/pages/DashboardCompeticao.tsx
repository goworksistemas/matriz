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
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { formatNumber } from '@/lib/utils';
import type { VendedorCompeticao } from '@/types';

// ============================================
// PROPS
// ============================================

interface DashboardCompeticaoProps {
  rankingCompeticao: VendedorCompeticao[];
}

// ============================================
// COMPONENTE: Pódio (Top 3)
// ============================================

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
      ring: 'ring-amber-400/50',
      bg: 'bg-gradient-to-b from-amber-50 to-amber-100 dark:from-amber-500/10 dark:to-amber-600/5',
      border: 'border-amber-200 dark:border-amber-500/30',
      icon: '1',
      height: 'h-28',
      size: 'text-2xl',
    },
    {
      gradient: 'from-gray-300 to-gray-500',
      ring: 'ring-gray-400/50',
      bg: 'bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-500/10 dark:to-gray-600/5',
      border: 'border-gray-200 dark:border-gray-500/30',
      icon: '2',
      height: 'h-20',
      size: 'text-xl',
    },
    {
      gradient: 'from-orange-400 to-orange-600',
      ring: 'ring-orange-400/50',
      bg: 'bg-gradient-to-b from-orange-50 to-orange-100 dark:from-orange-500/10 dark:to-orange-600/5',
      border: 'border-orange-200 dark:border-orange-500/30',
      icon: '3',
      height: 'h-16',
      size: 'text-lg',
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

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function DashboardCompeticao({ rankingCompeticao }: DashboardCompeticaoProps) {
  const kpis = useMemo(() => {
    const totalSeats = rankingCompeticao.reduce((acc, v) => acc + v.seatsCapped, 0);
    const vendedoresCompetindo = rankingCompeticao.filter(v => v.seatsCapped >= v.metaMinima).length;
    const totalVendedores = rankingCompeticao.length;
    const mediaSeats = totalVendedores > 0 ? totalSeats / totalVendedores : 0;

    return { totalSeats, vendedoresCompetindo, totalVendedores, mediaSeats };
  }, [rankingCompeticao]);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
            <Users className="h-4 w-4 text-violet-500" />
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

      {/* Podio */}
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

      {/* Ranking Completo */}
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
                    <th className="text-right py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Seats (c/ cap)</th>
                    <th className="text-right py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Seats (bruto)</th>
                    <th className="text-right py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Deals</th>
                    <th className="text-center py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Meta</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rankingCompeticao.map((v) => {
                    const dentroCompeticao = v.seatsCapped >= v.metaMinima;

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

                        <td className="py-3 px-3 text-center text-gray-400 dark:text-gray-500">
                          {v.metaMinima}
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

          {/* Criterios */}
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
