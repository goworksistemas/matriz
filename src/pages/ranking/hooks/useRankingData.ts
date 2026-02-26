import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchDadosRankingBase,
  fetchLineItemsEnriquecidos,
  type DadosRankingBase,
} from '../services/api';
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

let cachedBase: DadosRankingBase | null = null;
let cachedLineItems: LineItemEnriquecido[] | null = null;

export function useRankingData(): UseRankingDataReturn {
  const [base, setBase] = useState<DadosRankingBase | null>(cachedBase);
  const [lineItems, setLineItems] = useState<LineItemEnriquecido[]>(cachedLineItems || []);
  const [isLoading, setIsLoading] = useState(!cachedBase);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(0);

  const fetchAll = useCallback(async (silent: boolean) => {
    const thisRequest = ++abortRef.current;

    try {
      if (!silent) {
        setIsLoading(true);
        setError(null);
      }

      const baseResult = await fetchDadosRankingBase();
      if (abortRef.current !== thisRequest) return;

      cachedBase = baseResult;
      setBase(baseResult);
      if (!silent) setIsLoading(false);

      const items = await fetchLineItemsEnriquecidos(baseResult.wonDealsMap);
      if (abortRef.current !== thisRequest) return;

      cachedLineItems = items;
      setLineItems(items);
    } catch (err) {
      if (abortRef.current !== thisRequest) return;
      console.error('Erro ao carregar dados do ranking:', err);
      if (!silent) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (cachedBase) {
      setBase(cachedBase);
      setLineItems(cachedLineItems || []);
      setIsLoading(false);
      fetchAll(true);
    } else {
      fetchAll(false);
    }
  }, [fetchAll]);

  return {
    deals: base?.deals || [],
    lineItems,
    metas: base?.metas || [],
    proprietarios: base?.proprietarios || [],
    vendedoresUnicos: base?.vendedoresUnicos || [],
    ultimaAtualizacao: base?.ultimaAtualizacao || null,
    isLoading,
    error,
    refetch: async () => {
      cachedBase = null;
      cachedLineItems = null;
      await fetchAll(false);
    },
  };
}
