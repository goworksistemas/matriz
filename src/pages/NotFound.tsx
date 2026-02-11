import { useNavigate } from 'react-router-dom';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-5">
          <FileQuestion className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-5xl font-bold text-gray-200 dark:text-gray-800 mb-2">404</p>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Página não encontrada</h2>
        <p className="text-sm text-gray-500 mb-6">
          O endereço que você acessou não existe ou foi removido.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 transition-colors"
          >
            <Home className="w-4 h-4" />
            Início
          </button>
        </div>
      </div>
    </div>
  );
}
