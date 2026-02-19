import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/AuthContext';
import { fetchDadosNotion, type DadosNotionResult } from '../services/api';
import type { TarefaProcessada } from '../services/api';

interface UseNotionDataReturn {
  tarefas: TarefaProcessada[];
  statusUnicos: string[];
  prioridadesUnicas: string[];
  departamentosUnicos: string[];
  executoresUnicos: string[];
  ultimaAtualizacao: string | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useNotionData(): UseNotionDataReturn {
  const { user } = useAuth();
  const [data, setData] = useState<DadosNotionResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoaded = useRef(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await fetchDadosNotion();
      setData(result);
      hasLoaded.current = true;
    } catch (err) {
      console.error('Erro ao carregar tarefas do Notion:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  useEffect(() => {
    if (user && error && !hasLoaded.current) {
      const timer = setTimeout(() => loadData(), 1000);
      return () => clearTimeout(timer);
    }
  }, [user, error, loadData]);

  return {
    tarefas: data?.tarefas || [],
    statusUnicos: data?.statusUnicos || [],
    prioridadesUnicas: data?.prioridadesUnicas || [],
    departamentosUnicos: data?.departamentosUnicos || [],
    executoresUnicos: data?.executoresUnicos || [],
    ultimaAtualizacao: data?.ultimaAtualizacao || null,
    isLoading,
    error,
    refetch: loadData,
  };
}
