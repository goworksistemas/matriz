import { useState, useCallback, useEffect, useRef } from 'react';
import { LayoutDashboard, Users, UserCheck, Loader2, AlertCircle, RefreshCw, CheckCircle, XCircle, Download, Clock } from 'lucide-react';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { VisaoGeral } from './pages/VisaoGeral';
import { ComissoesVendedores } from './pages/ComissoesVendedores';
import { ComissoesSDR } from './pages/ComissoesSDR';
import { useSupabaseData } from './hooks/useSupabaseData';
import { useFilters } from './hooks/useFilters';
import { useComissoesCalculations } from './hooks/useComissoesCalculations';
import { useAuditLog } from '@/hooks/useAuditLog';

// URL do Webhook N8N para sincronização
const N8N_WEBHOOK_URL = 'https://flux.gowork.com.br/webhook/atualizar_comissoes';

type SyncStatus = 'idle' | 'loading' | 'success' | 'error';

interface SyncState {
  status: SyncStatus;
  message: string | null;
}

export function ComissoesPage() {
  const { log } = useAuditLog();
  const [activeTab, setActiveTab] = useState('visao-geral');
  const [syncState, setSyncState] = useState<SyncState>({ status: 'idle', message: null });
  const [syncProgress, setSyncProgress] = useState(0);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animação da barra de progresso
  useEffect(() => {
    if (syncState.status === 'loading') {
      setSyncProgress(0);
      const duration = 45000;
      const interval = 100;
      const increment = (100 / duration) * interval;
      
      progressIntervalRef.current = setInterval(() => {
        setSyncProgress(prev => {
          if (prev >= 95) return prev + (increment * 0.1);
          if (prev >= 80) return prev + (increment * 0.3);
          return Math.min(prev + increment, 99);
        });
      }, interval);
    } else {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      if (syncState.status === 'success') {
        setSyncProgress(100);
        setTimeout(() => setSyncProgress(0), 500);
      } else {
        setSyncProgress(0);
      }
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [syncState.status]);

  // Carregar dados do Supabase
  const {
    comissoes,
    produtosUnicos,
    etapasUnicas,
    vendedoresUnicos,
    sdrsUnicos,
    ultimaAtualizacao,
    isLoading,
    error,
    refetch,
  } = useSupabaseData();

  // Log de acesso ao relatório (apenas uma vez)
  useEffect(() => { log('view_report', 'report', 'comissoes'); }, [log]);

  const dataAtualizacaoFormatada = ultimaAtualizacao 
    ? format(new Date(ultimaAtualizacao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    : null;

  // Sincronizar dados via N8N
  const handleSyncHubSpot = useCallback(async () => {
    setSyncState({ status: 'loading', message: null });
    
    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          source: 'dashboard-comissoes'
        }),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setSyncState({ status: 'success', message: 'Dados atualizados com sucesso!' });
        log('sync_data', 'report', 'comissoes');
        setTimeout(() => {
          refetch();
          setSyncState({ status: 'idle', message: null });
        }, 3000);
      } else {
        setSyncState({ status: 'error', message: data.message || 'Erro ao atualizar. Tente novamente.' });
        setTimeout(() => setSyncState({ status: 'idle', message: null }), 5000);
      }
    } catch (err) {
      console.error('Erro na sincronização:', err);
      setSyncState({ status: 'error', message: 'Erro de conexão. Verifique sua internet.' });
      setTimeout(() => setSyncState({ status: 'idle', message: null }), 5000);
    }
  }, [refetch]);

  // Filtros
  const {
    comissoesFiltradas,
    comissoesFiltradosVendedor,
    comissoesFiltradosSDR,
    filtrosGlobais,
    filtrosVendedor,
    filtrosSDR,
    updateFiltroGlobal,
    updateFiltroVendedor,
    updateFiltroSDR,
    resetFiltrosGlobais,
    resetFiltrosVendedor,
    resetFiltrosSDR,
  } = useFilters(comissoes);

  // Exportar Excel
  const handleExportExcel = useCallback(() => {
    const dadosExport = comissoesFiltradas.map(c => ({
      'Cliente': c.nomeCliente,
      'Vendedor': c.proprietarioNome,
      'SDR': c.sdrNome,
      'Produto': c.produto,
      'Valor Negócio': c.valorNegocio,
      'Posições': c.posicoes,
      'Posições Calc.': c.posicoesCalculadas,
      'Peso': c.peso,
      'Porcentagem': c.porcentagem,
      'Comissão Simples': c.comissaoSimples,
      'Comissão SDR': c.comissaoSimplesSDR,
      'Status Financeiro': c.statusFinanceiro,
      'Status Comercial': c.statusComercial,
      'Status Jurídico': c.statusJuridico,
      'Etapa': c.nomeEtapa,
      'Venda de Impacto': c.vendaImpacto ? 'Sim' : 'Não',
      'Tipo Produto': c.tipoProduto === 'fisico' ? 'Físico' : 'Virtual',
      'Data Fechamento': c.dataFechamento || '',
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dadosExport);
    ws['!cols'] = [
      { wch: 30 }, { wch: 20 }, { wch: 20 }, { wch: 20 },
      { wch: 15 }, { wch: 12 }, { wch: 14 }, { wch: 10 },
      { wch: 12 }, { wch: 16 }, { wch: 14 }, { wch: 18 },
      { wch: 18 }, { wch: 16 }, { wch: 20 }, { wch: 15 },
      { wch: 12 }, { wch: 15 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Comissões');
    XLSX.writeFile(wb, `comissoes_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`);
    log('export_excel', 'report', 'comissoes', { records: comissoesFiltradas.length });
  }, [comissoesFiltradas, log]);

  // Cálculos
  const { kpis, dadosGraficos } = useComissoesCalculations(comissoesFiltradas);
  const { resumoVendedores, resumoConsolidado } = useComissoesCalculations(comissoesFiltradosVendedor);
  const { resumoSDRs: resumoSDRsFiltrados } = useComissoesCalculations(comissoesFiltradosSDR);

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
      {/* Toast */}
      {(syncState.status === 'success' || syncState.status === 'error') && syncState.message && (
        <div className="fixed top-4 right-4 z-[100]">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-sm ${
            syncState.status === 'success' 
              ? 'bg-emerald-500/10 border border-emerald-500/20 ring-1 ring-emerald-500/10' 
              : 'bg-red-500/10 border border-red-500/20 ring-1 ring-red-500/10'
          }`}>
            {syncState.status === 'success' && <CheckCircle className="h-4 w-4 text-emerald-400" />}
            {syncState.status === 'error' && <XCircle className="h-4 w-4 text-red-400" />}
            <span className="text-sm font-medium text-gray-100">{syncState.message}</span>
          </div>
        </div>
      )}

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
              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">{comissoes.length} comissões</span>
            </div>
          </div>

            <div className="flex items-center gap-2">
              <Button 
                onClick={handleExportExcel} 
                variant="secondary" 
                size="sm"
                disabled={comissoesFiltradas.length === 0}
              title="Exportar para Excel"
              >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              <span className="hidden sm:inline text-xs">Excel</span>
              </Button>

              {syncState.status === 'loading' ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-white/[0.04] rounded-lg ring-1 ring-gray-200 dark:ring-white/[0.08]">
                <RefreshCw className="h-3.5 w-3.5 text-primary-400 animate-spin" />
                <div className="w-16 h-1 bg-gray-200 dark:bg-white/[0.06] rounded-full overflow-hidden">
                        <div 
                    className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-100"
                          style={{ width: `${syncProgress}%` }}
                        />
                </div>
                <span className="text-[11px] text-gray-500 font-mono">{Math.round(syncProgress)}%</span>
              </div>
            ) : (
              <Button onClick={handleSyncHubSpot} variant="primary" size="sm">
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                <span className="text-xs">Sincronizar</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="visao-geral">
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="vendedores">
              <Users className="h-4 w-4 mr-2" />
              Comissões Vendedores
            </TabsTrigger>
            <TabsTrigger value="sdr">
              <UserCheck className="h-4 w-4 mr-2" />
              Comissões SDR
            </TabsTrigger>
          </TabsList>

          <TabsContent value="visao-geral">
            <VisaoGeral
              comissoesFiltradas={comissoesFiltradas}
              filtrosGlobais={filtrosGlobais}
              updateFiltroGlobal={updateFiltroGlobal}
              resetFiltrosGlobais={resetFiltrosGlobais}
              dadosGraficos={dadosGraficos}
              kpis={kpis}
              vendedoresUnicos={vendedoresUnicos}
              produtosUnicos={produtosUnicos}
            />
          </TabsContent>

          <TabsContent value="vendedores">
            <ComissoesVendedores
              comissoesFiltradas={comissoesFiltradosVendedor}
              filtrosVendedor={filtrosVendedor}
              updateFiltroVendedor={updateFiltroVendedor}
              resetFiltrosVendedor={resetFiltrosVendedor}
              resumoVendedores={resumoVendedores}
              resumoConsolidado={resumoConsolidado}
              vendedoresUnicos={vendedoresUnicos}
              etapasUnicas={etapasUnicas}
            />
          </TabsContent>

          <TabsContent value="sdr">
            <ComissoesSDR
              comissoesFiltradas={comissoesFiltradosSDR}
              filtrosSDR={filtrosSDR}
              updateFiltroSDR={updateFiltroSDR}
              resetFiltrosSDR={resetFiltrosSDR}
              resumoSDRs={resumoSDRsFiltrados}
              sdrsUnicos={sdrsUnicos}
              etapasUnicas={etapasUnicas}
            />
          </TabsContent>
        </Tabs>
        </div>
    </div>
  );
}
