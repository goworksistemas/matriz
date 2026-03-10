import { useCallback, useEffect } from 'react';
import { Clock, Loader2, AlertCircle, RefreshCw, Download, RotateCcw, Search } from 'lucide-react';
import { format } from 'date-fns';
import { exportToExcel } from '@/lib/exportExcel';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/Button';
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
    dadosGraficoDepartamento,
    dadosGraficoDepartamentosCriticos,
    topTarefasCriticas,
    insights,
    serieDemandaCapacidade,
    gargalosCriticos,
    performancePorAgente,
    interacoesPorUsuario,
    insightsComentarios,
  } = useNotionFilters(tarefas, comentarios);

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
                    stand_by: 'Pausadas',
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
            dadosGraficoDepartamento={dadosGraficoDepartamento}
            dadosGraficoDepartamentosCriticos={dadosGraficoDepartamentosCriticos}
            topTarefasCriticas={topTarefasCriticas}
            serieDemandaCapacidade={serieDemandaCapacidade}
            gargalosCriticos={gargalosCriticos}
            performancePorAgente={performancePorAgente}
            interacoesPorUsuario={interacoesPorUsuario}
            insightsComentarios={insightsComentarios}
          />
          <ListagemTarefas tarefas={tarefasFiltradas} />
        </div>
      </div>
    </div>
  );
}
