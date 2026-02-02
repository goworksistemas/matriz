import { RefreshCw, Maximize2, Minimize2, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Relatorio } from '@/types'

interface HeaderProps {
  relatorio: Relatorio | null
  isFullscreen: boolean
  isLoading: boolean
  onRefresh: () => void
  onToggleFullscreen: () => void
  onOpenExternal: () => void
}

export function Header({ 
  relatorio, 
  isFullscreen, 
  isLoading, 
  onRefresh, 
  onToggleFullscreen,
  onOpenExternal 
}: HeaderProps) {
  if (!relatorio) {
    return (
      <header className="h-16 bg-gray-900/50 backdrop-blur-sm border-b border-gray-800 flex items-center justify-between px-6">
        <div>
          <h2 className="text-xl font-semibold text-white">Central de Relatórios</h2>
          <p className="text-sm text-gray-500">Selecione um relatório no menu lateral</p>
        </div>
      </header>
    )
  }

  return (
    <header className="h-16 bg-gray-900/50 backdrop-blur-sm border-b border-gray-800 flex items-center justify-between px-6">
      <div>
        <h2 className="text-xl font-semibold text-white">{relatorio.nome}</h2>
        <p className="text-sm text-gray-500">{relatorio.descricao}</p>
      </div>

      <div className="flex items-center gap-2">
        {/* Refresh */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className={cn(
            "p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors",
            isLoading && "opacity-50 cursor-not-allowed"
          )}
          title="Atualizar relatório"
        >
          <RefreshCw className={cn("w-5 h-5", isLoading && "animate-spin")} />
        </button>

        {/* Open External */}
        <button
          onClick={onOpenExternal}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          title="Abrir em nova aba"
        >
          <ExternalLink className="w-5 h-5" />
        </button>

        {/* Fullscreen */}
        <button
          onClick={onToggleFullscreen}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
        >
          {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>
      </div>
    </header>
  )
}
