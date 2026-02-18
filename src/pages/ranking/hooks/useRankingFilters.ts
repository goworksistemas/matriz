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
} from '@/types';

const MESES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

const META_MINIMA_SEATS = 105;

const PRODUTOS_COMPETICAO = [
  'btg',
  'homeflex',
  'hotdesk',
  'open space',
  'openspace',
  'sala privativa',
];

const anoAtual = new Date().getFullYear();
const mesAtual = new Date().getMonth() + 1;

const FILTROS_INICIAL: FiltrosMetaGlobal = {
  ano: anoAtual,
  mes: mesAtual,
};

export function useRankingFilters(
  deals: DealProcessado[],
  lineItems: LineItemEnriquecido[],
  metas: MetaVendas[],
) {
  const [filtrosGlobal, setFiltrosGlobal] = useState<FiltrosMetaGlobal>(FILTROS_INICIAL);

  // ============================================
  // DEALS GANHOS FILTRADOS
  // ============================================

  const dealsGanhosAno = useMemo(() => {
    return deals.filter(d => d.isClosedWon && d.ano === filtrosGlobal.ano);
  }, [deals, filtrosGlobal.ano]);

  const dealsGanhosMes = useMemo(() => {
    if (filtrosGlobal.mes === 0) return dealsGanhosAno;
    return dealsGanhosAno.filter(d => d.mes === filtrosGlobal.mes);
  }, [dealsGanhosAno, filtrosGlobal.mes]);

  // ============================================
  // LINE ITEMS FILTRADOS
  // ============================================

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
  // GRÁFICO MENSAL (Receita)
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
  // GRÁFICO MENSAL (Seats)
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
  // COMPETIÇÃO - Ranking de vendedores
  // Usa os line items já filtrados por ano/mês
  // ============================================

  const lineItemsFiltrados = filtrosGlobal.mes === 0 ? lineItemsAno : lineItemsMes;

  const rankingCompeticao = useMemo<VendedorCompeticao[]>(() => {
    const porVendedor = new Map<string, {
      ownerNome: string;
      seatsCapped: number;
      seatsRaw: number;
      dealsSet: Set<string>;
    }>();

    lineItemsFiltrados.forEach(li => {
      if (!li.ownerId) return;

      const nomeLower = li.name.toLowerCase().trim();
      if (!nomeLower || !PRODUTOS_COMPETICAO.some(p => nomeLower.includes(p))) return;

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

    const vendedores: VendedorCompeticao[] = Array.from(porVendedor.entries())
      .map(([ownerId, data]) => {
        const faltam = META_MINIMA_SEATS - data.seatsCapped;
        return {
          ownerId,
          ownerNome: data.ownerNome,
          seatsCapped: Math.round(data.seatsCapped * 100) / 100,
          seatsRaw: Math.round(data.seatsRaw * 100) / 100,
          dealsCount: data.dealsSet.size,
          ranking: 0,
          metaMinima: META_MINIMA_SEATS,
          status: faltam <= 0
            ? 'Dentro da Competição'
            : `Faltam ${Math.ceil(faltam)} seats`,
        };
      })
      .sort((a, b) => b.seatsCapped - a.seatsCapped);

    vendedores.forEach((v, i) => {
      v.ranking = i + 1;
    });

    return vendedores;
  }, [lineItemsFiltrados]);

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
    setFiltrosGlobal(FILTROS_INICIAL);
  }, []);

  return {
    filtrosGlobal,
    updateFiltroGlobal,
    resetFiltrosGlobal,
    anosDisponiveis,
    kpisMetaGlobal,
    dealsGanhosAno,
    dealsGanhosMes,
    dadosGraficoMensalRevenue,
    dadosGraficoMensalSeats,
    rankingCompeticao,
  };
}
