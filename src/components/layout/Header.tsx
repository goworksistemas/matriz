import { Maximize2, Minimize2, ExternalLink, Sun, Moon, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/hooks/ThemeContext'
import { useAuth } from '@/hooks/AuthContext'
import type { Relatorio } from '@/types'

interface HeaderProps {
  relatorio: Relatorio | null
  isFullscreen: boolean
  onToggleFullscreen: () => void
  onOpenMobileMenu: () => void
}

export function Header({ relatorio, isFullscreen, onToggleFullscreen, onOpenMobileMenu }: HeaderProps) {
  const { isDark, toggleTheme } = useTheme()
  const { reports } = useAuth()

  const handleOpenExternal = () => {
    if (relatorio) {
      const report = reports.find(r => r.slug === relatorio.id)
      const token = report?.share_token
      const url = token ? `/standalone/${relatorio.id}?token=${token}` : `/standalone/${relatorio.id}`
      window.open(url, '_blank')
    }
  }

  const btnClass = "p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"

  return (
    <header className="h-14 bg-white/80 dark:bg-[#0c0c0e]/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/[0.06] flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        {/* Hamburger mobile */}
        <button onClick={onOpenMobileMenu} className={cn(btnClass, "lg:hidden")}>
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            {relatorio ? relatorio.nome : 'Central de Relatórios'}
          </h2>
          <p className="text-[11px] text-gray-500 dark:text-gray-600 hidden sm:block">
            {relatorio ? relatorio.descricao : 'Selecione um relatório no menu lateral'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button onClick={toggleTheme} className={btnClass} title={isDark ? 'Modo claro' : 'Modo escuro'}>
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {relatorio && (
          <>
            <button onClick={handleOpenExternal} className={cn(btnClass, "hidden sm:flex")} title="Abrir em nova aba">
              <ExternalLink className="w-4 h-4" />
            </button>
            <button
              onClick={onToggleFullscreen}
              className={cn(
                "p-2 rounded-lg transition-colors hidden sm:flex",
                isFullscreen
                  ? "text-primary-400 bg-primary-500/10 hover:bg-primary-500/20"
                  : btnClass
              )}
              title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </>
        )}
      </div>
    </header>
  )
}
