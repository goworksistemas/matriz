import { useMemo } from 'react';
import { AlertTriangle, Clock, CheckCircle2, CalendarX } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TarefaProcessada } from '../services/api';
import { TabelaNotion, type ColunaTabela } from '../components/TabelaNotion';

interface ListagemTarefasProps {
  tarefas: TarefaProcessada[];
}

function formatarData(data: string | null): string {
  if (!data) return '-';
  const [ano, mes, dia] = data.split('-');
  if (!ano || !mes || !dia) return data;
  return `${dia}/${mes}/${ano}`;
}

const BADGE_STATUS_PRAZO: Record<TarefaProcessada['statusPrazo'], string> = {
  vencida: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400 ring-red-200 dark:ring-red-500/20',
  hoje: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 ring-amber-200 dark:ring-amber-500/20',
  no_prazo: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 ring-emerald-200 dark:ring-emerald-500/20',
  sem_data: 'bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400 ring-gray-200 dark:ring-gray-500/20',
};

const PRAZO_ICONS: Record<TarefaProcessada['statusPrazo'], React.ReactNode> = {
  vencida: <AlertTriangle className="h-3 w-3" />,
  hoje: <Clock className="h-3 w-3" />,
  no_prazo: <CheckCircle2 className="h-3 w-3" />,
  sem_data: <CalendarX className="h-3 w-3" />,
};

const PRAZO_LABEL: Record<TarefaProcessada['statusPrazo'], (t: TarefaProcessada) => string> = {
  vencida: t => `${t.diasAtraso}d atrasada`,
  hoje: () => 'Vence hoje',
  no_prazo: t => formatarData(t.dataFim),
  sem_data: () => 'Sem prazo',
};

const PRAZO_ORDEM: Record<TarefaProcessada['statusPrazo'], number> = {
  vencida: 0, hoje: 1, no_prazo: 2, sem_data: 3,
};

export function ListagemTarefas({ tarefas }: ListagemTarefasProps) {
  const columns = useMemo<ColunaTabela<TarefaProcessada>[]>(() => [
    {
      key: 'titulo', header: 'Tarefa', accessor: r => r.titulo,
      sortable: true, filterable: 'text', width: '28%',
      render: r => <span className="font-medium text-gray-800 dark:text-gray-200 line-clamp-2">{r.titulo}</span>,
    },
    {
      key: 'executor', header: 'Executor', accessor: r => r.executor || 'Não atribuído',
      sortable: true, filterable: 'select',
      render: r => <span className="text-gray-700 dark:text-gray-300">{r.executor || 'Não atribuído'}</span>,
    },
    {
      key: 'solicitante', header: 'Solicitante', accessor: r => r.solicitante,
      sortable: true, filterable: 'select',
      render: r => <span className="text-gray-700 dark:text-gray-300">{r.solicitante || '-'}</span>,
    },
    {
      key: 'status', header: 'Status', accessor: r => r.status,
      sortable: true, filterable: 'select',
      render: r => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ring-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 ring-gray-200 dark:ring-gray-700">
          {r.status}
        </span>
      ),
    },
    {
      key: 'prazo', header: 'Prazo',
      accessor: r => PRAZO_ORDEM[r.statusPrazo] * 10000 - r.diasAtraso,
      sortable: true, filterable: false,
      render: r => (
        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ring-1', BADGE_STATUS_PRAZO[r.statusPrazo])}>
          {PRAZO_ICONS[r.statusPrazo]}
          {PRAZO_LABEL[r.statusPrazo](r)}
        </span>
      ),
    },
    {
      key: 'departamento', header: 'Departamento', accessor: r => r.departamento,
      sortable: true, filterable: 'select',
      render: r => <span className="text-gray-500 dark:text-gray-400">{r.departamento || '-'}</span>,
    },
    {
      key: 'prioridade', header: 'Prioridade', accessor: r => r.prioridade,
      sortable: true, filterable: 'select',
      render: r => <span className="text-gray-500 dark:text-gray-400">{r.prioridade || '-'}</span>,
    },
    {
      key: 'tags', header: 'Tags', accessor: r => r.tags.join(', '),
      filterable: 'text', sortable: false,
      render: r => (
        <div className="flex flex-wrap gap-1">
          {r.tags.map(tag => (
            <span key={tag} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary-100 dark:bg-primary-500/15 text-primary-700 dark:text-primary-300">
              {tag}
            </span>
          ))}
        </div>
      ),
    },
  ], []);

  return (
    <TabelaNotion
      data={tarefas}
      columns={columns}
      titulo="Listagem Completa de Tarefas"
      keyExtractor={r => r.id}
      notionUrlAccessor={r => r.notionUrl}
      defaultSort={{ key: 'prazo', dir: 'asc' }}
      defaultPageSize={20}
      emptyMessage="Nenhuma tarefa encontrada para os filtros atuais."
    />
  );
}
