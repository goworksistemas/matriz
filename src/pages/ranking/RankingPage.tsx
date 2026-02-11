import { useState, useCallback, useEffect } from 'react';
import { BarChart3, Megaphone, Loader2, AlertCircle, RefreshCw, Download, Clock } from 'lucide-react';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { DashboardVendas } from './pages/DashboardVendas';
import { DashboardMarketing } from './pages/DashboardMarketing';
import { useRankingData } from './hooks/useRankingData';
import { useRankingFilters } from './hooks/useRankingFilters';
import { useAuditLog } from '@/hooks/useAuditLog';

export function RankingPage() {
  const { log } = useAuditLog();
  const [activeTab, setActiveTab] = useState('vendas');

  // Carregar dados do Supabase
  const {
    deals,
    leads,
    metas,
    vendedoresUnicos,
    pipelinesUnicos,
    ultimaAtualizacao,
    isLoading,
    error,
    refetch,
  } = useRankingData();

  // Log de acesso ao relatório (apenas uma vez)
  useEffect(() => { log('view_report', 'report', 'ranking'); }, [log]);

  const dataAtualizacaoFormatada = ultimaAtualizacao
    ? format(new Date(ultimaAtualizacao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    : null;

  // Filtros
  const {
    dealsGanhosAno,
    dealsGanhosMes,
    leadsFiltrados,
    filtrosVendas,
    filtrosMarketing,
    updateFiltroVendas,
    updateFiltroMarketing,
    resetFiltrosVendas,
    resetFiltrosMarketing,
  } = useRankingFilters(deals, leads);

  // Exportar Excel — Vendas
  const handleExportExcelVendas = useCallback(() => {
    const dadosExport = dealsGanhosAno.map(d => ({
      'Nome do Deal': d.dealName,
      'Valor': d.amount,
      'Data Fechamento': d.closeDate || '',
      'Pipeline': d.pipelineNome,
      'Responsável': d.ownerNome,
      'Ganho': d.isClosedWon ? 'Sim' : 'Não',
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dadosExport);
    ws['!cols'] = [
      { wch: 40 }, { wch: 15 }, { wch: 15 },
      { wch: 25 }, { wch: 20 }, { wch: 8 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Vendas');
    XLSX.writeFile(wb, `ranking_vendas_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`);
    log('export_excel', 'report', 'ranking', { tab: 'vendas', records: dealsGanhosAno.length });
  }, [dealsGanhosAno, log]);

  // Exportar Excel — Marketing
  const handleExportExcelMarketing = useCallback(() => {
    const dadosExport = leadsFiltrados.map(l => ({
      'Nome': l.nome,
      'Email': l.email || '',
      'Estágio': l.lifecycleStage || 'Não definido',
      'Válido': l.isValido ? 'Sim' : 'Não',
      'Responsável': l.ownerNome,
      'Data Criação': l.createdAt || '',
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dadosExport);
    ws['!cols'] = [
      { wch: 30 }, { wch: 30 }, { wch: 20 },
      { wch: 8 }, { wch: 20 }, { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Marketing');
    XLSX.writeFile(wb, `ranking_marketing_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`);
    log('export_excel', 'report', 'ranking', { tab: 'marketing', records: leadsFiltrados.length });
  }, [leadsFiltrados, log]);

  const handleExportExcel = useCallback(() => {
    if (activeTab === 'vendas') {
      handleExportExcelVendas();
    } else {
      handleExportExcelMarketing();
    }
  }, [activeTab, handleExportExcelVendas, handleExportExcelMarketing]);

  const totalRegistros = activeTab === 'vendas' ? deals.length : leads.length;

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 text-primary-500 animate-spin" />
          <p className="text-gray-500 text-sm">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <AlertCircle className="h-10 w-10 text-red-500" />
          <h2 className="text-lg font-semibold text-gray-100">Erro ao carregar dados</h2>
          <p className="text-sm text-gray-400">{error}</p>
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
            <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 ring-1 ring-emerald-200 dark:ring-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                {totalRegistros} {activeTab === 'vendas' ? 'deals' : 'leads'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleExportExcel}
              variant="secondary"
              size="sm"
              title="Exportar para Excel"
            >
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
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="vendas">
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard Vendas
            </TabsTrigger>
            <TabsTrigger value="marketing">
              <Megaphone className="h-4 w-4 mr-2" />
              Dashboard Marketing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vendas">
            <DashboardVendas
              dealsGanhosAno={dealsGanhosAno}
              dealsGanhosMes={dealsGanhosMes}
              metas={metas}
              filtrosVendas={filtrosVendas}
              updateFiltroVendas={updateFiltroVendas}
              resetFiltrosVendas={resetFiltrosVendas}
              vendedoresUnicos={vendedoresUnicos}
              pipelinesUnicos={pipelinesUnicos}
              onMetaSaved={refetch}
            />
          </TabsContent>

          <TabsContent value="marketing">
            <DashboardMarketing
              leadsFiltrados={leadsFiltrados}
              filtrosMarketing={filtrosMarketing}
              updateFiltroMarketing={updateFiltroMarketing}
              resetFiltrosMarketing={resetFiltrosMarketing}
              vendedoresUnicos={vendedoresUnicos}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
