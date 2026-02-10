// ============================================
// HOOK PARA CARREGAR DADOS DO SUPABASE
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { fetchDadosDashboard, type DadosDashboardResult } from '../services/api';
import type { Comissao, Proprietario } from '@/types';

interface UseSupabaseDataReturn {
  comissoes: Comissao[];
  proprietarios: Proprietario[];
  produtosUnicos: string[];
  etapasUnicas: string[];
  vendedoresUnicos: string[];
  sdrsUnicos: string[];
  ultimaAtualizacao: string | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSupabaseData(): UseSupabaseDataReturn {
  const [data, setData] = useState<DadosDashboardResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await fetchDadosDashboard();
      setData(result);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    comissoes: data?.comissoes || [],
    proprietarios: data?.proprietarios || [],
    produtosUnicos: data?.produtosUnicos || [],
    etapasUnicas: data?.etapasUnicas || [],
    vendedoresUnicos: data?.vendedoresUnicos || [],
    sdrsUnicos: data?.sdrsUnicos || [],
    ultimaAtualizacao: data?.ultimaAtualizacao || null,
    isLoading,
    error,
    refetch: loadData,
  };
}
