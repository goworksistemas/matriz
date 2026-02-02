import { 
  LayoutDashboard, 
  Coins, 
  TrendingUp, 
  Wallet, 
  Settings, 
  Users,
  ChevronLeft,
  ChevronRight,
  Zap
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
  relatorioAtivo: string | null
  onSelectRelatorio: (id: string) => void
  collapsed: boolean
  onToggleCollapse: () => void
}

export function Sidebar({ 
  relatorios, 
  relatorioAtivo, 
  onSelectRelatorio, 
  collapsed, 
  onToggleCollapse 
}: SidebarProps) {
  return (
    <aside 
      className={cn(
        "h-screen bg-gray-900 border-r border-gray-800 flex flex-col transition-all duration-300",
        collapsed ? "w-20" : "w-72"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
            <Zap className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="text-lg font-semibold text-white tracking-tight">NetworkGo</h1>
              <p className="text-xs text-gray-500">Central de Relatórios</p>
            </div>
          )}
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-20 w-6 h-6 bg-gray-800 border border-gray-700 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-colors z-10"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {/* Home */}
        <button
          onClick={() => onSelectRelatorio('')}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
            relatorioAtivo === null || relatorioAtivo === ''
              ? "bg-primary-500/10 text-primary-400"
              : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"
          )}
        >
          <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="font-medium">Início</span>}
        </button>

        {/* Separador */}
        {!collapsed && (
          <div className="pt-4 pb-2">
            <p className="px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Relatórios
            </p>
          </div>
        )}

        {/* Lista de Relatórios */}
        {relatorios.filter(r => r.ativo).map((relatorio) => {
          const Icon = iconMap[relatorio.icone] || Coins
          const isActive = relatorioAtivo === relatorio.id

          return (
            <button
              key={relatorio.id}
              onClick={() => onSelectRelatorio(relatorio.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                isActive
                  ? "bg-primary-500/10 text-primary-400"
                  : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"
              )}
              title={collapsed ? relatorio.nome : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <div className="flex-1 text-left">
                  <span className="font-medium block">{relatorio.nome}</span>
                </div>
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        {!collapsed && (
          <div className="text-xs text-gray-600 text-center">
            v1.0.0
          </div>
        )}
      </div>
    </aside>
  )
}
