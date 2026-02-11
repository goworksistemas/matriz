// ============================================
// HOOK PARA CARREGAR DADOS DO RANKING
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { fetchDadosRanking, type DadosRankingResult } from '../services/api';
import type {
  DealProcessado,
  LeadProcessado,
  MetaVendas,
  Proprietario,
} from '@/types';

interface UseRankingDataReturn {
  deals: DealProcessado[];
  leads: LeadProcessado[];
  metas: MetaVendas[];
  proprietarios: Proprietario[];
  pipelinesUnicos: string[];
  vendedoresUnicos: string[];
  ultimaAtualizacao: string | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useRankingData(): UseRankingDataReturn {
  const [data, setData] = useState<DadosRankingResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await fetchDadosRanking();
      setData(result);
    } catch (err) {
      console.error('Erro ao carregar dados do ranking:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    deals: data?.deals || [],
    leads: data?.leads || [],
    metas: data?.metas || [],
    proprietarios: data?.proprietarios || [],
    pipelinesUnicos: data?.pipelinesUnicos || [],
    vendedoresUnicos: data?.vendedoresUnicos || [],
    ultimaAtualizacao: data?.ultimaAtualizacao || null,
    isLoading,
    error,
    refetch: loadData,
  };
}
