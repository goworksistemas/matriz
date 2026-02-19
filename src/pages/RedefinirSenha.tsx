import { useState, type FormEvent } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Zap, Loader2, AlertCircle, CheckCircle, KeyRound } from 'lucide-react';
import { useAuth } from '@/hooks/AuthContext';

export function RedefinirSenha() {
  const { user, isLoading: authLoading, isRecovery, updatePassword, clearRecovery } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  // Usuário logado sem recovery → vai para home
  if (user && !isRecovery) {
    return <Navigate to="/" replace />;
  }

  // Sem recovery (acessou rota direto sem link válido) → vai para login
  if (!isRecovery) {
    return <Navigate to="/login" replace />;
  }

  const handleUpdatePassword = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setIsSubmitting(true);
    const { error: err } = await updatePassword(password);
    if (err) {
      setError(err);
    } else {
      setSuccess('Senha alterada com sucesso! Redirecionando...');
      setTimeout(() => {
        clearRecovery();
        window.location.href = '/';
      }, 1500);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center mb-4 shadow-lg shadow-primary-500/20">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">NetworkGo</h1>
          <p className="text-sm text-gray-500 mt-1">Redefinir senha</p>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="flex flex-col items-center mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center mb-3">
                <KeyRound className="w-5 h-5 text-primary-500" />
              </div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Nova senha</h2>
              <p className="text-xs text-gray-500 mt-1">Defina sua nova senha de acesso</p>
            </div>

            {error && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
              </div>
            )}
            {success && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-emerald-600 dark:text-emerald-400">{success}</span>
              </div>
            )}

            {!success && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Nova senha</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoFocus
                    placeholder="Mínimo 6 caracteres"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Confirmar senha</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Repita a senha"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary-500 text-white px-4 py-2.5 text-sm font-medium hover:bg-primary-600 active:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Aguarde...</> : 'Salvar nova senha'}
                </button>
              </>
            )}
          </form>

          <Link
            to="/login"
            className="mt-4 flex items-center justify-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Voltar para o login
          </Link>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">© 2026 GoWork Sistemas</p>
      </div>
    </div>
  );
}
