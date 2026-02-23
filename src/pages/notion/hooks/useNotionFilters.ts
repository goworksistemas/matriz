import { useState, useMemo, useCallback } from 'react';
import type { TarefaProcessada } from '../services/api';

export interface FiltrosNotion {
  status: string;
  prioridade: string;
  departamento: string;
  executor: string;
}

const FILTROS_INICIAL: FiltrosNotion = {
  status: '',
  prioridade: '',
  departamento: '',
  executor: '',
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
}

export interface SerieDemandaCapacidade {
  mes: string;
  criadas: number;
  concluidas: number;
}

function parseDataEntrada(data: string | null): Date | null {
  if (!data) return null;
  const dt = new Date(data);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function chaveMes(data: Date): string {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
}

function labelMes(chave: string): string {
  const [ano, mes] = chave.split('-').map(Number);
  const dt = new Date(ano, (mes || 1) - 1, 1);
  return dt.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
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

export function useNotionFilters(tarefas: TarefaProcessada[]) {
  const [filtros, setFiltros] = useState<FiltrosNotion>(FILTROS_INICIAL);

  const tarefasFiltradas = useMemo(() => {
    return tarefas.filter(t => {
      if (filtros.status && t.status !== filtros.status) return false;
      if (filtros.prioridade && t.prioridade !== filtros.prioridade) return false;
      if (filtros.departamento && t.departamento !== filtros.departamento) return false;
      if (filtros.executor && !t.executores.includes(filtros.executor)) return false;
      return true;
    });
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

    return {
      riscoGeral: ativas.length > 0 ? Math.round((atrasadas.length / ativas.length) * 100) : 0,
      atrasoMedioDias,
      taxaSemPrazo: ativas.length > 0 ? Math.round((semPrazo.length / ativas.length) * 100) : 0,
      tarefasSemResponsavel,
      taxaStandBy: total > 0 ? Math.round((emStandBy / total) * 100) : 0,
      taxaFechamento: total > 0 ? Math.round(((concluidas + canceladas) / total) * 100) : 0,
    };
  }, [tarefasFiltradas]);

  const serieDemandaCapacidade = useMemo<SerieDemandaCapacidade[]>(() => {
    const mapa = new Map<string, { criadas: number; concluidas: number }>();

    tarefasFiltradas.forEach((tarefa) => {
      const dataCriacao = parseDataEntrada(tarefa.criadoEm ?? tarefa.dataInicio);
      if (dataCriacao) {
        const chave = chaveMes(dataCriacao);
        const atual = mapa.get(chave) || { criadas: 0, concluidas: 0 };
        atual.criadas += 1;
        mapa.set(chave, atual);
      }

      if (isConcluida(tarefa.status)) {
        const dataConclusao = parseDataEntrada(tarefa.atualizadoEm ?? tarefa.dataFim ?? tarefa.criadoEm);
        if (dataConclusao) {
          const chave = chaveMes(dataConclusao);
          const atual = mapa.get(chave) || { criadas: 0, concluidas: 0 };
          atual.concluidas += 1;
          mapa.set(chave, atual);
        }
      }
    });

    return Array.from(mapa.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([mes, values]) => ({
        mes: labelMes(mes),
        criadas: values.criadas,
        concluidas: values.concluidas,
      }));
  }, [tarefasFiltradas]);

  const topSolicitantes = useMemo(() => {
    const mapa = new Map<string, number>();

    tarefasFiltradas.forEach((tarefa) => {
      const solicitante = tarefa.solicitante?.trim() || 'Nao informado';
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
    return Object.values(filtros).some(v => v !== '');
  }, [filtros]);

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
  };
}
