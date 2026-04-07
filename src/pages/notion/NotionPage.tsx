import { useCallback, useEffect, useMemo, useState } from 'react';
import { Clock, Loader2, AlertCircle, RefreshCw, Download, RotateCcw, Search, Calendar, CalendarRange } from 'lucide-react';
import { format } from 'date-fns';
import { exportToExcel } from '@/lib/exportExcel';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/Button';
import { Select, SelectItem } from '@/components/ui/Select';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { ListagemTarefas } from './pages/ListagemTarefas';
import { PainelExecutivo } from './pages/PainelExecutivo';
import { useNotionData } from './hooks/useNotionData';
import { useNotionFilters } from './hooks/useNotionFilters';
import { useAuditLog } from '@/hooks/useAuditLog';

export function NotionPage() {
  const { log } = useAuditLog();

  const {
    tarefas,
    comentarios,
    statusUnicos,
    prioridadesUnicas,
    departamentosUnicos,
    executoresUnicos,
    ultimaAtualizacao,
    isLoading,
    error,
    refetch,
  } = useNotionData();

  useEffect(() => { log('view_report', 'report', 'notion'); }, [log]);

  const dataAtualizacaoFormatada = ultimaAtualizacao
    ? format(new Date(ultimaAtualizacao), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })
    : null;

  const {
    filtros,
    updateFiltro,
    resetFiltros,
    hasActiveFilters,
    tarefasFiltradas,
    kpis,
    dadosGraficoStatus,
    dadosGraficoPrioridade,
    dadosGraficoExecutores,
    serieConclucoesPorAgente,
    dadosGraficoDepartamento,
    dadosGraficoDepartamentosCriticos,
    topTarefasCriticas,
    insights,
    serieDemandaCapacidade,
    anomaliasConcluidas,
    gargalosCriticos,
    performancePorAgente,
    interacoesPorUsuario,
    serieComentariosPorAgente,
    insightsComentarios,
  } = useNotionFilters(tarefas, comentarios);

  const [periodoTipo, setPeriodoTipo] = useState<string>('');
  const [periodoValor, setPeriodoValor] = useState<string>('');

  const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  const periodosDisponiveis = useMemo(() => {
    const anos = new Set<number>();
    for (const t of tarefas) {
      const d = t.criadoEm || t.dataInicio;
      if (d) anos.add(new Date(d).getFullYear());
    }
    const anosArr = Array.from(anos).sort((a, b) => b - a);
    if (anosArr.length === 0) return [];

    if (periodoTipo === 'ano') {
      return anosArr.map(a => ({ label: String(a), value: String(a), start: `${a}-01-01`, end: `${a}-12-31` }));
    }
    if (periodoTipo === 'semestre') {
      const items: { label: string; value: string; start: string; end: string }[] = [];
      for (const a of anosArr) {
        items.push({ label: `1° Sem ${a}`, value: `${a}-S1`, start: `${a}-01-01`, end: `${a}-06-30` });
        items.push({ label: `2° Sem ${a}`, value: `${a}-S2`, start: `${a}-07-01`, end: `${a}-12-31` });
      }
      return items;
    }
    if (periodoTipo === 'trimestre') {
      const items: { label: string; value: string; start: string; end: string }[] = [];
      for (const a of anosArr) {
        items.push({ label: `1° Tri ${a}`, value: `${a}-Q1`, start: `${a}-01-01`, end: `${a}-03-31` });
        items.push({ label: `2° Tri ${a}`, value: `${a}-Q2`, start: `${a}-04-01`, end: `${a}-06-30` });
        items.push({ label: `3° Tri ${a}`, value: `${a}-Q3`, start: `${a}-07-01`, end: `${a}-09-30` });
        items.push({ label: `4° Tri ${a}`, value: `${a}-Q4`, start: `${a}-10-01`, end: `${a}-12-31` });
      }
      return items;
    }
    if (periodoTipo === 'mes') {
      const items: { label: string; value: string; start: string; end: string }[] = [];
      for (const a of anosArr) {
        for (let m = 11; m >= 0; m--) {
          const mm = String(m + 1).padStart(2, '0');
          const lastDay = new Date(a, m + 1, 0).getDate();
          items.push({ label: `${MESES[m]}/${a}`, value: `${a}-${mm}`, start: `${a}-${mm}-01`, end: `${a}-${mm}-${lastDay}` });
        }
      }
      return items;
    }
    return [];
  }, [periodoTipo, tarefas, MESES]);

  const handlePeriodoTipoChange = useCallback((tipo: string) => {
    setPeriodoTipo(tipo);
    setPeriodoValor('');
    if (!tipo) {
      updateFiltro('dataInicial', null);
      updateFiltro('dataFinal', null);
    }
  }, [updateFiltro]);

  const handlePeriodoValorChange = useCallback((valor: string) => {
    setPeriodoValor(valor);
    if (!valor) {
      updateFiltro('dataInicial', null);
      updateFiltro('dataFinal', null);
      return;
    }
    const periodo = periodosDisponiveis.find(p => p.value === valor);
    if (periodo) {
      updateFiltro('dataInicial', periodo.start);
      updateFiltro('dataFinal', periodo.end);
    }
  }, [periodosDisponiveis, updateFiltro]);

  const limparPeriodo = useCallback(() => {
    setPeriodoTipo('');
    setPeriodoValor('');
    updateFiltro('dataInicial', null);
    updateFiltro('dataFinal', null);
  }, [updateFiltro]);

  const handleExportExcel = useCallback(async () => {
    const dadosExport = tarefasFiltradas.map(t => ({
      'Titulo': t.titulo,
      'Status': t.status,
      'Prioridade': t.prioridade,
      'Executor': t.executor,
      'Solicitante': t.solicitante,
      'Departamento': t.departamento,
      'Tags': t.tags.join(', '),
      'Data Inicio': t.dataInicio || '',
      'Data Fim': t.dataFim || '',
      'Dias Atraso': t.diasAtraso > 0 ? t.diasAtraso : '',
      'Status Prazo': t.statusPrazo,
      'Editado Por': t.editadoPor,
      'Links': t.links,
    }));

    await exportToExcel({
      data: dadosExport,
      sheetName: 'Tarefas Notion',
      fileName: `tarefas_notion_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`,
      columnWidths: [40, 20, 15, 25, 25, 20, 15, 12, 12, 12, 15, 25, 30],
    });
    log('export_excel', 'report', 'notion', { records: tarefasFiltradas.length });
  }, [tarefasFiltradas, log]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 text-primary-500 animate-spin" />
          <p className="text-gray-500 text-sm">Carregando tarefas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <AlertCircle className="h-10 w-10 text-red-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Erro ao carregar dados</h2>
          <p className="text-sm text-gray-500">{error}</p>
          <Button onClick={refetch} variant="primary">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      {/* Toolbar */}
      <div className="sticky top-0 z-40 border-b border-gray-200 dark:border-white/[0.04] bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-3 text-[11px] text-gray-500 dark:text-gray-600">
            {dataAtualizacaoFormatada && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Atualizado: {dataAtualizacaoFormatada}
              </span>
            )}
            <div className="hidden lg:flex items-center gap-2">
              {filtros.filtroCard && (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] font-medium">
                  Filtrando: {{
                    ativas: 'Ativas',
                    vencidas: 'Atrasadas',
                    vence_hoje: 'Vencem Hoje',
                    conclusao: 'Concluídas',
                    concluidas: 'Concluídas',
                    canceladas: 'Canceladas',
                    stand_by: 'Stand-by',
                    sem_prazo: 'Sem Prazo',
                    sem_dono: 'Sem Responsável',
                  }[filtros.filtroCard]}
                </span>
              )}
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-500/10 ring-1 ring-primary-200 dark:ring-primary-500/20">
                <span className="text-[11px] font-medium text-primary-600 dark:text-primary-400">
                  {tarefasFiltradas.length} tarefas
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={handleExportExcel} variant="secondary" size="sm" title="Exportar para Excel">
              <Download className="h-3.5 w-3.5 mr-1.5" />
              <span className="hidden sm:inline text-xs">Excel</span>
            </Button>
            <Button onClick={refetch} variant="primary" size="sm">
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              <span className="text-xs">Atualizar</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Filtros */}
        <div className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50 p-4 mb-6">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={filtros.busca}
                onChange={(e) => updateFiltro('busca', e.target.value)}
                placeholder="Buscar tarefa por nome..."
                className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
              />
            </div>

            <div className="flex flex-wrap items-end gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Status</label>
                <MultiSelect
                  options={statusUnicos}
                  selected={filtros.status}
                  onChange={(v) => updateFiltro('status', v)}
                  placeholder="Todos"
                  searchPlaceholder="Buscar status..."
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Prioridade</label>
                <MultiSelect
                  options={prioridadesUnicas}
                  selected={filtros.prioridade}
                  onChange={(v) => updateFiltro('prioridade', v)}
                  placeholder="Todas"
                  searchPlaceholder="Buscar prioridade..."
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Departamento</label>
                <MultiSelect
                  options={departamentosUnicos}
                  selected={filtros.departamento}
                  onChange={(v) => updateFiltro('departamento', v)}
                  placeholder="Todos"
                  searchPlaceholder="Buscar departamento..."
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Executor</label>
                <MultiSelect
                  options={executoresUnicos}
                  selected={filtros.executor}
                  onChange={(v) => updateFiltro('executor', v)}
                  placeholder="Todos"
                  searchPlaceholder="Buscar executor..."
                />
              </div>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={resetFiltros} className="mb-0.5">
                  <RotateCcw className="h-4 w-4 mr-1.5" />
                  Limpar
                </Button>
              )}
            </div>

            <div className="border-t border-gray-100 dark:border-white/[0.04] pt-4">
              <div className="flex flex-wrap items-end gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <CalendarRange className="h-3 w-3" /> Período
                  </label>
                  <Select value={periodoTipo} onValueChange={handlePeriodoTipoChange} placeholder="Selecione..." className="min-w-[150px]">
                    <SelectItem value="">Nenhum</SelectItem>
                    <SelectItem value="ano">Ano</SelectItem>
                    <SelectItem value="semestre">Semestre</SelectItem>
                    <SelectItem value="trimestre">Trimestre</SelectItem>
                    <SelectItem value="mes">Mês</SelectItem>
                  </Select>
                </div>

                {periodoTipo && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Valor</label>
                    <Select value={periodoValor} onValueChange={handlePeriodoValorChange} placeholder="Selecione..." className="min-w-[160px]">
                      <SelectItem value="">Todos</SelectItem>
                      {periodosDisponiveis.map(p => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </Select>
                  </div>
                )}

                {periodoValor && (
                  <Button variant="ghost" size="sm" onClick={limparPeriodo} className="mb-0.5">
                    <RotateCcw className="h-3.5 w-3.5 mr-1" />
                    Limpar período
                  </Button>
                )}

                <div className="ml-auto flex items-end gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> De
                    </label>
                    <input
                      type="date"
                      value={filtros.dataInicial || ''}
                      onChange={(e) => { updateFiltro('dataInicial', e.target.value || null); setPeriodoTipo(''); setPeriodoValor(''); }}
                      className="h-9 px-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Até
                    </label>
                    <input
                      type="date"
                      value={filtros.dataFinal || ''}
                      onChange={(e) => { updateFiltro('dataFinal', e.target.value || null); setPeriodoTipo(''); setPeriodoValor(''); }}
                      className="h-9 px-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <PainelExecutivo
            kpis={kpis}
            insights={insights}
            filtros={filtros}
            onFiltroChange={updateFiltro}
            dadosGraficoStatus={dadosGraficoStatus}
            dadosGraficoPrioridade={dadosGraficoPrioridade}
            dadosGraficoExecutores={dadosGraficoExecutores}
            serieConclucoesPorAgente={serieConclucoesPorAgente}
            dadosGraficoDepartamento={dadosGraficoDepartamento}
            dadosGraficoDepartamentosCriticos={dadosGraficoDepartamentosCriticos}
            topTarefasCriticas={topTarefasCriticas}
            serieDemandaCapacidade={serieDemandaCapacidade}
            anomaliasConcluidas={anomaliasConcluidas}
            gargalosCriticos={gargalosCriticos}
            performancePorAgente={performancePorAgente}
            interacoesPorUsuario={interacoesPorUsuario}
            insightsComentarios={insightsComentarios}
            serieComentariosPorAgente={serieComentariosPorAgente}
            tarefasFiltradas={tarefasFiltradas}
          />
          <ListagemTarefas tarefas={tarefasFiltradas} />
        </div>
      </div>
    </div>
  );
}
