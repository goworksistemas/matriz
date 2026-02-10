import { useNavigate, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Coins, 
  TrendingUp, 
  Wallet, 
  Settings, 
  Users,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Relatorio } from '@/types'

const iconMap: Record<string, React.ElementType> = {
  'layout-dashboard': LayoutDashboard,
  'coins': Coins,
  'trending-up': TrendingUp,
  'wallet': Wallet,
  'settings': Settings,
  'users': Users,
}

interface SidebarProps {
  relatorios: Relatorio[]
  collapsed: boolean
  onToggleCollapse: () => void
}

export function Sidebar({ relatorios, collapsed, onToggleCollapse }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <aside 
      className={cn(
        "h-screen flex flex-col transition-all duration-300",
        "bg-gray-50 dark:bg-[#0c0c0e] border-r border-gray-200 dark:border-white/[0.06]",
        collapsed ? "w-[68px]" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-gray-200 dark:border-white/[0.06]">
        <button onClick={() => navigate('/')} className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105">
            <Zap className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-[13px] font-semibold text-gray-900 dark:text-white tracking-tight leading-tight">NetworkGo</h1>
              <p className="text-[10px] text-gray-500 dark:text-gray-600 leading-tight">Central de Relatórios</p>
            </div>
          )}
        </button>
      </div>

      {/* Toggle */}
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-[52px] w-6 h-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/[0.08] rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors z-10 shadow-sm"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <button
          onClick={() => navigate('/')}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-[13px]",
            isHome
              ? "bg-gray-200/60 dark:bg-white/[0.06] text-gray-900 dark:text-white"
              : "text-gray-500 hover:bg-gray-100 dark:hover:bg-white/[0.03] hover:text-gray-900 dark:hover:text-gray-300"
          )}
        >
          <LayoutDashboard className="w-[18px] h-[18px] flex-shrink-0" />
          {!collapsed && <span className="font-medium">Início</span>}
        </button>

        {!collapsed && (
          <div className="pt-4 pb-1.5 px-3">
            <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-widest">
              Relatórios
            </p>
          </div>
        )}
        {collapsed && <div className="h-3" />}

        {relatorios.filter(r => r.ativo).map((relatorio) => {
          const Icon = iconMap[relatorio.icone] || Coins
          const isActive = location.pathname === `/${relatorio.id}`

          return (
            <button
              key={relatorio.id}
              onClick={() => navigate(`/${relatorio.id}`)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-[13px]",
                isActive
                  ? "bg-primary-500/10 text-primary-600 dark:text-primary-400"
                  : "text-gray-500 hover:bg-gray-100 dark:hover:bg-white/[0.03] hover:text-gray-900 dark:hover:text-gray-300"
              )}
              title={collapsed ? relatorio.nome : undefined}
            >
              <Icon className="w-[18px] h-[18px] flex-shrink-0" />
              {!collapsed && <span className="font-medium">{relatorio.nome}</span>}
            </button>
          )
        })}
      </nav>

      <div className="p-3 border-t border-gray-200 dark:border-white/[0.04]">
        {!collapsed && (
          <p className="text-[10px] text-gray-400 dark:text-gray-700 text-center font-mono">v1.0.0</p>
        )}
      </div>
    </aside>
  )
}
