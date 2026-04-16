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
  NegocioVarejo,
  NegocioMacbook,
  NegocioPreVendas,
  VendedorPreVendas,
} from '@/types';

export interface DadoGraficoMensalDeals {
  mes: string;
  mesNumero: number;
  deals: number;
  meta: number;
}

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
  reuniaoRealizadaStageIds: Set<string> = new Set(),
  virtualPipelineId: string | null = null,
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

    const metasDoAno = metas.filter(m => m.year === filtrosGlobal.ano);
    const metaAnualRevenue = Math.max(0, ...metasDoAno.map(m => m.annualGoal));
    const metaAnualSeats = Math.max(0, ...metasDoAno.map(m => m.annualGoalSeats));
    const metaAnualDeals = Math.max(0, ...metasDoAno.map(m => m.annualGoalDeals));

    return {
      revenueAno,
      revenueMes,
      seatsAno,
      seatsMes,
      dealsAno,
      dealsMes,
      metaAnualRevenue,
      metaAnualSeats,
      metaAnualDeals,
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
  // GRÁFICO MENSAL (Deals)
  // ============================================

  const dadosGraficoMensalDeals = useMemo<DadoGraficoMensalDeals[]>(() => {
    return MESES.map((mes, index) => {
      const mesNumero = index + 1;
      const dealsNoMes = dealsGanhosAno.filter(d => d.mes === mesNumero).length;

      const metaDoMes = metas.find(
        m => m.year === filtrosGlobal.ano && m.month === mesNumero
      );

      return { mes, mesNumero, deals: dealsNoMes, meta: metaDoMes?.monthlyGoalDeals || 0 };
    });
  }, [dealsGanhosAno, metas, filtrosGlobal.ano]);

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
  // COMPETIÇÃO VAREJO - Ranking por deals de sala privativa
  // Filtra por property "produto" do deal (raw_data)
  // Período fixo, sem dependência dos filtros globais
  // ============================================

  const VAREJO_INICIO = '2026-03-17';
  const VAREJO_FIM = '2026-05-18';
  const VAREJO_MAX_SEATS = 20;
  const VAREJO_META_MINIMA = 60;

  const negociosVarejo = useMemo<NegocioVarejo[]>(() => {
    const lineItemsByDeal = new Map<string, LineItemEnriquecido[]>();
    lineItems.forEach(li => {
      if (!li.dealHubspotId) return;
      const nomeLower = li.name.toLowerCase().trim();
      if (!nomeLower.includes('sala privativ')) return;
      const existing = lineItemsByDeal.get(li.dealHubspotId) || [];
      existing.push(li);
      lineItemsByDeal.set(li.dealHubspotId, existing);
    });

    return deals
      .filter(d => {
        if (!d.isClosedWon) return false;
        if (!d.ownerId) return false;
        if (!d.closeDate) return false;
        const closeDate = d.closeDate.substring(0, 10);
        if (closeDate < VAREJO_INICIO || closeDate > VAREJO_FIM) return false;
        const produtoLower = d.produto.toLowerCase().trim();
        const matchProduto = produtoLower.includes('sala privativ');
        const lis = lineItemsByDeal.get(d.hubspotId) || [];
        const matchLineItems = lis.length > 0;
        // HubSpot: coluna Produto; no banco o campo pode vir vazio (ex.: upgrades).
        // Alinha com o CRM: entra se produto OU itens de linha indicam Sala Privativa.
        return matchProduto || matchLineItems;
      })
      .map(d => {
        const lis = lineItemsByDeal.get(d.hubspotId) || [];
        const temLineItem = lis.length > 0;
        const totalSeats = lis.reduce((sum, li) => sum + li.quantity, 0);
        const excedeLimite = temLineItem && lis.some(li => li.quantity > VAREJO_MAX_SEATS);
        const produtoDisplay =
          d.produto.trim() || (temLineItem ? 'Sala Privativa' : '');

        return {
          dealHubspotId: d.hubspotId,
          dealName: d.dealName,
          ownerId: d.ownerId!,
          ownerNome: d.ownerNome,
          closeDate: d.closeDate!,
          amount: d.amount,
          produto: produtoDisplay,
          seats: temLineItem ? totalSeats : null,
          valido: temLineItem ? !excedeLimite : true,
          temLineItem,
        };
      })
      .sort((a, b) => b.closeDate.localeCompare(a.closeDate));
  }, [deals, lineItems]);

  const rankingVarejo = useMemo<VendedorCompeticao[]>(() => {
    const porVendedor = new Map<string, {
      ownerNome: string;
      seats: number;
      dealsCount: number;
    }>();

    negociosVarejo.forEach(n => {
      if (!n.valido) return;

      const existing = porVendedor.get(n.ownerId) || {
        ownerNome: n.ownerNome,
        seats: 0,
        dealsCount: 0,
      };

      existing.dealsCount += 1;
      if (n.seats !== null) {
        existing.seats += n.seats;
      }

      porVendedor.set(n.ownerId, existing);
    });

    const vendedores: VendedorCompeticao[] = Array.from(porVendedor.entries())
      .map(([ownerId, data]) => {
        const seats = Math.round(data.seats * 100) / 100;
        const faltam = VAREJO_META_MINIMA - seats;
        return {
          ownerId,
          ownerNome: data.ownerNome,
          seatsCapped: seats,
          seatsRaw: seats,
          dealsCount: data.dealsCount,
          ranking: 0,
          metaMinima: VAREJO_META_MINIMA,
          status: faltam <= 0
            ? 'Dentro da Competição'
            : `Faltam ${Math.ceil(faltam)} seats`,
        };
      })
      .sort((a, b) => b.dealsCount - a.dealsCount || b.seatsCapped - a.seatsCapped);

    vendedores.forEach((v, i) => {
      v.ranking = i + 1;
    });

    return vendedores;
  }, [negociosVarejo]);

  // ============================================
  // COMPETIÇÃO MACBOOK - Ranking por seats (todos os produtos da competição)
  // Usa deal.produto OU line items para identificar produto
  // Período fixo, sem dependência dos filtros globais
  // ============================================

  const MACBOOK_INICIO = '2026-03-17';
  const MACBOOK_FIM = '2026-12-15';
  const MACBOOK_CAP_SEATS = 20;
  const MACBOOK_META_MINIMA = 250;

  const MACBOOK_PRODUTOS = [
    'btg',
    'homeflex',
    'home flex',
    'hotdesk',
    'open space',
    'openspace',
    'sala privativ',
  ];

  function matchMacbookProduto(text: string): boolean {
    const lower = text.toLowerCase().trim();
    return MACBOOK_PRODUTOS.some(p => lower.includes(p));
  }

  const negociosMacbook = useMemo<NegocioMacbook[]>(() => {
    const lineItemsByDeal = new Map<string, LineItemEnriquecido[]>();
    lineItems.forEach(li => {
      if (!li.dealHubspotId) return;
      const nomeLower = li.name.toLowerCase().trim();
      if (!MACBOOK_PRODUTOS.some(p => nomeLower.includes(p))) return;
      const existing = lineItemsByDeal.get(li.dealHubspotId) || [];
      existing.push(li);
      lineItemsByDeal.set(li.dealHubspotId, existing);
    });

    return deals
      .filter(d => {
        if (!d.isClosedWon) return false;
        if (!d.ownerId) return false;
        if (!d.closeDate) return false;
        const closeDate = d.closeDate.substring(0, 10);
        if (closeDate < MACBOOK_INICIO || closeDate > MACBOOK_FIM) return false;
        const matchProduto = matchMacbookProduto(d.produto);
        const matchLI = lineItemsByDeal.has(d.hubspotId);
        return matchProduto || matchLI;
      })
      .map(d => {
        const lis = lineItemsByDeal.get(d.hubspotId) || [];
        const temLineItem = lis.length > 0;
        const seatsRaw = temLineItem ? lis.reduce((sum, li) => sum + li.quantity, 0) : null;
        const seatsCapped = temLineItem
          ? lis.reduce((sum, li) => sum + Math.min(li.quantity, MACBOOK_CAP_SEATS), 0)
          : null;
        const produtoDisplay =
          d.produto.trim() || (temLineItem ? lis[0].name : '');

        return {
          dealHubspotId: d.hubspotId,
          dealName: d.dealName,
          ownerId: d.ownerId!,
          ownerNome: d.ownerNome,
          closeDate: d.closeDate!,
          amount: d.amount,
          produto: produtoDisplay,
          seatsRaw,
          seatsCapped,
          temLineItem,
        };
      })
      .sort((a, b) => b.closeDate.localeCompare(a.closeDate));
  }, [deals, lineItems]);

  const rankingMacbook = useMemo<VendedorCompeticao[]>(() => {
    const porVendedor = new Map<string, {
      ownerNome: string;
      seatsCapped: number;
      seatsRaw: number;
      dealsCount: number;
    }>();

    negociosMacbook.forEach(n => {
      if (!n.temLineItem) return;

      const existing = porVendedor.get(n.ownerId) || {
        ownerNome: n.ownerNome,
        seatsCapped: 0,
        seatsRaw: 0,
        dealsCount: 0,
      };

      existing.seatsCapped += n.seatsCapped ?? 0;
      existing.seatsRaw += n.seatsRaw ?? 0;
      existing.dealsCount += 1;

      porVendedor.set(n.ownerId, existing);
    });

    const vendedores: VendedorCompeticao[] = Array.from(porVendedor.entries())
      .map(([ownerId, data]) => {
        const seatsCapped = Math.round(data.seatsCapped * 100) / 100;
        const seatsRaw = Math.round(data.seatsRaw * 100) / 100;
        const faltam = MACBOOK_META_MINIMA - seatsRaw;
        return {
          ownerId,
          ownerNome: data.ownerNome,
          seatsCapped,
          seatsRaw,
          dealsCount: data.dealsCount,
          ranking: 0,
          metaMinima: MACBOOK_META_MINIMA,
          status: faltam <= 0
            ? 'Dentro da Competição'
            : `Faltam ${Math.ceil(faltam)} seats`,
        };
      })
      .sort((a, b) => b.seatsCapped - a.seatsCapped || b.dealsCount - a.dealsCount);

    vendedores.forEach((v, i) => {
      v.ranking = i + 1;
    });

    return vendedores;
  }, [negociosMacbook]);

  // ============================================
  // PRÉ-VENDAS / VIRTUAL — ambas competições (Varejo + MacBook)
  // Pipeline "Virtual", etapa "Reunião realizada" ou posterior
  // 2 reuniões = 1 virtual
  // Varejo: mín. 100 reuniões | MacBook: mín. 400 reuniões e 250 virtuais
  // ============================================

  const PRE_VENDAS_META_VAREJO_REUNIOES = 100;
  const PRE_VENDAS_META_MACBOOK_REUNIOES = 400;
  const PRE_VENDAS_META_MACBOOK_VIRTUAIS = 250;

  const negociosPreVendas = useMemo<NegocioPreVendas[]>(() => {
    if (!virtualPipelineId || reuniaoRealizadaStageIds.size === 0) return [];

    return deals
      .filter(d => {
        if (!d.ownerId) return false;
        if (d.pipelineId !== virtualPipelineId) return false;
        if (!reuniaoRealizadaStageIds.has(d.stageId)) return false;
        return true;
      })
      .map(d => ({
        dealHubspotId: d.hubspotId,
        dealName: d.dealName,
        ownerId: d.ownerId!,
        ownerNome: d.ownerNome,
        pipelineNome: d.pipelineNome,
        stageLabel: d.stageLabel,
        closeDate: d.closeDate,
        createDate: d.createDate,
        amount: d.amount,
      }))
      .sort((a, b) => {
        const dateA = a.closeDate || a.createDate || '';
        const dateB = b.closeDate || b.createDate || '';
        return dateB.localeCompare(dateA);
      });
  }, [deals, virtualPipelineId, reuniaoRealizadaStageIds]);

  const negociosPreVendasVarejo = useMemo<NegocioPreVendas[]>(() => {
    return negociosPreVendas.filter(n => {
      const date = (n.closeDate || n.createDate || '').substring(0, 10);
      return date >= VAREJO_INICIO && date <= VAREJO_FIM;
    });
  }, [negociosPreVendas]);

  const negociosPreVendasMacbook = useMemo<NegocioPreVendas[]>(() => {
    return negociosPreVendas.filter(n => {
      const date = (n.closeDate || n.createDate || '').substring(0, 10);
      return date >= MACBOOK_INICIO && date <= MACBOOK_FIM;
    });
  }, [negociosPreVendas]);

  function buildRankingPreVendas(
    negocios: NegocioPreVendas[],
    config: { metaReunioes: number; metaVirtuais?: number },
  ): VendedorPreVendas[] {
    const porVendedor = new Map<string, { ownerNome: string; reunioes: number }>();

    negocios.forEach(n => {
      const existing = porVendedor.get(n.ownerId) || { ownerNome: n.ownerNome, reunioes: 0 };
      existing.reunioes += 1;
      porVendedor.set(n.ownerId, existing);
    });

    const vendedores: VendedorPreVendas[] = Array.from(porVendedor.entries())
      .map(([ownerId, data]) => {
        const virtuais = Math.floor(data.reunioes / 2);
        const { metaReunioes, metaVirtuais } = config;

        let status: string;
        if (metaVirtuais === undefined) {
          const faltam = metaReunioes - data.reunioes;
          status = faltam <= 0
            ? 'Dentro da Competição'
            : `Faltam ${Math.ceil(faltam)} reuniões`;
        } else {
          const okR = data.reunioes >= metaReunioes;
          const okV = virtuais >= metaVirtuais;
          if (okR && okV) {
            status = 'Dentro da Competição';
          } else {
            const faltamR = Math.max(0, metaReunioes - data.reunioes);
            const faltamV = Math.max(0, metaVirtuais - virtuais);
            const parts: string[] = [];
            if (faltamR > 0) parts.push(`${Math.ceil(faltamR)} reuniões`);
            if (faltamV > 0) parts.push(`${Math.ceil(faltamV)} virtuais`);
            status = parts.length ? `Faltam ${parts.join(' e ')}` : 'Dentro da Competição';
          }
        }

        const base: VendedorPreVendas = {
          ownerId,
          ownerNome: data.ownerNome,
          reunioes: data.reunioes,
          virtuais,
          ranking: 0,
          metaMinima: metaReunioes,
          status,
        };
        if (metaVirtuais !== undefined) {
          base.metaMinimaVirtuais = metaVirtuais;
        }
        return base;
      })
      .sort((a, b) => b.reunioes - a.reunioes || b.virtuais - a.virtuais);

    vendedores.forEach((v, i) => { v.ranking = i + 1; });
    return vendedores;
  }

  const rankingPreVendasVarejo = useMemo(
    () => buildRankingPreVendas(negociosPreVendasVarejo, { metaReunioes: PRE_VENDAS_META_VAREJO_REUNIOES }),
    [negociosPreVendasVarejo],
  );

  const rankingPreVendasMacbook = useMemo(
    () => buildRankingPreVendas(negociosPreVendasMacbook, {
      metaReunioes: PRE_VENDAS_META_MACBOOK_REUNIOES,
      metaVirtuais: PRE_VENDAS_META_MACBOOK_VIRTUAIS,
    }),
    [negociosPreVendasMacbook],
  );

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
    dadosGraficoMensalDeals,
    rankingCompeticao,
    rankingVarejo,
    negociosVarejo,
    rankingMacbook,
    negociosMacbook,
    negociosPreVendasVarejo,
    rankingPreVendasVarejo,
    negociosPreVendasMacbook,
    rankingPreVendasMacbook,
  };
}
