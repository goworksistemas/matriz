import { useState, useCallback } from 'react'
import { Sidebar, Header, ReportViewer, HomeScreen } from '@/components'
import { RELATORIOS } from '@/config/relatorios'
import { cn } from '@/lib/utils'

function App() {
  const [relatorioAtivo, setRelatorioAtivo] = useState<string | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const relatorioSelecionado = RELATORIOS.find(r => r.id === relatorioAtivo) || null

  const handleSelectRelatorio = useCallback((id: string) => {
    if (id === '') {
      setRelatorioAtivo(null)
    } else {
      setRelatorioAtivo(id)
    }
    setIsFullscreen(false)
  }, [])

  const handleRefresh = useCallback(() => {
    setIsLoading(true)
    setRefreshKey(prev => prev + 1)
    // Simula loading state
    setTimeout(() => setIsLoading(false), 500)
  }, [])

  const handleToggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev)
    if (!isFullscreen) {
      setSidebarCollapsed(true)
    }
  }, [isFullscreen])

  const handleOpenExternal = useCallback(() => {
    if (relatorioSelecionado) {
      window.open(relatorioSelecionado.url, '_blank')
    }
  }, [relatorioSelecionado])

  const handleToggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev)
  }, [])

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* Sidebar */}
      <div className={cn(
        "relative flex-shrink-0 transition-all duration-300",
        isFullscreen && "hidden"
      )}>
        <Sidebar
          relatorios={RELATORIOS}
          relatorioAtivo={relatorioAtivo}
          onSelectRelatorio={handleSelectRelatorio}
          collapsed={sidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <Header
          relatorio={relatorioSelecionado}
          isFullscreen={isFullscreen}
          isLoading={isLoading}
          onRefresh={handleRefresh}
          onToggleFullscreen={handleToggleFullscreen}
          onOpenExternal={handleOpenExternal}
        />

        {/* Content Area */}
        <div className="flex-1 overflow-hidden bg-gray-950">
          {relatorioSelecionado ? (
            <div className="h-full p-4">
              <ReportViewer 
                relatorio={relatorioSelecionado} 
                refreshKey={refreshKey}
              />
            </div>
          ) : (
            <HomeScreen 
              relatorios={RELATORIOS} 
              onSelectRelatorio={handleSelectRelatorio}
            />
          )}
        </div>
      </main>
    </div>
  )
}

export default App
