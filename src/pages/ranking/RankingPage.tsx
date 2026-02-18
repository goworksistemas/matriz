import { useState, useCallback, useEffect } from 'react';
import { Target, Trophy, Loader2, AlertCircle, RefreshCw, Download, Clock } from 'lucide-react';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { DashboardMetaGlobal } from './pages/DashboardMetaGlobal';
import { DashboardCompeticao } from './pages/DashboardCompeticao';
import { useRankingData } from './hooks/useRankingData';
import { useRankingFilters } from './hooks/useRankingFilters';
import { useAuditLog } from '@/hooks/useAuditLog';

export function RankingPage() {
  const { log } = useAuditLog();
  const [activeTab, setActiveTab] = useState('meta-global');

  // Carregar dados do Supabase
  const {
    deals,
    lineItems,
    metas,
    ultimaAtualizacao,
    isLoading,
    error,
    refetch,
  } = useRankingData();

  // Log de acesso ao relatório
  useEffect(() => { log('view_report', 'report', 'ranking'); }, [log]);

  const dataAtualizacaoFormatada = ultimaAtualizacao
    ? format(new Date(ultimaAtualizacao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    : null;

  const {
    filtrosGlobal,
    updateFiltroGlobal,
    resetFiltrosGlobal,
    anosDisponiveis,
    kpisMetaGlobal,
    dealsGanhosAno,
    dadosGraficoMensalRevenue,
    dadosGraficoMensalSeats,
    rankingCompeticao,
  } = useRankingFilters(deals, lineItems, metas);

  // Exportar Excel — Meta Global
  const handleExportExcelMeta = useCallback(() => {
    const dadosExport = dealsGanhosAno.map(d => ({
      'Nome do Deal': d.dealName,
      'Valor': d.amount,
      'Data Fechamento': d.closeDate || '',
      'Pipeline': d.pipelineNome,
      'Responsável': d.ownerNome,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dadosExport);
    ws['!cols'] = [
      { wch: 40 }, { wch: 15 }, { wch: 15 },
      { wch: 25 }, { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Meta Global');
    XLSX.writeFile(wb, `meta_global_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`);
    log('export_excel', 'report', 'ranking', { tab: 'meta-global', records: dealsGanhosAno.length });
  }, [dealsGanhosAno, log]);

  const handleExportExcelCompeticao = useCallback(() => {
    const dadosExport = rankingCompeticao.map(v => ({
      'Posicao': v.ranking,
      'Vendedor': v.ownerNome,
      'Seats (c/ cap)': v.seatsCapped,
      'Seats (bruto)': v.seatsRaw,
      'Deals': v.dealsCount,
      'Meta Minima': v.metaMinima,
      'Status': v.status,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dadosExport);
    ws['!cols'] = [
      { wch: 8 }, { wch: 25 }, { wch: 15 },
      { wch: 15 }, { wch: 8 }, { wch: 12 }, { wch: 30 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Competicao');
    XLSX.writeFile(wb, `competicao_${filtrosGlobal.ano}_${filtrosGlobal.mes}_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`);
    log('export_excel', 'report', 'ranking', { tab: 'competicao', ano: filtrosGlobal.ano, mes: filtrosGlobal.mes, records: rankingCompeticao.length });
  }, [rankingCompeticao, filtrosGlobal, log]);

  const handleExportExcel = useCallback(() => {
    if (activeTab === 'meta-global') {
      handleExportExcelMeta();
    } else {
      handleExportExcelCompeticao();
    }
  }, [activeTab, handleExportExcelMeta, handleExportExcelCompeticao]);

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
                {deals.filter(d => d.isClosedWon).length} deals ganhos
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
            <TabsTrigger value="meta-global">
              <Target className="h-4 w-4 mr-2" />
              Cultura e Meta Global
            </TabsTrigger>
            <TabsTrigger value="competicao">
              <Trophy className="h-4 w-4 mr-2" />
              Competição Comercial
            </TabsTrigger>
          </TabsList>

          <TabsContent value="meta-global">
            <DashboardMetaGlobal
              metas={metas}
              filtrosGlobal={filtrosGlobal}
              updateFiltroGlobal={updateFiltroGlobal}
              resetFiltrosGlobal={resetFiltrosGlobal}
              anosDisponiveis={anosDisponiveis}
              kpisMetaGlobal={kpisMetaGlobal}
              dadosGraficoMensalRevenue={dadosGraficoMensalRevenue}
              dadosGraficoMensalSeats={dadosGraficoMensalSeats}
              onMetaSaved={refetch}
            />
          </TabsContent>

          <TabsContent value="competicao">
            <DashboardCompeticao
              rankingCompeticao={rankingCompeticao}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
