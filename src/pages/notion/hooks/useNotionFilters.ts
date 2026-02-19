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
  percentConcluidas: number;
}

export interface ResumoExecutor {
  nome: string;
  total: number;
  vencidas: number;
  noPrazo: number;
  hoje: number;
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
    const concluidas = tarefasFiltradas.filter(t =>
      t.status.toLowerCase().includes('conclu')
    ).length;
    const canceladas = tarefasFiltradas.filter(t =>
      t.status.toLowerCase().includes('cancel')
    ).length;
    const ativas = total - concluidas - canceladas;
    const vencidas = tarefasFiltradas.filter(t => t.statusPrazo === 'vencida' && !t.status.toLowerCase().includes('conclu') && !t.status.toLowerCase().includes('cancel')).length;
    const noPrazo = tarefasFiltradas.filter(t => t.statusPrazo === 'no_prazo' && !t.status.toLowerCase().includes('conclu') && !t.status.toLowerCase().includes('cancel')).length;
    const venceHoje = tarefasFiltradas.filter(t => t.statusPrazo === 'hoje' && !t.status.toLowerCase().includes('conclu') && !t.status.toLowerCase().includes('cancel')).length;
    const semData = tarefasFiltradas.filter(t => t.statusPrazo === 'sem_data' && !t.status.toLowerCase().includes('conclu') && !t.status.toLowerCase().includes('cancel')).length;

    return {
      totalTarefas: total,
      tarefasAtivas: ativas,
      vencidas,
      noPrazo,
      venceHoje,
      semData,
      concluidas,
      percentConcluidas: total > 0 ? Math.round((concluidas / total) * 100) : 0,
    };
  }, [tarefasFiltradas]);

  const dadosGraficoStatus = useMemo(() => {
    const mapa = new Map<string, number>();
    tarefasFiltradas.forEach(t => {
      mapa.set(t.status, (mapa.get(t.status) || 0) + 1);
    });
    return Array.from(mapa.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [tarefasFiltradas]);

  const dadosGraficoPrioridade = useMemo(() => {
    const mapa = new Map<string, number>();
    tarefasFiltradas.forEach(t => {
      mapa.set(t.prioridade, (mapa.get(t.prioridade) || 0) + 1);
    });
    return Array.from(mapa.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
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

  const resumoPorExecutor = useMemo<ResumoExecutor[]>(() => {
    const ativas = tarefasFiltradas.filter(t =>
      !t.status.toLowerCase().includes('conclu') && !t.status.toLowerCase().includes('cancel')
    );

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

  const tarefasTimeline = useMemo(() => {
    return tarefasFiltradas
      .filter(t => !t.status.toLowerCase().includes('conclu') && !t.status.toLowerCase().includes('cancel'))
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
    resumoPorExecutor,
    tarefasTimeline,
  };
}
