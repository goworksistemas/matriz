import { useMemo, useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Target,
  Layers,
  Briefcase,
  CheckCircle,
  CalendarDays,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  LabelList,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { cn, formatCurrency, formatNumber } from '@/lib/utils';
import type {
  MetaVendas,
  FiltrosMetaGlobal,
  KPIsMetaGlobal,
  DadoGraficoMensal,
  DadoGraficoMensalSeats,
} from '@/types';
import type { DadoGraficoMensalDeals } from '../hooks/useRankingFilters';

const MESES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

const MESES_COMPLETO = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

interface DadoMesDetalhado {
  mes: string;
  mesNumero: number;
  realizado: number;
  meta: number;
}

function MesCard({
  dado,
  formatFn,
  color,
  isAtual,
  isFuturo,
}: {
  dado: DadoMesDetalhado;
  formatFn: (v: number) => string;
  color: string;
  isAtual: boolean;
  isFuturo: boolean;
}) {
  const percent = dado.meta > 0 ? Math.min((dado.realizado / dado.meta) * 100, 100) : 0;
  const atingiu = dado.meta > 0 && dado.realizado >= dado.meta;

  return (
    <div className={cn(
      'rounded-lg border p-3 transition-all',
      isAtual
        ? 'border-primary-300 dark:border-primary-500/40 bg-primary-50/40 dark:bg-primary-500/5 ring-1 ring-primary-200 dark:ring-primary-500/20'
        : isFuturo
        ? 'border-gray-100 dark:border-white/[0.03] bg-gray-50/50 dark:bg-gray-900/30 opacity-50'
        : 'border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50',
    )}>
      <div className="flex items-center justify-between mb-2">
        <span className={cn(
          'text-xs font-semibold',
          isAtual ? 'text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300',
        )}>
          {dado.mes}
          {isAtual && <span className="ml-1 text-[10px] font-normal text-primary-500">(atual)</span>}
        </span>
        {atingiu && <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />}
      </div>

      <div className="mb-2 min-w-0">
        <div className={cn(
          'text-sm font-bold truncate',
          atingiu ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-gray-100',
        )}>
          {formatFn(dado.realizado)}
        </div>
        {dado.meta > 0 && (
          <div className="text-[10px] text-gray-400 truncate">Meta: {formatFn(dado.meta)}</div>
        )}
      </div>

      {dado.meta > 0 ? (
        <div className="space-y-1">
          <div className="h-1.5 rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${percent}%`, backgroundColor: atingiu ? '#10b981' : color }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 min-w-0">
            <span className="shrink-0">{formatNumber(percent, 0)}%</span>
            {!atingiu && dado.meta > dado.realizado && (
              <span className="truncate ml-1 text-right">-{formatFn(dado.meta - dado.realizado)}</span>
            )}
          </div>
        </div>
      ) : (
        <div className="h-1.5 rounded-full bg-gray-100 dark:bg-white/[0.06]" />
      )}
    </div>
  );
}

function ProgressCard({
  title,
  icon: Icon,
  atual,
  meta,
  formatValue,
  color,
  compact,
}: {
  title: string;
  icon: React.ElementType;
  atual: number;
  meta: number;
  formatValue: (v: number) => string;
  color: 'emerald' | 'sky' | 'violet';
  compact?: boolean;
}) {
  const percentual = meta > 0 ? Math.min((atual / meta) * 100, 100) : 0;
  const atingiu = meta > 0 && atual >= meta;
  const falta = meta > 0 ? Math.max(meta - atual, 0) : 0;

  const colorMap = {
    emerald: { bg: 'bg-emerald-500/10', icon: 'text-emerald-500', bar: 'bg-emerald-500', barBg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400' },
    sky: { bg: 'bg-sky-500/10', icon: 'text-sky-500', bar: 'bg-sky-500', barBg: 'bg-sky-500/10', text: 'text-sky-600 dark:text-sky-400' },
    violet: { bg: 'bg-violet-500/10', icon: 'text-violet-500', bar: 'bg-violet-500', barBg: 'bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400' },
  };

  const c = colorMap[color];

  return (
    <div className={cn('rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50 transition-all hover:shadow-md', compact ? 'p-3' : 'p-4')}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={cn('rounded-lg', c.bg, compact ? 'p-1' : 'p-1.5')}>
            <Icon className={cn(c.icon, compact ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
          </div>
          <span className={cn('font-medium text-gray-600 dark:text-gray-400', compact ? 'text-xs' : 'text-sm')}>{title}</span>
        </div>
        {atingiu && (
          <span className="text-[11px] font-semibold text-emerald-500 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> Atingida
          </span>
        )}
      </div>

      <div className="mb-2 min-w-0">
        <div className={cn('font-bold truncate', c.text, compact ? 'text-base' : 'text-lg')}>{formatValue(atual)}</div>
        <div className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
          {meta > 0 ? `Meta: ${formatValue(meta)}` : 'Sem meta'}
        </div>
      </div>

      {meta > 0 && (
        <div className="space-y-1">
          <div className={cn('rounded-full overflow-hidden', c.barBg, compact ? 'h-1.5' : 'h-2')}>
            <div className={cn('h-full rounded-full transition-all duration-700 ease-out', c.bar)} style={{ width: `${percentual}%` }} />
          </div>
          <div className="flex justify-between text-[11px] text-gray-400 min-w-0">
            <span className="shrink-0">{formatNumber(percentual, 1)}%</span>
            <span className="truncate ml-2 text-right">
              {atingiu ? `${formatValue(atual)} / ${formatValue(meta)}` : `Faltam ${formatValue(falta)}`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

type GraficoTab = 'revenue' | 'seats' | 'deals';

const GRAFICO_TABS: { key: GraficoTab; label: string; activeClass: string }[] = [
  { key: 'revenue', label: 'Receita', activeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' },
  { key: 'seats', label: 'Seats', activeClass: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400' },
  { key: 'deals', label: 'Deals', activeClass: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400' },
];

const GRAFICO_CONFIG: Record<GraficoTab, { dataKey: string; color: string; labelRealizado: string; formatFn: (v: number) => string }> = {
  revenue: { dataKey: 'realizado', color: '#10b981', labelRealizado: 'Realizado', formatFn: formatCurrency },
  seats: { dataKey: 'seats', color: '#0ea5e9', labelRealizado: 'Seats Realizados', formatFn: (v) => formatNumber(v, 1) },
  deals: { dataKey: 'deals', color: '#8b5cf6', labelRealizado: 'Deals Fechados', formatFn: (v) => formatNumber(v) },
};

interface DashboardMetaGlobalProps {
  metas: MetaVendas[];
  filtrosGlobal: FiltrosMetaGlobal;
  kpisMetaGlobal: KPIsMetaGlobal;
  dadosGraficoMensalRevenue: DadoGraficoMensal[];
  dadosGraficoMensalSeats: DadoGraficoMensalSeats[];
  dadosGraficoMensalDeals: DadoGraficoMensalDeals[];
}

export function DashboardMetaGlobal({
  metas,
  filtrosGlobal,
  kpisMetaGlobal,
  dadosGraficoMensalRevenue,
  dadosGraficoMensalSeats,
  dadosGraficoMensalDeals,
}: DashboardMetaGlobalProps) {
  const [graficoAtivo, setGraficoAtivo] = useState<GraficoTab>('revenue');

  const dadosGraficoAtivo = graficoAtivo === 'revenue'
    ? dadosGraficoMensalRevenue
    : graficoAtivo === 'seats'
    ? dadosGraficoMensalSeats
    : dadosGraficoMensalDeals;

  const configAtivo = GRAFICO_CONFIG[graficoAtivo];

  const mesAtualNumero = new Date().getMonth() + 1;
  const mesAtualLabel = MESES[mesAtualNumero - 1];
  const isAnoAtual = filtrosGlobal.ano === new Date().getFullYear();
  const mesesDecorridos = isAnoAtual ? mesAtualNumero : 12;

  const mediaMensalGrafico = useMemo(() => {
    const valores = dadosGraficoAtivo
      .slice(0, mesesDecorridos)
      .map((d) => Number((d as unknown as Record<string, unknown>)[configAtivo.dataKey]) || 0);
    const soma = valores.reduce((a, b) => a + b, 0);
    return mesesDecorridos > 0 ? soma / mesesDecorridos : 0;
  }, [dadosGraficoAtivo, mesesDecorridos, configAtivo.dataKey]);

  const dadosDetalheMensal = useMemo<DadoMesDetalhado[]>(() => {
    return dadosGraficoAtivo.map((d) => {
      const rec = d as unknown as Record<string, unknown>;
      return {
        mes: String(rec.mes),
        mesNumero: Number(rec.mesNumero),
        realizado: Number(rec[configAtivo.dataKey]) || 0,
        meta: Number(rec.meta) || 0,
      };
    });
  }, [dadosGraficoAtivo, configAtivo.dataKey]);

  const totaisDetalhe = useMemo(() => {
    const totalRealizado = dadosDetalheMensal.reduce((a, d) => a + d.realizado, 0);
    const totalMeta = dadosDetalheMensal.reduce((a, d) => a + d.meta, 0);
    const mesesComMeta = dadosDetalheMensal.filter(d => d.meta > 0).length;
    const mesesAtingidos = dadosDetalheMensal.filter(d => d.meta > 0 && d.realizado >= d.meta).length;
    return { totalRealizado, totalMeta, mesesComMeta, mesesAtingidos };
  }, [dadosDetalheMensal]);

  const percentAnual = useMemo(() => {
    const metaMap: Record<GraficoTab, number> = {
      revenue: kpisMetaGlobal.metaAnualRevenue,
      seats: kpisMetaGlobal.metaAnualSeats,
      deals: kpisMetaGlobal.metaAnualDeals,
    };
    const atualMap: Record<GraficoTab, number> = {
      revenue: kpisMetaGlobal.revenueAno,
      seats: kpisMetaGlobal.seatsAno,
      deals: kpisMetaGlobal.dealsAno,
    };
    const m = metaMap[graficoAtivo];
    return m > 0 ? Math.min((atualMap[graficoAtivo] / m) * 100, 999) : 0;
  }, [graficoAtivo, kpisMetaGlobal]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-primary-200/60 dark:border-primary-500/20 bg-gradient-to-r from-primary-50 to-white dark:from-primary-500/10 dark:to-gray-900/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-primary-700 dark:text-primary-300">Cultura e Meta Global</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Acompanhamento de receita, seats e deals — {filtrosGlobal.ano}
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
            {isAnoAtual && (
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-primary-500" />
                {mesesDecorridos}/12 meses
              </span>
            )}
            {kpisMetaGlobal.metaAnualRevenue > 0 && (
              <span>
                Meta anual: <span className={cn('font-semibold', percentAnual >= 100 ? 'text-emerald-600 dark:text-emerald-400' : percentAnual >= 70 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400')}>{formatNumber(percentAnual, 1)}%</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className={cn('grid gap-6', filtrosGlobal.mes > 0 ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1')}>
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-primary-500" />
            Meta Anual — {filtrosGlobal.ano}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <ProgressCard title="Receita" icon={DollarSign} atual={kpisMetaGlobal.revenueAno} meta={kpisMetaGlobal.metaAnualRevenue} formatValue={formatCurrency} color="emerald" compact={filtrosGlobal.mes > 0} />
            <ProgressCard title="Seats" icon={Layers} atual={kpisMetaGlobal.seatsAno} meta={kpisMetaGlobal.metaAnualSeats} formatValue={(v) => formatNumber(v, 1)} color="sky" compact={filtrosGlobal.mes > 0} />
            <ProgressCard title="Deals" icon={Briefcase} atual={kpisMetaGlobal.dealsAno} meta={kpisMetaGlobal.metaAnualDeals} formatValue={(v) => formatNumber(v)} color="violet" compact={filtrosGlobal.mes > 0} />
          </div>
        </div>

        {filtrosGlobal.mes > 0 && (
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-primary-500" />
              Meta Mensal — {MESES_COMPLETO[filtrosGlobal.mes - 1]} {filtrosGlobal.ano}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <ProgressCard title="Receita" icon={DollarSign} atual={kpisMetaGlobal.revenueMes} meta={kpisMetaGlobal.metaMensalRevenue} formatValue={formatCurrency} color="emerald" compact />
              <ProgressCard title="Seats" icon={Layers} atual={kpisMetaGlobal.seatsMes} meta={kpisMetaGlobal.metaMensalSeats} formatValue={(v) => formatNumber(v, 1)} color="sky" compact />
              <ProgressCard title="Deals" icon={Briefcase} atual={kpisMetaGlobal.dealsMes} meta={kpisMetaGlobal.metaMensalDeals} formatValue={(v) => formatNumber(v)} color="violet" compact />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Evolucao Mensal</p>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{configAtivo.labelRealizado} — Meta vs Realizado ({filtrosGlobal.ano})</CardTitle>
              <div className="flex gap-1">
                {GRAFICO_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setGraficoAtivo(tab.key)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      graficoAtivo === tab.key ? tab.activeClass : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/[0.06]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={dadosGraficoAtivo} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis dataKey="mes" stroke="var(--chart-axis)" fontSize={12} />
                <YAxis stroke="var(--chart-axis)" fontSize={12} tickFormatter={(v: number) => graficoAtivo === 'revenue' && v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)', borderRadius: '8px', color: 'var(--chart-tooltip-text)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value: number, name: string) => [configAtivo.formatFn(value), name === 'meta' ? 'Meta' : configAtivo.labelRealizado]}
                />
                <Legend formatter={(value: string) => (<span style={{ color: 'var(--chart-legend-text)', fontSize: '12px' }}>{value === 'meta' ? 'Meta' : configAtivo.labelRealizado}</span>)} />
                {mediaMensalGrafico > 0 && (
                  <ReferenceLine y={mediaMensalGrafico} stroke="#f59e0b" strokeDasharray="6 4" strokeWidth={1.5} label={{ value: `Média: ${configAtivo.formatFn(mediaMensalGrafico)}`, position: 'insideTopRight', fill: '#f59e0b', fontSize: 11 }} />
                )}
                <Bar dataKey="meta" fill="#6366f1" radius={[4, 4, 0, 0]} opacity={0.4} />
                <Bar dataKey={configAtivo.dataKey} fill={configAtivo.color} radius={[4, 4, 0, 0]}>
                  <LabelList dataKey={configAtivo.dataKey} position="top" offset={6} fill="var(--chart-axis)" fontSize={10} formatter={(v: number) => configAtivo.formatFn(v)} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {isAnoAtual && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-white/[0.04] text-xs text-gray-500 dark:text-gray-400">
                <span>Mês atual: <span className="font-medium text-gray-700 dark:text-gray-300">{mesAtualLabel}</span></span>
                <span>Média mensal: <span className="font-medium text-gray-700 dark:text-gray-300">{configAtivo.formatFn(mediaMensalGrafico)}</span></span>
                <span>Projeção anual: <span className="font-medium text-gray-700 dark:text-gray-300">{configAtivo.formatFn(mediaMensalGrafico * 12)}</span></span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Detalhamento Mensal — {configAtivo.labelRealizado}</p>
          {totaisDetalhe.mesesComMeta > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              <span className="font-medium text-gray-700 dark:text-gray-300">{totaisDetalhe.mesesAtingidos}</span>/{totaisDetalhe.mesesComMeta} meses com meta atingida
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {dadosDetalheMensal.map((dado) => (
            <MesCard
              key={dado.mesNumero}
              dado={dado}
              formatFn={configAtivo.formatFn}
              color={configAtivo.color}
              isAtual={isAnoAtual && dado.mesNumero === mesAtualNumero}
              isFuturo={isAnoAtual && dado.mesNumero > mesAtualNumero}
            />
          ))}
        </div>

        {totaisDetalhe.totalMeta > 0 && (
          <div className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-[11px] text-gray-400 mb-0.5">Total Realizado</p>
                  <p className="text-base font-bold text-gray-900 dark:text-gray-100">{configAtivo.formatFn(totaisDetalhe.totalRealizado)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 mb-0.5">Total Metas</p>
                  <p className="text-base font-bold text-gray-900 dark:text-gray-100">{configAtivo.formatFn(totaisDetalhe.totalMeta)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 mb-0.5">Atingimento</p>
                  <p className={cn('text-base font-bold', totaisDetalhe.totalRealizado >= totaisDetalhe.totalMeta ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400')}>
                    {formatNumber(totaisDetalhe.totalMeta > 0 ? (totaisDetalhe.totalRealizado / totaisDetalhe.totalMeta) * 100 : 0, 1)}%
                  </p>
                </div>
              </div>
              <div className="flex-1 min-w-[200px] max-w-[400px]">
                <div className="h-2.5 rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-700', totaisDetalhe.totalRealizado >= totaisDetalhe.totalMeta ? 'bg-emerald-500' : 'bg-amber-500')}
                    style={{ width: `${Math.min((totaisDetalhe.totalRealizado / totaisDetalhe.totalMeta) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
