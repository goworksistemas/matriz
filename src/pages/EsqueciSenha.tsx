import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Loader2, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/AuthContext';

export function EsqueciSenha() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const { error: err } = await resetPassword(email);
    if (err) {
      setError(err);
    } else {
      setSuccess('Email enviado! Verifique sua caixa de entrada para redefinir a senha.');
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
          <p className="text-sm text-gray-500 mt-1">Recuperar senha</p>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <Link
              to="/login"
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-2"
            >
              <ArrowLeft className="w-3 h-3" /> Voltar
            </Link>

            <div className="text-center mb-2">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Esqueceu a senha?</h2>
              <p className="text-xs text-gray-500 mt-1">Enviaremos um link para redefinir sua senha</p>
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
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    placeholder="seu@email.com"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary-500 text-white px-4 py-2.5 text-sm font-medium hover:bg-primary-600 active:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Aguarde...</> : 'Enviar link'}
                </button>
              </>
            )}
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">© 2026 GoWork Sistemas</p>
      </div>
    </div>
  );
}
