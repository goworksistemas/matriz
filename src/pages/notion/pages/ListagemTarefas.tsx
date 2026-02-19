import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, AlertTriangle, Clock, CheckCircle2, CalendarX, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import type { TarefaProcessada } from '../services/api';

interface ListagemTarefasProps {
  tarefas: TarefaProcessada[];
}

function formatarData(data: string | null): string {
  if (!data) return '-';
  const [ano, mes, dia] = data.split('-');
  if (!ano || !mes || !dia) return data;
  return `${dia}/${mes}/${ano}`;
}

function ordemStatus(statusPrazo: TarefaProcessada['statusPrazo']): number {
  if (statusPrazo === 'vencida') return 0;
  if (statusPrazo === 'hoje') return 1;
  if (statusPrazo === 'no_prazo') return 2;
  return 3;
}

const BADGE_STATUS_PRAZO: Record<TarefaProcessada['statusPrazo'], string> = {
  vencida: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400 ring-red-200 dark:ring-red-500/20',
  hoje: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 ring-amber-200 dark:ring-amber-500/20',
  no_prazo: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 ring-emerald-200 dark:ring-emerald-500/20',
  sem_data: 'bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400 ring-gray-200 dark:ring-gray-500/20',
};

export function ListagemTarefas({ tarefas }: ListagemTarefasProps) {
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(20);

  const tarefasOrdenadas = useMemo(() => {
    return [...tarefas].sort((a, b) => {
      const ordemA = ordemStatus(a.statusPrazo);
      const ordemB = ordemStatus(b.statusPrazo);
      if (ordemA !== ordemB) return ordemA - ordemB;
      if (!a.dataFim && !b.dataFim) return a.titulo.localeCompare(b.titulo);
      if (!a.dataFim) return 1;
      if (!b.dataFim) return -1;
      return a.dataFim.localeCompare(b.dataFim);
    });
  }, [tarefas]);

  const totalPaginas = Math.max(1, Math.ceil(tarefasOrdenadas.length / itensPorPagina));

  useEffect(() => {
    setPaginaAtual(1);
  }, [tarefas, itensPorPagina]);

  const paginaCorrigida = Math.min(paginaAtual, totalPaginas);
  const inicio = (paginaCorrigida - 1) * itensPorPagina;
  const fim = inicio + itensPorPagina;
  const tarefasPaginadas = tarefasOrdenadas.slice(inicio, fim);
  const inicioExibicao = tarefasOrdenadas.length === 0 ? 0 : inicio + 1;
  const fimExibicao = Math.min(fim, tarefasOrdenadas.length);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base">Listagem Completa de Tarefas</CardTitle>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>Itens por pagina</span>
            <select
              value={itensPorPagina}
              onChange={(e) => setItensPorPagina(Number(e.target.value))}
              className="h-8 rounded-md border border-gray-200 bg-white px-2 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {tarefasOrdenadas.length === 0 ? (
          <div className="flex items-center justify-center h-28 text-gray-400 text-sm">
            Nenhuma tarefa encontrada para os filtros atuais.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-white/[0.06]">
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Tarefa</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Executor</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Status</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Prazo</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Departamento</th>
                </tr>
              </thead>
              <tbody>
                {tarefasPaginadas.map((tarefa) => (
                  <tr
                    key={tarefa.id}
                    className="border-b border-gray-100 dark:border-white/[0.03] hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3 px-3">
                      {tarefa.notionUrl ? (
                        <a
                          href={tarefa.notionUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 font-medium text-primary-600 dark:text-primary-400 hover:underline"
                          title="Abrir tarefa no Notion"
                        >
                          <span className="truncate max-w-[320px]">{tarefa.titulo}</span>
                          <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                        </a>
                      ) : (
                        <span className="font-medium text-gray-800 dark:text-gray-200">{tarefa.titulo}</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-gray-700 dark:text-gray-300">{tarefa.executor}</td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ring-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 ring-gray-200 dark:ring-gray-700">
                        {tarefa.status}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ring-1', BADGE_STATUS_PRAZO[tarefa.statusPrazo])}>
                        {tarefa.statusPrazo === 'vencida' && <AlertTriangle className="h-3 w-3" />}
                        {tarefa.statusPrazo === 'hoje' && <Clock className="h-3 w-3" />}
                        {tarefa.statusPrazo === 'no_prazo' && <CheckCircle2 className="h-3 w-3" />}
                        {tarefa.statusPrazo === 'sem_data' && <CalendarX className="h-3 w-3" />}
                        {tarefa.statusPrazo === 'vencida' && `${tarefa.diasAtraso}d atrasada`}
                        {tarefa.statusPrazo === 'hoje' && 'Vence hoje'}
                        {tarefa.statusPrazo === 'no_prazo' && formatarData(tarefa.dataFim)}
                        {tarefa.statusPrazo === 'sem_data' && 'Sem prazo'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-gray-500 dark:text-gray-400">{tarefa.departamento}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tarefasOrdenadas.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Exibindo {inicioExibicao}-{fimExibicao} de {tarefasOrdenadas.length}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                disabled={paginaCorrigida <= 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <span className="text-xs text-gray-600 dark:text-gray-300 min-w-[70px] text-center">
                {paginaCorrigida} / {totalPaginas}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
                disabled={paginaCorrigida >= totalPaginas}
              >
                Proxima
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
