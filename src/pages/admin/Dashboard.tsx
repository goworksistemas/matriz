import { useState, useEffect } from 'react';
import { BarChart3, Users, FolderOpen, FileBarChart, ScrollText, Activity, Clock, TrendingUp, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface Stats {
  totalUsers: number;
  activeUsers: number;
  totalGroups: number;
  totalReports: number;
  totalLogs: number;
  logsByAction: { action: string; count: number }[];
  recentLogs: { action: string; email: string; created_at: string }[];
  usersByRole: { role: string; count: number }[];
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string;
  color: 'primary' | 'emerald' | 'amber' | 'violet';
}) {
  const styles = {
    primary: { icon: 'bg-primary-100 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400', value: 'text-primary-600 dark:text-primary-400' },
    emerald: { icon: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', value: 'text-emerald-600 dark:text-emerald-400' },
    amber: { icon: 'bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400', value: 'text-amber-600 dark:text-amber-400' },
    violet: { icon: 'bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400', value: 'text-violet-600 dark:text-violet-400' },
  };
  const s = styles[color];

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
      <div className="flex items-center gap-3">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", s.icon)}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className={cn("text-xl font-bold", s.value)}>{value}</p>
          <p className="text-xs text-gray-500">{label}</p>
          {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [
        { count: totalUsers },
        { count: activeUsers },
        { count: totalGroups },
        { count: totalReports },
        { count: totalLogs },
        { data: recentLogs },
        { data: profiles },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('active', true),
        supabase.from('access_groups').select('*', { count: 'exact', head: true }),
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('active', true),
        supabase.from('audit_logs').select('*', { count: 'exact', head: true }),
        supabase.from('audit_logs')
          .select('action, created_at, profiles(email)')
          .order('created_at', { ascending: false })
          .limit(10),
        supabase.from('profiles').select('role'),
      ]);

      // Contagem por role
      const roleMap = new Map<string, number>();
      (profiles || []).forEach((p: { role: string }) => {
        roleMap.set(p.role, (roleMap.get(p.role) || 0) + 1);
      });
      const usersByRole = Array.from(roleMap.entries()).map(([role, count]) => ({ role, count }));

      // Contagem por ação (dos recent logs como amostra simples)
      const actionMap = new Map<string, number>();
      (recentLogs || []).forEach((l: { action: string }) => {
        actionMap.set(l.action, (actionMap.get(l.action) || 0) + 1);
      });
      const logsByAction = Array.from(actionMap.entries()).map(([action, count]) => ({ action, count }));

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalGroups: totalGroups || 0,
        totalReports: totalReports || 0,
        totalLogs: totalLogs || 0,
        logsByAction,
        recentLogs: (recentLogs || []).map((l: Record<string, unknown>) => ({
          action: l.action as string,
          email: (l.profiles as { email: string } | null)?.email || '—',
          created_at: l.created_at as string,
        })),
        usersByRole,
      });
      setLoading(false);
    };
    load();
  }, []);

  const formatTime = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'agora';
    if (mins < 60) return `${mins}min atrás`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h atrás`;
    return `${Math.floor(hours / 24)}d atrás`;
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="h-full overflow-auto">
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-500" />
            Dashboard Admin
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Visão geral do sistema</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          <StatCard icon={Users} label="Usuários" value={stats.totalUsers} sub={`${stats.activeUsers} ativos`} color="primary" />
          <StatCard icon={FolderOpen} label="Grupos" value={stats.totalGroups} color="amber" />
          <StatCard icon={FileBarChart} label="Relatórios" value={stats.totalReports} color="emerald" />
          <StatCard icon={ScrollText} label="Logs totais" value={stats.totalLogs} color="violet" />
          <StatCard icon={Activity} label="Ações recentes" value={stats.logsByAction.length} sub="tipos distintos" color="primary" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Usuários por role */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-primary-500" />
              Usuários por Role
            </h3>
            <div className="space-y-3">
              {stats.usersByRole.map(({ role, count }) => {
                const total = stats.totalUsers || 1;
                const pct = Math.round((count / total) * 100);
                const colors: Record<string, string> = {
                  admin: 'bg-red-500',
                  manager: 'bg-amber-500',
                  viewer: 'bg-gray-400',
                };
                return (
                  <div key={role}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 capitalize">{role}</span>
                      <span className="text-xs text-gray-500">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full", colors[role] || 'bg-gray-400')} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              {stats.usersByRole.length === 0 && (
                <p className="text-xs text-gray-500 text-center py-4">Nenhum dado.</p>
              )}
            </div>
          </div>

          {/* Atividade recente */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-primary-500" />
              Atividade Recente
            </h3>
            <div className="space-y-2">
              {stats.recentLogs.map((log, i) => (
                <div key={i} className="flex items-center gap-3 py-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0" />
                  <span className="text-xs text-gray-700 dark:text-gray-300 font-medium truncate max-w-[100px]">{log.email}</span>
                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500">{log.action}</span>
                  <span className="text-[11px] text-gray-400 ml-auto flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(log.created_at)}
                  </span>
                </div>
              ))}
              {stats.recentLogs.length === 0 && (
                <p className="text-xs text-gray-500 text-center py-4">Nenhuma atividade registrada.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
