import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation, useSearchParams } from 'react-router-dom'
import { Sun, Moon, Loader2 } from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { Home } from '@/pages/Home'
import { Login } from '@/pages/Login'
import { ComissoesPage } from '@/pages/comissoes/ComissoesPage'
import { RankingPage } from '@/pages/ranking/RankingPage'
import { AccessDenied } from '@/pages/AccessDenied'
import { NotFound } from '@/pages/NotFound'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { VersionBadge } from '@/components/layout/VersionBadge'
import { AdminUsers } from '@/pages/admin/Users'
import { AdminGroups } from '@/pages/admin/Groups'
import { AdminReports } from '@/pages/admin/Reports'
import { AdminAuditLogs } from '@/pages/admin/AuditLogs'
import { AdminDashboard } from '@/pages/admin/Dashboard'
import { AdminTheme } from '@/pages/admin/Theme'
import { ProfilePage } from '@/pages/Profile'
import { useAuth } from '@/hooks/AuthContext'
import { useTheme } from '@/hooks/ThemeContext'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

// ============================================
// LOADING GLOBAL
// ============================================

function FullPageLoader() {
  return (
    <div className="h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
      <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
    </div>
  )
}

// ============================================
// LAYOUT PROTEGIDO
// ============================================

function ProtectedLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { reports, hasReportAccess, isAdmin } = useAuth()
  const location = useLocation()

  const relatorioAtivo = reports.find(r => location.pathname === `/${r.slug}`) || null

  return (
    <div className="flex h-screen bg-white dark:bg-gray-950 overflow-hidden">
      <div className={cn("relative flex-shrink-0 transition-all duration-300", isFullscreen && "hidden")}>
        <Sidebar
          collapsed={sidebarCollapsed}
          mobileOpen={mobileOpen}
          onToggleCollapse={() => setSidebarCollapsed(p => !p)}
          onCloseMobile={() => setMobileOpen(false)}
        />
      </div>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className={cn(isFullscreen && !relatorioAtivo && "hidden")}>
          <Header
            relatorio={relatorioAtivo ? {
              id: relatorioAtivo.slug,
              nome: relatorioAtivo.name,
              descricao: relatorioAtivo.description || '',
              icone: relatorioAtivo.icon,
              categoria: relatorioAtivo.category as 'vendas' | 'financeiro' | 'operacional' | 'rh',
              ativo: true,
            } : null}
            isFullscreen={isFullscreen}
            onToggleFullscreen={() => setIsFullscreen(p => { if (!p) setSidebarCollapsed(true); return !p; })}
            onOpenMobileMenu={() => setMobileOpen(true)}
          />
        </div>

        <Breadcrumb />

        <div className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/comissoes" element={
              hasReportAccess('comissoes') ? <ComissoesPage /> : <AccessDenied />
            } />
            <Route path="/ranking" element={
              hasReportAccess('ranking') ? <RankingPage /> : <AccessDenied />
            } />
            <Route path="/admin" element={
              isAdmin ? <AdminDashboard /> : <AccessDenied />
            } />
            <Route path="/admin/usuarios" element={
              isAdmin ? <AdminUsers /> : <AccessDenied />
            } />
            <Route path="/admin/grupos" element={
              isAdmin ? <AdminGroups /> : <AccessDenied />
            } />
            <Route path="/admin/relatorios" element={
              isAdmin ? <AdminReports /> : <AccessDenied />
            } />
            <Route path="/admin/logs" element={
              isAdmin ? <AdminAuditLogs /> : <AccessDenied />
            } />
            <Route path="/admin/tema" element={
              isAdmin ? <AdminTheme /> : <AccessDenied />
            } />
            <Route path="/perfil" element={<ProfilePage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

// ============================================
// STANDALONE
// ============================================

function StandaloneComissoes() {
  const { isDark, toggleTheme } = useTheme()
  const { user, isLoading } = useAuth()
  const [searchParams] = useSearchParams()
  const [tokenOk, setTokenOk] = useState<boolean | null>(null)

  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) { setTokenOk(null); return }
    supabase
      .from('reports')
      .select('id')
      .eq('share_token', token)
      .eq('slug', 'comissoes')
      .eq('standalone_public', true)
      .single()
      .then(({ data, error }) => setTokenOk(!error && !!data))
  }, [token])

  // Com token: validando
  if (token && tokenOk === null) return <FullPageLoader />

  // Com token: inválido
  if (token && tokenOk === false) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <p className="text-sm text-gray-500">Link inválido ou expirado.</p>
      </div>
    )
  }

  // Sem token: precisa login
  if (!token && isLoading) return <FullPageLoader />
  if (!token && !user) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-3">Faça login para acessar.</p>
          <a href="/login" className="text-sm text-primary-500 hover:text-primary-600 font-medium">Ir para login</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col">
      <header className="h-14 border-b border-gray-200 dark:border-white/[0.06] bg-white/80 dark:bg-[#0c0c0e]/80 backdrop-blur-xl flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight">Dashboard de Comissões</h1>
            <p className="text-[10px] text-gray-500">NetworkGo</p>
          </div>
        </div>
        <button onClick={toggleTheme} className="p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors">
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </header>
      <div className="flex-1 overflow-hidden">
        <ComissoesPage />
      </div>
    </div>
  )
}

// ============================================
// APP ROOT
// ============================================

export default function App() {
  const { user, isLoading, profile } = useAuth()

  // Carregando auth
  if (isLoading) return <FullPageLoader />

  return (
    <>
      <VersionBadge />
      <Routes>
        {/* Login — acessível sempre */}
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />

      {/* Standalone — lógica própria de auth */}
      <Route path="/standalone/comissoes" element={<StandaloneComissoes />} />

      {/* Tudo mais — precisa estar logado */}
      <Route path="/*" element={
        !user ? <Navigate to="/login" replace /> :
        !profile ? (
          <div className="h-screen bg-white dark:bg-gray-950 flex items-center justify-center p-8">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">Perfil não encontrado.</p>
              <p className="text-xs text-gray-400 mb-4">Contate o administrador.</p>
              <button onClick={() => {
                supabase.auth.signOut().catch(() => {})
                localStorage.clear()
                sessionStorage.clear()
                window.location.href = '/login'
              }}
                className="text-sm text-primary-500 hover:text-primary-600 font-medium">
                Fazer logout
              </button>
            </div>
          </div>
        ) :
        !profile.active ? (
          <div className="h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
            <p className="text-sm text-gray-500">Conta desativada. Contate o administrador.</p>
          </div>
        ) :
        <ProtectedLayout />
      } />
      </Routes>
    </>
  )
}
