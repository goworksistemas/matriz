import { useNavigate } from 'react-router-dom'
import { 
  Coins, 
  TrendingUp, 
  Wallet, 
  Settings, 
  Users, 
  ArrowRight,
  BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/AuthContext'

const iconMap: Record<string, React.ElementType> = {
  'coins': Coins,
  'trending-up': TrendingUp,
  'wallet': Wallet,
  'settings': Settings,
  'users': Users,
  'bar-chart': TrendingUp,
}

const categoriaConfig: Record<string, { 
  iconBg: string
  iconColor: string
  hoverBorder: string
}> = {
  vendas: { 
    iconBg: 'bg-emerald-100 dark:bg-emerald-500/10',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    hoverBorder: 'hover:border-emerald-300 dark:hover:border-emerald-500/30',
  },
  financeiro: { 
    iconBg: 'bg-amber-100 dark:bg-amber-500/10',
    iconColor: 'text-amber-600 dark:text-amber-400',
    hoverBorder: 'hover:border-amber-300 dark:hover:border-amber-500/30',
  },
  operacional: { 
    iconBg: 'bg-blue-100 dark:bg-blue-500/10',
    iconColor: 'text-blue-600 dark:text-blue-400',
    hoverBorder: 'hover:border-blue-300 dark:hover:border-blue-500/30',
  },
  rh: { 
    iconBg: 'bg-violet-100 dark:bg-violet-500/10',
    iconColor: 'text-violet-600 dark:text-violet-400',
    hoverBorder: 'hover:border-violet-300 dark:hover:border-violet-500/30',
  },
}

export function Home() {
  const navigate = useNavigate()
  const { reports, profile } = useAuth()

  return (
    <div className="h-full overflow-auto">
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">
            {profile ? `Olá, ${profile.full_name || profile.email.split('@')[0]}` : 'Relatórios'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {reports.length} {reports.length === 1 ? 'relatório disponível' : 'relatórios disponíveis'}
          </p>
        </div>

        {/* Grid */}
        {reports.length === 0 ? (
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-12 text-center">
            <BarChart3 className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Nenhum relatório disponível para sua conta.</p>
            <p className="text-xs text-gray-400 mt-1">Solicite acesso ao administrador.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {reports.map((report) => {
              const Icon = iconMap[report.icon] || Coins
              const config = categoriaConfig[report.category] || categoriaConfig.operacional

              return (
                <button
                  key={report.report_id}
                  onClick={() => navigate(`/${report.slug}`)}
                  className={cn(
                    "group text-left rounded-xl p-4",
                    "border border-gray-200 dark:border-gray-800",
                    "bg-white dark:bg-gray-900",
                    "transition-all duration-200",
                    "hover:shadow-md dark:hover:shadow-none",
                    "hover:-translate-y-px",
                    config.hoverBorder,
                  )}
                >
                  <div className="flex items-start gap-3.5">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                      config.iconBg,
                    )}>
                      <Icon className={cn("w-5 h-5", config.iconColor)} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white leading-tight">
                        {report.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                        {report.description}
                      </p>
                    </div>

                    <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0 mt-0.5 transition-all duration-200 group-hover:text-gray-500 dark:group-hover:text-gray-400 group-hover:translate-x-0.5" />
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
