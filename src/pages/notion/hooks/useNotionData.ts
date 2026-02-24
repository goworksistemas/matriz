import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/AuthContext';
import { fetchDadosNotion, type DadosNotionResult } from '../services/api';
import type { TarefaProcessada } from '../services/api';
import { supabase, isSupabaseConfigured, supabaseConfigErrorMessage } from '../services/supabase';

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
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadData = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent === true;
    try {
      if (!silent) {
        setIsLoading(true);
        setError(null);
      }

      if (!isSupabaseConfigured) {
        throw new Error(supabaseConfigErrorMessage);
      }

      const result = await fetchDadosNotion();
      setData(result);
      hasLoaded.current = true;
    } catch (err) {
      console.error('Erro ao carregar tarefas do Notion:', err);
      if (!silent) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
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

  const scheduleRealtimeRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    // Debounce para evitar múltiplos refetches durante upsert em lote.
    refreshTimeoutRef.current = setTimeout(() => {
      void loadData({ silent: true });
    }, 600);
  }, [loadData]);

  useEffect(() => {
    if (!user) return;
    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel(`notion_tasks_realtime_${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notion_tasks' },
        () => {
          scheduleRealtimeRefresh();
        },
      )
      .subscribe();

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      void supabase.removeChannel(channel);
    };
  }, [user, scheduleRealtimeRefresh]);

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
