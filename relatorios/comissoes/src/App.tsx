import { useState, useCallback } from 'react';
import { LayoutDashboard, Users, UserCheck, Loader2, AlertCircle, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { VisaoGeral } from '@/pages/VisaoGeral';
import { ComissoesVendedores } from '@/pages/ComissoesVendedores';
import { ComissoesSDR } from '@/pages/ComissoesSDR';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useFilters } from '@/hooks/useFilters';
import { useComissoesCalculations } from '@/hooks/useComissoesCalculations';

// URL do Webhook N8N para sincronização
const N8N_WEBHOOK_URL = 'https://flux.gowork.com.br/webhook/atualizar_comissoes';

// Tipos para o estado de sincronização
type SyncStatus = 'idle' | 'loading' | 'success' | 'error';

interface SyncState {
  status: SyncStatus;
  message: string | null;
}

function App() {
  const [activeTab, setActiveTab] = useState('visao-geral');
  const [syncState, setSyncState] = useState<SyncState>({ status: 'idle', message: null });

  // Carregar dados do Supabase
  const {
    comissoes,
    produtosUnicos,
    etapasUnicas,
    vendedoresUnicos,
    sdrsUnicos,
    isLoading,
    error,
    refetch,
  } = useSupabaseData();

  // Função para sincronizar dados do HubSpot via N8N
  const handleSyncHubSpot = useCallback(async () => {
    setSyncState({ status: 'loading', message: 'Atualizando base de dados...' });
    
    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          source: 'dashboard-comissoes'
        }),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setSyncState({ status: 'success', message: 'Dados atualizados com sucesso!' });
        setTimeout(() => {
          refetch();
          setSyncState({ status: 'idle', message: null });
        }, 3000);
      } else {
        setSyncState({ 
          status: 'error', 
          message: data.message || 'Erro ao atualizar. Tente novamente.' 
        });
        setTimeout(() => setSyncState({ status: 'idle', message: null }), 5000);
      }
    } catch (err) {
      console.error('Erro na sincronização:', err);
      setSyncState({ 
        status: 'error', 
        message: 'Erro de conexão. Verifique sua internet.' 
      });
      setTimeout(() => setSyncState({ status: 'idle', message: null }), 5000);
    }
  }, [refetch]);

  // Hook de filtros (recebe dados do Supabase)
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

  // Hook de cálculos para Visão Geral
  const { kpis, dadosGraficos } = useComissoesCalculations(comissoesFiltradas);

  // Hook de cálculos para Vendedores
  const {
    resumoVendedores,
    resumoConsolidado,
  } = useComissoesCalculations(comissoesFiltradosVendedor);

  // Hook de cálculos para SDR (usando os dados filtrados por SDR)
  const { resumoSDRs: resumoSDRsFiltrados } = useComissoesCalculations(comissoesFiltradosSDR);

  // Tela de carregamento
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 text-primary-500 animate-spin" />
          <p className="text-gray-400 text-lg">Carregando dados...</p>
        </div>
      </div>
    );
  }

  // Tela de erro
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <h2 className="text-xl font-semibold text-gray-100">Erro ao carregar dados</h2>
          <p className="text-gray-400">{error}</p>
          <Button onClick={refetch} variant="primary">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Toast de Notificação */}
      {syncState.status !== 'idle' && syncState.message && (
        <div className="fixed top-4 right-4 z-[100] animate-in fade-in slide-in-from-top-2 duration-300">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
            syncState.status === 'loading' ? 'bg-blue-900/90 border border-blue-700' :
            syncState.status === 'success' ? 'bg-green-900/90 border border-green-700' :
            'bg-red-900/90 border border-red-700'
          }`}>
            {syncState.status === 'loading' && <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />}
            {syncState.status === 'success' && <CheckCircle className="h-5 w-5 text-green-400" />}
            {syncState.status === 'error' && <XCircle className="h-5 w-5 text-red-400" />}
            <span className="text-sm font-medium text-gray-100">{syncState.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-700 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Dashboard de Comissões</h1>
              <p className="text-xs text-gray-500">Análise e gestão de comissões de vendas</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Botão Único: Atualizar Dados */}
              <Button 
                onClick={handleSyncHubSpot} 
                variant="primary" 
                size="sm"
                disabled={syncState.status === 'loading'}
              >
                {syncState.status === 'loading' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sincronizar
                  </>
                )}
              </Button>

              <div className="hidden md:flex items-center text-sm text-gray-400">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
                  {comissoes.length} comissões
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Tabs Navigation */}
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

          {/* Tab Contents */}
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
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-gray-500">
          <p>© 2026 GoWork - Dashboard de Comissões | Dados: Supabase</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
