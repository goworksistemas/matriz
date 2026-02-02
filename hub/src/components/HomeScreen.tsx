import { Coins, TrendingUp, Wallet, Settings, Users, ArrowRight, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Relatorio } from '@/types'

const iconMap: Record<string, React.ElementType> = {
  'coins': Coins,
  'trending-up': TrendingUp,
  'wallet': Wallet,
  'settings': Settings,
  'users': Users,
}

const categoriaColors: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  vendas: { 
    bg: 'from-emerald-500/10 to-emerald-600/5', 
    border: 'border-emerald-500/20 hover:border-emerald-500/40',
    text: 'text-emerald-400',
    glow: 'group-hover:shadow-emerald-500/10'
  },
  financeiro: { 
    bg: 'from-amber-500/10 to-amber-600/5', 
    border: 'border-amber-500/20 hover:border-amber-500/40',
    text: 'text-amber-400',
    glow: 'group-hover:shadow-amber-500/10'
  },
  operacional: { 
    bg: 'from-blue-500/10 to-blue-600/5', 
    border: 'border-blue-500/20 hover:border-blue-500/40',
    text: 'text-blue-400',
    glow: 'group-hover:shadow-blue-500/10'
  },
  rh: { 
    bg: 'from-purple-500/10 to-purple-600/5', 
    border: 'border-purple-500/20 hover:border-purple-500/40',
    text: 'text-purple-400',
    glow: 'group-hover:shadow-purple-500/10'
  },
}

interface HomeScreenProps {
  relatorios: Relatorio[]
  onSelectRelatorio: (id: string) => void
}

export function HomeScreen({ relatorios, onSelectRelatorio }: HomeScreenProps) {
  const relatoriosAtivos = relatorios.filter(r => r.ativo)

  return (
    <div className="h-full overflow-auto p-8">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 text-primary-400 text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            <span>Central de Business Intelligence</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Seus relatórios em um
            <span className="bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent"> só lugar</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Acesse todos os dashboards e relatórios da NetworkGo de forma centralizada, 
            organizada e com a performance que você precisa.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
            <p className="text-3xl font-bold text-white">{relatoriosAtivos.length}</p>
            <p className="text-sm text-gray-500">Relatórios Disponíveis</p>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
            <p className="text-3xl font-bold text-emerald-400">Online</p>
            <p className="text-sm text-gray-500">Status do Sistema</p>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
            <p className="text-3xl font-bold text-primary-400">v1.0.0</p>
            <p className="text-sm text-gray-500">Versão da Matriz</p>
          </div>
        </div>

        {/* Relatórios Grid */}
        <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <span>Relatórios Disponíveis</span>
            <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-full">
              {relatoriosAtivos.length}
            </span>
          </h2>

          {relatoriosAtivos.length === 0 ? (
            <div className="bg-gray-800/30 rounded-2xl p-12 text-center border border-gray-700/50">
              <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-gray-600" />
              </div>
              <p className="text-gray-400">Nenhum relatório configurado ainda.</p>
              <p className="text-sm text-gray-600 mt-1">
                Os relatórios aparecerão aqui quando forem adicionados.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatoriosAtivos.map((relatorio) => {
                const Icon = iconMap[relatorio.icone] || Coins
                const colors = categoriaColors[relatorio.categoria] || categoriaColors.operacional

                return (
                  <button
                    key={relatorio.id}
                    onClick={() => onSelectRelatorio(relatorio.id)}
                    className={cn(
                      "group relative bg-gradient-to-br rounded-2xl p-6 text-left transition-all duration-300",
                      "border hover:scale-[1.02] hover:shadow-xl",
                      colors.bg,
                      colors.border,
                      colors.glow
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                      "bg-gray-800/80 backdrop-blur-sm"
                    )}>
                      <Icon className={cn("w-6 h-6", colors.text)} />
                    </div>
                    
                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-primary-400 transition-colors">
                      {relatorio.nome}
                    </h3>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                      {relatorio.descricao}
                    </p>

                    <div className="flex items-center gap-2 text-sm text-gray-500 group-hover:text-primary-400 transition-colors">
                      <span>Acessar relatório</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>

                    {/* Categoria Badge */}
                    <div className={cn(
                      "absolute top-4 right-4 text-xs px-2 py-1 rounded-full",
                      "bg-gray-800/80 backdrop-blur-sm",
                      colors.text
                    )}>
                      {relatorio.categoria}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
