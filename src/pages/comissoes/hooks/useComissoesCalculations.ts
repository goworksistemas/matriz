import { useMemo } from 'react';
import type { Comissao, ResumoVendedor, ResumoSDR, KPIsGerais, DadosGrafico } from '@/types';

// ============================================
// HOOK DE CÁLCULOS - LÓGICA DE NEGÓCIOS
// ============================================

// Faixas de prêmio para físico (por posições calculadas)
const FAIXAS_FISICO = [
  { min: 65, percentual: 0.35, label: '≥65 pos (35%)' },
  { min: 45, percentual: 0.30, label: '≥45 pos (30%)' },
  { min: 35, percentual: 0.25, label: '≥35 pos (25%)' },
  { min: 0, percentual: 0, label: 'Sem prêmio' },
];

// Faixas de prêmio para virtual (por peso + posições)
const FAIXAS_VIRTUAL = [
  { min: 55, percentual: 0.45, label: '≥55 (45%)' },
  { min: 45, percentual: 0.35, label: '≥45 (35%)' },
  { min: 30, percentual: 0.25, label: '≥30 (25%)' },
  { min: 0, percentual: 0, label: 'Sem prêmio' },
];

function calcularPremioFisico(comissoesVendedor: Comissao[]): {
  premio: number;
  faixa: string;
  posicoesCalc: number;
  comissaoSimples: number;
} {
  // Filtro: tipo físico E etapa "Comissão Aprovada"
  const comissoesFisico = comissoesVendedor.filter(
    c => c.tipoProduto === 'fisico' && c.nomeEtapa === 'Comissão Aprovada'
  );

  const posicoesCalc = comissoesFisico.reduce((acc, c) => acc + c.posicoesCalculadas, 0);
  const comissaoSimples = comissoesFisico.reduce((acc, c) => acc + c.comissaoSimples, 0);

  const faixaAtual = FAIXAS_FISICO.find(f => posicoesCalc >= f.min) || FAIXAS_FISICO[3];
  const premio = comissaoSimples * faixaAtual.percentual;

  return {
    premio,
    faixa: faixaAtual.label,
    posicoesCalc,
    comissaoSimples,
  };
}

function calcularPremioVirtual(comissoesVendedor: Comissao[]): {
  premio: number;
  faixa: string;
  somaPesoPosicoes: number;
  comissaoSimples: number;
} {
  // Filtro: tipo virtual E etapa "Comissão Aprovada"
  const comissoesVirtual = comissoesVendedor.filter(
    c => c.tipoProduto === 'virtual' && c.nomeEtapa === 'Comissão Aprovada'
  );

  const somaPeso = comissoesVirtual.reduce((acc, c) => acc + (c.peso ?? 0), 0);
  const somaPosicoes = comissoesVirtual.reduce((acc, c) => acc + c.posicoesCalculadas, 0);
  const somaPesoPosicoes = somaPeso + somaPosicoes;
  const comissaoSimples = comissoesVirtual.reduce((acc, c) => acc + c.comissaoSimples, 0);

  const faixaAtual = FAIXAS_VIRTUAL.find(f => somaPesoPosicoes >= f.min) || FAIXAS_VIRTUAL[3];
  const premio = comissaoSimples * faixaAtual.percentual;

  return {
    premio,
    faixa: faixaAtual.label,
    somaPesoPosicoes,
    comissaoSimples,
  };
}

