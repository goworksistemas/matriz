// ============================================
// HOOK DE FILTROS - RANKING (Meta Global + Competição)
// ============================================

import { useState, useMemo, useCallback } from 'react';
import type {
  DealProcessado,
  LineItemEnriquecido,
  MetaVendas,
  FiltrosMetaGlobal,
  KPIsMetaGlobal,
  DadoGraficoMensal,
  DadoGraficoMensalSeats,
  VendedorCompeticao,
  CampanhaConfig,
} from '@/types';

// ============================================
// NOMES DOS MESES
// ============================================

const MESES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

// ============================================
// CONFIGURAÇÃO DAS CAMPANHAS (FIXAS)
// ============================================

export const CAMPANHAS: CampanhaConfig[] = [
  {
    id: 'salinhas',
    nome: 'Campanha Salinhas Varejo',
    dataInicio: '2026-02-17',
    dataFim: '2026-05-15',
    premios: [
      { lugar: '1° Colocado', premio: 'R$ 1.500,00 (presente, não dinheiro)', categoria: 'Vendas' },
      { lugar: '2° Colocado', premio: 'R$ 750,00 (presente, não dinheiro)', categoria: 'Vendas' },
      { lugar: 'Pré-Vendas e Virtual', premio: 'R$ 500,00 (presente, não dinheiro)', categoria: 'Pré-Vendas' },
    ],
    metaMinimaVendas: 105,
    metaMinimaPV: 'Mínimo 180 Reuniões Realizadas (1 Virtual = 2 Reuniões)',
    condicao: 'Ter batido a meta mínima da campanha. Limite de 30 posições por contrato (ex: contrato de 70, conta como 30).',
    regras: [
      'Seats contados de deals ganhos no período',
      'Limite de 30 posições por contrato',
      'Meta mínima: 105 seats para competir (Vendas)',
      'Pré-Vendas: reuniões realizadas (info pendente de confirmação)',
    ],
  },
  {
    id: 'mackbook',
    nome: 'Campanha Mackbook',
    dataInicio: '2026-02-17',
    dataFim: '2026-12-15',
    premios: [
      { lugar: '1° Colocado', premio: 'Mackbook', categoria: 'Vendas' },
      { lugar: '2° Colocado', premio: 'Apple Watch', categoria: 'Vendas' },
      { lugar: 'Pré-Vendas e Virtual', premio: 'Apple Watch', categoria: 'Pré-Vendas' },
    ],
    metaMinimaVendas: 250,
    metaMinimaPV: 'Mínimo 400 Reuniões Realizadas e 250 Virtuais (1 Virtual = 2 Reuniões)',
    condicao: 'Ter batido a meta mínima da campanha. Limite de 30 posições por contrato.',
    regras: [
      'Seats contados de deals ganhos no período',
      'Limite de 30 posições por contrato',
      'Meta mínima: 250 seats para competir (Vendas)',
      'Pré-Vendas: reuniões realizadas (info pendente de confirmação)',
    ],
  },
];

// ============================================
// ESTADOS INICIAIS
// ============================================

const anoAtual = new Date().getFullYear();
const mesAtual = new Date().getMonth() + 1;

const FILTROS_META_GLOBAL_INICIAL: FiltrosMetaGlobal = {
  ano: anoAtual,
  mes: mesAtual,
};

// ============================================
// HOOK PRINCIPAL
// ============================================

