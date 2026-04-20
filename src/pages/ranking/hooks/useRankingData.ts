import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchDadosRankingBase,
  fetchLineItemsEnriquecidos,
  fetchRankingPrevendasRPC,
  type DadosRankingBase,
  type DealStageHistoryEntry,
  type PrevendasRankingRow,
} from '../services/api';
import { isSupabaseConfigured, supabaseConfigErrorMessage } from '../services/supabase';
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
  reuniaoRealizadaStageIds: Set<string>;
  virtualPipelineId: string | null;
  preVendasPipelineIds: string[];
  wonStageIds: Set<string>;
  stageHistory: DealStageHistoryEntry[];
  rankingPrevendasVarejoRPC: PrevendasRankingRow[];
  rankingPrevendasMacbookRPC: PrevendasRankingRow[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

let cachedBase: DadosRankingBase | null = null;
let cachedLineItems: LineItemEnriquecido[] | null = null;
let cachedPrevendasVarejo: PrevendasRankingRow[] | null = null;
let cachedPrevendasMacbook: PrevendasRankingRow[] | null = null;

export function useRankingData(): UseRankingDataReturn {
  const [base, setBase] = useState<DadosRankingBase | null>(cachedBase);
  const [lineItems, setLineItems] = useState<LineItemEnriquecido[]>(cachedLineItems || []);
  const [prevendasVarejo, setPrevendasVarejo] = useState<PrevendasRankingRow[]>(cachedPrevendasVarejo || []);
  const [prevendasMacbook, setPrevendasMacbook] = useState<PrevendasRankingRow[]>(cachedPrevendasMacbook || []);
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

      if (!isSupabaseConfigured) {
        throw new Error(supabaseConfigErrorMessage);
      }

      const baseResult = await fetchDadosRankingBase();
      if (abortRef.current !== thisRequest) return;

      cachedBase = baseResult;
      setBase(baseResult);
      if (!silent) setIsLoading(false);

      const [items, pvVarejo, pvMacbook] = await Promise.all([
        fetchLineItemsEnriquecidos(baseResult.wonDealsMap),
        fetchRankingPrevendasRPC('2026-03-17', '2026-05-18'),
        fetchRankingPrevendasRPC('2026-03-17', '2026-12-15'),
      ]);
      if (abortRef.current !== thisRequest) return;

      cachedLineItems = items;
      setLineItems(items);
      cachedPrevendasVarejo = pvVarejo;
      setPrevendasVarejo(pvVarejo);
      cachedPrevendasMacbook = pvMacbook;
      setPrevendasMacbook(pvMacbook);
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
    reuniaoRealizadaStageIds: base?.reuniaoRealizadaStageIds || new Set(),
    virtualPipelineId: base?.virtualPipelineId || null,
    preVendasPipelineIds: base?.preVendasPipelineIds || [],
    wonStageIds: base?.wonStageIds || new Set(),
    stageHistory: base?.stageHistory || [],
    rankingPrevendasVarejoRPC: prevendasVarejo,
    rankingPrevendasMacbookRPC: prevendasMacbook,
    isLoading,
    error,
    refetch: async () => {
      cachedBase = null;
      cachedLineItems = null;
      cachedPrevendasVarejo = null;
      cachedPrevendasMacbook = null;
      await fetchAll(false);
    },
  };
}
