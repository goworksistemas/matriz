import { AlertTriangle, Clock3, CheckCircle2, ClipboardList, UserCog, CalendarX, Layers3, Building2, ExternalLink, XCircle, PauseCircle, TrendingUp, Users2, Activity, MessageSquare, Timer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { BarChartComponent } from '@/components/charts/BarChartComponent';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { cn } from '@/lib/utils';
import type { DadosGrafico } from '@/types';
import { CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, LabelList, Cell, Legend, PieChart, Pie } from 'recharts';
import type { FiltrosNotion, FiltroCard, InsightNotion, KPIsNotion, SerieDemandaCapacidade, PerformanceAgente, InteracaoUsuario, GranularidadeTempo } from '../hooks/useNotionFilters';
import type { TarefaProcessada } from '../services/api';
import { useCallback, useState, type ReactNode } from 'react';

interface PainelExecutivoProps {
  kpis: KPIsNotion;
  insights: InsightNotion;
  filtros: FiltrosNotion;
  onFiltroChange: <K extends keyof FiltrosNotion>(key: K, value: FiltrosNotion[K]) => void;
  dadosGraficoStatus: DadosGrafico[];
  dadosGraficoPrioridade: DadosGrafico[];
  dadosGraficoExecutores: DadosGrafico[];
  dadosGraficoDepartamento: DadosGrafico[];
  dadosGraficoDepartamentosCriticos: DadosGrafico[];
  serieDemandaCapacidade: SerieDemandaCapacidade[];
  gargalosCriticos: TarefaProcessada[];
  topTarefasCriticas: TarefaProcessada[];
  performancePorAgente: PerformanceAgente[];
  interacoesPorUsuario: InteracaoUsuario[];
  insightsComentarios: {
    totalComentarios: number;
    tarefasComComentario: number;
    tarefasSemComentario: number;
    percentTarefasSemComentario: number;
    mediaComentariosPorTarefa: number;
  };
}


/* ------------------------------------------------------------------ */
/*  Componente KpiCard reutilizável                                    */
/* ------------------------------------------------------------------ */

type KpiColor = 'primary' | 'red' | 'emerald' | 'amber' | 'sky' | 'rose' | 'indigo' | 'violet';

const KPI_COLOR_MAP: Record<KpiColor, { hover: string; active: string; inactive: string; ring: string }> = {
  primary: {
    hover: 'hover:border-primary-300 dark:hover:border-primary-500/40',
    active: 'border-primary-500 ring-2 ring-primary-500/30 bg-primary-50/50 dark:bg-primary-500/10',
    inactive: 'border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50',
    ring: 'focus:ring-primary-500',
  },
  red: {
    hover: 'hover:border-red-300 dark:hover:border-red-500/40',
    active: 'border-red-500 ring-2 ring-red-500/30 bg-red-50/50 dark:bg-red-500/10',
    inactive: 'border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50',
    ring: 'focus:ring-red-500',
  },
  emerald: {
    hover: 'hover:border-emerald-300 dark:hover:border-emerald-500/40',
    active: 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/10',
    inactive: 'border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50',
    ring: 'focus:ring-emerald-500',
  },
  amber: {
    hover: 'hover:border-amber-300 dark:hover:border-amber-500/40',
    active: 'border-amber-500 ring-2 ring-amber-500/30 bg-amber-50/50 dark:bg-amber-500/10',
    inactive: 'border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50',
    ring: 'focus:ring-amber-500',
  },
  sky: {
    hover: 'hover:border-sky-300 dark:hover:border-sky-500/40',
    active: 'border-sky-500 ring-2 ring-sky-500/30 bg-sky-50/50 dark:bg-sky-500/10',
    inactive: 'border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50',
    ring: 'focus:ring-sky-500',
  },
  rose: {
    hover: 'hover:border-rose-300 dark:hover:border-rose-500/40',
    active: 'border-rose-500 ring-2 ring-rose-500/30 bg-rose-50/50 dark:bg-rose-500/10',
    inactive: 'border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50',
    ring: 'focus:ring-rose-500',
  },
  indigo: {
    hover: 'hover:border-indigo-300 dark:hover:border-indigo-500/40',
    active: 'border-indigo-500 ring-2 ring-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-500/10',
    inactive: 'border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50',
    ring: 'focus:ring-indigo-500',
  },
  violet: {
    hover: 'hover:border-violet-300 dark:hover:border-violet-500/40',
    active: 'border-violet-500 ring-2 ring-violet-500/30 bg-violet-50/50 dark:bg-violet-500/10',
    inactive: 'border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50',
    ring: 'focus:ring-violet-500',
  },
};

interface KpiCardProps {
  filtroCard: FiltroCard;
  cardId: FiltroCard;
  onClick: (card: FiltroCard) => void;
  color: KpiColor;
  icon: ReactNode;
  label: string;
  value: string | number;
  valueClassName?: string;
}

function KpiCard({ filtroCard, cardId, onClick, color, icon, label, value, valueClassName }: KpiCardProps) {
  const isActive = filtroCard === cardId;
  const colors = KPI_COLOR_MAP[color];
  return (
    <button
      type="button"
      onClick={() => onClick(cardId)}
      className={cn(
        'rounded-lg border text-left transition-all cursor-pointer hover:shadow-sm py-2.5 px-3',
        colors.hover,
        colors.ring,
        'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-white dark:focus:ring-offset-gray-900',
        isActive ? colors.active : colors.inactive,
      )}
    >
      <div className="flex items-center gap-1.5 text-gray-500 text-[10px] leading-tight mb-0.5">{icon} {label}</div>
      <div className={cn('text-lg font-bold', valueClassName ?? 'text-gray-900 dark:text-gray-100')}>
        {value}
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function corPrioridade(prioridade: string): string {
  if (prioridade === 'Urgente') return '#ef4444';
  if (prioridade === 'Importante') return '#f59e0b';
  if (prioridade === 'Media') return '#06b6d4';
  if (prioridade === 'Baixa') return '#10b981';
  return '#6b7280';
}

const tooltipStyle = {
  backgroundColor: 'var(--chart-tooltip-bg)',
  border: '1px solid var(--chart-tooltip-border)',
  borderRadius: '8px',
  color: 'var(--chart-tooltip-text)',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
};

function EmptyState({ children, height = 280 }: { children: string; height?: number }) {
  return (
    <div className="flex items-center justify-center text-sm text-gray-500 dark:text-gray-400" style={{ height }}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  PainelExecutivo                                                    */
/* ------------------------------------------------------------------ */

export function PainelExecutivo({
  kpis,
  insights,
  filtros,
  onFiltroChange,
  dadosGraficoStatus,
  dadosGraficoPrioridade,
  dadosGraficoExecutores,
  dadosGraficoDepartamento,
  dadosGraficoDepartamentosCriticos,
  serieDemandaCapacidade,
  gargalosCriticos,
  topTarefasCriticas,
  performancePorAgente,
  interacoesPorUsuario,
  insightsComentarios,
}: PainelExecutivoProps) {
  const [tab, setTab] = useState('visao-geral');
  const [expandirDepartamentos, setExpandirDepartamentos] = useState(false);

  const toggleFiltro = useCallback(<K extends 'status' | 'prioridade' | 'departamento' | 'executor'>(key: K, value: string) => {
    const current = filtros[key] as string[];
    const novoValor = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    onFiltroChange(key, novoValor as FiltrosNotion[K]);
  }, [filtros, onFiltroChange]);

  const handleFiltroStatus = useCallback((value: string) => {
    if (value === 'Outros') return;
    toggleFiltro('status', value);
  }, [toggleFiltro]);

  const handleCardClick = useCallback((card: FiltroCard) => {
    const novoValor = filtros.filtroCard === card ? null : card;
    onFiltroChange('filtroCard', novoValor);
  }, [filtros.filtroCard, onFiltroChange]);

  const dadosTempoMedioPorPrioridade = insights.leadTimePorPrioridade
    .filter((item) => item.totalTarefas > 0)
    .map((item) => ({
      ...item,
      value: item.mediaDias,
      name: item.prioridade,
      detalhe: `${item.concluidasComData} de ${item.totalTarefas} concluídas com data`,
    }));

  return (
    <div className="space-y-6">

      {/* ============================================================ */}
      {/*  Painel de Resumo — números de impacto                       */}
      {/* ============================================================ */}
      <div className="rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/60 overflow-hidden">
        {/* Faixa superior: Total + métricas-chave */}
        <div className="grid grid-cols-2 lg:grid-cols-5 divide-x divide-gray-100 dark:divide-white/[0.04]">
          {/* Total */}
          <div className="col-span-2 lg:col-span-1 p-5 bg-gradient-to-br from-primary-50 to-white dark:from-primary-500/10 dark:to-gray-900/60">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Total de Tarefas</p>
            <p className="text-4xl font-extrabold text-gray-900 dark:text-gray-50">{kpis.totalTarefas}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {kpis.tarefasAtivas} ativas · {kpis.tarefasFechadas} encerradas
            </p>
          </div>
          {/* Ativas */}
          <div className="p-5">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Ativas</p>
            <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">{kpis.tarefasAtivas}</p>
            <p className="text-xs text-gray-400 mt-1">em execução agora</p>
          </div>
          {/* Concluídas */}
          <div className="p-5">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Concluídas</p>
            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{kpis.concluidas}</p>
            <p className="text-xs text-gray-400 mt-1">{kpis.percentConcluidas}% do total</p>
          </div>
          {/* Atrasadas */}
          <div className="p-5">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Atrasadas</p>
            <p className={cn(
              'text-3xl font-bold',
              kpis.vencidas > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-300 dark:text-gray-600',
            )}>{kpis.vencidas}</p>
            <p className="text-xs text-gray-400 mt-1">
              {insights.riscoGeral > 0 ? `${insights.riscoGeral}% das ativas` : 'nenhuma'}
            </p>
          </div>
          {/* Tempo médio */}
          <div className="p-5">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tempo Médio</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {insights.leadTimeMedioDias > 0 ? `${insights.leadTimeMedioDias}d` : '--'}
            </p>
            <p className="text-xs text-gray-400 mt-1">para concluir uma tarefa</p>
          </div>
        </div>

      </div>

      {/* ============================================================ */}
      {/*  Cards de filtro rápido                                      */}
      {/* ============================================================ */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-9 gap-2">
        <KpiCard filtroCard={filtros.filtroCard} cardId="ativas" onClick={handleCardClick} color="primary"
          icon={<ClipboardList className="h-3.5 w-3.5 text-primary-500" />}
          label="Ativas" value={kpis.tarefasAtivas} />
        <KpiCard filtroCard={filtros.filtroCard} cardId="vencidas" onClick={handleCardClick} color="red"
          icon={<AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
          label="Atrasadas" value={kpis.vencidas} valueClassName="text-red-600 dark:text-red-400" />
        <KpiCard filtroCard={filtros.filtroCard} cardId="vence_hoje" onClick={handleCardClick} color="amber"
          icon={<Clock3 className="h-3.5 w-3.5 text-amber-500" />}
          label="Vencem Hoje" value={kpis.venceHoje} valueClassName="text-amber-600 dark:text-amber-400" />
        <KpiCard filtroCard={filtros.filtroCard} cardId="concluidas" onClick={handleCardClick} color="emerald"
          icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
          label="Concluídas" value={kpis.concluidas} valueClassName="text-emerald-600 dark:text-emerald-400" />
        <KpiCard filtroCard={filtros.filtroCard} cardId="conclusao" onClick={handleCardClick} color="emerald"
          icon={<TrendingUp className="h-3.5 w-3.5 text-emerald-500" />}
          label="Conclusão" value={`${kpis.percentConcluidas}%`} valueClassName="text-emerald-600 dark:text-emerald-400" />
        <KpiCard filtroCard={filtros.filtroCard} cardId="canceladas" onClick={handleCardClick} color="rose"
          icon={<XCircle className="h-3.5 w-3.5 text-rose-500" />}
          label="Canceladas" value={kpis.canceladas} valueClassName="text-rose-600 dark:text-rose-400" />
        <KpiCard filtroCard={filtros.filtroCard} cardId="stand_by" onClick={handleCardClick} color="indigo"
          icon={<PauseCircle className="h-3.5 w-3.5 text-indigo-500" />}
          label="Pausadas" value={kpis.emStandBy} valueClassName="text-indigo-600 dark:text-indigo-400" />
        <KpiCard filtroCard={filtros.filtroCard} cardId="sem_prazo" onClick={handleCardClick} color="violet"
          icon={<CalendarX className="h-3.5 w-3.5 text-violet-500" />}
          label="Sem Prazo" value={kpis.semData} valueClassName="text-violet-600 dark:text-violet-400" />
        <KpiCard filtroCard={filtros.filtroCard} cardId="sem_dono" onClick={handleCardClick} color="sky"
          icon={<UserCog className="h-3.5 w-3.5 text-sky-500" />}
          label="Sem Dono" value={insights.tarefasSemResponsavel} valueClassName="text-sky-600 dark:text-sky-400" />
      </div>

      {/* ============================================================ */}
      {/*  Tabs                                                         */}
      {/* ============================================================ */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="equipe">Equipe</TabsTrigger>
          <TabsTrigger value="prazos">Prazos e Alertas</TabsTrigger>
        </TabsList>

        {/* -------------------------------------------------------------- */}
        {/*  Tab: Visão Geral                                               */}
        {/* -------------------------------------------------------------- */}
        <TabsContent value="visao-geral">
          <div className="space-y-6">

            {/* Evolução mensal — area chart moderno com rótulos e seletor de granularidade */}
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="h-4 w-4 text-primary-500" /> Tarefas Criadas vs Finalizadas
                    {filtros.periodoSelecionado && (
                      <span className="text-xs font-normal text-primary-600 bg-primary-50 dark:bg-primary-500/10 px-2 py-0.5 rounded-full">
                        Filtrando período: {serieDemandaCapacidade.find(s => s.chave === filtros.periodoSelecionado)?.label || filtros.periodoSelecionado}
                      </span>
                    )}
                  </CardTitle>
                  
                  <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                    {(['dia', 'semana', 'mes', 'trimestre', 'ano'] as GranularidadeTempo[]).map((g) => (
                      <button
                        key={g}
                        onClick={() => onFiltroChange('granularidade', g)}
                        className={cn(
                          'px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all',
                          filtros.granularidade === g
                            ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        )}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {serieDemandaCapacidade.length === 0 ? (
                  <EmptyState>Sem dados suficientes.</EmptyState>
                ) : (
                  <ResponsiveContainer width="100%" height={340}>
                    <BarChart
                      data={serieDemandaCapacidade}
                      margin={{ top: 20, right: 12, left: 4, bottom: 60 }}
                      onClick={(data) => {
                        if (data?.activePayload?.[0]) {
                          const chave = data.activePayload[0].payload.chave;
                          onFiltroChange('periodoSelecionado', filtros.periodoSelecionado === chave ? null : chave);
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                      <XAxis
                        dataKey="label"
                        stroke="var(--chart-axis)"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: 'var(--chart-grid)' }}
                        tick={(tickProps: any) => {
                          const { x, y, payload, index } = tickProps;
                          const d = serieDemandaCapacidade.find(s => s.label === payload.value);
                          const vc = d?.variacaoCriadas;
                          const vf = d?.variacaoConcluidas;
                          const fmtVar = (v: number | null | undefined) => {
                            if (v == null) return '—';
                            const arrow = v > 0 ? '▲' : v < 0 ? '▼' : '';
                            return `${arrow} ${v > 0 ? '+' : ''}${v}%`;
                          };
                          const varColor = (v: number | null | undefined) => {
                            if (v == null) return '#9ca3af';
                            return v > 0 ? '#16a34a' : v < 0 ? '#dc2626' : '#9ca3af';
                          };
                          return (
                            <g transform={`translate(${x},${y})`}>
                              <text x={0} y={0} dy={14} textAnchor="middle" fill="var(--chart-axis)" fontSize={11} fontWeight={600}>{payload.value}</text>
                              <line x1={-20} y1={24} x2={20} y2={24} stroke="var(--chart-grid)" strokeWidth={1} />
                              <text x={0} y={0} dy={37} textAnchor="middle" fill={varColor(vc)} fontSize={11} fontWeight={700}>{fmtVar(vc)}</text>
                              <text x={0} y={0} dy={52} textAnchor="middle" fill={varColor(vf)} fontSize={11} fontWeight={700}>{fmtVar(vf)}</text>
                              {index === 0 && (
                                <>
                                  <text x={-x + 4} y={0} dy={37} textAnchor="start" fill="#b45309" fontSize={9} fontWeight={700}>Criadas</text>
                                  <text x={-x + 4} y={0} dy={52} textAnchor="start" fill="#047857" fontSize={9} fontWeight={700}>Finaliz.</text>
                                </>
                              )}
                            </g>
                          );
                        }}
                      />
                      <YAxis stroke="var(--chart-axis)" fontSize={11} tickLine={false} axisLine={false} width={40} />
                      <Tooltip
                        cursor={{ fill: 'var(--chart-cursor)' }}
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null;
                          const d = serieDemandaCapacidade.find(s => s.label === label);
                          const fmtVar = (v: number | null | undefined) => {
                            if (v == null) return null;
                            const sinal = v > 0 ? '+' : '';
                            const cor = v > 0 ? '#16a34a' : v < 0 ? '#dc2626' : '#6b7280';
                            return <span style={{ color: cor, fontWeight: 600 }}>{sinal}{v}%</span>;
                          };
                          return (
                            <div style={{ ...tooltipStyle, padding: '8px 12px', fontSize: 12 }}>
                              <p style={{ fontWeight: 700, marginBottom: 4 }}>{label}</p>
                              {payload.map((p: any) => (
                                <p key={p.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                                  <span style={{ color: p.color }}>{p.name}</span>
                                  <strong>{p.value}</strong>
                                </p>
                              ))}
                              {(d?.variacaoCriadas != null || d?.variacaoConcluidas != null) && (
                                <div style={{ borderTop: '1px dashed #e5e7eb', marginTop: 4, paddingTop: 4, fontSize: 11 }}>
                                  {d?.variacaoCriadas != null && <p style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}><span style={{ color: '#b45309' }}>Var. Criadas</span>{fmtVar(d.variacaoCriadas)}</p>}
                                  {d?.variacaoConcluidas != null && <p style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}><span style={{ color: '#047857' }}>Var. Finalizadas</span>{fmtVar(d.variacaoConcluidas)}</p>}
                                </div>
                              )}
                            </div>
                          );
                        }}
                      />
                      <Legend
                        verticalAlign="top"
                        align="right"
                        iconType="rect"
                        wrapperStyle={{ paddingBottom: 8, fontSize: '11px' }}
                      />
                      <Bar dataKey="criadas" name="Criadas" fill="#f59e0b" fillOpacity={0.85} radius={[3, 3, 0, 0]} barSize={28}>
                        <LabelList dataKey="criadas" position="top" offset={6} fill="#b45309" fontSize={12} fontWeight={700} />
                      </Bar>
                      <Bar dataKey="concluidas" name="Finalizadas" fill="#10b981" fillOpacity={0.85} radius={[3, 3, 0, 0]} barSize={28}>
                        <LabelList dataKey="concluidas" position="top" offset={6} fill="#047857" fontSize={12} fontWeight={700} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
                {filtros.periodoSelecionado && (
                  <div className="mt-3 flex justify-center">
                    <button
                      onClick={() => onFiltroChange('periodoSelecionado', null)}
                      className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
                    >
                      Limpar filtro de período ✕
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status + Prioridade — lado a lado */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Layers3 className="h-4 w-4 text-primary-500" /> Por Status
                    {filtros.status.length > 0 && <span className="ml-2 text-xs font-normal text-primary-500">({filtros.status.join(', ')})</span>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <BarChartComponent data={dadosGraficoStatus} height={260} layout="vertical" onItemClick={handleFiltroStatus} activeItems={filtros.status.length > 0 ? filtros.status : undefined} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ClipboardList className="h-4 w-4 text-primary-500" /> Por Prioridade
                    {filtros.prioridade.length > 0 && <span className="ml-2 text-xs font-normal text-primary-500">({filtros.prioridade.join(', ')})</span>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={dadosGraficoPrioridade}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        nameKey="name"
                        onClick={(entry) => toggleFiltro('prioridade', entry.name)}
                        style={{ cursor: 'pointer' }}
                        label={({ cx, cy, midAngle, innerRadius, outerRadius, value }) => {
                          const RADIAN = Math.PI / 180;
                          const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                          const x = cx + radius * Math.cos(-midAngle * RADIAN);
                          const y = cy + radius * Math.sin(-midAngle * RADIAN);
                          return (
                            <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={700}>
                              {value}
                            </text>
                          );
                        }}
                        labelLine={false}
                      >
                        {dadosGraficoPrioridade.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={corPrioridade(entry.name)} 
                            fillOpacity={filtros.prioridade.length > 0 && !filtros.prioridade.includes(entry.name) ? 0.3 : 1}
                          />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{value}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Departamento — top 10, o resto agrupado (expansível) */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Building2 className="h-4 w-4 text-primary-500" /> Tarefas por Departamento
                    {filtros.departamento.length > 0 && <span className="ml-2 text-xs font-normal text-primary-500">({filtros.departamento.join(', ')})</span>}
                  </CardTitle>
                  {dadosGraficoDepartamento.length > 10 && (
                    <button
                      onClick={() => setExpandirDepartamentos(!expandirDepartamentos)}
                      className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 underline-offset-4 hover:underline"
                    >
                      {expandirDepartamentos ? 'Recolher' : `Ver todos os ${dadosGraficoDepartamento.length}`}
                    </button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  let dados = dadosGraficoDepartamento;
                  if (!expandirDepartamentos && dadosGraficoDepartamento.length > 10) {
                    const top = dadosGraficoDepartamento.slice(0, 10);
                    const resto = dadosGraficoDepartamento.slice(10);
                    dados = [...top, { name: `Outros (${resto.length})`, value: resto.reduce((s, d) => s + d.value, 0) }];
                  }
                  
                  return (
                    <BarChartComponent
                      data={dados}
                      height={Math.max(260, dados.length * 36)}
                      layout="vertical"
                      categoryAxisWidth={200}
                      categoryLabelMaxChars={28}
                      onItemClick={(name) => {
                        if (name.startsWith('Outros')) {
                          setExpandirDepartamentos(true);
                        } else {
                          toggleFiltro('departamento', name);
                        }
                      }}
                      activeItems={filtros.departamento.length > 0 ? filtros.departamento : undefined}
                    />
                  );
                })()}
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        {/* -------------------------------------------------------------- */}
        {/*  Tab: Equipe                                                    */}
        {/* -------------------------------------------------------------- */}
        <TabsContent value="equipe">
          <div className="space-y-6">

            {/* Tabela principal — toda a informação relevante por pessoa */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users2 className="h-4 w-4 text-primary-500" /> Desempenho por Pessoa
                </CardTitle>
              </CardHeader>
              <CardContent>
                {performancePorAgente.length === 0 ? (
                  <EmptyState height={80}>Sem dados no filtro atual.</EmptyState>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-white/[0.06] text-xs text-gray-500 dark:text-gray-400">
                          <th className="text-left py-2.5 pr-4 font-medium">Responsável</th>
                          <th className="text-right py-2.5 px-3 font-medium">Concluídas</th>
                          <th className="text-right py-2.5 px-3 font-medium">Em Andamento</th>
                          <th className="text-right py-2.5 px-3 font-medium">Tempo Médio</th>
                          <th className="text-right py-2.5 px-3 font-medium">No Prazo</th>
                          <th className="text-right py-2.5 px-3 font-medium">Comentários</th>
                        </tr>
                      </thead>
                      <tbody>
                        {performancePorAgente.map((ag) => (
                          <tr key={ag.nome} className="border-b border-gray-100 dark:border-white/[0.04] hover:bg-gray-50 dark:hover:bg-gray-800/30">
                            <td className="py-2.5 pr-4 font-medium text-gray-900 dark:text-gray-100 max-w-[260px] truncate">{ag.nome}</td>
                            <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400 font-semibold">{ag.concluidas}</td>
                            <td className="py-2.5 px-3 text-right text-amber-600 dark:text-amber-400">{ag.ativas}</td>
                            <td className="py-2.5 px-3 text-right">{ag.tempoMedioDias > 0 ? `${ag.tempoMedioDias}d` : '--'}</td>
                            <td className="py-2.5 px-3 text-right">
                              <span className={cn(
                                'font-medium',
                                ag.taxaNoPrazo >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
                                ag.taxaNoPrazo >= 50 ? 'text-amber-600 dark:text-amber-400' :
                                'text-red-600 dark:text-red-400',
                              )}>
                                {ag.concluidas > 0 ? `${ag.taxaNoPrazo}%` : '--'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">{ag.totalComentarios}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Carga de trabalho + Quem mais comenta */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <UserCog className="h-4 w-4 text-primary-500" /> Carga de Trabalho
                    {filtros.executor.length > 0 && <span className="ml-2 text-xs font-normal text-primary-500">({filtros.executor.join(', ')})</span>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <BarChartComponent
                    data={dadosGraficoExecutores}
                    height={Math.max(260, Math.min(500, dadosGraficoExecutores.length * 38))}
                    layout="vertical"
                    categoryAxisWidth={180}
                    categoryLabelMaxChars={24}
                    onItemClick={(name) => toggleFiltro('executor', name)}
                    activeItems={filtros.executor.length > 0 ? filtros.executor : undefined}
                  />
                </CardContent>
              </Card>

              {interacoesPorUsuario.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between gap-2 text-base">
                      <span className="inline-flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary-500" /> Interações</span>
                      <span className="text-[11px] text-gray-500 dark:text-gray-400 font-normal">
                        {insightsComentarios.totalComentarios} comentários · {insightsComentarios.mediaComentariosPorTarefa}/tarefa
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-[360px] overflow-auto pr-1">
                      {interacoesPorUsuario.map((user) => (
                        <div key={user.nome} className="flex items-center gap-3">
                          <span className="text-xs text-gray-700 dark:text-gray-300 w-[160px] truncate shrink-0 font-medium">{user.nome}</span>
                          <div className="flex-1 h-5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary-500/80 rounded-full transition-all flex items-center justify-end pr-2"
                              style={{ width: `${Math.max(user.percentual, 4)}%` }}
                            >
                              {user.percentual >= 15 && (
                                <span className="text-[9px] font-semibold text-white">{user.percentual}%</span>
                              )}
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 w-[40px] text-right shrink-0">{user.totalComentarios}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

          </div>
        </TabsContent>

        {/* -------------------------------------------------------------- */}
        {/*  Tab: Prazos e Alertas                                          */}
        {/* -------------------------------------------------------------- */}
        <TabsContent value="prazos">
          <div className="space-y-6">

            {/* Tempo médio por prioridade */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Timer className="h-4 w-4 text-primary-500" /> Tempo Médio de Conclusão por Prioridade
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dadosTempoMedioPorPrioridade.length === 0 ? (
                  <EmptyState height={200}>Sem tarefas concluídas com data para calcular.</EmptyState>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={dadosTempoMedioPorPrioridade} layout="vertical" margin={{ top: 8, right: 32, left: 12, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                        <XAxis type="number" stroke="var(--chart-axis)" fontSize={11} />
                        <YAxis type="category" dataKey="prioridade" stroke="var(--chart-axis)" fontSize={11} width={92} />
                        <Tooltip contentStyle={tooltipStyle} formatter={(value: number, _name: string, item: { payload?: { prioridade?: string; detalhe?: string } }) => [`${value} dias`, `${item.payload?.prioridade ?? ''} (${item.payload?.detalhe ?? ''})`]} />
                        <Bar dataKey="value" radius={[4, 4, 4, 4]}>
                          <LabelList dataKey="value" position="right" offset={8} fill="var(--chart-axis)" fontSize={13} fontWeight={600} formatter={(value: number) => `${value}d`} />
                          {dadosTempoMedioPorPrioridade.map((item) => (
                            <Cell key={`prio-${item.prioridade}`} fill={corPrioridade(item.prioridade)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Média geral: {insights.leadTimeMedioDias > 0 ? `${insights.leadTimeMedioDias} dias` : 'sem dados'} · Baseado em {insights.tarefasConcluidasComData} tarefas
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Tarefas atrasadas + Urgentes paradas (condicional) */}
            {(topTarefasCriticas.length > 0 || gargalosCriticos.length > 0) && (
              <div className={cn('grid gap-6', topTarefasCriticas.length > 0 && gargalosCriticos.length > 0 ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1')}>
                {topTarefasCriticas.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between gap-2 text-base">
                        <span className="inline-flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-500" /> Tarefas Mais Atrasadas</span>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 font-normal">
                          Atraso médio: {insights.atrasoMedioDias}d
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-[400px] overflow-auto pr-1">
                        {topTarefasCriticas.map(tarefa => (
                          <div key={tarefa.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-red-200/60 dark:border-red-500/20 bg-red-50/40 dark:bg-red-500/5">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{tarefa.titulo}</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">{tarefa.executor} · {tarefa.departamento}</p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-xs font-semibold text-red-700 dark:text-red-400">{tarefa.diasAtraso}d</span>
                              {tarefa.notionUrl && (
                                <a href={tarefa.notionUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline">
                                  Notion <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {gargalosCriticos.length > 0 && (
                  <Card className="border-red-200/60 dark:border-red-500/20 bg-red-50/30 dark:bg-red-500/5">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Activity className="h-4 w-4 text-red-500" /> Urgentes Paradas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-[400px] overflow-auto pr-1">
                        {gargalosCriticos.slice(0, 10).map((tarefa) => (
                          <div key={tarefa.id} className="p-2.5 rounded-lg border border-red-200/60 dark:border-red-500/20 bg-red-50/40 dark:bg-red-500/5">
                            <p className="text-xs font-medium text-gray-900 dark:text-gray-100 line-clamp-2">{tarefa.titulo}</p>
                            <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-2">
                                <span className="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300">Pausada</span>
                                <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300">{tarefa.prioridade}</span>
                              </div>
                              {tarefa.notionUrl && (
                                <a href={tarefa.notionUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:underline">
                                  Notion <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Atrasos por departamento (condicional) */}
            {dadosGraficoDepartamentosCriticos.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Building2 className="h-4 w-4 text-red-500" /> Atrasos por Departamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <BarChartComponent
                    data={dadosGraficoDepartamentosCriticos}
                    height={Math.max(200, dadosGraficoDepartamentosCriticos.length * 42)}
                    layout="vertical"
                    categoryAxisWidth={180}
                    categoryLabelMaxChars={24}
                    onItemClick={(name) => toggleFiltro('departamento', name)}
                    activeItems={filtros.departamento.length > 0 ? filtros.departamento : undefined}
                  />
                </CardContent>
              </Card>
            )}

          </div>
        </TabsContent>
      </Tabs>

    </div>
  );
}
