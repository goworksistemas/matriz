import { AlertTriangle, Clock3, CheckCircle2, ClipboardList, UserCog, CalendarX, Layers3, Building2, ExternalLink, XCircle, PauseCircle, TrendingUp, Users2, Activity, MessageSquare, Timer, ShieldAlert, Trophy, Info, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { BarChartComponent } from '@/components/charts/BarChartComponent';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { cn } from '@/lib/utils';
import type { DadosGrafico } from '@/types';
import { CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, LabelList, Cell, Legend, PieChart, Pie } from 'recharts';
import type { FiltrosNotion, FiltroCard, InsightNotion, KPIsNotion, SerieDemandaCapacidade, PerformanceAgente, InteracaoUsuario, GranularidadeTempo } from '../hooks/useNotionFilters';
import type { TarefaProcessada } from '../services/api';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { Inbox, PauseOctagon, Ban } from 'lucide-react';

interface PainelExecutivoProps {
  kpis: KPIsNotion;
  insights: InsightNotion;
  filtros: FiltrosNotion;
  onFiltroChange: <K extends keyof FiltrosNotion>(key: K, value: FiltrosNotion[K]) => void;
  dadosGraficoStatus: DadosGrafico[];
  dadosGraficoPrioridade: DadosGrafico[];
  dadosGraficoExecutores: DadosGrafico[];
  serieConclucoesPorAgente: {
    serie: Record<string, string | number>[];
    agentes: string[];
    variacao: Array<{ agente: string; total: number; ultimo: number; variacao: number }>;
  };
  dadosGraficoDepartamento: DadosGrafico[];
  dadosGraficoDepartamentosCriticos: DadosGrafico[];
  serieDemandaCapacidade: SerieDemandaCapacidade[];
  anomaliasConcluidas: TarefaProcessada[];
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
  serieComentariosPorAgente: {
    serie: Record<string, string | number>[];
    agentes: string[];
    variacao: Array<{ agente: string; total: number; ultimo: number; variacao: number }>;
  };
  tarefasFiltradas: TarefaProcessada[];
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
  if (prioridade === 'Média') return '#06b6d4';
  if (prioridade === 'Baixa') return '#10b981';
  return '#6b7280';
}

const CORES_AGENTES = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'];

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

function InfoBadge({ texto }: { texto: string }) {
  return (
    <span className="relative group/info ml-1">
      <Info className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help inline-block" />
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 px-3 py-2 rounded-lg bg-gray-900 dark:bg-gray-700 text-white text-[11px] leading-relaxed shadow-lg opacity-0 pointer-events-none group-hover/info:opacity-100 group-hover/info:pointer-events-auto transition-opacity z-50 text-left">
        {texto}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
      </span>
    </span>
  );
}

function GraficoTemporalCriacao({ tarefas, titulo, cor, info }: { tarefas: TarefaProcessada[]; titulo: string; cor: string; info?: string }) {
  const mapa = new Map<string, number>();
  tarefas.forEach(t => {
    if (!t.criadoEm) return;
    const dt = new Date(t.criadoEm);
    if (Number.isNaN(dt.getTime())) return;
    const chave = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
    mapa.set(chave, (mapa.get(chave) || 0) + 1);
  });
  if (mapa.size < 2) return null;

  const ordenado = Array.from(mapa.entries()).sort(([a], [b]) => a.localeCompare(b));
  const serie = ordenado.map(([chave, qtd], idx) => {
    const [ano, mes] = chave.split('-').map(Number);
    const label = new Date(ano, (mes || 1) - 1, 1).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    const anterior = idx > 0 ? ordenado[idx - 1][1] : null;
    const variacao = anterior != null && anterior > 0 ? Math.round(((qtd - anterior) / anterior) * 100) : (anterior === 0 && qtd > 0 ? 100 : null);
    return { label, value: qtd, variacao };
  });

  const corLabel = cor === '#3b82f6' ? '#1d4ed8' : cor === '#6366f1' ? '#4338ca' : cor === '#f43f5e' ? '#be123c' : cor;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4" style={{ color: cor }} /> {titulo}
          {info && <InfoBadge texto={info} />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={serie} margin={{ top: 20, right: 12, left: 4, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
            <XAxis
              dataKey="label"
              stroke="var(--chart-axis)"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: 'var(--chart-grid)' }}
              tick={(tickProps: any) => {
                const { x, y, payload } = tickProps;
                const d = serie.find(s => s.label === payload.value);
                const v = d?.variacao;
                const fmtV = v == null ? '—' : `${v > 0 ? '▲ +' : v < 0 ? '▼ ' : ''}${v}%`;
                const varCor = v == null ? '#9ca3af' : v > 0 ? '#16a34a' : v < 0 ? '#dc2626' : '#9ca3af';
                return (
                  <g transform={`translate(${x},${y})`}>
                    <text x={0} y={0} dy={14} textAnchor="middle" fill="var(--chart-axis)" fontSize={11} fontWeight={600}>{payload.value}</text>
                    <line x1={-18} y1={24} x2={18} y2={24} stroke="var(--chart-grid)" strokeWidth={1} />
                    <text x={0} y={0} dy={37} textAnchor="middle" fill={varCor} fontSize={10} fontWeight={700}>{fmtV}</text>
                  </g>
                );
              }}
            />
            <YAxis stroke="var(--chart-axis)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" name={titulo} fill={cor} fillOpacity={0.85} radius={[3, 3, 0, 0]} barSize={32}>
              <LabelList dataKey="value" position="top" offset={6} fill={corLabel} fontSize={12} fontWeight={700} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
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
  serieConclucoesPorAgente,
  dadosGraficoDepartamento,
  dadosGraficoDepartamentosCriticos,
  serieDemandaCapacidade,
  anomaliasConcluidas,
  gargalosCriticos,
  topTarefasCriticas,
  performancePorAgente,
  interacoesPorUsuario,
  insightsComentarios,
  serieComentariosPorAgente,
  tarefasFiltradas,
}: PainelExecutivoProps) {
  const [tab, setTab] = useState('visao-geral');
  const [expandirDepartamentos, setExpandirDepartamentos] = useState(false);

  const nomeExibicao = useCallback((nome: string) => nome.split('|')[0].trim() || nome, []);

  const backlogTarefas = useMemo(() => {
    const hoje = new Date();
    return tarefasFiltradas
      .filter(t => t.status.toLowerCase().includes('solicit'))
      .map(t => {
        const criado = t.criadoEm ? new Date(t.criadoEm) : null;
        const diasEspera = criado ? Math.max(0, Math.floor((hoje.getTime() - criado.getTime()) / 86400000)) : 0;
        return { ...t, diasEspera };
      })
      .sort((a, b) => b.diasEspera - a.diasEspera);
  }, [tarefasFiltradas]);

  const standbyTarefas = useMemo(() => {
    const hoje = new Date();
    return tarefasFiltradas
      .filter(t => t.status.toLowerCase().includes('stand'))
      .map(t => {
        const criado = t.criadoEm ? new Date(t.criadoEm) : null;
        const diasParada = criado ? Math.max(0, Math.floor((hoje.getTime() - criado.getTime()) / 86400000)) : 0;
        return { ...t, diasParada };
      })
      .sort((a, b) => {
        const prioA = a.prioridade.includes('Urgente') ? 0 : a.prioridade.includes('Importante') ? 1 : 2;
        const prioB = b.prioridade.includes('Urgente') ? 0 : b.prioridade.includes('Importante') ? 1 : 2;
        return prioA - prioB || b.diasParada - a.diasParada;
      });
  }, [tarefasFiltradas]);

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
          <TabsTrigger value="prazos" className="inline-flex items-center gap-1.5">
            Prazos e Alertas
            {anomaliasConcluidas.length > 0 && (
              <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold leading-none">
                {anomaliasConcluidas.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="backlog" className="inline-flex items-center gap-1.5">
            Backlog
            {backlogTarefas.length > 0 && (
              <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-blue-500 text-white text-[10px] font-bold leading-none">
                {backlogTarefas.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="standby" className="inline-flex items-center gap-1.5">
            Stand-by
            {standbyTarefas.length > 0 && (
              <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-indigo-500 text-white text-[10px] font-bold leading-none">
                {standbyTarefas.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="canceladas">Canceladas</TabsTrigger>
          <TabsTrigger value="qualidade">Qualidade</TabsTrigger>
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
                    <InfoBadge texto="Criadas: data de criação no Notion (created_at). Finalizadas: data fim (date_end) de tarefas concluídas. Variação % compara com o período anterior." />
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

            {/* Resumo da equipe */}
            {performancePorAgente.length > 0 && (() => {
              const totalPessoas = performancePorAgente.filter(a => a.nome !== 'Nao atribuido').length;
              const totalConcluidas = performancePorAgente.reduce((s, a) => s + a.concluidas, 0);
              const totalAtivas = performancePorAgente.reduce((s, a) => s + a.ativas, 0);
              const melhorAgente = performancePorAgente.reduce((best, a) => a.concluidas > best.concluidas ? a : best, performancePorAgente[0]);
              return (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50 p-4">
                    <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Membros</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-50 mt-1">{totalPessoas}</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50 p-4">
                    <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Concluídas</p>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{totalConcluidas}</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50 p-4">
                    <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Em Andamento</p>
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{totalAtivas}</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50 p-4">
                    <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Destaque</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-50 mt-1 truncate">{melhorAgente.nome}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">{melhorAgente.concluidas} concluídas</p>
                  </div>
                </div>
              );
            })()}

            {/* Tabela com barras de progresso inline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users2 className="h-4 w-4 text-primary-500" /> Desempenho por Pessoa
                </CardTitle>
              </CardHeader>
              <CardContent>
                {performancePorAgente.length === 0 ? (
                  <EmptyState height={80}>Sem dados no filtro atual.</EmptyState>
                ) : (() => {
                  const maxTotal = Math.max(...performancePorAgente.map(a => a.total), 1);
                  return (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-white/[0.06] text-xs text-gray-500 dark:text-gray-400">
                            <th className="text-left py-2.5 pr-4 font-medium w-[200px]">Responsável</th>
                            <th className="text-left py-2.5 px-3 font-medium">Progresso</th>
                            <th className="text-right py-2.5 px-3 font-medium w-[80px]">Concluídas</th>
                            <th className="text-right py-2.5 px-3 font-medium w-[80px]">Ativas</th>
                            <th className="text-right py-2.5 px-3 font-medium w-[80px]">Tempo Médio</th>
                          </tr>
                        </thead>
                        <tbody>
                          {performancePorAgente.map((ag) => {
                            const pctConcluidas = ag.total > 0 ? (ag.concluidas / ag.total) * 100 : 0;
                            const barWidth = (ag.total / maxTotal) * 100;
                            return (
                              <tr key={ag.nome} className="border-b border-gray-100 dark:border-white/[0.04] hover:bg-gray-50 dark:hover:bg-gray-800/30">
                                <td className="py-3 pr-4">
                                  <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{ag.nome}</p>
                                  <p className="text-[10px] text-gray-400">{ag.total} tarefas · {ag.totalComentarios} comentários</p>
                                </td>
                                <td className="py-3 px-3">
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden" style={{ width: `${barWidth}%`, minWidth: '40px' }}>
                                      <div
                                        className="h-full bg-emerald-500/80 rounded-full transition-all"
                                        style={{ width: `${pctConcluidas}%` }}
                                      />
                                    </div>
                                    <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 w-[32px] text-right shrink-0">
                                      {Math.round(pctConcluidas)}%
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">{ag.concluidas}</td>
                                <td className="py-3 px-3 text-right text-amber-600 dark:text-amber-400 tabular-nums">{ag.ativas}</td>
                                <td className="py-3 px-3 text-right tabular-nums">{ag.tempoMedioDias > 0 ? `${ag.tempoMedioDias}d` : '--'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Conclusões por Agente — mesmo modelo de Criadas vs Finalizadas */}
            {serieConclucoesPorAgente.serie.length > 0 && (() => {
              const { serie, agentes, variacao: variacaoAgentes } = serieConclucoesPorAgente;
              const varPorPeriodoPorAgente = new Map<string, Map<string, number | null>>();
              for (let idx = 0; idx < serie.length; idx++) {
                const ponto = serie[idx];
                const label = ponto.label as string;
                const m = new Map<string, number | null>();
                agentes.forEach(ag => {
                  const atual = (ponto[ag] as number) || 0;
                  const anterior = idx > 0 ? ((serie[idx - 1][ag] as number) || 0) : null;
                  if (anterior === null) { m.set(ag, null); return; }
                  if (anterior === 0) { m.set(ag, atual > 0 ? 100 : 0); return; }
                  m.set(ag, Math.round(((atual - anterior) / anterior) * 100));
                });
                varPorPeriodoPorAgente.set(label, m);
              }

              const fmtVar = (v: number | null | undefined) => {
                if (v == null) return '—';
                const arrow = v > 0 ? '▲' : v < 0 ? '▼' : '';
                return `${arrow} ${v > 0 ? '+' : ''}${v}%`;
              };
              const varColor = (v: number | null | undefined) => {
                if (v == null) return '#9ca3af';
                return v > 0 ? '#16a34a' : v < 0 ? '#dc2626' : '#9ca3af';
              };
              const bottomMargin = 16 + agentes.length * 15;

              return (
                <Card>
                  <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Trophy className="h-4 w-4 text-amber-500" /> Conclusões por Agente
                        <InfoBadge texto="Base: data fim (date_end) de tarefas concluídas. Cada barra representa o total de conclusões do agente no período. Top 5 executores por volume." />
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
                    <ResponsiveContainer width="100%" height={340 + bottomMargin}>
                      <BarChart data={serie} margin={{ top: 20, right: 12, left: 4, bottom: bottomMargin }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                        <XAxis
                          dataKey="label"
                          stroke="var(--chart-axis)"
                          fontSize={11}
                          tickLine={false}
                          axisLine={{ stroke: 'var(--chart-grid)' }}
                          tick={(tickProps: any) => {
                            const { x, y, payload, index: tickIndex } = tickProps;
                            const vars = varPorPeriodoPorAgente.get(payload.value);
                            return (
                              <g transform={`translate(${x},${y})`}>
                                <text x={0} y={0} dy={14} textAnchor="middle" fill="var(--chart-axis)" fontSize={11} fontWeight={600}>{payload.value}</text>
                                <line x1={-22} y1={24} x2={22} y2={24} stroke="var(--chart-grid)" strokeWidth={1} />
                                {agentes.map((ag, ai) => {
                                  const v = vars?.get(ag) ?? null;
                                  return (
                                    <text key={ag} x={0} y={0} dy={37 + ai * 15} textAnchor="middle" fill={varColor(v)} fontSize={10} fontWeight={700}>
                                      {fmtVar(v)}
                                    </text>
                                  );
                                })}
                                {tickIndex === 0 && agentes.map((ag, ai) => (
                                  <text key={`lbl-${ag}`} x={-x + 4} y={0} dy={37 + ai * 15} textAnchor="start" fill={CORES_AGENTES[ai % CORES_AGENTES.length]} fontSize={9} fontWeight={700}>
                                    {ag.length > 12 ? ag.slice(0, 12) + '..' : ag}
                                  </text>
                                ))}
                              </g>
                            );
                          }}
                        />
                        <YAxis stroke="var(--chart-axis)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                        <Tooltip
                          cursor={{ fill: 'var(--chart-cursor)' }}
                          content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null;
                            const vars = varPorPeriodoPorAgente.get(label as string);
                            return (
                              <div style={{ ...tooltipStyle, padding: '8px 12px', fontSize: 12 }}>
                                <p style={{ fontWeight: 700, marginBottom: 4 }}>{label}</p>
                                {payload.map((p: any) => (
                                  <p key={p.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                                    <span style={{ color: p.color }}>{p.name}</span>
                                    <strong>{p.value}</strong>
                                  </p>
                                ))}
                                {vars && (
                                  <div style={{ borderTop: '1px dashed #e5e7eb', marginTop: 4, paddingTop: 4, fontSize: 11 }}>
                                    {agentes.map((ag, ai) => {
                                      const v = vars.get(ag);
                                      if (v == null) return null;
                                      const sinal = v > 0 ? '+' : '';
                                      const cor = v > 0 ? '#16a34a' : v < 0 ? '#dc2626' : '#6b7280';
                                      return (
                                        <p key={ag} style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                                          <span style={{ color: CORES_AGENTES[ai % CORES_AGENTES.length] }}>Var. {ag.split(' ')[0]}</span>
                                          <span style={{ color: cor, fontWeight: 600 }}>{sinal}{v}%</span>
                                        </p>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          }}
                        />
                        <Legend verticalAlign="top" align="right" iconType="rect" wrapperStyle={{ paddingBottom: 8, fontSize: '11px' }} />
                        {agentes.map((agente, i) => (
                          <Bar
                            key={agente}
                            dataKey={agente}
                            name={agente}
                            fill={CORES_AGENTES[i % CORES_AGENTES.length]}
                            fillOpacity={0.85}
                            radius={[3, 3, 0, 0]}
                            barSize={22}
                          >
                            <LabelList dataKey={agente} position="top" offset={6} fill={CORES_AGENTES[i % CORES_AGENTES.length]} fontSize={11} fontWeight={700} formatter={(v: number) => v > 0 ? v : ''} />
                          </Bar>
                        ))}
                      </BarChart>
                    </ResponsiveContainer>

                    {variacaoAgentes.length > 0 && (
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex flex-wrap gap-x-6 gap-y-1">
                        {variacaoAgentes.map((v, i) => (
                          <span key={v.agente} className="inline-flex items-center gap-1">
                            <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: CORES_AGENTES[i % CORES_AGENTES.length] }} />
                            <span className="font-medium">{v.agente}</span>:
                            <span className="font-semibold text-gray-900 dark:text-gray-100">{v.total}</span> total
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })()}

            {/* Carga de trabalho + Interações */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <UserCog className="h-4 w-4 text-primary-500" /> Carga de Trabalho (Ativas)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <BarChartComponent
                    data={dadosGraficoExecutores}
                    height={Math.max(260, Math.min(500, dadosGraficoExecutores.length * 38))}
                    layout="vertical"
                    categoryAxisWidth={160}
                    categoryLabelMaxChars={22}
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
                          <span className="text-xs text-gray-700 dark:text-gray-300 w-[140px] truncate shrink-0 font-medium">{user.nome}</span>
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

            {/* Comentários por Agente ao longo do tempo */}
            {serieComentariosPorAgente.serie.length > 0 && (() => {
              const { serie, agentes, variacao: variacaoAgentes } = serieComentariosPorAgente;
              const varPorPeriodo = new Map<string, Map<string, number | null>>();
              for (let idx = 0; idx < serie.length; idx++) {
                const ponto = serie[idx];
                const label = ponto.label as string;
                const m = new Map<string, number | null>();
                agentes.forEach(ag => {
                  const atual = (ponto[ag] as number) || 0;
                  const anterior = idx > 0 ? ((serie[idx - 1][ag] as number) || 0) : null;
                  if (anterior === null) { m.set(ag, null); return; }
                  if (anterior === 0) { m.set(ag, atual > 0 ? 100 : 0); return; }
                  m.set(ag, Math.round(((atual - anterior) / anterior) * 100));
                });
                varPorPeriodo.set(label, m);
              }

              const fmtVar = (v: number | null | undefined) => {
                if (v == null) return '—';
                const arrow = v > 0 ? '▲' : v < 0 ? '▼' : '';
                return `${arrow} ${v > 0 ? '+' : ''}${v}%`;
              };
              const varColor = (v: number | null | undefined) => {
                if (v == null) return '#9ca3af';
                return v > 0 ? '#16a34a' : v < 0 ? '#dc2626' : '#9ca3af';
              };
              const bottomMargin = 16 + agentes.length * 15;

              return (
                <Card>
                  <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <MessageSquare className="h-4 w-4 text-primary-500" /> Comentários por Agente
                        <InfoBadge texto="Base: data do comentário (commented_at) no Notion. Cada barra representa o total de comentários do agente no período. Top 5 autores por volume." />
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
                    <ResponsiveContainer width="100%" height={340 + bottomMargin}>
                      <BarChart data={serie} margin={{ top: 20, right: 12, left: 4, bottom: bottomMargin }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                        <XAxis
                          dataKey="label"
                          stroke="var(--chart-axis)"
                          fontSize={11}
                          tickLine={false}
                          axisLine={{ stroke: 'var(--chart-grid)' }}
                          tick={(tickProps: any) => {
                            const { x, y, payload, index: tickIndex } = tickProps;
                            const vars = varPorPeriodo.get(payload.value);
                            return (
                              <g transform={`translate(${x},${y})`}>
                                <text x={0} y={0} dy={14} textAnchor="middle" fill="var(--chart-axis)" fontSize={11} fontWeight={600}>{payload.value}</text>
                                <line x1={-22} y1={24} x2={22} y2={24} stroke="var(--chart-grid)" strokeWidth={1} />
                                {agentes.map((ag, ai) => {
                                  const v = vars?.get(ag) ?? null;
                                  return (
                                    <text key={ag} x={0} y={0} dy={37 + ai * 15} textAnchor="middle" fill={varColor(v)} fontSize={10} fontWeight={700}>
                                      {fmtVar(v)}
                                    </text>
                                  );
                                })}
                                {tickIndex === 0 && agentes.map((ag, ai) => (
                                  <text key={`lbl-${ag}`} x={-x + 4} y={0} dy={37 + ai * 15} textAnchor="start" fill={CORES_AGENTES[ai % CORES_AGENTES.length]} fontSize={9} fontWeight={700}>
                                    {ag.length > 12 ? ag.slice(0, 12) + '..' : ag}
                                  </text>
                                ))}
                              </g>
                            );
                          }}
                        />
                        <YAxis stroke="var(--chart-axis)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                        <Tooltip
                          cursor={{ fill: 'var(--chart-cursor)' }}
                          content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null;
                            const vars = varPorPeriodo.get(label as string);
                            return (
                              <div style={{ ...tooltipStyle, padding: '8px 12px', fontSize: 12 }}>
                                <p style={{ fontWeight: 700, marginBottom: 4 }}>{label}</p>
                                {payload.map((p: any) => (
                                  <p key={p.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                                    <span style={{ color: p.color }}>{p.name}</span>
                                    <strong>{p.value}</strong>
                                  </p>
                                ))}
                                {vars && (
                                  <div style={{ borderTop: '1px dashed #e5e7eb', marginTop: 4, paddingTop: 4, fontSize: 11 }}>
                                    {agentes.map((ag, ai) => {
                                      const v = vars.get(ag);
                                      if (v == null) return null;
                                      const sinal = v > 0 ? '+' : '';
                                      const cor = v > 0 ? '#16a34a' : v < 0 ? '#dc2626' : '#6b7280';
                                      return (
                                        <p key={ag} style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                                          <span style={{ color: CORES_AGENTES[ai % CORES_AGENTES.length] }}>Var. {ag.split(' ')[0]}</span>
                                          <span style={{ color: cor, fontWeight: 600 }}>{sinal}{v}%</span>
                                        </p>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          }}
                        />
                        <Legend verticalAlign="top" align="right" iconType="rect" wrapperStyle={{ paddingBottom: 8, fontSize: '11px' }} />
                        {agentes.map((agente, i) => (
                          <Bar
                            key={agente}
                            dataKey={agente}
                            name={agente}
                            fill={CORES_AGENTES[i % CORES_AGENTES.length]}
                            fillOpacity={0.85}
                            radius={[3, 3, 0, 0]}
                            barSize={22}
                          >
                            <LabelList dataKey={agente} position="top" offset={6} fill={CORES_AGENTES[i % CORES_AGENTES.length]} fontSize={11} fontWeight={700} formatter={(v: number) => v > 0 ? v : ''} />
                          </Bar>
                        ))}
                      </BarChart>
                    </ResponsiveContainer>

                    {variacaoAgentes.length > 0 && (
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex flex-wrap gap-x-6 gap-y-1">
                        {variacaoAgentes.map((v, i) => (
                          <span key={v.agente} className="inline-flex items-center gap-1">
                            <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: CORES_AGENTES[i % CORES_AGENTES.length] }} />
                            <span className="font-medium">{v.agente}</span>:
                            <span className="font-semibold text-gray-900 dark:text-gray-100">{v.total}</span> total
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })()}

          </div>
        </TabsContent>

        {/* -------------------------------------------------------------- */}
        {/*  Tab: Prazos e Alertas                                          */}
        {/* -------------------------------------------------------------- */}
        <TabsContent value="prazos">
          <div className="space-y-6">

            {anomaliasConcluidas.length > 0 && (
              <Card className="border-amber-300 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2 text-base">
                    <span className="inline-flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-amber-600" /> Anomalia: Concluídas com prazo no futuro
                      <InfoBadge texto="Tarefas com status 'Concluído' mas data fim (date_end) posterior à data de hoje. Indica inconsistência no preenchimento." />
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-bold">
                      {anomaliasConcluidas.length}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mb-3">
                    Estas tarefas estão marcadas como concluídas mas possuem data de finalização no futuro. Verifique se o status ou a data está incorreta.
                  </p>
                  <div className="space-y-2 max-h-[300px] overflow-auto pr-1">
                    {anomaliasConcluidas.map(tarefa => (
                      <div key={tarefa.id} className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-amber-200/80 dark:border-amber-500/20 bg-white/60 dark:bg-gray-900/40">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{tarefa.titulo}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {tarefa.executor} · Prazo: {tarefa.dataFim?.split('-').reverse().join('/')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300">
                            {tarefa.status}
                          </span>
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

            {/* Tempo médio por prioridade */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Timer className="h-4 w-4 text-primary-500" /> Tempo Médio de Conclusão por Prioridade
                  <InfoBadge texto="Calcula a diferença em dias entre a data de criação (created_at) e a data fim (date_end). Apenas tarefas concluídas com ambas as datas preenchidas." />
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

        {/* -------------------------------------------------------------- */}
        {/*  Tab: Backlog (Solicitações)                                    */}
        {/* -------------------------------------------------------------- */}
        <TabsContent value="backlog">
          <div className="space-y-6">
            {(() => {
              const total = backlogTarefas.length;
              const urgentes = backlogTarefas.filter(t => t.prioridade.toLowerCase().includes('urg')).length;
              const importantes = backlogTarefas.filter(t => t.prioridade.toLowerCase().includes('import')).length;
              const tempoMedioEspera = total > 0 ? Math.round(backlogTarefas.reduce((s, t) => s + t.diasEspera, 0) / total) : 0;
              const porDepto = new Map<string, number>();
              backlogTarefas.forEach(t => { porDepto.set(t.departamento || 'Sem depto', (porDepto.get(t.departamento || 'Sem depto') || 0) + 1); });
              const deptoData = Array.from(porDepto.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
              const porPrioridade = new Map<string, number>();
              backlogTarefas.forEach(t => { porPrioridade.set(t.prioridade || 'Sem prioridade', (porPrioridade.get(t.prioridade || 'Sem prioridade') || 0) + 1); });
              const prioData = Array.from(porPrioridade.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

              return (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="rounded-xl border border-blue-200 dark:border-blue-500/20 bg-blue-50/50 dark:bg-blue-500/5 p-4">
                      <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Na Fila</p>
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">{total}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">aguardando triagem</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50 p-4">
                      <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tempo Médio Espera</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-gray-50 mt-1">{tempoMedioEspera}d</p>
                    </div>
                    <div className="rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50/30 dark:bg-red-500/5 p-4">
                      <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Urgentes</p>
                      <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">{urgentes}</p>
                    </div>
                    <div className="rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50/30 dark:bg-amber-500/5 p-4">
                      <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Importantes</p>
                      <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1">{importantes}</p>
                    </div>
                  </div>

                  <GraficoTemporalCriacao tarefas={backlogTarefas} titulo="Solicitações ao Longo do Tempo" cor="#3b82f6" info="Base: data de criação (created_at) das tarefas em status Solicitação. Mostra o volume de novas demandas entrando na fila por mês." />

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {deptoData.length > 0 && (
                      <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Building2 className="h-4 w-4 text-blue-500" /> Por Departamento</CardTitle></CardHeader>
                        <CardContent>
                          <BarChartComponent data={deptoData} height={Math.max(200, deptoData.length * 36)} layout="vertical" categoryAxisWidth={160} categoryLabelMaxChars={22} />
                        </CardContent>
                      </Card>
                    )}
                    {prioData.length > 0 && (
                      <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="h-4 w-4 text-amber-500" /> Por Prioridade</CardTitle></CardHeader>
                        <CardContent>
                          <BarChartComponent data={prioData} height={Math.max(160, prioData.length * 36)} layout="vertical" categoryAxisWidth={120} categoryLabelMaxChars={18} />
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Inbox className="h-4 w-4 text-blue-500" /> Fila de Solicitações
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {total === 0 ? (
                        <EmptyState height={80}>Nenhuma solicitação pendente.</EmptyState>
                      ) : (
                        <div className="space-y-2 max-h-[500px] overflow-auto pr-1">
                          {backlogTarefas.map(tarefa => (
                            <div key={tarefa.id} className={cn(
                              'flex items-center justify-between gap-3 p-3 rounded-lg border',
                              tarefa.diasEspera > 14 ? 'border-red-200/60 dark:border-red-500/20 bg-red-50/30 dark:bg-red-500/5' :
                              tarefa.diasEspera > 7 ? 'border-amber-200/60 dark:border-amber-500/20 bg-amber-50/30 dark:bg-amber-500/5' :
                              'border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50',
                            )}>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{tarefa.titulo}</p>
                                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                                  <span>{tarefa.departamento || 'Sem depto'}</span>
                                  <span>·</span>
                                  <span>{tarefa.prioridade || 'Sem prioridade'}</span>
                                  {tarefa.criadoPor && <><span>·</span><span>por {nomeExibicao(tarefa.criadoPor)}</span></>}
                                </div>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <span className={cn(
                                  'text-xs font-semibold',
                                  tarefa.diasEspera > 14 ? 'text-red-600 dark:text-red-400' :
                                  tarefa.diasEspera > 7 ? 'text-amber-600 dark:text-amber-400' :
                                  'text-gray-500',
                                )}>{tarefa.diasEspera}d</span>
                                {tarefa.notionUrl && (
                                  <a href={tarefa.notionUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-1">
                                    Notion <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              );
            })()}
          </div>
        </TabsContent>

        {/* -------------------------------------------------------------- */}
        {/*  Tab: Stand-by                                                  */}
        {/* -------------------------------------------------------------- */}
        <TabsContent value="standby">
          <div className="space-y-6">
            {(() => {
              const total = standbyTarefas.length;
              const criticas = standbyTarefas.filter(t => t.prioridade.toLowerCase().includes('urg') || t.prioridade.toLowerCase().includes('import')).length;
              const porDepto = new Map<string, number>();
              standbyTarefas.forEach(t => { porDepto.set(t.departamento || 'Sem depto', (porDepto.get(t.departamento || 'Sem depto') || 0) + 1); });
              const deptoData = Array.from(porDepto.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

              return (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="rounded-xl border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-500/5 p-4">
                      <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Pausadas</p>
                      <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{total}</p>
                    </div>
                    {criticas > 0 && (
                      <div className="rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50/30 dark:bg-red-500/5 p-4">
                        <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Urgentes/Importantes</p>
                        <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">{criticas}</p>
                        <p className="text-[10px] text-red-500 mt-0.5">requer atenção</p>
                      </div>
                    )}
                    <div className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50 p-4">
                      <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Departamentos</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-gray-50 mt-1">{porDepto.size}</p>
                    </div>
                  </div>

                  <GraficoTemporalCriacao tarefas={standbyTarefas} titulo="Stand-by ao Longo do Tempo" cor="#6366f1" info="Base: data de criação (created_at) das tarefas em status Stand-by. Mostra quando as tarefas pausadas foram originalmente criadas." />

                  {deptoData.length > 1 && (
                    <Card>
                      <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Building2 className="h-4 w-4 text-indigo-500" /> Stand-by por Departamento</CardTitle></CardHeader>
                      <CardContent>
                        <BarChartComponent data={deptoData} height={Math.max(180, deptoData.length * 36)} layout="vertical" categoryAxisWidth={160} categoryLabelMaxChars={22} />
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <PauseOctagon className="h-4 w-4 text-indigo-500" /> Tarefas Pausadas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {total === 0 ? (
                        <EmptyState height={80}>Nenhuma tarefa em stand-by.</EmptyState>
                      ) : (
                        <div className="space-y-2 max-h-[500px] overflow-auto pr-1">
                          {standbyTarefas.map(tarefa => {
                            const isCritica = tarefa.prioridade.toLowerCase().includes('urg') || tarefa.prioridade.toLowerCase().includes('import');
                            return (
                              <div key={tarefa.id} className={cn(
                                'flex items-center justify-between gap-3 p-3 rounded-lg border',
                                isCritica ? 'border-red-200/60 dark:border-red-500/20 bg-red-50/30 dark:bg-red-500/5' :
                                'border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50',
                              )}>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{tarefa.titulo}</p>
                                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                                    <span className={cn(
                                      'px-1.5 py-0.5 rounded text-[10px] font-medium',
                                      isCritica ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300',
                                    )}>{tarefa.prioridade || 'Sem prioridade'}</span>
                                    <span>{tarefa.departamento || 'Sem depto'}</span>
                                    {tarefa.executor && tarefa.executor !== 'Nao atribuido' && <><span>·</span><span>{nomeExibicao(tarefa.executor)}</span></>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                  <span className="text-xs text-gray-500">{tarefa.diasParada}d parada</span>
                                  {tarefa.notionUrl && (
                                    <a href={tarefa.notionUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-1">
                                      Notion <ExternalLink className="h-3 w-3" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              );
            })()}
          </div>
        </TabsContent>

        {/* -------------------------------------------------------------- */}
        {/*  Tab: Canceladas                                                */}
        {/* -------------------------------------------------------------- */}
        <TabsContent value="canceladas">
          <div className="space-y-6">
            {(() => {
              const canceladas = tarefasFiltradas.filter(t => t.status.toLowerCase().includes('cancel'));
              const total = canceladas.length;
              const totalGeral = tarefasFiltradas.length;
              const taxa = totalGeral > 0 ? Math.round((total / totalGeral) * 100) : 0;
              const porDepto = new Map<string, number>();
              canceladas.forEach(t => { porDepto.set(t.departamento || 'Sem depto', (porDepto.get(t.departamento || 'Sem depto') || 0) + 1); });
              const deptoData = Array.from(porDepto.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
              const porPrioridade = new Map<string, number>();
              canceladas.forEach(t => { porPrioridade.set(t.prioridade || 'Sem prioridade', (porPrioridade.get(t.prioridade || 'Sem prioridade') || 0) + 1); });
              const prioData = Array.from(porPrioridade.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

              return (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="rounded-xl border border-rose-200 dark:border-rose-500/20 bg-rose-50/50 dark:bg-rose-500/5 p-4">
                      <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Canceladas</p>
                      <p className="text-3xl font-bold text-rose-600 dark:text-rose-400 mt-1">{total}</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50 p-4">
                      <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Taxa de Cancelamento</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-gray-50 mt-1">{taxa}%</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">do total de {totalGeral} tarefas</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50 p-4">
                      <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Departamentos</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-gray-50 mt-1">{porDepto.size}</p>
                    </div>
                  </div>

                  <GraficoTemporalCriacao tarefas={canceladas} titulo="Cancelamentos ao Longo do Tempo" cor="#f43f5e" info="Base: data de criação (created_at) das tarefas canceladas. Mostra quando as tarefas que foram canceladas entraram originalmente na esteira." />

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {deptoData.length > 0 && (
                      <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Building2 className="h-4 w-4 text-rose-500" /> Canceladas por Departamento</CardTitle></CardHeader>
                        <CardContent>
                          <BarChartComponent data={deptoData} height={Math.max(180, deptoData.length * 36)} layout="vertical" categoryAxisWidth={160} categoryLabelMaxChars={22} />
                        </CardContent>
                      </Card>
                    )}
                    {prioData.length > 0 && (
                      <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="h-4 w-4 text-rose-500" /> Canceladas por Prioridade</CardTitle></CardHeader>
                        <CardContent>
                          <BarChartComponent data={prioData} height={Math.max(160, prioData.length * 36)} layout="vertical" categoryAxisWidth={120} categoryLabelMaxChars={18} />
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Ban className="h-4 w-4 text-rose-500" /> Tarefas Canceladas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {total === 0 ? (
                        <EmptyState height={80}>Nenhuma tarefa cancelada.</EmptyState>
                      ) : (
                        <div className="space-y-2 max-h-[500px] overflow-auto pr-1">
                          {canceladas.map(tarefa => (
                            <div key={tarefa.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate line-through">{tarefa.titulo}</p>
                                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-400">
                                  <span>{tarefa.departamento || 'Sem depto'}</span>
                                  <span>·</span>
                                  <span>{tarefa.prioridade || 'Sem prioridade'}</span>
                                  {tarefa.executor && tarefa.executor !== 'Nao atribuido' && <><span>·</span><span>{nomeExibicao(tarefa.executor)}</span></>}
                                </div>
                              </div>
                              {tarefa.notionUrl && (
                                <a href={tarefa.notionUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-1 shrink-0">
                                  Notion <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              );
            })()}
          </div>
        </TabsContent>

        {/* -------------------------------------------------------------- */}
        {/*  Tab: Qualidade (Compliance com regras da esteira)              */}
        {/* -------------------------------------------------------------- */}
        <TabsContent value="qualidade">
          <div className="space-y-6">
            {(() => {
              type Violacao = { campo: string; regra: string; tipo: 'faltando' | 'proibido' };
              type TarefaAuditada = TarefaProcessada & { violacoes: Violacao[]; statusCategoria: string };

              const categorizar = (status: string): string => {
                const s = status.toLowerCase();
                if (s.includes('solicit')) return 'solicitacao';
                if (s.includes('agend')) return 'agendado';
                if (s.includes('andamento') || s.includes('aguard') || s.includes('implant') || s.includes('aprov')) return 'execucao';
                if (s.includes('conclu')) return 'concluido';
                if (s.includes('cancel') || s.includes('stand')) return 'encerrado';
                return 'outro';
              };

              const auditar = (t: TarefaProcessada): Violacao[] => {
                const v: Violacao[] = [];
                const cat = categorizar(t.status);
                const semTitulo = !t.titulo || t.titulo === 'Sem titulo';
                const semDepto = !t.departamento || t.departamento === 'Sem departamento';
                const semPrioridade = !t.prioridade || t.prioridade === 'Sem prioridade';
                const semDescricao = !t.descricao?.trim();
                const temExecutor = t.executores.length > 0 && t.executor.toLowerCase() !== 'nao atribuido';
                const temDataInicio = !!t.dataInicio;
                const temDataFim = !!t.dataFim;
                const temTags = t.tags.length > 0;

                if (cat === 'solicitacao') {
                  if (semTitulo) v.push({ campo: 'Nome', regra: 'Obrigatório em Solicitação', tipo: 'faltando' });
                  if (semDepto) v.push({ campo: 'Departamento', regra: 'Obrigatório em Solicitação', tipo: 'faltando' });
                  if (semPrioridade) v.push({ campo: 'Prioridade', regra: 'Obrigatório em Solicitação', tipo: 'faltando' });
                  if (semDescricao) v.push({ campo: 'Descrição', regra: 'Obrigatório em Solicitação', tipo: 'faltando' });
                  if (temExecutor) v.push({ campo: 'Executor', regra: 'Proibido em Solicitação', tipo: 'proibido' });
                  if (temDataInicio) v.push({ campo: 'Data início', regra: 'Proibido em Solicitação', tipo: 'proibido' });
                  if (temDataFim) v.push({ campo: 'Data fim', regra: 'Proibido em Solicitação', tipo: 'proibido' });
                }
                if (cat === 'agendado') {
                  if (semDepto) v.push({ campo: 'Departamento', regra: 'Obrigatório em Agendado', tipo: 'faltando' });
                  if (semPrioridade) v.push({ campo: 'Prioridade', regra: 'Obrigatório em Agendado', tipo: 'faltando' });
                  if (!temExecutor) v.push({ campo: 'Executor', regra: 'Obrigatório em Agendado', tipo: 'faltando' });
                  if (!temDataInicio) v.push({ campo: 'Data início', regra: 'Obrigatório em Agendado', tipo: 'faltando' });
                  if (!temTags) v.push({ campo: 'Tags', regra: 'Obrigatório em Agendado', tipo: 'faltando' });
                  if (temDataFim) v.push({ campo: 'Data fim', regra: 'Não preencher em Agendado', tipo: 'proibido' });
                }
                if (cat === 'execucao') {
                  if (semDepto) v.push({ campo: 'Departamento', regra: 'Obrigatório em Execução', tipo: 'faltando' });
                  if (semPrioridade) v.push({ campo: 'Prioridade', regra: 'Obrigatório em Execução', tipo: 'faltando' });
                  if (!temExecutor) v.push({ campo: 'Executor', regra: 'Obrigatório em Execução', tipo: 'faltando' });
                  if (!temDataInicio) v.push({ campo: 'Data início', regra: 'Obrigatório em Execução', tipo: 'faltando' });
                  if (!temDataFim) v.push({ campo: 'Data fim', regra: 'Previsão obrigatória em Execução', tipo: 'faltando' });
                  if (!temTags) v.push({ campo: 'Tags', regra: 'Obrigatório em Execução', tipo: 'faltando' });
                }
                if (cat === 'concluido') {
                  if (semDepto) v.push({ campo: 'Departamento', regra: 'Obrigatório em Concluído', tipo: 'faltando' });
                  if (semPrioridade) v.push({ campo: 'Prioridade', regra: 'Obrigatório em Concluído', tipo: 'faltando' });
                  if (!temExecutor) v.push({ campo: 'Executor', regra: 'Obrigatório em Concluído', tipo: 'faltando' });
                  if (!temDataInicio) v.push({ campo: 'Data início', regra: 'Obrigatório em Concluído', tipo: 'faltando' });
                  if (!temDataFim) v.push({ campo: 'Data fim', regra: 'Data real obrigatória em Concluído', tipo: 'faltando' });
                  if (!temTags) v.push({ campo: 'Tags', regra: 'Obrigatório em Concluído', tipo: 'faltando' });
                }
                return v;
              };

              const auditadas: TarefaAuditada[] = tarefasFiltradas.map(t => ({
                ...t,
                violacoes: auditar(t),
                statusCategoria: categorizar(t.status),
              }));

              const comViolacao = auditadas.filter(t => t.violacoes.length > 0);
              const semViolacao = auditadas.filter(t => t.violacoes.length === 0);
              const totalAuditadas = auditadas.length;
              const pctConforme = totalAuditadas > 0 ? Math.round((semViolacao.length / totalAuditadas) * 100) : 0;
              const totalViolacoes = comViolacao.reduce((s, t) => s + t.violacoes.length, 0);

              const porCategoria = new Map<string, { total: number; violacoes: number }>();
              auditadas.forEach(t => {
                const cat = t.statusCategoria;
                const e = porCategoria.get(cat) || { total: 0, violacoes: 0 };
                e.total++;
                if (t.violacoes.length > 0) e.violacoes++;
                porCategoria.set(cat, e);
              });

              const porCampo = new Map<string, number>();
              comViolacao.forEach(t => t.violacoes.forEach(v => {
                porCampo.set(v.campo, (porCampo.get(v.campo) || 0) + 1);
              }));
              const campoData = Array.from(porCampo.entries())
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value);

              const nomesCat: Record<string, string> = {
                solicitacao: 'Solicitação',
                agendado: 'Agendado',
                execucao: 'Em Execução',
                concluido: 'Concluído',
                encerrado: 'Cancel./Stand-by',
                outro: 'Outro',
              };
              const coresCat: Record<string, string> = {
                solicitacao: 'text-blue-600 dark:text-blue-400',
                agendado: 'text-cyan-600 dark:text-cyan-400',
                execucao: 'text-amber-600 dark:text-amber-400',
                concluido: 'text-emerald-600 dark:text-emerald-400',
                encerrado: 'text-gray-500',
                outro: 'text-gray-400',
              };

              return (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className={cn(
                      'rounded-xl border p-4',
                      pctConforme >= 80 ? 'border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5' :
                      pctConforme >= 50 ? 'border-amber-200 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/5' :
                      'border-red-200 dark:border-red-500/20 bg-red-50/50 dark:bg-red-500/5',
                    )}>
                      <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Conformidade</p>
                      <p className={cn(
                        'text-3xl font-bold mt-1',
                        pctConforme >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
                        pctConforme >= 50 ? 'text-amber-600 dark:text-amber-400' :
                        'text-red-600 dark:text-red-400',
                      )}>{pctConforme}%</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{semViolacao.length} de {totalAuditadas} OK</p>
                    </div>
                    <div className="rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50/30 dark:bg-red-500/5 p-4">
                      <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Com Violações</p>
                      <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">{comViolacao.length}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{totalViolacoes} problemas encontrados</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50 p-4">
                      <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Auditadas</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-gray-50 mt-1">{totalAuditadas}</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50 p-4">
                      <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Conformidade por Etapa</p>
                      <div className="mt-2 space-y-1">
                        {Array.from(porCategoria.entries()).filter(([c]) => c !== 'encerrado' && c !== 'outro').map(([cat, d]) => {
                          const pct = d.total > 0 ? Math.round(((d.total - d.violacoes) / d.total) * 100) : 100;
                          return (
                            <div key={cat} className="flex items-center justify-between text-[10px]">
                              <span className={cn('font-medium', coresCat[cat])}>{nomesCat[cat]}</span>
                              <span className={cn('font-bold', pct >= 80 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-600')}>{pct}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {campoData.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <ShieldCheck className="h-4 w-4 text-red-500" /> Violações por Campo
                          <InfoBadge texto="Campos obrigatórios ou proibidos conforme a regra de cada status da esteira. Baseado nas regras do documento de processo S&D." />
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <BarChartComponent data={campoData} height={Math.max(200, campoData.length * 36)} layout="vertical" categoryAxisWidth={120} categoryLabelMaxChars={18} />
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between gap-2 text-base">
                        <span className="inline-flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-500" /> Tarefas com Violações
                        </span>
                        <span className="text-[11px] text-gray-500 font-normal">{comViolacao.length} tarefas</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {comViolacao.length === 0 ? (
                        <EmptyState height={80}>Todas as tarefas estão em conformidade com as regras da esteira.</EmptyState>
                      ) : (
                        <div className="space-y-3 max-h-[600px] overflow-auto pr-1">
                          {comViolacao
                            .sort((a, b) => b.violacoes.length - a.violacoes.length)
                            .map(tarefa => (
                            <div key={tarefa.id} className="p-3 rounded-lg border border-red-200/60 dark:border-red-500/15 bg-red-50/20 dark:bg-red-500/5">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{tarefa.titulo}</p>
                                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500">
                                    <span className={cn('font-medium', coresCat[tarefa.statusCategoria])}>{tarefa.status}</span>
                                    <span>·</span>
                                    <span>{tarefa.departamento || 'Sem depto'}</span>
                                    {tarefa.executor && tarefa.executor !== 'Nao atribuido' && <><span>·</span><span>{nomeExibicao(tarefa.executor)}</span></>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 text-[10px] font-bold">{tarefa.violacoes.length}</span>
                                  {tarefa.notionUrl && (
                                    <a href={tarefa.notionUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-1">
                                      Notion <ExternalLink className="h-3 w-3" />
                                    </a>
                                  )}
                                </div>
                              </div>
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {tarefa.violacoes.map((v, i) => (
                                  <span key={i} className={cn(
                                    'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium',
                                    v.tipo === 'proibido'
                                      ? 'bg-orange-100 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300'
                                      : 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300',
                                  )}>
                                    {v.tipo === 'proibido' ? '⚠' : '✕'} {v.campo}: {v.regra}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              );
            })()}
          </div>
        </TabsContent>

      </Tabs>

    </div>
  );
}
