import { useState, useMemo, useCallback } from 'react';
import type { TarefaProcessada, ComentarioNotion } from '../services/api';

export type FiltroCard =
  | 'ativas'
  | 'vencidas'
  | 'vence_hoje'
  | 'conclusao'
  | 'concluidas'
  | 'canceladas'
  | 'stand_by'
  | 'sem_prazo'
  | 'sem_dono'
  | null;

export interface FiltrosNotion {
  status: string[];
  prioridade: string[];
  departamento: string[];
  executor: string[];
  busca: string;
  filtroCard: FiltroCard;
  granularidade: GranularidadeTempo;
  periodoSelecionado: string | null;
  dataInicial: string | null;
  dataFinal: string | null;
}

const FILTROS_INICIAL: FiltrosNotion = {
  status: [],
  prioridade: [],
  departamento: [],
  executor: [],
  busca: '',
  filtroCard: null,
  granularidade: 'mes',
  periodoSelecionado: null,
  dataInicial: null,
  dataFinal: null,
};

export interface KPIsNotion {
  totalTarefas: number;
  tarefasAtivas: number;
  vencidas: number;
  noPrazo: number;
  venceHoje: number;
  semData: number;
  concluidas: number;
  canceladas: number;
  emStandBy: number;
  tarefasFechadas: number;
  percentConcluidas: number;
}

export interface InsightNotion {
  riscoGeral: number;
  atrasoMedioDias: number;
  taxaSemPrazo: number;
  tarefasSemResponsavel: number;
  taxaStandBy: number;
  taxaFechamento: number;
  leadTimeMedioDias: number;
  tarefasConcluidasComData: number;
  leadTimePorPrioridade: Array<{
    prioridade: string;
    mediaDias: number;
    concluidasComData: number;
    totalTarefas: number;
  }>;
}

export interface PerformanceAgente {
  nome: string;
  total: number;
  tempoMedioDias: number;
  concluidas: number;
  ativas: number;
  totalComentarios: number;
}

export interface InteracaoUsuario {
  nome: string;
  totalComentarios: number;
  percentual: number;
}

export type GranularidadeTempo = 'dia' | 'semana' | 'mes' | 'trimestre' | 'semestre' | 'ano';

export interface SerieDemandaCapacidade {
  label: string;
  chave: string;
  criadas: number;
  concluidas: number;
  variacaoCriadas?: number;
  variacaoConcluidas?: number;
}

