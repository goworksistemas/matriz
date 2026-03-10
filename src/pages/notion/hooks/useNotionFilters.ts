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

export interface ResumoExecutor {
  nome: string;
  total: number;
  vencidas: number;
  noPrazo: number;
  hoje: number;
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
  tempoMedioDias: number;
  concluidas: number;
  ativas: number;
  totalComentarios: number;
  percentInteracoes: number;
  taxaNoPrazo: number;
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

function isStatusGlobal(status: string): boolean {
  return isConcluida(status) || isCancelada(status) || isStandBy(status);
}

function isOperacionalAtiva(status: string): boolean {
  return !isStatusGlobal(status);
}

function normalizarStatus(status: string): string {
  const s = status.trim().toLowerCase();
  if (s.includes('conclu')) return 'Concluido';
  if (s.includes('cancel')) return 'Cancelado';
  if (s.includes('stand')) return 'Stand by';
  if (s.includes('solicit')) return 'Solicitacao';
  if (s.includes('andamento') || s.includes('andamento')) return 'Em andamento';
  if (s.includes('agend')) return 'Agendado';
  if (s.includes('aprov')) return 'Aprovado';
  if (s.includes('implant')) return 'Implantacao';
  if (s.includes('aguard')) return 'Aguardando';
  if (!s) return 'Sem status';
  return status;
}

function normalizarPrioridade(prioridade: string): string {
  const p = prioridade.trim().toLowerCase();
  if (p.includes('urg')) return 'Urgente';
  if (p.includes('import')) return 'Importante';
  if (p.includes('media') || p === 'medio' || p === 'med') return 'Media';
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
      if (filtros.executor.length > 0 && !t.executores.some(e => filtros.executor.includes(e))) return false;
      if (filtros.busca.trim()) {
        const termo = filtros.busca.toLowerCase();
        if (!t.titulo.toLowerCase().includes(termo)) return false;
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
        const dataConclusao = isConcluida(t.status) ? parseDataEntrada(t.atualizadoEm ?? t.dataFim ?? t.criadoEm) : null;
        
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
    const ativas = total - concluidas - canceladas - emStandBy;
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
      Media: 2,
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

  const dadosGraficoPrazo = useMemo(() => {
    const ativas = tarefasFiltradas.filter(t => isOperacionalAtiva(t.status));
    const mapa = new Map<string, number>([
      ['Vencidas', 0],
      ['Vence hoje', 0],
      ['No prazo', 0],
      ['Sem prazo', 0],
    ]);

    ativas.forEach(t => {
      if (t.statusPrazo === 'vencida') mapa.set('Vencidas', (mapa.get('Vencidas') || 0) + 1);
      else if (t.statusPrazo === 'hoje') mapa.set('Vence hoje', (mapa.get('Vence hoje') || 0) + 1);
      else if (t.statusPrazo === 'no_prazo') mapa.set('No prazo', (mapa.get('No prazo') || 0) + 1);
      else mapa.set('Sem prazo', (mapa.get('Sem prazo') || 0) + 1);
    });

    return Array.from(mapa.entries()).map(([name, value]) => ({ name, value }));
  }, [tarefasFiltradas]);

  const resumoPorExecutor = useMemo<ResumoExecutor[]>(() => {
    const ativas = tarefasFiltradas.filter(t => isOperacionalAtiva(t.status));

    const mapa = new Map<string, ResumoExecutor>();

    ativas.forEach(t => {
      t.executores.forEach(exec => {
        const existing = mapa.get(exec) || { nome: exec, total: 0, vencidas: 0, noPrazo: 0, hoje: 0 };
        existing.total++;
        if (t.statusPrazo === 'vencida') existing.vencidas++;
        else if (t.statusPrazo === 'hoje') existing.hoje++;
        else if (t.statusPrazo === 'no_prazo') existing.noPrazo++;
        else existing.noPrazo++;
        mapa.set(exec, existing);
      });

      if (t.executores.length === 0) {
        const existing = mapa.get('Nao atribuido') || { nome: 'Nao atribuido', total: 0, vencidas: 0, noPrazo: 0, hoje: 0 };
        existing.total++;
        if (t.statusPrazo === 'vencida') existing.vencidas++;
        else if (t.statusPrazo === 'hoje') existing.hoje++;
        else existing.noPrazo++;
        mapa.set('Nao atribuido', existing);
      }
    });

    return Array.from(mapa.values()).sort((a, b) => b.vencidas - a.vencidas || b.total - a.total);
  }, [tarefasFiltradas]);

  const dadosGraficoExecutores = useMemo(() => {
    return [...resumoPorExecutor]
      .sort((a, b) => b.total - a.total || b.vencidas - a.vencidas)
      .slice(0, 8)
      .map(exec => ({ name: exec.nome, value: exec.total }));
  }, [resumoPorExecutor]);

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
      if (!isConcluida(tarefa.status) || !tarefa.criadoEm) return false;
      const dataCriacao = parseDataEntrada(tarefa.criadoEm);
      const dataConclusao = parseDataEntrada(tarefa.dataFim ?? tarefa.dataInicio);
      return !!dataCriacao && !!dataConclusao;
    });
    const somaLeadTimeDias = concluidasComData.reduce((acc, tarefa) => {
      const dataCriacao = parseDataEntrada(tarefa.criadoEm);
      const dataConclusao = parseDataEntrada(tarefa.dataFim ?? tarefa.dataInicio);
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
      const dataConclusao = parseDataEntrada(tarefa.dataFim ?? tarefa.dataInicio);
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
      Media: 2,
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
      if (filtros.executor.length > 0 && !t.executores.some(e => filtros.executor.includes(e))) return false;
      if (filtros.busca.trim()) {
        const termo = filtros.busca.toLowerCase();
        if (!t.titulo.toLowerCase().includes(termo)) return false;
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
        const dataConclusao = parseDataEntrada(tarefa.atualizadoEm ?? tarefa.dataFim ?? tarefa.criadoEm);
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
  }, [tarefas, filtros.status, filtros.prioridade, filtros.departamento, filtros.executor, filtros.busca, filtros.granularidade]);

  const topSolicitantes = useMemo(() => {
    const mapa = new Map<string, number>();

    tarefasFiltradas.forEach((tarefa) => {
      const solicitante =
        tarefa.solicitante?.trim() ||
        tarefa.criadoPor?.trim() ||
        'Nao informado';
      mapa.set(solicitante, (mapa.get(solicitante) || 0) + 1);
    });

    return Array.from(mapa.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
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

  const tarefasTimeline = useMemo(() => {
    return tarefasFiltradas
      .filter(t => isOperacionalAtiva(t.status))
      .sort((a, b) => {
        if (a.statusPrazo === 'vencida' && b.statusPrazo !== 'vencida') return -1;
        if (a.statusPrazo !== 'vencida' && b.statusPrazo === 'vencida') return 1;
        if (a.statusPrazo === 'hoje' && b.statusPrazo !== 'hoje') return -1;
        if (a.statusPrazo !== 'hoje' && b.statusPrazo === 'hoje') return 1;
        if (!a.dataFim) return 1;
        if (!b.dataFim) return -1;
        return a.dataFim.localeCompare(b.dataFim);
      });
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
      filtros.filtroCard !== null
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

    const mapaComentariosPorAutor = new Map<string, number>();
    for (const c of comentariosFiltrados) {
      mapaComentariosPorAutor.set(c.autor, (mapaComentariosPorAutor.get(c.autor) || 0) + 1);
    }

    const agentes = new Map<string, {
      somaLeadTime: number;
      concluidas: number;
      concluidasComData: number;
      ativas: number;
      totalComentarios: number;
      concluidasNoPrazo: number;
    }>();

    for (const tarefa of tarefasFiltradas) {
      const executores = tarefa.executores.length > 0 ? tarefa.executores : ['Nao atribuido'];
      const comentariosDaTarefa = mapaComentariosPorTarefa.get(tarefa.notionId) || [];

      for (const exec of executores) {
        const ag = agentes.get(exec) || { somaLeadTime: 0, concluidas: 0, concluidasComData: 0, ativas: 0, totalComentarios: 0, concluidasNoPrazo: 0 };

        const comentariosDoAgente = comentariosDaTarefa.filter(c => c.autor === exec).length;
        ag.totalComentarios += comentariosDoAgente;

        if (isConcluida(tarefa.status)) {
          ag.concluidas++;
          const dataCriacao = parseDataEntrada(tarefa.criadoEm);
          const dataConclusao = parseDataEntrada(tarefa.atualizadoEm ?? tarefa.dataFim);
          if (dataCriacao && dataConclusao) {
            const diffDias = Math.max(0, Math.floor((dataConclusao.getTime() - dataCriacao.getTime()) / (1000 * 60 * 60 * 24)));
            ag.somaLeadTime += diffDias;
            ag.concluidasComData++;
          }
          if (tarefa.dataFim) {
            const fim = parseDataEntrada(tarefa.dataFim);
            const conclusao = parseDataEntrada(tarefa.atualizadoEm ?? tarefa.dataFim);
            if (fim && conclusao && conclusao.getTime() <= fim.getTime() + 86400000) {
              ag.concluidasNoPrazo++;
            }
          }
        } else if (isOperacionalAtiva(tarefa.status)) {
          ag.ativas++;
        }

        agentes.set(exec, ag);
      }
    }

    const totalComentariosGeral = comentariosFiltrados.length;

    return Array.from(agentes.entries())
      .map(([nome, ag]) => ({
        nome,
        tempoMedioDias: ag.concluidasComData > 0 ? Math.round((ag.somaLeadTime / ag.concluidasComData) * 10) / 10 : 0,
        concluidas: ag.concluidas,
        ativas: ag.ativas,
        totalComentarios: ag.totalComentarios,
        percentInteracoes: totalComentariosGeral > 0 ? Math.round((ag.totalComentarios / totalComentariosGeral) * 1000) / 10 : 0,
        taxaNoPrazo: ag.concluidas > 0 ? Math.round((ag.concluidasNoPrazo / ag.concluidas) * 100) : 0,
      }))
      .filter(a => a.concluidas > 0 || a.ativas > 0)
      .sort((a, b) => b.concluidas - a.concluidas || a.tempoMedioDias - b.tempoMedioDias);
  }, [tarefasFiltradas, comentariosFiltrados]);

  const interacoesPorUsuario = useMemo<InteracaoUsuario[]>(() => {
    const mapa = new Map<string, number>();
    for (const c of comentariosFiltrados) {
      mapa.set(c.autor, (mapa.get(c.autor) || 0) + 1);
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
    dadosGraficoPrazo,
    dadosGraficoExecutores,
    dadosGraficoDepartamentosCriticos,
    topTarefasCriticas,
    insights,
    resumoPorExecutor,
    tarefasTimeline,
    serieDemandaCapacidade,
    topSolicitantes,
    gargalosCriticos,
    performancePorAgente,
    interacoesPorUsuario,
    insightsComentarios,
  };
}
