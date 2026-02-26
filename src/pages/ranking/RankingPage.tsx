import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Target, Trophy, Loader2, AlertCircle, RefreshCw, Download, Clock, CheckCircle, XCircle, Gauge, Settings2, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { exportToExcel } from '@/lib/exportExcel';
import { ptBR } from 'date-fns/locale';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { Select, SelectItem } from '@/components/ui/Select';
import { DashboardMetaGlobal } from './pages/DashboardMetaGlobal';
import { DashboardCompeticao } from './pages/DashboardCompeticao';
import { DashboardVelocimetro } from './pages/DashboardVelocimetro';
import { PainelMetas } from './pages/PainelMetas';
import { useRankingData } from './hooks/useRankingData';
import { useRankingFilters } from './hooks/useRankingFilters';
import { useAuditLog } from '@/hooks/useAuditLog';

const N8N_WEBHOOK_URL = 'https://flux.gowork.com.br/webhook/atualizar_comissoes';

const MESES_CURTO = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

type SyncStatus = 'idle' | 'loading' | 'success' | 'error';

interface SyncState {
  status: SyncStatus;
  message: string | null;
}

export function RankingPage() {
  const { log } = useAuditLog();
  const [activeTab, setActiveTab] = useState('meta-global');
  const [syncState, setSyncState] = useState<SyncState>({ status: 'idle', message: null });
  const [syncProgress, setSyncProgress] = useState(0);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (syncState.status === 'loading') {
      setSyncProgress(0);
      const duration = 45000;
      const interval = 100;
      const increment = (100 / duration) * interval;

      progressIntervalRef.current = setInterval(() => {
        setSyncProgress(prev => {
          if (prev >= 95) return Math.min(prev + (increment * 0.1), 99);
          if (prev >= 80) return Math.min(prev + (increment * 0.3), 99);
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

  const {
    deals,
    lineItems,
    metas,
    ultimaAtualizacao,
    isLoading,
    error,
    refetch,
  } = useRankingData();

  useEffect(() => { log('view_report', 'report', 'ranking'); }, [log]);

  const dataAtualizacaoFormatada = ultimaAtualizacao
    ? format(new Date(ultimaAtualizacao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    : null;

  const handleSyncHubSpot = useCallback(async () => {
    setSyncState({ status: 'loading', message: null });

    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          source: 'dashboard-ranking',
        }),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setSyncState({ status: 'success', message: 'Dados atualizados com sucesso!' });
        log('sync_data', 'report', 'ranking');
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
  }, [refetch, log]);

  const {
    filtrosGlobal,
    updateFiltroGlobal,
    resetFiltrosGlobal,
    anosDisponiveis,
    kpisMetaGlobal,
    dealsGanhosAno,
    dadosGraficoMensalRevenue,
    dadosGraficoMensalSeats,
    dadosGraficoMensalDeals,
    rankingCompeticao,
  } = useRankingFilters(deals, lineItems, metas);

  const hasActiveFilters = useMemo(() => {
    const anoAtual = new Date().getFullYear();
    const mesAtual = new Date().getMonth() + 1;
    return filtrosGlobal.ano !== anoAtual || filtrosGlobal.mes !== mesAtual;
  }, [filtrosGlobal]);

  const handleExportExcelMeta = useCallback(async () => {
    const dadosExport = dealsGanhosAno.map(d => ({
      'Nome do Deal': d.dealName,
      'Valor': d.amount,
      'Data Fechamento': d.closeDate || '',
      'Pipeline': d.pipelineNome,
      'Responsável': d.ownerNome,
    }));

    await exportToExcel({
      data: dadosExport,
      sheetName: 'Meta Global',
      fileName: `meta_global_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`,
      columnWidths: [40, 15, 15, 25, 20],
    });
    log('export_excel', 'report', 'ranking', { tab: 'meta-global', records: dealsGanhosAno.length });
  }, [dealsGanhosAno, log]);

  const handleExportExcelCompeticao = useCallback(async () => {
    const dadosExport = rankingCompeticao.map(v => ({
      'Posicao': v.ranking,
      'Vendedor': v.ownerNome,
      'Seats (c/ cap)': v.seatsCapped,
      'Seats (bruto)': v.seatsRaw,
      'Deals': v.dealsCount,
      'Meta Minima': v.metaMinima,
      'Status': v.status,
    }));

    await exportToExcel({
      data: dadosExport,
      sheetName: 'Competicao',
      fileName: `competicao_${filtrosGlobal.ano}_${filtrosGlobal.mes}_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`,
      columnWidths: [8, 25, 15, 15, 8, 12, 30],
    });
    log('export_excel', 'report', 'ranking', { tab: 'competicao', ano: filtrosGlobal.ano, mes: filtrosGlobal.mes, records: rankingCompeticao.length });
  }, [rankingCompeticao, filtrosGlobal, log]);

  const handleExportExcel = useCallback(async () => {
    if (activeTab === 'meta-global') {
      await handleExportExcelMeta();
    } else if (activeTab === 'competicao') {
      await handleExportExcelCompeticao();
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
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Erro ao carregar dados</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
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
      {(syncState.status === 'success' || syncState.status === 'error') && syncState.message && (
        <div className="fixed top-4 right-4 z-[100]">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-sm ${
            syncState.status === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 ring-1 ring-emerald-500/10'
              : 'bg-red-500/10 border border-red-500/20 ring-1 ring-red-500/10'
          }`}>
            {syncState.status === 'success' && <CheckCircle className="h-4 w-4 text-emerald-400" />}
            {syncState.status === 'error' && <XCircle className="h-4 w-4 text-red-400" />}
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{syncState.message}</span>
          </div>
        </div>
      )}

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
            <Select
              value={String(filtrosGlobal.ano)}
              onValueChange={(v) => updateFiltroGlobal('ano', Number(v))}
              placeholder="Ano"
            >
              {anosDisponiveis.map((a) => (
                <SelectItem key={a} value={String(a)}>{a}</SelectItem>
              ))}
            </Select>

            <Select
              value={String(filtrosGlobal.mes)}
              onValueChange={(v) => updateFiltroGlobal('mes', Number(v))}
              placeholder="Mês"
            >
              <SelectItem value="0">Todos</SelectItem>
              {MESES_CURTO.map((m, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
              ))}
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={resetFiltrosGlobal}>
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            )}

            <div className="w-px h-5 bg-gray-200 dark:bg-white/[0.08]" />

            {(activeTab === 'meta-global' || activeTab === 'competicao') && (
              <Button
                onClick={handleExportExcel}
                variant="secondary"
                size="sm"
                title="Exportar para Excel"
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                <span className="hidden sm:inline text-xs">Excel</span>
              </Button>
            )}

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
            <TabsTrigger value="velocimetro">
              <Gauge className="h-4 w-4 mr-2" />
              Velocímetro
            </TabsTrigger>
            <TabsTrigger value="metas">
              <Settings2 className="h-4 w-4 mr-2" />
              Painel de Metas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="meta-global">
            <DashboardMetaGlobal
              metas={metas}
              filtrosGlobal={filtrosGlobal}
              kpisMetaGlobal={kpisMetaGlobal}
              dadosGraficoMensalRevenue={dadosGraficoMensalRevenue}
              dadosGraficoMensalSeats={dadosGraficoMensalSeats}
              dadosGraficoMensalDeals={dadosGraficoMensalDeals}
            />
          </TabsContent>

          <TabsContent value="competicao">
            <DashboardCompeticao
              rankingCompeticao={rankingCompeticao}
            />
          </TabsContent>

          <TabsContent value="velocimetro">
            <DashboardVelocimetro
              kpisMetaGlobal={kpisMetaGlobal}
              filtrosGlobal={filtrosGlobal}
            />
          </TabsContent>

          <TabsContent value="metas">
            <PainelMetas
              metas={metas}
              filtrosGlobal={filtrosGlobal}
              anosDisponiveis={anosDisponiveis}
              onMetaSaved={refetch}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
