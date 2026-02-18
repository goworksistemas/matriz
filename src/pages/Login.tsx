import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { Zap, Loader2, AlertCircle, CheckCircle, ArrowLeft, KeyRound } from 'lucide-react';
import { useAuth } from '@/hooks/AuthContext';

type View = 'login' | 'signup' | 'forgot';

export function Login() {
  const { user, isLoading: authLoading, isRecovery, signIn, signUp, resetPassword, updatePassword, clearRecovery } = useAuth();
  const [view, setView] = useState<View>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
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

  if (user && !isRecovery) {
    return <Navigate to="/" replace />;
  }

  const resetForm = () => {
    setError(null);
    setSuccess(null);
  };

  const switchView = (v: View) => {
    setView(v);
    resetForm();
  };

  // LOGIN
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    resetForm();
    setIsSubmitting(true);

    const { error: err } = await signIn(email, password);
    if (err) {
      setError(err.includes('Invalid login') ? 'Email ou senha incorretos.' : err);
    }
    setIsSubmitting(false);
  };

  // CADASTRO
  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    resetForm();

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setIsSubmitting(true);
    const { error: err } = await signUp(email, password, fullName);
    if (err) {
      setError(err.includes('already registered') ? 'Este email já está cadastrado.' : err);
    } else {
      setSuccess('Conta criada! Verifique seu email para confirmar o cadastro.');
    }
    setIsSubmitting(false);
  };

  // REDEFINIR SENHA (RECOVERY)
  const handleUpdatePassword = async (e: FormEvent) => {
    e.preventDefault();
    resetForm();

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

  // ESQUECI A SENHA
  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    resetForm();
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
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center mb-4 shadow-lg shadow-primary-500/20">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">NetworkGo</h1>
          <p className="text-sm text-gray-500 mt-1">Central de Relatórios</p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">

          {/* ============ LOGIN ============ */}
          {view === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="text-center mb-2">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Entrar</h2>
                <p className="text-xs text-gray-500 mt-1">Acesse sua conta</p>
              </div>

              {error && <AlertMsg message={error} />}

              <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="seu@email.com" autoFocus />
              <Field label="Senha" type="password" value={password} onChange={setPassword} placeholder="••••••••" />

              <SubmitBtn loading={isSubmitting} label="Entrar" />

              <div className="flex items-center justify-between text-xs">
                <button type="button" onClick={() => switchView('forgot')} className="text-primary-500 hover:text-primary-600 font-medium">
                  Esqueci a senha
                </button>
                <button type="button" onClick={() => switchView('signup')} className="text-primary-500 hover:text-primary-600 font-medium">
                  Criar conta
                </button>
              </div>
            </form>
          )}

          {/* ============ CADASTRO ============ */}
          {view === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <button type="button" onClick={() => switchView('login')} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-2">
                <ArrowLeft className="w-3 h-3" /> Voltar
              </button>

              <div className="text-center mb-2">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Criar conta</h2>
                <p className="text-xs text-gray-500 mt-1">Preencha seus dados</p>
              </div>

              {error && <AlertMsg message={error} />}
              {success && <SuccessMsg message={success} />}

              {!success && (
                <>
                  <Field label="Nome completo" type="text" value={fullName} onChange={setFullName} placeholder="Seu nome" autoFocus />
                  <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="seu@email.com" />
                  <Field label="Senha" type="password" value={password} onChange={setPassword} placeholder="Mínimo 6 caracteres" />
                  <SubmitBtn loading={isSubmitting} label="Criar conta" />
                </>
              )}
            </form>
          )}

          {/* ============ ESQUECI A SENHA ============ */}
          {view === 'forgot' && !isRecovery && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <button type="button" onClick={() => switchView('login')} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-2">
                <ArrowLeft className="w-3 h-3" /> Voltar
              </button>

              <div className="text-center mb-2">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Recuperar senha</h2>
                <p className="text-xs text-gray-500 mt-1">Enviaremos um link para redefinir</p>
              </div>

              {error && <AlertMsg message={error} />}
              {success && <SuccessMsg message={success} />}

              {!success && (
                <>
                  <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="seu@email.com" autoFocus />
                  <SubmitBtn loading={isSubmitting} label="Enviar link" />
                </>
              )}
            </form>
          )}

          {/* ============ REDEFINIR SENHA (RECOVERY) ============ */}
          {isRecovery && (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="flex flex-col items-center mb-2">
                <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center mb-3">
                  <KeyRound className="w-5 h-5 text-primary-500" />
                </div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Nova senha</h2>
                <p className="text-xs text-gray-500 mt-1">Defina sua nova senha de acesso</p>
              </div>

              {error && <AlertMsg message={error} />}
              {success && <SuccessMsg message={success} />}

              {!success && (
                <>
                  <Field label="Nova senha" type="password" value={password} onChange={setPassword} placeholder="Mínimo 6 caracteres" autoFocus />
                  <Field label="Confirmar senha" type="password" value={confirmPassword} onChange={setConfirmPassword} placeholder="Repita a senha" />
                  <SubmitBtn loading={isSubmitting} label="Salvar nova senha" />
                </>
              )}
            </form>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">© 2026 GoWork Sistemas</p>
      </div>
    </div>
  );
}

// ============================================
// SUB-COMPONENTES
// ============================================

function Field({ label, type, value, onChange, placeholder, autoFocus }: {
  label: string; type: string; value: string; onChange: (v: string) => void; placeholder: string; autoFocus?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        autoFocus={autoFocus}
        autoComplete={type === 'email' ? 'email' : type === 'password' ? 'current-password' : 'name'}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
      />
    </div>
  );
}

function SubmitBtn({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary-500 text-white px-4 py-2.5 text-sm font-medium hover:bg-primary-600 active:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Aguarde...</> : label}
    </button>
  );
}

function AlertMsg({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
      <span className="text-sm text-red-600 dark:text-red-400">{message}</span>
    </div>
  );
}

function SuccessMsg({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
      <span className="text-sm text-emerald-600 dark:text-emerald-400">{message}</span>
    </div>
  );
}
