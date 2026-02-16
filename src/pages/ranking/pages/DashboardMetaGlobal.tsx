import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Target,
  Layers,
  Briefcase,
  RotateCcw,
  Save,
  Loader2,
  CheckCircle,
  Settings2,
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
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Select, SelectItem } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { upsertSalesGoal } from '../services/api';
import type {
  MetaVendas,
  FiltrosMetaGlobal,
  KPIsMetaGlobal,
  DadoGraficoMensal,
  DadoGraficoMensalSeats,
} from '@/types';

const MESES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

const MESES_COMPLETO = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

// ============================================
// COMPONENTE: Barra de progresso com meta
// ============================================

function ProgressCard({
  title,
  icon: Icon,
  atual,
  meta,
  formatValue,
  color,
}: {
  title: string;
  icon: React.ElementType;
  atual: number;
  meta: number;
  formatValue: (v: number) => string;
  color: 'emerald' | 'sky' | 'violet';
}) {
  const percentual = meta > 0 ? Math.min((atual / meta) * 100, 100) : 0;
  const atingiu = meta > 0 && atual >= meta;

  const colorMap = {
    emerald: {
      bg: 'bg-emerald-500/10',
      icon: 'text-emerald-500',
      bar: 'bg-emerald-500',
      barBg: 'bg-emerald-500/10',
      text: 'text-emerald-600 dark:text-emerald-400',
      ring: 'ring-emerald-500/20',
    },
    sky: {
      bg: 'bg-sky-500/10',
      icon: 'text-sky-500',
      bar: 'bg-sky-500',
      barBg: 'bg-sky-500/10',
      text: 'text-sky-600 dark:text-sky-400',
      ring: 'ring-sky-500/20',
    },
    violet: {
      bg: 'bg-violet-500/10',
      icon: 'text-violet-500',
      bar: 'bg-violet-500',
      barBg: 'bg-violet-500/10',
      text: 'text-violet-600 dark:text-violet-400',
      ring: 'ring-violet-500/20',
    },
  };

  const c = colorMap[color];

  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50 p-4 transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${c.bg}`}>
            <Icon className={`h-4 w-4 ${c.icon}`} />
          </div>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</span>
        </div>
        {atingiu && (
          <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> Meta atingida!
          </span>
        )}
      </div>

      <div className="flex items-baseline justify-between mb-2">
        <span className={`text-xl font-bold ${c.text}`}>
          {formatValue(atual)}
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {meta > 0 ? `Meta: ${formatValue(meta)}` : 'Sem meta definida'}
        </span>
      </div>

      {meta > 0 && (
        <div className="space-y-1">
          <div className={`h-2 rounded-full ${c.barBg} overflow-hidden`}>
            <div
              className={`h-full rounded-full ${c.bar} transition-all duration-700 ease-out`}
              style={{ width: `${percentual}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-gray-400">
            <span>{formatNumber(percentual, 1)}%</span>
            <span>{formatValue(atual)} / {formatValue(meta)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// PROPS
// ============================================

interface DashboardMetaGlobalProps {
  metas: MetaVendas[];
  filtrosGlobal: FiltrosMetaGlobal;
  updateFiltroGlobal: <K extends keyof FiltrosMetaGlobal>(key: K, value: FiltrosMetaGlobal[K]) => void;
  resetFiltrosGlobal: () => void;
  anosDisponiveis: number[];
  kpisMetaGlobal: KPIsMetaGlobal;
  dadosGraficoMensalRevenue: DadoGraficoMensal[];
  dadosGraficoMensalSeats: DadoGraficoMensalSeats[];
  onMetaSaved: () => void;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function DashboardMetaGlobal({
  metas,
  filtrosGlobal,
  updateFiltroGlobal,
  resetFiltrosGlobal,
  anosDisponiveis,
  kpisMetaGlobal,
  dadosGraficoMensalRevenue,
  dadosGraficoMensalSeats,
  onMetaSaved,
}: DashboardMetaGlobalProps) {
  // ============================================
  // ESTADO DO EDITOR DE METAS
  // ============================================
  const [showMetaEditor, setShowMetaEditor] = useState(false);
  const [savingMeta, setSavingMeta] = useState(false);
  const [metaSaved, setMetaSaved] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Inputs das metas (6 campos)
  const [metaInputs, setMetaInputs] = useState({
    monthlyRevenue: '',
    annualRevenue: '',
    monthlySeats: '',
    annualSeats: '',
    monthlyDeals: '',
    annualDeals: '',
  });

  // Preencher inputs quando muda o mês/ano ou as metas carregam
  useEffect(() => {
    const metaAtual = metas.find(
      m => m.year === filtrosGlobal.ano && m.month === filtrosGlobal.mes
    );
    const metaAno = metas.find(m => m.year === filtrosGlobal.ano);

    setMetaInputs({
      monthlyRevenue: metaAtual?.monthlyGoal ? String(metaAtual.monthlyGoal) : '',
      annualRevenue: metaAno?.annualGoal ? String(metaAno.annualGoal) : '',
      monthlySeats: metaAtual?.monthlyGoalSeats ? String(metaAtual.monthlyGoalSeats) : '',
      annualSeats: metaAno?.annualGoalSeats ? String(metaAno.annualGoalSeats) : '',
      monthlyDeals: metaAtual?.monthlyGoalDeals ? String(metaAtual.monthlyGoalDeals) : '',
      annualDeals: metaAno?.annualGoalDeals ? String(metaAno.annualGoalDeals) : '',
    });
  }, [metas, filtrosGlobal.ano, filtrosGlobal.mes]);

  const handleSaveMeta = useCallback(async () => {
    if (filtrosGlobal.mes === 0) return;

    const parseVal = (v: string) => parseFloat(v.replace(',', '.')) || 0;

    setSavingMeta(true);
    setMetaSaved(false);
    try {
      await upsertSalesGoal(filtrosGlobal.ano, filtrosGlobal.mes, {
        monthlyGoal: parseVal(metaInputs.monthlyRevenue),
        annualGoal: parseVal(metaInputs.annualRevenue),
        monthlyGoalSeats: parseVal(metaInputs.monthlySeats),
        annualGoalSeats: parseVal(metaInputs.annualSeats),
        monthlyGoalDeals: parseVal(metaInputs.monthlyDeals),
        annualGoalDeals: parseVal(metaInputs.annualDeals),
      });
      setMetaSaved(true);
      onMetaSaved();
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => setMetaSaved(false), 3000);
    } catch (err) {
      console.error('Erro ao salvar meta:', err);
    } finally {
      setSavingMeta(false);
    }
  }, [filtrosGlobal.ano, filtrosGlobal.mes, metaInputs, onMetaSaved]);

  const hasActiveFilters = useMemo(() => {
    const anoAtual = new Date().getFullYear();
    const mesAtual = new Date().getMonth() + 1;
    return filtrosGlobal.ano !== anoAtual || filtrosGlobal.mes !== mesAtual;
  }, [filtrosGlobal]);

  // Gráfico ativo
  const [graficoAtivo, setGraficoAtivo] = useState<'revenue' | 'seats'>('revenue');

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card className="!p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Ano</label>
            <Select
              value={String(filtrosGlobal.ano)}
              onValueChange={(v) => updateFiltroGlobal('ano', Number(v))}
              placeholder="Ano"
            >
              {anosDisponiveis.map((a) => (
                <SelectItem key={a} value={String(a)}>{a}</SelectItem>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Mês</label>
            <Select
              value={String(filtrosGlobal.mes)}
              onValueChange={(v) => updateFiltroGlobal('mes', Number(v))}
              placeholder="Mês"
            >
              <SelectItem value="0">Todos</SelectItem>
              {MESES.map((m, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
              ))}
            </Select>
          </div>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={resetFiltrosGlobal} className="mb-0.5">
              <RotateCcw className="h-4 w-4 mr-1.5" />
              Limpar
            </Button>
          )}

          <div className="ml-auto">
            <Button
              variant={showMetaEditor ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setShowMetaEditor(prev => !prev)}
              title="Definir metas"
            >
              <Settings2 className="h-3.5 w-3.5 mr-1.5" />
              <span className="text-xs">Definir Metas</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Editor de Metas */}
      {showMetaEditor && (
        <Card className="!p-4 border-primary-200 dark:border-primary-500/30 bg-gradient-to-r from-primary-50/50 dark:from-primary-500/5 to-transparent">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Definir Metas — {filtrosGlobal.mes > 0 ? `${MESES_COMPLETO[filtrosGlobal.mes - 1]} ${filtrosGlobal.ano}` : 'Selecione um mês'}
              </span>
            </div>

            {filtrosGlobal.mes === 0 ? (
              <span className="text-xs text-amber-500 dark:text-amber-400">
                Selecione um mês específico para editar as metas
              </span>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Receita */}
                  <div className="space-y-2 p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10">
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <DollarSign className="h-3 w-3" /> Receita (R$)
                    </span>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] text-gray-500">Meta Mensal</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={metaInputs.monthlyRevenue}
                        onChange={(e) => setMetaInputs(p => ({ ...p, monthlyRevenue: e.target.value }))}
                        placeholder="0,00"
                        className="h-8 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-gray-900 px-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] text-gray-500">Meta Anual</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={metaInputs.annualRevenue}
                        onChange={(e) => setMetaInputs(p => ({ ...p, annualRevenue: e.target.value }))}
                        placeholder="0,00"
                        className="h-8 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-gray-900 px-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      />
                    </div>
                  </div>

                  {/* Seats */}
                  <div className="space-y-2 p-3 rounded-lg bg-sky-50/50 dark:bg-sky-500/5 border border-sky-100 dark:border-sky-500/10">
                    <span className="text-xs font-semibold text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
                      <Layers className="h-3 w-3" /> Seats (posições)
                    </span>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] text-gray-500">Meta Mensal</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={metaInputs.monthlySeats}
                        onChange={(e) => setMetaInputs(p => ({ ...p, monthlySeats: e.target.value }))}
                        placeholder="0"
                        className="h-8 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-gray-900 px-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] text-gray-500">Meta Anual</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={metaInputs.annualSeats}
                        onChange={(e) => setMetaInputs(p => ({ ...p, annualSeats: e.target.value }))}
                        placeholder="0"
                        className="h-8 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-gray-900 px-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                      />
                    </div>
                  </div>

                  {/* Deals */}
                  <div className="space-y-2 p-3 rounded-lg bg-violet-50/50 dark:bg-violet-500/5 border border-violet-100 dark:border-violet-500/10">
                    <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 flex items-center gap-1.5">
                      <Briefcase className="h-3 w-3" /> Deals (negócios)
                    </span>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] text-gray-500">Meta Mensal</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={metaInputs.monthlyDeals}
                        onChange={(e) => setMetaInputs(p => ({ ...p, monthlyDeals: e.target.value }))}
                        placeholder="0"
                        className="h-8 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-gray-900 px-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] text-gray-500">Meta Anual</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={metaInputs.annualDeals}
                        onChange={(e) => setMetaInputs(p => ({ ...p, annualDeals: e.target.value }))}
                        placeholder="0"
                        className="h-8 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-gray-900 px-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSaveMeta}
                    disabled={savingMeta}
                  >
                    {savingMeta ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : metaSaved ? (
                      <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                    ) : (
                      <Save className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    <span className="text-xs">{metaSaved ? 'Salvo!' : 'Salvar Metas'}</span>
                  </Button>
                </div>
              </>
            )}
          </div>
        </Card>
      )}

      {/* === SEÇÃO: META ANUAL === */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <Target className="h-4 w-4 text-primary-500" />
          Meta Anual — {filtrosGlobal.ano}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ProgressCard
            title="Receita"
            icon={DollarSign}
            atual={kpisMetaGlobal.revenueAno}
            meta={kpisMetaGlobal.metaAnualRevenue}
            formatValue={formatCurrency}
            color="emerald"
          />
          <ProgressCard
            title="Seats"
            icon={Layers}
            atual={kpisMetaGlobal.seatsAno}
            meta={kpisMetaGlobal.metaAnualSeats}
            formatValue={(v) => formatNumber(v, 1)}
            color="sky"
          />
          <ProgressCard
            title="Deals"
            icon={Briefcase}
            atual={kpisMetaGlobal.dealsAno}
            meta={kpisMetaGlobal.metaAnualDeals}
            formatValue={(v) => formatNumber(v)}
            color="violet"
          />
        </div>
      </div>

      {/* === SEÇÃO: META MENSAL === */}
      {filtrosGlobal.mes > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary-500" />
            Meta Mensal — {MESES_COMPLETO[filtrosGlobal.mes - 1]} {filtrosGlobal.ano}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ProgressCard
              title="Receita"
              icon={DollarSign}
              atual={kpisMetaGlobal.revenueMes}
              meta={kpisMetaGlobal.metaMensalRevenue}
              formatValue={formatCurrency}
              color="emerald"
            />
            <ProgressCard
              title="Seats"
              icon={Layers}
              atual={kpisMetaGlobal.seatsMes}
              meta={kpisMetaGlobal.metaMensalSeats}
              formatValue={(v) => formatNumber(v, 1)}
              color="sky"
            />
            <ProgressCard
              title="Deals"
              icon={Briefcase}
              atual={kpisMetaGlobal.dealsMes}
              meta={kpisMetaGlobal.metaMensalDeals}
              formatValue={(v) => formatNumber(v)}
              color="violet"
            />
          </div>
        </div>
      )}

      {/* === GRÁFICO MENSAL === */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {graficoAtivo === 'revenue' ? 'Receita' : 'Seats'} — Meta vs Realizado ({filtrosGlobal.ano})
            </CardTitle>
            <div className="flex gap-1">
              <button
                onClick={() => setGraficoAtivo('revenue')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  graficoAtivo === 'revenue'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/[0.06]'
                }`}
              >
                Receita
              </button>
              <button
                onClick={() => setGraficoAtivo('seats')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  graficoAtivo === 'seats'
                    ? 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400'
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/[0.06]'
                }`}
              >
                Seats
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {graficoAtivo === 'revenue' ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={dadosGraficoMensalRevenue} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis dataKey="mes" stroke="var(--chart-axis)" fontSize={12} />
                <YAxis
                  stroke="var(--chart-axis)"
                  fontSize={12}
                  tickFormatter={(v: number) =>
                    v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                  }
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
                    formatCurrency(value),
                    name === 'realizado' ? 'Realizado' : 'Meta',
                  ]}
                />
                <Legend
                  formatter={(value: string) => (
                    <span style={{ color: 'var(--chart-legend-text)', fontSize: '12px' }}>
                      {value === 'realizado' ? 'Realizado' : 'Meta'}
                    </span>
                  )}
                />
                <Bar dataKey="meta" fill="#6366f1" radius={[4, 4, 0, 0]} opacity={0.4} />
                <Bar dataKey="realizado" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={dadosGraficoMensalSeats} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis dataKey="mes" stroke="var(--chart-axis)" fontSize={12} />
                <YAxis stroke="var(--chart-axis)" fontSize={12} />
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
                    name === 'seats' ? 'Seats' : 'Meta',
                  ]}
                />
                <Legend
                  formatter={(value: string) => (
                    <span style={{ color: 'var(--chart-legend-text)', fontSize: '12px' }}>
                      {value === 'seats' ? 'Seats Realizados' : 'Meta'}
                    </span>
                  )}
                />
                <Bar dataKey="meta" fill="#6366f1" radius={[4, 4, 0, 0]} opacity={0.4} />
                <Bar dataKey="seats" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
