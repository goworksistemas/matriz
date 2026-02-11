import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useAuth } from '@/hooks/AuthContext';

const ROUTE_LABELS: Record<string, string> = {
  '': 'Início',
  'admin': 'Admin',
  'usuarios': 'Usuários',
  'grupos': 'Grupos',
  'relatorios': 'Relatórios',
  'logs': 'Logs',
  'tema': 'Tema',
  'perfil': 'Meu Perfil',
};

export function Breadcrumb() {
  const location = useLocation();
  const { reports } = useAuth();

  if (location.pathname === '/') return null;

  const segments = location.pathname.split('/').filter(Boolean);

  const crumbs = segments.map((segment, index) => {
    const path = '/' + segments.slice(0, index + 1).join('/');

    // Tentar nome do relatório
    const report = reports.find(r => r.slug === segment);
    const label = report?.name || ROUTE_LABELS[segment] || segment;

    return { path, label };
  });

  return (
    <nav className="flex items-center gap-1 px-6 py-2 text-xs text-gray-500 border-b border-gray-100 dark:border-white/[0.03] bg-gray-50/50 dark:bg-transparent">
      <Link to="/" className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-300 transition-colors">
        <Home className="w-3 h-3" />
        <span>Início</span>
      </Link>
      {crumbs.map((crumb, i) => (
        <span key={crumb.path} className="flex items-center gap-1">
          <ChevronRight className="w-3 h-3 text-gray-300 dark:text-gray-700" />
          {i === crumbs.length - 1 ? (
            <span className="text-gray-900 dark:text-gray-200 font-medium">{crumb.label}</span>
          ) : (
            <Link to={crumb.path} className="hover:text-gray-900 dark:hover:text-gray-300 transition-colors">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
