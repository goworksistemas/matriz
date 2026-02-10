import { Maximize2, Minimize2, ExternalLink, Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/hooks/ThemeContext'
import type { Relatorio } from '@/types'

interface HeaderProps {
  relatorio: Relatorio | null
  isFullscreen: boolean
  onToggleFullscreen: () => void
}

export function Header({ relatorio, isFullscreen, onToggleFullscreen }: HeaderProps) {
  const { isDark, toggleTheme } = useTheme()

  const handleOpenExternal = () => {
    if (relatorio) {
      window.open(`/standalone/${relatorio.id}`, '_blank')
    }
  }

  if (!relatorio) {
    return (
      <header className="h-14 bg-white/80 dark:bg-[#0c0c0e]/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/[0.06] flex items-center justify-between px-6">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Central de Relatórios</h2>
          <p className="text-[11px] text-gray-500 dark:text-gray-600">Selecione um relatório no menu lateral</p>
        </div>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
          title={isDark ? 'Modo claro' : 'Modo escuro'}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </header>
    )
  }

  return (
    <header className="h-14 bg-white/80 dark:bg-[#0c0c0e]/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/[0.06] flex items-center justify-between px-6">
      <div>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{relatorio.nome}</h2>
        <p className="text-[11px] text-gray-500 dark:text-gray-600">{relatorio.descricao}</p>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
          title={isDark ? 'Modo claro' : 'Modo escuro'}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <button
          onClick={handleOpenExternal}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
          title="Abrir em nova aba"
        >
          <ExternalLink className="w-4 h-4" />
        </button>

        <button
          onClick={onToggleFullscreen}
          className={cn(
            "p-2 rounded-lg transition-colors",
            isFullscreen 
              ? "text-primary-400 bg-primary-500/10 hover:bg-primary-500/20" 
              : "text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.06]"
          )}
          title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </header>
  )
}