export function useRankingFilters(
  deals: DealProcessado[],
  lineItems: LineItemEnriquecido[],
  metas: MetaVendas[],
) {
  const [filtrosGlobal, setFiltrosGlobal] = useState<FiltrosMetaGlobal>(FILTROS_META_GLOBAL_INICIAL);
  const [campanhaAtiva, setCampanhaAtiva] = useState<'salinhas' | 'mackbook'>('salinhas');

  // ============================================
  // META GLOBAL - Deals ganhos filtrados
  // ============================================

  const dealsGanhosAno = useMemo(() => {
    return deals.filter(d => d.isClosedWon && d.ano === filtrosGlobal.ano);
  }, [deals, filtrosGlobal.ano]);

  const dealsGanhosMes = useMemo(() => {
    if (filtrosGlobal.mes === 0) return dealsGanhosAno;
    return dealsGanhosAno.filter(d => d.mes === filtrosGlobal.mes);
  }, [dealsGanhosAno, filtrosGlobal.mes]);

  // Line items do ano (sem cap, para Meta Global)
  const lineItemsAno = useMemo(() => {
    return lineItems.filter(li => li.ano === filtrosGlobal.ano);
  }, [lineItems, filtrosGlobal.ano]);

  const lineItemsMes = useMemo(() => {
    if (filtrosGlobal.mes === 0) return lineItemsAno;
    return lineItemsAno.filter(li => li.mes === filtrosGlobal.mes);
  }, [lineItemsAno, filtrosGlobal.mes]);

  // ============================================
  // META GLOBAL - KPIs
  // ============================================

  const kpisMetaGlobal = useMemo<KPIsMetaGlobal>(() => {
    const revenueAno = dealsGanhosAno.reduce((acc, d) => acc + d.amount, 0);
    const revenueMes = dealsGanhosMes.reduce((acc, d) => acc + d.amount, 0);
    const seatsAno = lineItemsAno.reduce((acc, li) => acc + li.quantity, 0);
    const seatsMes = lineItemsMes.reduce((acc, li) => acc + li.quantity, 0);
    const dealsAno = dealsGanhosAno.length;
    const dealsMes = dealsGanhosMes.length;

    // Buscar metas
    const metaDoMes = metas.find(
      m => m.year === filtrosGlobal.ano && m.month === filtrosGlobal.mes
    );
    const metaDoAno = metas.find(m => m.year === filtrosGlobal.ano);

    return {
      revenueAno,
      revenueMes,
      seatsAno,
      seatsMes,
      dealsAno,
      dealsMes,
      metaAnualRevenue: metaDoAno?.annualGoal || 0,
      metaAnualSeats: metaDoAno?.annualGoalSeats || 0,
      metaAnualDeals: metaDoAno?.annualGoalDeals || 0,
      metaMensalRevenue: metaDoMes?.monthlyGoal || 0,
      metaMensalSeats: metaDoMes?.monthlyGoalSeats || 0,
      metaMensalDeals: metaDoMes?.monthlyGoalDeals || 0,
    };
  }, [dealsGanhosAno, dealsGanhosMes, lineItemsAno, lineItemsMes, metas, filtrosGlobal]);

  // ============================================
  // META GLOBAL - Dados do gráfico mensal (Receita)
  // ============================================

  const dadosGraficoMensalRevenue = useMemo<DadoGraficoMensal[]>(() => {
    return MESES.map((mes, index) => {
      const mesNumero = index + 1;
      const realizado = dealsGanhosAno
        .filter(d => d.mes === mesNumero)
        .reduce((acc, d) => acc + d.amount, 0);

      const metaDoMes = metas.find(
        m => m.year === filtrosGlobal.ano && m.month === mesNumero
      );

      return { mes, mesNumero, realizado, meta: metaDoMes?.monthlyGoal || 0 };
    });
  }, [dealsGanhosAno, metas, filtrosGlobal.ano]);

  // ============================================
  // META GLOBAL - Dados do gráfico mensal (Seats)
  // ============================================

  const dadosGraficoMensalSeats = useMemo<DadoGraficoMensalSeats[]>(() => {
    return MESES.map((mes, index) => {
      const mesNumero = index + 1;
      const seats = lineItemsAno
        .filter(li => li.mes === mesNumero)
        .reduce((acc, li) => acc + li.quantity, 0);

      const metaDoMes = metas.find(
        m => m.year === filtrosGlobal.ano && m.month === mesNumero
      );

      return { mes, mesNumero, seats, meta: metaDoMes?.monthlyGoalSeats || 0 };
    });
  }, [lineItemsAno, metas, filtrosGlobal.ano]);

  // ============================================
  // COMPETIÇÃO - Configuração da campanha ativa
  // ============================================

  const campanha = useMemo(() => {
    return CAMPANHAS.find(c => c.id === campanhaAtiva)!;
  }, [campanhaAtiva]);

  // ============================================
  // COMPETIÇÃO - Ranking de vendedores
  // ============================================

  const rankingCompeticao = useMemo<VendedorCompeticao[]>(() => {
    const inicio = new Date(campanha.dataInicio);
    const fim = new Date(campanha.dataFim);

    // Filtrar line items dentro do período da campanha (via close_date do deal)
    const lineItemsCampanha = lineItems.filter(li => {
      if (!li.closeDate) return false;
      const closeDate = new Date(li.closeDate);
      return closeDate >= inicio && closeDate <= fim;
    });

    // Agrupar por vendedor
    const porVendedor = new Map<string, {
      ownerNome: string;
      seatsCapped: number;
      seatsRaw: number;
      dealsSet: Set<string>;
    }>();

    lineItemsCampanha.forEach(li => {
      if (!li.ownerId) return;

      const existing = porVendedor.get(li.ownerId) || {
        ownerNome: li.ownerNome,
        seatsCapped: 0,
        seatsRaw: 0,
        dealsSet: new Set<string>(),
      };

      existing.seatsCapped += li.quantityCapped;
      existing.seatsRaw += li.quantity;
      existing.dealsSet.add(li.dealHubspotId);

      porVendedor.set(li.ownerId, existing);
    });

    // Converter para array e rankear
    const vendedores: VendedorCompeticao[] = Array.from(porVendedor.entries())
      .map(([ownerId, data]) => {
        const faltam = campanha.metaMinimaVendas - data.seatsCapped;
        return {
          ownerId,
          ownerNome: data.ownerNome,
          seatsCapped: Math.round(data.seatsCapped * 100) / 100,
          seatsRaw: Math.round(data.seatsRaw * 100) / 100,
          dealsCount: data.dealsSet.size,
          ranking: 0,
          metaMinima: campanha.metaMinimaVendas,
          status: faltam <= 0
            ? 'Dentro da Competição'
            : `Faltam ${Math.ceil(faltam)} seats`,
        };
      })
      .sort((a, b) => b.seatsCapped - a.seatsCapped);

    // Atribuir ranking
    vendedores.forEach((v, i) => {
      v.ranking = i + 1;
    });

    return vendedores;
  }, [lineItems, campanha]);

  // ============================================
  // ANOS DISPONÍVEIS
  // ============================================

  const anosDisponiveis = useMemo(() => {
    const anos = new Set(deals.filter(d => d.isClosedWon).map(d => d.ano).filter(a => a > 0));
    anos.add(filtrosGlobal.ano);
    for (let i = 0; i < 3; i++) anos.add(anoAtual - i);
    return [...anos].sort((a, b) => b - a);
  }, [deals, filtrosGlobal.ano]);

  // ============================================
  // UPDATES
  // ============================================

  const updateFiltroGlobal = useCallback(<K extends keyof FiltrosMetaGlobal>(
    key: K,
    value: FiltrosMetaGlobal[K],
  ) => {
    setFiltrosGlobal(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetFiltrosGlobal = useCallback(() => {
    setFiltrosGlobal(FILTROS_META_GLOBAL_INICIAL);
  }, []);

  return {
    // Meta Global
    filtrosGlobal,
    updateFiltroGlobal,
    resetFiltrosGlobal,
    anosDisponiveis,
    kpisMetaGlobal,
    dealsGanhosAno,
    dealsGanhosMes,
    dadosGraficoMensalRevenue,
    dadosGraficoMensalSeats,

    // Competição
    campanhaAtiva,
    setCampanhaAtiva,
    campanha,
    rankingCompeticao,
  };
}
