import { useState, useCallback } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { Sun, Moon } from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { Home } from '@/pages/Home'
import { ComissoesPage } from '@/pages/comissoes/ComissoesPage'
import { useTheme } from '@/hooks/ThemeContext'
import { RELATORIOS } from '@/config/relatorios'
import { cn } from '@/lib/utils'

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const location = useLocation()

  const isStandalone = location.pathname.startsWith('/standalone/')
  if (isStandalone) {
    return (
      <Routes>
        <Route path="/standalone/comissoes" element={<ComissoesStandalone />} />
      </Routes>
    )
  }

  const relatorioAtivo = RELATORIOS.find(r => location.pathname.startsWith(`/${r.id}`)) || null

  const handleToggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev)
  }, [])

  const handleToggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => {
      if (!prev) setSidebarCollapsed(true)
      return !prev
    })
  }, [])

  return (
    <div className="flex h-screen bg-white dark:bg-gray-950 overflow-hidden">
      <div className={cn(
        "relative flex-shrink-0 transition-all duration-300",
        isFullscreen && "hidden"
      )}>
        <Sidebar
          relatorios={RELATORIOS}
          collapsed={sidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
        />
      </div>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className={cn(isFullscreen && !relatorioAtivo && "hidden")}>
          <Header
            relatorio={relatorioAtivo}
            isFullscreen={isFullscreen}
            onToggleFullscreen={handleToggleFullscreen}
          />
        </div>

        <div className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/comissoes" element={<ComissoesPage />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

function ComissoesStandalone() {
  const { isDark, toggleTheme } = useTheme()

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col">
      <header className="h-14 border-b border-gray-200 dark:border-white/[0.06] bg-white/80 dark:bg-[#0c0c0e]/80 backdrop-blur-xl flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-gray-900 dark:text-white">Dashboard de Comissões</h1>
            <p className="text-[10px] text-gray-500 dark:text-gray-600">NetworkGo — Relatório compartilhado</p>
          </div>
        </div>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
          title={isDark ? 'Modo claro' : 'Modo escuro'}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </header>
      <div className="flex-1 overflow-hidden">
        <ComissoesPage />
      </div>
    </div>
  )
}

export default App