function parseDataEntrada(data: string | null): Date | null {
  if (!data) return null;
  const dt = new Date(data);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function chavePeriodo(data: Date, granularidade: GranularidadeTempo): string {
  const ano = data.getFullYear();
  switch (granularidade) {
    case 'dia':
      return `${ano}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
    case 'semana': {
      const d = new Date(Date.UTC(ano, data.getMonth(), data.getDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
      return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
    }
    case 'mes':
      return `${ano}-${String(data.getMonth() + 1).padStart(2, '0')}`;
    case 'trimestre':
      return `${ano}-Q${Math.floor(data.getMonth() / 3) + 1}`;
    case 'semestre':
      return `${ano}-S${Math.floor(data.getMonth() / 6) + 1}`;
    case 'ano':
      return `${ano}`;
    default:
      return `${ano}-${String(data.getMonth() + 1).padStart(2, '0')}`;
  }
}

function labelPeriodo(chave: string, granularidade: GranularidadeTempo): string {
  if (granularidade === 'dia') {
    const [y, m, d] = chave.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  }
  if (granularidade === 'semana') {
    return `Sem ${chave.split('-W')[1]}/${chave.split('-')[0].slice(2)}`;
  }
  if (granularidade === 'mes') {
    const [ano, mes] = chave.split('-').map(Number);
    const dt = new Date(ano, (mes || 1) - 1, 1);
    return dt.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
  }
  if (granularidade === 'trimestre') {
    return `${chave.split('-')[1]} ${chave.split('-')[0]}`;
  }
  if (granularidade === 'semestre') {
    return `${chave.split('-')[1]} ${chave.split('-')[0]}`;
  }
  return chave;
}

function isConcluida(status: string): boolean {
  const normalizado = status.toLowerCase();
  return normalizado.includes('conclu');
}

function isCancelada(status: string): boolean {
  const normalizado = status.toLowerCase();
  return normalizado.includes('cancel');
}

function isStandBy(status: string): boolean {
  return status.toLowerCase().includes('stand');
}

function isSolicitacao(status: string): boolean {
  return status.toLowerCase().includes('solicit');
}

function isStatusGlobal(status: string): boolean {
  return isConcluida(status) || isCancelada(status) || isStandBy(status);
}

function isOperacionalAtiva(status: string): boolean {
  return !isStatusGlobal(status) && !isSolicitacao(status);
}

function normalizarStatus(status: string): string {
  const s = status.trim().toLowerCase();
  if (s.includes('conclu')) return 'Concluido';
  if (s.includes('cancel')) return 'Cancelado';
  if (s.includes('stand')) return 'Stand by';
  if (s.includes('solicit')) return 'Solicitacao';
  if (s.includes('andamento') || s.includes('progresso')) return 'Em andamento';
  if (s.includes('agend')) return 'Agendado';
  if (s.includes('aprov')) return 'Aprovado';
  if (s.includes('implant')) return 'Implantacao';
  if (s.includes('aguard')) return 'Aguardando';
  if (!s) return 'Sem status';
  return status;
}

function removerAcentos(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function nomeBase(nome: string): string {
  return nome.split('|')[0].trim();
}

function normalizarPrioridade(prioridade: string): string {
  const p = removerAcentos(prioridade.trim().toLowerCase());
  if (p.includes('urg')) return 'Urgente';
  if (p.includes('import')) return 'Importante';
  if (p.includes('media') || p === 'medio' || p === 'med') return 'Média';
  if (p.includes('baix')) return 'Baixa';
  return 'Sem prioridade';
}

export function useNotionFilters(tarefas: TarefaProcessada[], comentarios: ComentarioNotion[] = []) {
  const [filtros, setFiltros] = useState<FiltrosNotion>(FILTROS_INICIAL);

  const tarefasFiltradas = useMemo(() => {
    let resultado = tarefas.filter(t => {
      if (filtros.status.length > 0) {
        const statusNorm = normalizarStatus(t.status);
        if (!filtros.status.includes(t.status) && !filtros.status.includes(statusNorm)) return false;
      }
      if (filtros.prioridade.length > 0) {
        const prioridadeNorm = normalizarPrioridade(t.prioridade);
        if (!filtros.prioridade.includes(t.prioridade) && !filtros.prioridade.includes(prioridadeNorm)) return false;
      }
      if (filtros.departamento.length > 0 && !filtros.departamento.includes(t.departamento)) return false;
      if (filtros.executor.length > 0) {
        const match = t.executores.some(e =>
          filtros.executor.includes(e) || filtros.executor.some(f => nomeBase(e) === f)
        );
        if (!match) return false;
      }
      if (filtros.busca.trim()) {
        const termo = filtros.busca.toLowerCase();
        if (!t.titulo.toLowerCase().includes(termo)) return false;
      }
      if (filtros.dataInicial) {
        const ref = t.criadoEm ?? t.dataInicio;
        if (!ref || ref < filtros.dataInicial) return false;
      }
      if (filtros.dataFinal) {
        const ref = t.criadoEm ?? t.dataInicio;
        if (!ref || ref > filtros.dataFinal + 'T23:59:59') return false;
      }
      return true;
    });

    if (filtros.filtroCard) {
      resultado = resultado.filter(t => {
        switch (filtros.filtroCard) {
          case 'ativas':
            return isOperacionalAtiva(t.status);
          case 'vencidas':
            return t.statusPrazo === 'vencida' && isOperacionalAtiva(t.status);
          case 'vence_hoje':
            return t.statusPrazo === 'hoje' && isOperacionalAtiva(t.status);
          case 'conclusao':
          case 'concluidas':
            return isConcluida(t.status);
          case 'canceladas':
            return isCancelada(t.status);
          case 'stand_by':
            return isStandBy(t.status);
          case 'sem_prazo':
            return t.statusPrazo === 'sem_data' && isOperacionalAtiva(t.status);
          case 'sem_dono':
            return isOperacionalAtiva(t.status) && (t.executores.length === 0 || t.executor.toLowerCase() === 'nao atribuido');
          default:
            return true;
        }
      });
    }

    if (filtros.periodoSelecionado) {
      resultado = resultado.filter(t => {
        const dataCriacao = parseDataEntrada(t.criadoEm ?? t.dataInicio);
        const dataConclusao = isConcluida(t.status) ? parseDataEntrada(t.dataFim) : null;
        
        const chaveCriacao = dataCriacao ? chavePeriodo(dataCriacao, filtros.granularidade) : null;
        const chaveConclusao = dataConclusao ? chavePeriodo(dataConclusao, filtros.granularidade) : null;
        
        return chaveCriacao === filtros.periodoSelecionado || chaveConclusao === filtros.periodoSelecionado;
      });
    }

    return resultado;
  }, [tarefas, filtros]);

  const kpis = useMemo<KPIsNotion>(() => {
    const total = tarefasFiltradas.length;
    const concluidas = tarefasFiltradas.filter(t => isConcluida(t.status)).length;
    const canceladas = tarefasFiltradas.filter(t => isCancelada(t.status)).length;
    const emStandBy = tarefasFiltradas.filter(t => isStandBy(t.status)).length;
    const solicitacoes = tarefasFiltradas.filter(t => isSolicitacao(t.status)).length;
    const ativas = total - concluidas - canceladas - emStandBy - solicitacoes;
    const tarefasFechadas = concluidas + canceladas;
    const vencidas = tarefasFiltradas.filter(t => t.statusPrazo === 'vencida' && isOperacionalAtiva(t.status)).length;
    const noPrazo = tarefasFiltradas.filter(t => t.statusPrazo === 'no_prazo' && isOperacionalAtiva(t.status)).length;
    const venceHoje = tarefasFiltradas.filter(t => t.statusPrazo === 'hoje' && isOperacionalAtiva(t.status)).length;
    const semData = tarefasFiltradas.filter(t => t.statusPrazo === 'sem_data' && isOperacionalAtiva(t.status)).length;

    return {
      totalTarefas: total,
      tarefasAtivas: ativas,
      vencidas,
      noPrazo,
      venceHoje,
      semData,
      concluidas,
      canceladas,
      emStandBy,
      tarefasFechadas,
      percentConcluidas: total > 0 ? Math.round((concluidas / total) * 100) : 0,
    };
  }, [tarefasFiltradas]);

  const dadosGraficoStatus = useMemo(() => {
    const mapa = new Map<string, number>();
    tarefasFiltradas.forEach(t => {
      if (isStatusGlobal(t.status)) return;
      const statusNormalizado = normalizarStatus(t.status);
      mapa.set(statusNormalizado, (mapa.get(statusNormalizado) || 0) + 1);
    });
    const ordenado = Array.from(mapa.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    if (ordenado.length <= 7) return ordenado;

    const principais = ordenado.slice(0, 6);
    const outros = ordenado.slice(6).reduce((acc, item) => acc + item.value, 0);
    return outros > 0 ? [...principais, { name: 'Outros', value: outros }] : principais;
  }, [tarefasFiltradas]);

  const dadosGraficoPrioridade = useMemo(() => {
    const mapa = new Map<string, number>();
    tarefasFiltradas.forEach(t => {
      const prioridadeNormalizada = normalizarPrioridade(t.prioridade);
      mapa.set(prioridadeNormalizada, (mapa.get(prioridadeNormalizada) || 0) + 1);
    });

    const ordem: Record<string, number> = {
      Urgente: 0,
      Importante: 1,
      'Média': 2,
      Baixa: 3,
      'Sem prioridade': 4,
    };

    return Array.from(mapa.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => {
        const ordemA = ordem[a.name] ?? 99;
        const ordemB = ordem[b.name] ?? 99;
        if (ordemA !== ordemB) return ordemA - ordemB;
        return b.value - a.value;
      });
  }, [tarefasFiltradas]);

  const dadosGraficoDepartamento = useMemo(() => {
    const mapa = new Map<string, number>();
    tarefasFiltradas.forEach(t => {
      mapa.set(t.departamento, (mapa.get(t.departamento) || 0) + 1);
    });
    return Array.from(mapa.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [tarefasFiltradas]);

  const nomeExibicao = useCallback((nome: string) => nomeBase(nome) || nome, []);

  const dadosGraficoExecutores = useMemo(() => {
    const ativas = tarefasFiltradas.filter(t => isOperacionalAtiva(t.status) && t.executores.length > 0);
    const mapa = new Map<string, number>();

    ativas.forEach(t => {
      t.executores.forEach(exec => {
        const nome = nomeExibicao(exec);
        mapa.set(nome, (mapa.get(nome) || 0) + 1);
      });
    });

    return Array.from(mapa.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [tarefasFiltradas, nomeExibicao]);

  const serieConclucoesPorAgente = useMemo(() => {
    const concluidas = tarefasFiltradas.filter(t => isConcluida(t.status) && t.dataFim && t.executores.length > 0);

    const agentesSet = new Set<string>();
    const mapa = new Map<string, Map<string, number>>();

    concluidas.forEach(t => {
      const data = parseDataEntrada(t.dataFim);
      if (!data) return;
      const chave = chavePeriodo(data, filtros.granularidade);

      t.executores.forEach(exec => {
        const nome = nomeExibicao(exec);
        agentesSet.add(nome);
        if (!mapa.has(chave)) mapa.set(chave, new Map());
        const periodo = mapa.get(chave)!;
        periodo.set(nome, (periodo.get(nome) || 0) + 1);
      });
    });

    const totalPorAgente = new Map<string, number>();
    for (const [, periodo] of mapa) {
      for (const [agente, qtd] of periodo) {
        totalPorAgente.set(agente, (totalPorAgente.get(agente) || 0) + qtd);
      }
    }
    const topAgentes = Array.from(agentesSet)
      .sort((a, b) => (totalPorAgente.get(b) || 0) - (totalPorAgente.get(a) || 0))
      .slice(0, 5);

    const ordenado = Array.from(mapa.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(-12);

    const serie = ordenado.map(([chave, periodo]) => {
      const ponto: Record<string, string | number> = { label: labelPeriodo(chave, filtros.granularidade), chave };
      let total = 0;
      topAgentes.forEach(agente => {
        const v = periodo.get(agente) || 0;
        ponto[agente] = v;
        total += v;
      });
      ponto._total = total;
      return ponto;
    });

    const variacao = topAgentes.map(agente => {
      const valores = ordenado.map(([, p]) => p.get(agente) || 0);
      const ultimo = valores[valores.length - 1] ?? 0;
      const penultimo = valores[valores.length - 2] ?? 0;
      const totalAgente = totalPorAgente.get(agente) || 0;
      const var_ = penultimo > 0 ? Math.round(((ultimo - penultimo) / penultimo) * 100) : (ultimo > 0 ? 100 : 0);
      return { agente, total: totalAgente, ultimo, variacao: var_ };
    });

    return { serie, agentes: topAgentes, variacao };
  }, [tarefasFiltradas, filtros.granularidade, nomeExibicao]);

  const dadosGraficoDepartamentosCriticos = useMemo(() => {
    const mapa = new Map<string, number>();
    tarefasFiltradas
      .filter(t => t.statusPrazo === 'vencida' && isOperacionalAtiva(t.status))
      .forEach(t => {
        mapa.set(t.departamento, (mapa.get(t.departamento) || 0) + 1);
      });

    return Array.from(mapa.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [tarefasFiltradas]);

  const topTarefasCriticas = useMemo(() => {
    return tarefasFiltradas
      .filter(t => t.statusPrazo === 'vencida' && isOperacionalAtiva(t.status))
      .sort((a, b) => b.diasAtraso - a.diasAtraso)
      .slice(0, 8);
  }, [tarefasFiltradas]);

  const insights = useMemo<InsightNotion>(() => {
    const ativas = tarefasFiltradas.filter(t => isOperacionalAtiva(t.status));
    const total = tarefasFiltradas.length;
    const concluidas = tarefasFiltradas.filter(t => isConcluida(t.status)).length;
    const canceladas = tarefasFiltradas.filter(t => isCancelada(t.status)).length;
    const emStandBy = tarefasFiltradas.filter(t => isStandBy(t.status)).length;
    const atrasadas = ativas.filter(t => t.statusPrazo === 'vencida');
    const semPrazo = ativas.filter(t => t.statusPrazo === 'sem_data');
    const atrasoMedioDias = atrasadas.length > 0
      ? Math.round(atrasadas.reduce((acc, t) => acc + t.diasAtraso, 0) / atrasadas.length)
      : 0;
    const tarefasSemResponsavel = ativas.filter(t =>
      t.executores.length === 0 || t.executor.toLowerCase() === 'nao atribuido'
    ).length;
    const concluidasComData = tarefasFiltradas.filter((tarefa) => {
      if (!isConcluida(tarefa.status) || !tarefa.criadoEm || !tarefa.dataFim) return false;
      const dataCriacao = parseDataEntrada(tarefa.criadoEm);
      const dataConclusao = parseDataEntrada(tarefa.dataFim);
      return !!dataCriacao && !!dataConclusao;
    });
    const somaLeadTimeDias = concluidasComData.reduce((acc, tarefa) => {
      const dataCriacao = parseDataEntrada(tarefa.criadoEm);
      const dataConclusao = parseDataEntrada(tarefa.dataFim);
      if (!dataCriacao || !dataConclusao) return acc;
      const diffMs = dataConclusao.getTime() - dataCriacao.getTime();
      const diffDias = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      return acc + diffDias;
    }, 0);
    const totaisPorPrioridade = new Map<string, number>();
    tarefasFiltradas.forEach((tarefa) => {
      const prioridade = normalizarPrioridade(tarefa.prioridade);
      totaisPorPrioridade.set(prioridade, (totaisPorPrioridade.get(prioridade) || 0) + 1);
    });

    const leadTimePorPrioridadeMap = new Map<string, { somaDias: number; concluidasComData: number }>();
    concluidasComData.forEach((tarefa) => {
      const prioridade = normalizarPrioridade(tarefa.prioridade);
      const dataCriacao = parseDataEntrada(tarefa.criadoEm);
      const dataConclusao = parseDataEntrada(tarefa.dataFim);
      if (!dataCriacao || !dataConclusao) return;
      const diffMs = dataConclusao.getTime() - dataCriacao.getTime();
      const diffDias = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      const atual = leadTimePorPrioridadeMap.get(prioridade) || { somaDias: 0, concluidasComData: 0 };
      atual.somaDias += diffDias;
      atual.concluidasComData += 1;
      leadTimePorPrioridadeMap.set(prioridade, atual);
    });

    const ordemPrioridade: Record<string, number> = {
      Urgente: 0,
      Importante: 1,
      'Média': 2,
      Baixa: 3,
      'Sem prioridade': 4,
    };

    const leadTimePorPrioridade = Array.from(totaisPorPrioridade.entries())
      .map(([prioridade, totalTarefas]) => {
        const lead = leadTimePorPrioridadeMap.get(prioridade);
        const concluidasComData = lead?.concluidasComData || 0;
        const mediaDias = concluidasComData > 0
          ? Math.round(((lead?.somaDias || 0) / concluidasComData) * 10) / 10
          : 0;
        return {
          prioridade,
          mediaDias,
          concluidasComData,
          totalTarefas,
        };
      })
      .sort((a, b) => {
        const ordemA = ordemPrioridade[a.prioridade] ?? 99;
        const ordemB = ordemPrioridade[b.prioridade] ?? 99;
        if (ordemA !== ordemB) return ordemA - ordemB;
        return b.totalTarefas - a.totalTarefas;
      });

    return {
      riscoGeral: ativas.length > 0 ? Math.round((atrasadas.length / ativas.length) * 100) : 0,
      atrasoMedioDias,
      taxaSemPrazo: ativas.length > 0 ? Math.round((semPrazo.length / ativas.length) * 100) : 0,
      tarefasSemResponsavel,
      taxaStandBy: total > 0 ? Math.round((emStandBy / total) * 100) : 0,
      taxaFechamento: total > 0 ? Math.round(((concluidas + canceladas) / total) * 100) : 0,
      leadTimeMedioDias: concluidasComData.length > 0 ? Math.round((somaLeadTimeDias / concluidasComData.length) * 10) / 10 : 0,
      tarefasConcluidasComData: concluidasComData.length,
      leadTimePorPrioridade,
    };
  }, [tarefasFiltradas]);

  const serieDemandaCapacidade = useMemo<SerieDemandaCapacidade[]>(() => {
    const mapa = new Map<string, { criadas: number; concluidas: number }>();

    // Usamos as tarefas originais (sem o filtro de período) para construir a série histórica completa
    const tarefasParaSerie = tarefas.filter(t => {
      if (filtros.status.length > 0) {
        const statusNorm = normalizarStatus(t.status);
        if (!filtros.status.includes(t.status) && !filtros.status.includes(statusNorm)) return false;
      }
      if (filtros.prioridade.length > 0) {
        const prioridadeNorm = normalizarPrioridade(t.prioridade);
        if (!filtros.prioridade.includes(t.prioridade) && !filtros.prioridade.includes(prioridadeNorm)) return false;
      }
      if (filtros.departamento.length > 0 && !filtros.departamento.includes(t.departamento)) return false;
      if (filtros.executor.length > 0) {
        const match = t.executores.some(e =>
          filtros.executor.includes(e) || filtros.executor.some(f => nomeBase(e) === f)
        );
        if (!match) return false;
      }
      if (filtros.busca.trim()) {
        const termo = filtros.busca.toLowerCase();
        if (!t.titulo.toLowerCase().includes(termo)) return false;
      }
      if (filtros.dataInicial) {
        const ref = t.criadoEm ?? t.dataInicio;
        if (!ref || ref < filtros.dataInicial) return false;
      }
      if (filtros.dataFinal) {
        const ref = t.criadoEm ?? t.dataInicio;
        if (!ref || ref > filtros.dataFinal + 'T23:59:59') return false;
      }
      return true;
    });

    tarefasParaSerie.forEach((tarefa) => {
      const dataCriacao = parseDataEntrada(tarefa.criadoEm ?? tarefa.dataInicio);
      if (dataCriacao) {
        const chave = chavePeriodo(dataCriacao, filtros.granularidade);
        const atual = mapa.get(chave) || { criadas: 0, concluidas: 0 };
        atual.criadas += 1;
        mapa.set(chave, atual);
      }

      if (isConcluida(tarefa.status)) {
        const dataConclusao = parseDataEntrada(tarefa.dataFim);
        if (dataConclusao) {
          const chave = chavePeriodo(dataConclusao, filtros.granularidade);
          const atual = mapa.get(chave) || { criadas: 0, concluidas: 0 };
          atual.concluidas += 1;
          mapa.set(chave, atual);
        }
      }
    });

    const ordenado = Array.from(mapa.entries())
      .sort(([a], [b]) => a.localeCompare(b));

    return ordenado.map(([chave, values], index) => {
      const anterior = index > 0 ? ordenado[index - 1][1] : null;
      
      const calcVariacao = (atual: number, ant: number) => {
        if (!ant || ant === 0) return atual > 0 ? 100 : 0;
        return Math.round(((atual - ant) / ant) * 100);
      };

      return {
        chave,
        label: labelPeriodo(chave, filtros.granularidade),
        criadas: values.criadas,
        concluidas: values.concluidas,
        variacaoCriadas: anterior ? calcVariacao(values.criadas, anterior.criadas) : undefined,
        variacaoConcluidas: anterior ? calcVariacao(values.concluidas, anterior.concluidas) : undefined,
      };
    }).slice(-15); // Mostramos os últimos 15 períodos para não poluir
  }, [tarefas, filtros.status, filtros.prioridade, filtros.departamento, filtros.executor, filtros.busca, filtros.dataInicial, filtros.dataFinal, filtros.granularidade]);

  const anomaliasConcluidas = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    return tarefasFiltradas.filter(t => {
      if (!isConcluida(t.status) || !t.dataFim) return false;
      const fim = parseDataEntrada(t.dataFim);
      if (!fim) return false;
      fim.setHours(0, 0, 0, 0);
      return fim.getTime() > hoje.getTime();
    });
  }, [tarefasFiltradas]);

  const gargalosCriticos = useMemo(() => {
    return tarefasFiltradas
      .filter((tarefa) => {
        const standBy = tarefa.status.toLowerCase().includes('stand');
        const prioridade = normalizarPrioridade(tarefa.prioridade);
        const prioridadeCritica = prioridade === 'Urgente' || prioridade === 'Importante';
        return standBy && prioridadeCritica;
      })
      .sort((a, b) => b.diasAtraso - a.diasAtraso);
  }, [tarefasFiltradas]);

  const updateFiltro = useCallback(<K extends keyof FiltrosNotion>(
    key: K,
    value: FiltrosNotion[K],
  ) => {
    setFiltros(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetFiltros = useCallback(() => {
    setFiltros(FILTROS_INICIAL);
  }, []);

  const hasActiveFilters = useMemo(() => {
    return (
      filtros.status.length > 0 ||
      filtros.prioridade.length > 0 ||
      filtros.departamento.length > 0 ||
      filtros.executor.length > 0 ||
      filtros.busca.trim() !== '' ||
      filtros.filtroCard !== null ||
      filtros.dataInicial !== null ||
      filtros.dataFinal !== null
    );
  }, [filtros]);

  const comentariosFiltrados = useMemo(() => {
    if (comentarios.length === 0) return [];
    const notionIdsFiltrados = new Set(tarefasFiltradas.map(t => t.notionId));
    return comentarios.filter(c => notionIdsFiltrados.has(c.notionId));
  }, [comentarios, tarefasFiltradas]);

  const performancePorAgente = useMemo<PerformanceAgente[]>(() => {
    const mapaComentariosPorTarefa = new Map<string, ComentarioNotion[]>();
    for (const c of comentariosFiltrados) {
      const arr = mapaComentariosPorTarefa.get(c.notionId) || [];
      arr.push(c);
      mapaComentariosPorTarefa.set(c.notionId, arr);
    }

    const nomeBaseParaMatch = (nome: string) => removerAcentos(nome.split('|')[0].trim().toLowerCase());

    const agentes = new Map<string, {
      somaLeadTime: number;
      concluidas: number;
      concluidasComData: number;
      ativas: number;
      totalComentarios: number;
    }>();

    for (const tarefa of tarefasFiltradas) {
      const executores = tarefa.executores.length > 0 ? tarefa.executores : ['Nao atribuido'];
      const comentariosDaTarefa = mapaComentariosPorTarefa.get(tarefa.notionId) || [];

      for (const exec of executores) {
        const nome = nomeExibicao(exec);
        const ag = agentes.get(nome) || { somaLeadTime: 0, concluidas: 0, concluidasComData: 0, ativas: 0, totalComentarios: 0 };

        const execBase = nomeBaseParaMatch(exec);
        const comentariosDoAgente = comentariosDaTarefa.filter(c => {
          const autorBase = nomeBaseParaMatch(c.autor);
          return autorBase === execBase || autorBase.includes(execBase) || execBase.includes(autorBase);
        }).length;
        ag.totalComentarios += comentariosDoAgente;

        if (isConcluida(tarefa.status)) {
          ag.concluidas++;
          const dataCriacao = parseDataEntrada(tarefa.criadoEm);
          const dataConclusao = parseDataEntrada(tarefa.dataFim);
          if (dataCriacao && dataConclusao) {
            const diffDias = Math.max(0, Math.floor((dataConclusao.getTime() - dataCriacao.getTime()) / (1000 * 60 * 60 * 24)));
            ag.somaLeadTime += diffDias;
            ag.concluidasComData++;
          }
        } else if (isOperacionalAtiva(tarefa.status)) {
          ag.ativas++;
        }

        agentes.set(nome, ag);
      }
    }

    return Array.from(agentes.entries())
      .map(([nome, ag]) => ({
        nome,
        total: ag.concluidas + ag.ativas,
        tempoMedioDias: ag.concluidasComData > 0 ? Math.round((ag.somaLeadTime / ag.concluidasComData) * 10) / 10 : 0,
        concluidas: ag.concluidas,
        ativas: ag.ativas,
        totalComentarios: ag.totalComentarios,
      }))
      .filter(a => a.total > 0)
      .sort((a, b) => b.total - a.total || b.concluidas - a.concluidas);
  }, [tarefasFiltradas, comentariosFiltrados]);

  const interacoesPorUsuario = useMemo<InteracaoUsuario[]>(() => {
    const mapa = new Map<string, number>();
    for (const c of comentariosFiltrados) {
      const nome = nomeExibicao(c.autor);
      mapa.set(nome, (mapa.get(nome) || 0) + 1);
    }
    const total = comentariosFiltrados.length;
    return Array.from(mapa.entries())
      .map(([nome, totalComentarios]) => ({
        nome,
        totalComentarios,
        percentual: total > 0 ? Math.round((totalComentarios / total) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.totalComentarios - a.totalComentarios);
  }, [comentariosFiltrados]);

  const serieComentariosPorAgente = useMemo(() => {
    if (comentariosFiltrados.length === 0) return { serie: [] as Record<string, string | number>[], agentes: [] as string[], variacao: [] as Array<{ agente: string; total: number; ultimo: number; variacao: number }> };

    const agentesSet = new Set<string>();
    const mapa = new Map<string, Map<string, number>>();

    comentariosFiltrados.forEach(c => {
      if (!c.comentadoEm) return;
      const dt = new Date(c.comentadoEm);
      if (Number.isNaN(dt.getTime())) return;
      const chave = chavePeriodo(dt, filtros.granularidade);
      const nome = nomeExibicao(c.autor);
      if (!nome) return;
      agentesSet.add(nome);
      if (!mapa.has(chave)) mapa.set(chave, new Map());
      const periodo = mapa.get(chave)!;
      periodo.set(nome, (periodo.get(nome) || 0) + 1);
    });

    const totalPorAgente = new Map<string, number>();
    for (const [, periodo] of mapa) {
      for (const [agente, qtd] of periodo) {
        totalPorAgente.set(agente, (totalPorAgente.get(agente) || 0) + qtd);
      }
    }
    const topAgentes = Array.from(agentesSet)
      .sort((a, b) => (totalPorAgente.get(b) || 0) - (totalPorAgente.get(a) || 0))
      .slice(0, 5);

    const ordenado = Array.from(mapa.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(-12);

    const serie = ordenado.map(([chave, periodo]) => {
      const ponto: Record<string, string | number> = { label: labelPeriodo(chave, filtros.granularidade), chave };
      topAgentes.forEach(agente => { ponto[agente] = periodo.get(agente) || 0; });
      return ponto;
    });

    const variacao = topAgentes.map(agente => {
      const valores = ordenado.map(([, p]) => p.get(agente) || 0);
      const ultimo = valores[valores.length - 1] ?? 0;
      const penultimo = valores[valores.length - 2] ?? 0;
      const totalAgente = totalPorAgente.get(agente) || 0;
      const var_ = penultimo > 0 ? Math.round(((ultimo - penultimo) / penultimo) * 100) : (ultimo > 0 ? 100 : 0);
      return { agente, total: totalAgente, ultimo, variacao: var_ };
    });

    return { serie, agentes: topAgentes, variacao };
  }, [comentariosFiltrados, filtros.granularidade, nomeExibicao]);

  const insightsComentarios = useMemo(() => {
    const totalComentarios = comentariosFiltrados.length;
    const totalTarefas = tarefasFiltradas.length;
    const tarefasComComentario = new Set(comentariosFiltrados.map(c => c.notionId)).size;
    const tarefasSemComentario = totalTarefas - tarefasComComentario;
    const mediaComentariosPorTarefa = totalTarefas > 0 ? Math.round((totalComentarios / totalTarefas) * 10) / 10 : 0;

    return {
      totalComentarios,
      tarefasComComentario,
      tarefasSemComentario,
      percentTarefasSemComentario: totalTarefas > 0 ? Math.round((tarefasSemComentario / totalTarefas) * 100) : 0,
      mediaComentariosPorTarefa,
    };
  }, [comentariosFiltrados, tarefasFiltradas]);

  return {
    filtros,
    updateFiltro,
    resetFiltros,
    hasActiveFilters,
    tarefasFiltradas,
    kpis,
    dadosGraficoStatus,
    dadosGraficoPrioridade,
    dadosGraficoDepartamento,
    dadosGraficoExecutores,
    serieConclucoesPorAgente,
    dadosGraficoDepartamentosCriticos,
    topTarefasCriticas,
    insights,
    serieDemandaCapacidade,
    anomaliasConcluidas,
    gargalosCriticos,
    performancePorAgente,
    interacoesPorUsuario,
    serieComentariosPorAgente,
    insightsComentarios,
  };
}
