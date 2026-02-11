import { useNavigate } from 'react-router-dom';
import { ShieldX } from 'lucide-react';

export function AccessDenied() {
  const navigate = useNavigate();

  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <ShieldX className="w-7 h-7 text-red-500" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Acesso negado</h2>
        <p className="text-sm text-gray-500 mb-6">
          Você não tem permissão para acessar este relatório. Solicite acesso ao administrador.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          Voltar ao início
        </button>
      </div>
    </div>
  );
}
