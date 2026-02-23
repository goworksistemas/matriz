import { useCallback, useEffect } from 'react';
import { Clock, Loader2, AlertCircle, RefreshCw, Download, RotateCcw } from 'lucide-react';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/Button';
import { Select, SelectItem } from '@/components/ui/Select';
import { ListagemTarefas } from './pages/ListagemTarefas';
import { PainelExecutivo } from './pages/PainelExecutivo';
import { useNotionData } from './hooks/useNotionData';
import { useNotionFilters } from './hooks/useNotionFilters';
import { useAuditLog } from '@/hooks/useAuditLog';

export function NotionPage() {
  const { log } = useAuditLog();

  const {
    tarefas,
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
    dadosGraficoPrazo,
    dadosGraficoExecutores,
    dadosGraficoDepartamentosCriticos,
    topTarefasCriticas,
    insights,
    serieDemandaCapacidade,
    topSolicitantes,
    gargalosCriticos,
  } = useNotionFilters(tarefas);

  const handleExportExcel = useCallback(() => {
    const dadosExport = tarefasFiltradas.map(t => ({
      'Titulo': t.titulo,
      'Status': t.status,
      'Prioridade': t.prioridade,
      'Executor': t.executor,
      'Solicitante': t.solicitante,
      'Departamento': t.departamento,
      'Data Inicio': t.dataInicio || '',
      'Data Fim': t.dataFim || '',
      'Dias Atraso': t.diasAtraso > 0 ? t.diasAtraso : '',
      'Status Prazo': t.statusPrazo,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dadosExport);
    ws['!cols'] = [
      { wch: 40 }, { wch: 20 }, { wch: 15 }, { wch: 25 },
      { wch: 25 }, { wch: 20 }, { wch: 12 }, { wch: 12 },
      { wch: 12 }, { wch: 15 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Tarefas Notion');
    XLSX.writeFile(wb, `tarefas_notion_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`);
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
            <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-500/10 ring-1 ring-primary-200 dark:ring-primary-500/20">
              <span className="text-[11px] font-medium text-primary-600 dark:text-primary-400">
                {tarefasFiltradas.length} tarefas
              </span>
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
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Status</label>
              <Select value={filtros.status} onValueChange={(v) => updateFiltro('status', v)} placeholder="Todos">
                <SelectItem value="">Todos</SelectItem>
                {statusUnicos.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Prioridade</label>
              <Select value={filtros.prioridade} onValueChange={(v) => updateFiltro('prioridade', v)} placeholder="Todas">
                <SelectItem value="">Todas</SelectItem>
                {prioridadesUnicas.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Departamento</label>
              <Select value={filtros.departamento} onValueChange={(v) => updateFiltro('departamento', v)} placeholder="Todos">
                <SelectItem value="">Todos</SelectItem>
                {departamentosUnicos.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Executor</label>
              <Select value={filtros.executor} onValueChange={(v) => updateFiltro('executor', v)} placeholder="Todos">
                <SelectItem value="">Todos</SelectItem>
                {executoresUnicos.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </Select>
            </div>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={resetFiltros} className="mb-0.5">
                <RotateCcw className="h-4 w-4 mr-1.5" />
                Limpar
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <PainelExecutivo
            kpis={kpis}
            insights={insights}
            dadosGraficoStatus={dadosGraficoStatus}
            dadosGraficoPrioridade={dadosGraficoPrioridade}
            dadosGraficoPrazo={dadosGraficoPrazo}
            dadosGraficoExecutores={dadosGraficoExecutores}
            dadosGraficoDepartamentosCriticos={dadosGraficoDepartamentosCriticos}
            topTarefasCriticas={topTarefasCriticas}
            serieDemandaCapacidade={serieDemandaCapacidade}
            topSolicitantes={topSolicitantes}
            gargalosCriticos={gargalosCriticos}
          />
          <ListagemTarefas tarefas={tarefasFiltradas} />
        </div>
      </div>
    </div>
  );
}
