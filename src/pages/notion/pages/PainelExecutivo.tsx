import { AlertTriangle, Clock3, CheckCircle2, ClipboardList, UserCog, CalendarX, Layers3, Building2, ExternalLink, XCircle, PauseCircle, TrendingUp, Users2, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { BarChartComponent } from '@/components/charts/BarChartComponent';
import { cn } from '@/lib/utils';
import type { DadosGrafico } from '@/types';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, LabelList, Cell } from 'recharts';
import type { FiltrosNotion, InsightNotion, KPIsNotion, SerieDemandaCapacidade } from '../hooks/useNotionFilters';
import type { TarefaProcessada } from '../services/api';
import { useCallback } from 'react';

interface PainelExecutivoProps {
  kpis: KPIsNotion;
  insights: InsightNotion;
  filtros: FiltrosNotion;
  onFiltroChange: <K extends keyof FiltrosNotion>(key: K, value: FiltrosNotion[K]) => void;
  dadosGraficoStatus: DadosGrafico[];
  dadosGraficoPrioridade: DadosGrafico[];
  dadosGraficoPrazo: DadosGrafico[];
  dadosGraficoExecutores: DadosGrafico[];
  dadosGraficoDepartamentosCriticos: DadosGrafico[];
  serieDemandaCapacidade: SerieDemandaCapacidade[];
  topSolicitantes: DadosGrafico[];
  gargalosCriticos: TarefaProcessada[];
  topTarefasCriticas: TarefaProcessada[];
}

function classeRisco(valor: number): string {
  if (valor >= 40) return 'text-red-600 dark:text-red-400';
  if (valor >= 20) return 'text-amber-600 dark:text-amber-400';
  return 'text-emerald-600 dark:text-emerald-400';
}

function corLeadTimePrioridade(prioridade: string): string {
  if (prioridade === 'Urgente') return '#ef4444';
  if (prioridade === 'Importante') return '#f59e0b';
  if (prioridade === 'Media') return '#06b6d4';
  if (prioridade === 'Baixa') return '#10b981';
  return '#6b7280';
}

