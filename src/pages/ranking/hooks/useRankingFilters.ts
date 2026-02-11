// ============================================
// HOOK DE FILTROS - RANKING (Vendas + Marketing)
// ============================================

import { useState, useMemo, useCallback } from 'react';
import type {
  DealProcessado,
  LeadProcessado,
  FiltrosVendas,
  FiltrosMarketing,
} from '@/types';

const anoAtual = new Date().getFullYear();
const mesAtual = new Date().getMonth() + 1;

// Estado inicial dos filtros de vendas
const FILTROS_VENDAS_INICIAL: FiltrosVendas = {
  ano: anoAtual,
  mes: mesAtual,
  vendedor: '',
  pipeline: '',
};

// Estado inicial dos filtros de marketing
const FILTROS_MARKETING_INICIAL: FiltrosMarketing = {
  periodo: 12,
  owner: '',
};

export function useRankingFilters(
  deals: DealProcessado[],
  leads: LeadProcessado[],
) {
  const [filtrosVendas, setFiltrosVendas] = useState<FiltrosVendas>(FILTROS_VENDAS_INICIAL);
  const [filtrosMarketing, setFiltrosMarketing] = useState<FiltrosMarketing>(FILTROS_MARKETING_INICIAL);

  // ============================================
  // FILTROS DE VENDAS
  // ============================================

  // Deals ganhos no ano selecionado
  const dealsGanhosAno = useMemo<DealProcessado[]>(() => {
    return deals.filter(d => {
      if (!d.isClosedWon) return false;
      if (d.ano !== filtrosVendas.ano) return false;
      if (filtrosVendas.vendedor && d.ownerNome !== filtrosVendas.vendedor) return false;
      if (filtrosVendas.pipeline && d.pipelineNome !== filtrosVendas.pipeline) return false;
      return true;
    });
  }, [deals, filtrosVendas]);

  // Deals ganhos no mês selecionado
  const dealsGanhosMes = useMemo<DealProcessado[]>(() => {
    if (filtrosVendas.mes === 0) return dealsGanhosAno;
    return dealsGanhosAno.filter(d => d.mes === filtrosVendas.mes);
  }, [dealsGanhosAno, filtrosVendas.mes]);

  // ============================================
  // FILTROS DE MARKETING
  // ============================================

  const leadsFiltrados = useMemo<LeadProcessado[]>(() => {
    const agora = new Date();
    const limiteDate = new Date(agora.getFullYear(), agora.getMonth() - filtrosMarketing.periodo, 1);

    return leads.filter(l => {
      // Filtrar por período
      if (l.createdAt) {
        const createdDate = new Date(l.createdAt);
        if (createdDate < limiteDate) return false;
      } else {
        return false;
      }

      // Filtrar por owner
      if (filtrosMarketing.owner && l.ownerNome !== filtrosMarketing.owner) return false;

      return true;
    });
  }, [leads, filtrosMarketing]);

  // ============================================
  // RESETS
  // ============================================

  const resetFiltrosVendas = useCallback(() => {
    setFiltrosVendas(FILTROS_VENDAS_INICIAL);
  }, []);

  const resetFiltrosMarketing = useCallback(() => {
    setFiltrosMarketing(FILTROS_MARKETING_INICIAL);
  }, []);

  // ============================================
  // UPDATES
  // ============================================

  const updateFiltroVendas = useCallback(<K extends keyof FiltrosVendas>(
    key: K,
    value: FiltrosVendas[K],
  ) => {
    setFiltrosVendas(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateFiltroMarketing = useCallback(<K extends keyof FiltrosMarketing>(
    key: K,
    value: FiltrosMarketing[K],
  ) => {
    setFiltrosMarketing(prev => ({ ...prev, [key]: value }));
  }, []);

  return {
    // Dados filtrados
    dealsGanhosAno,
    dealsGanhosMes,
    leadsFiltrados,

    // Estados de filtro
    filtrosVendas,
    filtrosMarketing,

    // Updates
    updateFiltroVendas,
    updateFiltroMarketing,
    resetFiltrosVendas,
    resetFiltrosMarketing,
  };
}
