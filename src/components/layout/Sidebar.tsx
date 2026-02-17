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
  LogOut,
  ShieldCheck,
  FolderOpen,
  FileBarChart,
  ScrollText,
  BarChart3,
  Palette,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/AuthContext'

const iconMap: Record<string, React.ElementType> = {
  'layout-dashboard': LayoutDashboard,
  'coins': Coins,
  'trending-up': TrendingUp,
  'wallet': Wallet,
  'settings': Settings,
  'users': Users,
  'bar-chart': TrendingUp,
}

interface SidebarProps {
  collapsed: boolean
  mobileOpen: boolean
  onToggleCollapse: () => void
  onCloseMobile: () => void
}

export function Sidebar({ collapsed, mobileOpen, onToggleCollapse, onCloseMobile }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile, reports, signOut, isAdmin } = useAuth()
  const isHome = location.pathname === '/'

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/login'
  }

  const handleNav = (path: string) => {
    navigate(path)
    onCloseMobile() // Fecha o drawer no mobile após navegar
  }

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-gray-200 dark:border-white/[0.06]">
        <button onClick={() => handleNav('/')} className="flex items-center gap-3 group">
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
        {/* Fechar drawer no mobile */}
        <button onClick={onCloseMobile} className="lg:hidden p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Toggle desktop */}
      <button
        onClick={onToggleCollapse}
        className="hidden lg:flex absolute -right-3 top-[52px] w-6 h-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/[0.08] rounded-full items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors z-10 shadow-sm"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <button
          onClick={() => handleNav('/')}
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

        {reports.length > 0 && (
          <>
            {!collapsed && (
              <div className="pt-4 pb-1.5 px-3">
                <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-widest">Relatórios</p>
              </div>
            )}
            {collapsed && <div className="h-3" />}

            {reports.map((report) => {
              const Icon = iconMap[report.icon] || Coins
              const isActive = location.pathname === `/${report.slug}`
              return (
                <button
                  key={report.report_id}
                  onClick={() => handleNav(`/${report.slug}`)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-[13px]",
                    isActive ? "bg-primary-500/10 text-primary-600 dark:text-primary-400" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-white/[0.03] hover:text-gray-900 dark:hover:text-gray-300"
                  )}
                  title={collapsed ? report.name : undefined}
                >
                  <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                  {!collapsed && <span className="font-medium">{report.name}</span>}
                </button>
              )
            })}
          </>
        )}
      </nav>

      {/* Admin */}
      {isAdmin && (
        <div className="p-3 border-t border-gray-200 dark:border-white/[0.04]">
          {!collapsed && (
            <div className="pb-1.5 px-3">
              <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-widest">Admin</p>
            </div>
          )}
          {[
            { path: '/admin', icon: BarChart3, label: 'Dashboard' },
            { path: '/admin/usuarios', icon: ShieldCheck, label: 'Usuários' },
            { path: '/admin/grupos', icon: FolderOpen, label: 'Grupos' },
            { path: '/admin/relatorios', icon: FileBarChart, label: 'Relatórios' },
            { path: '/admin/logs', icon: ScrollText, label: 'Logs' },
            { path: '/admin/tema', icon: Palette, label: 'Tema' },
          ].map(item => (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-[13px]",
                location.pathname === item.path ? "bg-primary-500/10 text-primary-600 dark:text-primary-400" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-white/[0.03] hover:text-gray-900 dark:hover:text-gray-300"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </div>
      )}

      {/* User + Logout */}
      <div className="p-3 border-t border-gray-200 dark:border-white/[0.04] space-y-2">
        {profile && !collapsed && (
          <button
            onClick={() => handleNav('/perfil')}
            className={cn(
              "w-full text-left px-3 py-2 rounded-lg transition-colors",
              location.pathname === '/perfil' ? "bg-gray-200/60 dark:bg-white/[0.06]" : "hover:bg-gray-100 dark:hover:bg-white/[0.03]"
            )}
          >
            <p className="text-xs font-medium text-gray-900 dark:text-gray-200 truncate">{profile.full_name || profile.email}</p>
            <p className="text-[10px] text-gray-500 truncate">{profile.role}</p>
          </button>
        )}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-gray-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          title={collapsed ? 'Sair' : undefined}
        >
          <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
          {!collapsed && <span className="font-medium">Sair</span>}
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={cn(
        "hidden lg:flex h-screen flex-col transition-all duration-300",
        "bg-gray-50 dark:bg-[#0c0c0e] border-r border-gray-200 dark:border-white/[0.06]",
        collapsed ? "w-[68px]" : "w-64"
      )}>
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCloseMobile} />
          {/* Drawer */}
          <aside className="absolute left-0 top-0 h-full w-72 flex flex-col bg-gray-50 dark:bg-[#0c0c0e] border-r border-gray-200 dark:border-white/[0.06] shadow-2xl animate-slide-in-left">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  )
}