export function PainelExecutivo({
  kpis,
  insights,
  filtros,
  onFiltroChange,
  dadosGraficoStatus,
  dadosGraficoPrioridade,
  dadosGraficoPrazo,
  dadosGraficoExecutores,
  dadosGraficoDepartamentosCriticos,
  serieDemandaCapacidade,
  topSolicitantes,
  gargalosCriticos,
  topTarefasCriticas,
}: PainelExecutivoProps) {
  const toggleFiltro = useCallback(<K extends keyof FiltrosNotion>(key: K, value: string) => {
    const novoValor = filtros[key] === value ? '' : value;
    onFiltroChange(key, novoValor as FiltrosNotion[K]);
  }, [filtros, onFiltroChange]);

  const handleFiltroStatus = useCallback((value: string) => {
    if (value === 'Outros') return;
    toggleFiltro('status', value);
  }, [toggleFiltro]);

  const dadosLeadTimePorPrioridade = insights.leadTimePorPrioridade
    .filter((item) => item.totalTarefas > 0)
    .map((item) => ({
      ...item,
      value: item.mediaDias,
      detalhe: `${item.concluidasComData}/${item.totalTarefas} concluidas com data`,
    }));

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-primary-200/60 dark:border-primary-500/20 bg-gradient-to-r from-primary-50 to-white dark:from-primary-500/10 dark:to-gray-900/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-primary-700 dark:text-primary-300">Painel Executivo Notion</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Panorama operacional para acompanhamento em tempo real.
            </p>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Risco do quadro: <span className={cn('font-semibold', classeRisco(insights.riscoGeral))}>{insights.riscoGeral}%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-6 gap-4">
        <div className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50 p-4">
          <div className="flex items-center gap-2 mb-1 text-gray-500 text-xs"><ClipboardList className="h-4 w-4 text-primary-500" /> Ativas</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{kpis.tarefasAtivas}</div>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50 p-4">
          <div className="flex items-center gap-2 mb-1 text-gray-500 text-xs"><AlertTriangle className="h-4 w-4 text-red-500" /> Vencidas</div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{kpis.vencidas}</div>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50 p-4">
          <div className="flex items-center gap-2 mb-1 text-gray-500 text-xs"><Clock3 className="h-4 w-4 text-amber-500" /> Vence Hoje</div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{kpis.venceHoje}</div>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50 p-4">
          <div className="flex items-center gap-2 mb-1 text-gray-500 text-xs"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Conclusao</div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{kpis.percentConcluidas}%</div>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50 p-4">
          <div className="flex items-center gap-2 mb-1 text-gray-500 text-xs"><CheckCircle2 className="h-4 w-4 text-sky-500" /> Concluidas</div>
          <div className="text-2xl font-bold text-sky-600 dark:text-sky-400">{kpis.concluidas}</div>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50 p-4">
          <div className="flex items-center gap-2 mb-1 text-gray-500 text-xs"><XCircle className="h-4 w-4 text-rose-500" /> Canceladas</div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{kpis.canceladas}</div>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50 p-4">
          <div className="flex items-center gap-2 mb-1 text-gray-500 text-xs"><PauseCircle className="h-4 w-4 text-indigo-500" /> Stand by</div>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{kpis.emStandBy}</div>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50 p-4">
          <div className="flex items-center gap-2 mb-1 text-gray-500 text-xs"><CalendarX className="h-4 w-4 text-violet-500" /> Sem Prazo</div>
          <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">{kpis.semData}</div>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50 p-4">
          <div className="flex items-center gap-2 mb-1 text-gray-500 text-xs"><UserCog className="h-4 w-4 text-sky-500" /> Sem Dono</div>
          <div className="text-2xl font-bold text-sky-600 dark:text-sky-400">{insights.tarefasSemResponsavel}</div>
        </div>
        <div className="col-span-2 xl:col-span-4 rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50 p-4">
          <div className="flex items-center gap-2 mb-1 text-gray-500 text-xs"><Clock3 className="h-4 w-4 text-cyan-500" /> Lead Time Medio</div>
          {dadosLeadTimePorPrioridade.length === 0 ? (
            <div className="h-[180px] flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
              Sem tarefas concluidas com data para calcular o lead time.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={190}>
              <BarChart
                data={dadosLeadTimePorPrioridade}
                layout="vertical"
                margin={{ top: 8, right: 28, left: 12, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis type="number" stroke="var(--chart-axis)" fontSize={11} />
                <YAxis
                  type="category"
                  dataKey="prioridade"
                  stroke="var(--chart-axis)"
                  fontSize={11}
                  width={92}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--chart-tooltip-bg)',
                    border: '1px solid var(--chart-tooltip-border)',
                    borderRadius: '8px',
                    color: 'var(--chart-tooltip-text)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                  formatter={(value: number, _name, item) => [`${value} dias`, `${item.payload.prioridade} (${item.payload.detalhe})`]}
                />
                <Bar dataKey="value" radius={[4, 4, 4, 4]}>
                  <LabelList dataKey="value" position="right" offset={8} fill="var(--chart-axis)" fontSize={11} formatter={(value: number) => `${value}d`} />
                  {dadosLeadTimePorPrioridade.map((item) => (
                    <Cell key={`leadtime-${item.prioridade}`} fill={corLeadTimePrioridade(item.prioridade)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Media geral: {insights.tarefasConcluidasComData > 0 ? `${insights.leadTimeMedioDias}d` : '--'} ({insights.tarefasConcluidasComData} concluidas com data)
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-4 w-4 text-primary-500" /> Demanda vs Capacidade (12 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            {serieDemandaCapacidade.length === 0 ? (
              <div className="h-[280px] flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                Sem dados suficientes para a serie mensal.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={serieDemandaCapacidade} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                  <XAxis dataKey="mes" stroke="var(--chart-axis)" fontSize={11} />
                  <YAxis stroke="var(--chart-axis)" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--chart-tooltip-bg)',
                      border: '1px solid var(--chart-tooltip-border)',
                      borderRadius: '8px',
                      color: 'var(--chart-tooltip-text)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                    itemStyle={{ color: 'var(--chart-tooltip-text)' }}
                  />
                  <Line type="monotone" dataKey="criadas" name="Criadas" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="concluidas" name="Concluidas" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card className="border-red-200/60 dark:border-red-500/20 bg-red-50/30 dark:bg-red-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Activity className="h-4 w-4 text-red-500" /> Backlog Critico em Stand-by</CardTitle>
          </CardHeader>
          <CardContent>
            {gargalosCriticos.length === 0 ? (
              <div className="h-[280px] flex items-center justify-center text-sm text-emerald-600 dark:text-emerald-400">
                Sem gargalos criticos no filtro atual.
              </div>
            ) : (
              <div className="space-y-2 max-h-[280px] overflow-auto pr-1">
                {gargalosCriticos.slice(0, 10).map((tarefa) => (
                  <div key={tarefa.id} className="p-2.5 rounded-lg border border-red-200/60 dark:border-red-500/20 bg-red-50/40 dark:bg-red-500/5">
                    <p className="text-xs font-medium text-gray-900 dark:text-gray-100 line-clamp-2">{tarefa.titulo}</p>
                    <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300">STAND-BY</span>
                        <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300">{tarefa.prioridade}</span>
                      </div>
                      {tarefa.notionUrl && (
                        <a
                          href={tarefa.notionUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:underline"
                        >
                          Abrir <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Clock3 className="h-4 w-4 text-primary-500" /> Saude dos Prazos</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChartComponent data={dadosGraficoPrazo} height={260} layout="horizontal" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers3 className="h-4 w-4 text-primary-500" /> Distribuicao por Status
              {filtros.status && <span className="ml-2 text-xs font-normal text-primary-500">({filtros.status})</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChartComponent
              data={dadosGraficoStatus}
              height={260}
              layout="vertical"
              onItemClick={handleFiltroStatus}
              activeItem={filtros.status || undefined}
            />
          </CardContent>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4 text-primary-500" /> Prioridades
              {filtros.prioridade && <span className="ml-2 text-xs font-normal text-primary-500">({filtros.prioridade})</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChartComponent
              data={dadosGraficoPrioridade}
              height={280}
              layout="vertical"
              onItemClick={(name) => toggleFiltro('prioridade', name)}
              activeItem={filtros.prioridade || undefined}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-primary-500" /> Departamentos em Alerta
              {filtros.departamento && <span className="ml-2 text-xs font-normal text-primary-500">({filtros.departamento})</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChartComponent
              data={dadosGraficoDepartamentosCriticos.length > 0 ? dadosGraficoDepartamentosCriticos : [{ name: 'Sem atrasos', value: 0 }]}
              height={300}
              layout="vertical"
              onItemClick={(name) => name !== 'Sem atrasos' && toggleFiltro('departamento', name)}
              activeItem={filtros.departamento || undefined}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Users2 className="h-4 w-4 text-primary-500" /> Top Solicitantes</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChartComponent data={topSolicitantes} height={300} layout="vertical" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserCog className="h-4 w-4 text-primary-500" /> Carga por Responsavel
            {filtros.executor && <span className="ml-2 text-xs font-normal text-primary-500">({filtros.executor})</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BarChartComponent
            data={dadosGraficoExecutores}
            height={Math.max(260, dadosGraficoExecutores.length * 48)}
            layout="vertical"
            categoryAxisWidth={220}
            categoryLabelMaxChars={32}
            onItemClick={(name) => toggleFiltro('executor', name)}
            activeItem={filtros.executor || undefined}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2 text-base">
            <span className="inline-flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-500" /> Top Tarefas Criticas</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Atraso medio: {insights.atrasoMedioDias}d • Sem prazo: {insights.taxaSemPrazo}% • Fechamento: {insights.taxaFechamento}% • Stand by: {insights.taxaStandBy}%
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topTarefasCriticas.length === 0 ? (
            <div className="h-20 flex items-center justify-center text-sm text-emerald-600 dark:text-emerald-400">
              Nenhuma tarefa atrasada no filtro atual.
            </div>
          ) : (
            <div className="space-y-2">
              {topTarefasCriticas.map(tarefa => (
                <div
                  key={tarefa.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border border-red-200/60 dark:border-red-500/20 bg-red-50/40 dark:bg-red-500/5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{tarefa.titulo}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {tarefa.executor} • {tarefa.departamento}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-red-700 dark:text-red-400">{tarefa.diasAtraso}d atrasada</span>
                    {tarefa.notionUrl && (
                      <a
                        href={tarefa.notionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline"
                      >
                        Abrir <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
