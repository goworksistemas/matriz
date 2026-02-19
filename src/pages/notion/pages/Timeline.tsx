import { ExternalLink, AlertTriangle, Clock, CheckCircle, CalendarX } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import type { TarefaProcessada } from '../services/api';

interface TimelineProps {
  tarefas: TarefaProcessada[];
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

const STATUS_CONFIG = {
  vencida: {
    icon: AlertTriangle,
    bg: 'bg-red-50 dark:bg-red-500/5',
    border: 'border-red-200 dark:border-red-500/20',
    badge: 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400 ring-red-200 dark:ring-red-500/20',
    iconColor: 'text-red-500',
  },
  hoje: {
    icon: Clock,
    bg: 'bg-amber-50 dark:bg-amber-500/5',
    border: 'border-amber-200 dark:border-amber-500/20',
    badge: 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 ring-amber-200 dark:ring-amber-500/20',
    iconColor: 'text-amber-500',
  },
  no_prazo: {
    icon: CheckCircle,
    bg: 'bg-emerald-50/50 dark:bg-emerald-500/5',
    border: 'border-emerald-200 dark:border-emerald-500/20',
    badge: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 ring-emerald-200 dark:ring-emerald-500/20',
    iconColor: 'text-emerald-500',
  },
  sem_data: {
    icon: CalendarX,
    bg: 'bg-gray-50 dark:bg-gray-500/5',
    border: 'border-gray-200 dark:border-gray-500/20',
    badge: 'bg-gray-100 dark:bg-gray-500/15 text-gray-600 dark:text-gray-400 ring-gray-200 dark:ring-gray-500/20',
    iconColor: 'text-gray-400',
  },
};

export function Timeline({ tarefas }: TimelineProps) {
  if (tarefas.length === 0) {
    return (
      <Card>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-gray-400">
            Nenhuma tarefa ativa no periodo
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary-500" />
          Tarefas e Prazos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {tarefas.map(t => {
            const config = STATUS_CONFIG[t.statusPrazo];
            const Icon = config.icon;

            return (
              <div
                key={t.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                  config.bg, config.border,
                )}
              >
                <Icon className={cn("h-4 w-4 mt-0.5 flex-shrink-0", config.iconColor)} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                      {t.titulo}
                    </p>
                    {t.notionUrl && (
                      <a
                        href={t.notionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 p-1 rounded text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ring-1", config.badge)}>
                      {t.statusPrazo === 'vencida' && `${t.diasAtraso}d atrasada`}
                      {t.statusPrazo === 'hoje' && 'Vence hoje'}
                      {t.statusPrazo === 'no_prazo' && `Prazo: ${formatDate(t.dataFim)}`}
                      {t.statusPrazo === 'sem_data' && 'Sem prazo'}
                    </span>

                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                      {t.executor}
                    </span>

                    {t.departamento !== 'Sem departamento' && (
                      <span className="text-[11px] text-gray-400 dark:text-gray-500">
                        {t.departamento}
                      </span>
                    )}

                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                      {t.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