export function useComissoesCalculations(comissoesFiltradas: Comissao[]) {
  // KPIs Gerais
  const kpis = useMemo<KPIsGerais>(() => {
    const totalNegocios = new Set(comissoesFiltradas.map(c => c.id)).size;
    const totalPosicoes = comissoesFiltradas.reduce((acc, c) => acc + (c.posicoes ?? 0), 0);
    const totalValor = comissoesFiltradas.reduce((acc, c) => acc + c.valorNegocio, 0);
    const totalComissoes = comissoesFiltradas.reduce((acc, c) => acc + c.comissaoSimples, 0);

    return {
      totalNegocios,
      totalPosicoes,
      totalValor,
      totalComissoes,
    };
  }, [comissoesFiltradas]);

  // Resumo por Vendedor (para matriz de comissões)
  const resumoVendedores = useMemo<ResumoVendedor[]>(() => {
    const agrupado = new Map<string, Comissao[]>();

    comissoesFiltradas.forEach(c => {
      const key = c.proprietarioId || 'unknown';
      const lista = agrupado.get(key) || [];
      lista.push(c);
      agrupado.set(key, lista);
    });

    const resumos: ResumoVendedor[] = [];

    agrupado.forEach((comissoes, vendedorId) => {
      const vendedorNome = comissoes[0]?.proprietarioNome || 'Desconhecido';

      // Métricas totais
      const totalPosicoesCalc = comissoes.reduce((acc, c) => acc + c.posicoesCalculadas, 0);
      const totalPeso = comissoes.reduce((acc, c) => acc + (c.peso ?? 0), 0);
      const totalComissaoSimples = comissoes.reduce((acc, c) => acc + c.comissaoSimples, 0);

      // Prêmios
      const resultadoFisico = calcularPremioFisico(comissoes);
      const resultadoVirtual = calcularPremioVirtual(comissoes);

      const premioTotal = resultadoFisico.premio + resultadoVirtual.premio;
      const totalAReceber = totalComissaoSimples + premioTotal;

      resumos.push({
        vendedorId,
        vendedorNome,
        comissoes,
        totalPosicoesCalc,
        totalPeso,
        totalComissaoSimples,
        posicoesCalcFisico: resultadoFisico.posicoesCalc,
        comissaoSimplesFisico: resultadoFisico.comissaoSimples,
        premioFisico: resultadoFisico.premio,
        faixaFisico: resultadoFisico.faixa,
        somaPesoPosicoesVirtual: resultadoVirtual.somaPesoPosicoes,
        comissaoSimplesVirtual: resultadoVirtual.comissaoSimples,
        premioVirtual: resultadoVirtual.premio,
        faixaVirtual: resultadoVirtual.faixa,
        premioTotal,
        totalAReceber,
      });
    });

    return resumos.sort((a, b) => b.totalAReceber - a.totalAReceber);
  }, [comissoesFiltradas]);

  // Resumo consolidado de todos os vendedores
  const resumoConsolidado = useMemo(() => {
    return resumoVendedores.reduce(
      (acc, v) => ({
        totalPosicoesCalc: acc.totalPosicoesCalc + v.totalPosicoesCalc,
        totalPeso: acc.totalPeso + v.totalPeso,
        totalComissaoSimples: acc.totalComissaoSimples + v.totalComissaoSimples,
        totalPremioFisico: acc.totalPremioFisico + v.premioFisico,
        totalPremioVirtual: acc.totalPremioVirtual + v.premioVirtual,
        totalPremios: acc.totalPremios + v.premioTotal,
        totalAReceber: acc.totalAReceber + v.totalAReceber,
      }),
      {
        totalPosicoesCalc: 0,
        totalPeso: 0,
        totalComissaoSimples: 0,
        totalPremioFisico: 0,
        totalPremioVirtual: 0,
        totalPremios: 0,
        totalAReceber: 0,
      }
    );
  }, [resumoVendedores]);

  // Resumo por SDR
  const resumoSDRs = useMemo<ResumoSDR[]>(() => {
    // Filtrar apenas comissões com SDR válido
    const comissoesComSDR = comissoesFiltradas.filter(
      c => c.sdrEmail && c.sdrEmail !== '' && c.sdrEmail !== 'Não e aplica'
    );

    const agrupado = new Map<string, Comissao[]>();

    comissoesComSDR.forEach(c => {
      const lista = agrupado.get(c.sdrEmail) || [];
      lista.push(c);
      agrupado.set(c.sdrEmail, lista);
    });

    const resumos: ResumoSDR[] = [];

    agrupado.forEach((comissoes, sdrEmail) => {
      const sdrNome = comissoes[0]?.sdrNome || sdrEmail;
      const totalComissaoSDR = comissoes.reduce((acc, c) => acc + c.comissaoSimplesSDR, 0);

      resumos.push({
        sdrEmail,
        sdrNome,
        comissoes,
        totalComissaoSDR,
      });
    });

    return resumos.sort((a, b) => b.totalComissaoSDR - a.totalComissaoSDR);
  }, [comissoesFiltradas]);

  // Dados para gráficos
  const dadosGraficos = useMemo(() => {
    // Contagem por proprietário
    const porProprietario = new Map<string, number>();
    comissoesFiltradas.forEach(c => {
      porProprietario.set(c.proprietarioNome, (porProprietario.get(c.proprietarioNome) || 0) + 1);
    });
    const contagemPorProprietario: DadosGrafico[] = Array.from(porProprietario.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Contagem por produto
    const porProduto = new Map<string, number>();
    comissoesFiltradas.forEach(c => {
      if (c.produto) {
        porProduto.set(c.produto, (porProduto.get(c.produto) || 0) + 1);
      }
    });
    const contagemPorProduto: DadosGrafico[] = Array.from(porProduto.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Contagem por status comercial
    const porStatusComercial = new Map<string, number>();
    comissoesFiltradas.forEach(c => {
      if (c.statusComercial) {
        porStatusComercial.set(c.statusComercial, (porStatusComercial.get(c.statusComercial) || 0) + 1);
      }
    });
    const contagemPorStatusComercial: DadosGrafico[] = Array.from(porStatusComercial.entries())
      .map(([name, value]) => ({ name, value }));

    // Contagem por status financeiro
    const porStatusFinanceiro = new Map<string, number>();
    comissoesFiltradas.forEach(c => {
      if (c.statusFinanceiro) {
        porStatusFinanceiro.set(c.statusFinanceiro, (porStatusFinanceiro.get(c.statusFinanceiro) || 0) + 1);
      }
    });
    const contagemPorStatusFinanceiro: DadosGrafico[] = Array.from(porStatusFinanceiro.entries())
      .map(([name, value]) => ({ name, value }));

    // Contagem por status jurídico
    const porStatusJuridico = new Map<string, number>();
    comissoesFiltradas.forEach(c => {
      if (c.statusJuridico) {
        porStatusJuridico.set(c.statusJuridico, (porStatusJuridico.get(c.statusJuridico) || 0) + 1);
      }
    });
    const contagemPorStatusJuridico: DadosGrafico[] = Array.from(porStatusJuridico.entries())
      .map(([name, value]) => ({ name, value }));

    return {
      contagemPorProprietario,
      contagemPorProduto,
      contagemPorStatusComercial,
      contagemPorStatusFinanceiro,
      contagemPorStatusJuridico,
    };
  }, [comissoesFiltradas]);

  return {
    kpis,
    resumoVendedores,
    resumoConsolidado,
    resumoSDRs,
    dadosGraficos,
  };
}
