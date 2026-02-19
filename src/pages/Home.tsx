import { useNavigate } from 'react-router-dom';
import {
  Coins,
  TrendingUp,
  Wallet,
  Settings,
  Users,
  ArrowUpRight,
  BarChart3,
  LayoutDashboard,
  Trophy,
  ListTodo,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/AuthContext';

const iconMap: Record<string, React.ElementType> = {
  'coins': Coins,
  'trending-up': TrendingUp,
  'wallet': Wallet,
  'settings': Settings,
  'users': Users,
  'bar-chart': TrendingUp,
  'layout-dashboard': LayoutDashboard,
};

const categoriaConfig: Record<string, {
  accent: string
  barColor: string
  hoverBorder: string
}> = {
  vendas: {
    accent: 'text-emerald-500',
    barColor: 'bg-emerald-500',
    hoverBorder: 'hover:border-emerald-400/50 dark:hover:border-emerald-500/30',
  },
  financeiro: {
    accent: 'text-amber-500',
    barColor: 'bg-amber-500',
    hoverBorder: 'hover:border-amber-400/50 dark:hover:border-amber-500/30',
  },
  operacional: {
    accent: 'text-blue-500',
    barColor: 'bg-blue-500',
    hoverBorder: 'hover:border-blue-400/50 dark:hover:border-blue-500/30',
  },
  rh: {
    accent: 'text-violet-500',
    barColor: 'bg-violet-500',
    hoverBorder: 'hover:border-violet-400/50 dark:hover:border-violet-500/30',
  },
};

const previewConfig: Record<string, {
  illustration: 'chart' | 'podium' | 'tasks';
  tagIcon: React.ElementType;
  tagText: string;
}> = {
  comissoes: { illustration: 'chart', tagIcon: Coins, tagText: 'Comissoes e vendedores' },
  ranking: { illustration: 'podium', tagIcon: Trophy, tagText: 'Deals e competicao' },
  notion: { illustration: 'tasks', tagIcon: ListTodo, tagText: 'Tarefas e prazos' },
};

function IllustrationChart({ color }: { color: string }) {
  const bars = [35, 55, 42, 70, 58, 85, 65, 78, 50, 90];
  return (
    <div className="flex items-end gap-[3px] h-full px-1">
      {bars.map((h, i) => (
        <div
          key={i}
          className={cn("flex-1 rounded-t transition-all duration-500 group-hover:opacity-90", color)}
          style={{ height: `${h}%`, opacity: 0.15 + (i / bars.length) * 0.45 }}
        />
      ))}
    </div>
  );
}

function IllustrationPodium({ color }: { color: string }) {
  const positions = [
    { h: '55%', w: 'w-10', label: '2', opacity: 0.35 },
    { h: '75%', w: 'w-12', label: '1', opacity: 0.5 },
    { h: '40%', w: 'w-10', label: '3', opacity: 0.25 },
  ];
  return (
    <div className="flex items-end justify-center gap-1.5 h-full">
      {positions.map((p, i) => (
        <div key={i} className="flex flex-col items-center gap-1" style={{ height: p.h }}>
          <span className="text-[9px] font-bold text-gray-400/60 dark:text-gray-500/60">{p.label}</span>
          <div
            className={cn("flex-1 rounded-t transition-all duration-500 group-hover:opacity-60", p.w, color)}
            style={{ opacity: p.opacity }}
          />
        </div>
      ))}
    </div>
  );
}

function IllustrationTasks({ color }: { color: string }) {
  const rows = [
    { w: '80%', op: 0.4 },
    { w: '60%', op: 0.3 },
    { w: '90%', op: 0.45 },
    { w: '50%', op: 0.25 },
    { w: '70%', op: 0.35 },
  ];
  return (
    <div className="flex flex-col justify-center gap-2 h-full px-2">
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-sm flex-shrink-0", color)} style={{ opacity: r.op }} />
          <div className="flex-1 h-2 rounded bg-gray-200/50 dark:bg-white/[0.04]">
            <div
              className={cn("h-full rounded transition-all duration-500 group-hover:opacity-50", color)}
              style={{ width: r.w, opacity: r.op }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function IllustrationGeneric({ color }: { color: string }) {
  return <IllustrationChart color={color} />;
}

export function Home() {
  const navigate = useNavigate();
  const { reports, profile } = useAuth();

  return (
    <div className="h-full overflow-auto">
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">

        <div className="mb-8">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">
            {profile ? `Ola, ${profile.full_name || profile.email.split('@')[0]}` : 'Relatorios'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {reports.length} {reports.length === 1 ? 'relatorio disponivel' : 'relatorios disponiveis'}
          </p>
        </div>

        {reports.length === 0 ? (
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-12 text-center">
            <BarChart3 className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Nenhum relatorio disponivel para sua conta.</p>
            <p className="text-xs text-gray-400 mt-1">Solicite acesso ao administrador.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map((report) => {
              const Icon = iconMap[report.icon] || Coins;
              const config = categoriaConfig[report.category] || categoriaConfig.operacional;
              const pConfig = previewConfig[report.slug];

              return (
                <button
                  key={report.report_id}
                  onClick={() => navigate(`/${report.slug}`)}
                  className={cn(
                    "group text-left rounded-xl overflow-hidden",
                    "border border-gray-200 dark:border-gray-800",
                    "bg-white dark:bg-gray-900",
                    "transition-all duration-300",
                    "hover:shadow-lg dark:hover:shadow-black/20",
                    "hover:-translate-y-0.5",
                    config.hoverBorder,
                  )}
                >
                  {/* Ilustracao */}
                  <div className="h-24 mx-4 mt-4 rounded-lg bg-gray-50 dark:bg-white/[0.02] overflow-hidden p-2">
                    {pConfig?.illustration === 'chart' && <IllustrationChart color={config.barColor} />}
                    {pConfig?.illustration === 'podium' && <IllustrationPodium color={config.barColor} />}
                    {pConfig?.illustration === 'tasks' && <IllustrationTasks color={config.barColor} />}
                    {!pConfig && <IllustrationGeneric color={config.barColor} />}
                  </div>

                  {/* Info */}
                  <div className="p-4 pt-3">
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <Icon className={cn("w-4 h-4 flex-shrink-0", config.accent)} />
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white leading-tight truncate">
                        {report.name}
                      </h3>
                      <ArrowUpRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 flex-shrink-0 ml-auto transition-all duration-200 group-hover:text-gray-500 dark:group-hover:text-gray-400 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </div>
                    <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                      {report.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
