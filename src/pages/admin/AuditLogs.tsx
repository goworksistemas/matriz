import { useState, useEffect, useCallback } from 'react';
import { ScrollText, Loader2, RefreshCw, User, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
  profiles: { email: string; full_name: string | null } | null;
}

const ACTION_COLORS: Record<string, string> = {
  'login': 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400',
  'logout': 'bg-gray-100 dark:bg-gray-500/10 text-gray-600 dark:text-gray-400',
  'view_report': 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  'sync_data': 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
  'export_excel': 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400',
};

export function AdminAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(50);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('audit_logs')
      .select('*, profiles(email, full_name)')
      .order('created_at', { ascending: false })
      .limit(limit);
    setLogs((data || []) as AuditLog[]);
    setLoading(false);
  }, [limit]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const formatDate = (d: string) => {
    const date = new Date(d);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).format(date);
  };

  return (
    <div className="h-full overflow-auto">
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
              <ScrollText className="w-5 h-5 text-primary-500" />
              Logs de Auditoria
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Últimos {limit} registros</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={limit}
              onChange={e => setLimit(Number(e.target.value))}
              className="text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1.5 focus:ring-2 focus:ring-primary-500"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
            <ScrollText className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Nenhum log registrado ainda.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {logs.map(log => (
              <div
                key={log.id}
                className="flex items-start gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                {/* Time */}
                <div className="flex items-center gap-1 text-[11px] text-gray-400 w-32 flex-shrink-0 pt-0.5">
                  <Clock className="w-3 h-3" />
                  {formatDate(log.created_at)}
                </div>

                {/* Action badge */}
                <span className={cn(
                  "text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0",
                  ACTION_COLORS[log.action] || 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                )}>
                  {log.action}
                </span>

                {/* User */}
                <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 flex-shrink-0">
                  <User className="w-3 h-3" />
                  <span className="truncate max-w-[120px]">
                    {log.profiles?.full_name || log.profiles?.email || '—'}
                  </span>
                </div>

                {/* Resource */}
                {log.resource_type && (
                  <span className="text-xs text-gray-500">
                    {log.resource_type}{log.resource_id ? `: ${log.resource_id}` : ''}
                  </span>
                )}

                {/* Details */}
                {log.details && (
                  <span className="text-[11px] text-gray-400 truncate max-w-[200px]" title={JSON.stringify(log.details)}>
                    {JSON.stringify(log.details)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
