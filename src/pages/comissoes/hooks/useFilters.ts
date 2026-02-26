import { useState, useMemo, useCallback } from 'react';
import type { Comissao, FiltrosGlobais, FiltrosVendedor, FiltrosSDR } from '@/types';

// Estado inicial dos filtros globais
const FILTROS_GLOBAIS_INICIAL: FiltrosGlobais = {
  proprietario: '',
  produto: '',
  etapa: '',
  dataInicio: null,
  dataFim: null,
};

// Estado inicial dos filtros de vendedor
const FILTROS_VENDEDOR_INICIAL: FiltrosVendedor = {
  vendedor: '',
  vendaImpacto: null,
  etapa: '',
  tipoProduto: '',
  cliente: '',
  dataFechamento: null,
};

// Estado inicial dos filtros de SDR
const FILTROS_SDR_INICIAL: FiltrosSDR = {
  sdr: '',
  etapa: '',
  tipoProduto: '',
  dataFechamento: null,
};

// Hook recebe os dados como parâmetro (vindos do Supabase)
export function useFilters(comissoes: Comissao[]) {
  const [filtrosGlobais, setFiltrosGlobais] = useState<FiltrosGlobais>(FILTROS_GLOBAIS_INICIAL);
  const [filtrosVendedor, setFiltrosVendedor] = useState<FiltrosVendedor>(FILTROS_VENDEDOR_INICIAL);
  const [filtrosSDR, setFiltrosSDR] = useState<FiltrosSDR>(FILTROS_SDR_INICIAL);

  // Aplicar filtros globais
  const comissoesFiltradas = useMemo<Comissao[]>(() => {
    return comissoes.filter(c => {
      // Filtro por proprietário
      if (filtrosGlobais.proprietario && c.proprietarioNome !== filtrosGlobais.proprietario) {
        return false;
      }

      // Filtro por produto
      if (filtrosGlobais.produto && c.produto !== filtrosGlobais.produto) {
        return false;
      }

      // Filtro por etapa
      if (filtrosGlobais.etapa && c.nomeEtapa !== filtrosGlobais.etapa) {
        return false;
      }

      // Filtro por data início
      if (filtrosGlobais.dataInicio && c.dataFechamento) {
        const dataFechamento = new Date(c.dataFechamento);
        if (dataFechamento < filtrosGlobais.dataInicio) {
          return false;
        }
      }

      // Filtro por data fim
      if (filtrosGlobais.dataFim && c.dataFechamento) {
        const dataFechamento = new Date(c.dataFechamento);
        if (dataFechamento > filtrosGlobais.dataFim) {
          return false;
        }
      }

      return true;
    });
  }, [comissoes, filtrosGlobais]);

  // Aplicar filtros de vendedor sobre comissões já filtradas globalmente
  const comissoesFiltradosVendedor = useMemo<Comissao[]>(() => {
    return comissoesFiltradas.filter(c => {
      // Filtro por vendedor
      if (filtrosVendedor.vendedor && c.proprietarioNome !== filtrosVendedor.vendedor) {
        return false;
      }

      // Filtro por venda de impacto
      if (filtrosVendedor.vendaImpacto !== null && c.vendaImpacto !== filtrosVendedor.vendaImpacto) {
        return false;
      }

      // Filtro por etapa
      if (filtrosVendedor.etapa && c.nomeEtapa !== filtrosVendedor.etapa) {
        return false;
      }

      // Filtro por tipo de produto
      if (filtrosVendedor.tipoProduto && c.tipoProduto !== filtrosVendedor.tipoProduto) {
        return false;
      }

      // Filtro por cliente (busca parcial)
      if (filtrosVendedor.cliente) {
        const clienteLower = filtrosVendedor.cliente.toLowerCase();
        if (!c.nomeCliente.toLowerCase().includes(clienteLower)) {
          return false;
        }
      }

      return true;
    });
  }, [comissoesFiltradas, filtrosVendedor]);

  // Aplicar filtros de SDR sobre comissões já filtradas globalmente
  const comissoesFiltradosSDR = useMemo<Comissao[]>(() => {
    // Filtrar apenas comissões com SDR válido
    const comissoesComSDR = comissoesFiltradas.filter(
      c => c.sdrEmail && c.sdrEmail !== '' && c.sdrEmail !== 'Não e aplica'
    );

    return comissoesComSDR.filter(c => {
      // Filtro por SDR
      if (filtrosSDR.sdr && c.sdrNome !== filtrosSDR.sdr) {
        return false;
      }

      // Filtro por etapa
      if (filtrosSDR.etapa && c.nomeEtapa !== filtrosSDR.etapa) {
        return false;
      }

      // Filtro por tipo de produto
      if (filtrosSDR.tipoProduto && c.tipoProduto !== filtrosSDR.tipoProduto) {
        return false;
      }

      return true;
    });
  }, [comissoesFiltradas, filtrosSDR]);

  // Reset dos filtros
  const resetFiltrosGlobais = useCallback(() => {
    setFiltrosGlobais(FILTROS_GLOBAIS_INICIAL);
  }, []);

  const resetFiltrosVendedor = useCallback(() => {
    setFiltrosVendedor(FILTROS_VENDEDOR_INICIAL);
  }, []);

  const resetFiltrosSDR = useCallback(() => {
    setFiltrosSDR(FILTROS_SDR_INICIAL);
  }, []);

  // Atualização de filtros individuais
  const updateFiltroGlobal = useCallback(<K extends keyof FiltrosGlobais>(
    key: K,
    value: FiltrosGlobais[K]
  ) => {
    setFiltrosGlobais(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateFiltroVendedor = useCallback(<K extends keyof FiltrosVendedor>(
    key: K,
    value: FiltrosVendedor[K]
  ) => {
    setFiltrosVendedor(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateFiltroSDR = useCallback(<K extends keyof FiltrosSDR>(
    key: K,
    value: FiltrosSDR[K]
  ) => {
    setFiltrosSDR(prev => ({ ...prev, [key]: value }));
  }, []);

  return {
    // Dados filtrados
    comissoesFiltradas,
    comissoesFiltradosVendedor,
    comissoesFiltradosSDR,
    
    // Estados de filtro
    filtrosGlobais,
    filtrosVendedor,
    filtrosSDR,
    
    // Setters
    setFiltrosGlobais,
    setFiltrosVendedor,
    setFiltrosSDR,
    
    // Helpers
    updateFiltroGlobal,
    updateFiltroVendedor,
    updateFiltroSDR,
    resetFiltrosGlobais,
    resetFiltrosVendedor,
    resetFiltrosSDR,
  };
}
