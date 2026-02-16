// ============================================
// HOOK PARA CARREGAR DADOS DO RANKING
// ============================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/AuthContext';
import { fetchDadosRanking, type DadosRankingResult } from '../services/api';
import type {
  DealProcessado,
  LineItemEnriquecido,
  MetaVendas,
  Proprietario,
} from '@/types';

interface UseRankingDataReturn {
  deals: DealProcessado[];
  lineItems: LineItemEnriquecido[];
  metas: MetaVendas[];
  proprietarios: Proprietario[];
  vendedoresUnicos: string[];
  ultimaAtualizacao: string | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useRankingData(): UseRankingDataReturn {
  const { user } = useAuth();
  const [data, setData] = useState<DadosRankingResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoaded = useRef(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await fetchDadosRanking();
      setData(result);
      hasLoaded.current = true;
    } catch (err) {
      console.error('Erro ao carregar dados do ranking:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Carregar quando o user estiver autenticado
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  // Retry: se falhou na primeira vez e user existe, tenta novamente após 1s
  useEffect(() => {
    if (user && error && !hasLoaded.current) {
      const timer = setTimeout(() => loadData(), 1000);
      return () => clearTimeout(timer);
    }
  }, [user, error, loadData]);

  return {
    deals: data?.deals || [],
    lineItems: data?.lineItems || [],
    metas: data?.metas || [],
    proprietarios: data?.proprietarios || [],
    vendedoresUnicos: data?.vendedoresUnicos || [],
    ultimaAtualizacao: data?.ultimaAtualizacao || null,
    isLoading,
    error,
    refetch: loadData,
  };
}
