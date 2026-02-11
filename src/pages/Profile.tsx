import { useState } from 'react';
import { User, Save, Loader2, CheckCircle, KeyRound } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/AuthContext';
import { useToast } from '@/hooks/ToastContext';
import { cn } from '@/lib/utils';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  manager: 'Gerente',
  viewer: 'Visualizador',
};

export function ProfilePage() {
  const { profile, refreshData } = useAuth();
  const toast = useToast();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Alterar senha
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!profile) return null;

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaved(false);
    await supabase.from('profiles').update({ full_name: fullName.trim() }).eq('id', profile.id);
    await refreshData();
    setSaving(false);
    setSaved(true);
    toast.success('Nome atualizado');
    setTimeout(() => setSaved(false), 3000);
  };

  const handleChangePassword = async () => {
    setPasswordMsg(null);

    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'A nova senha deve ter pelo menos 6 caracteres.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'As senhas não coincidem.' });
      return;
    }

    setPasswordSaving(true);

    // Verificar senha atual fazendo login
    const { error: loginErr } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password: currentPassword,
    });

    if (loginErr) {
      setPasswordMsg({ type: 'error', text: 'Senha atual incorreta.' });
      setPasswordSaving(false);
      return;
    }

    // Atualizar senha
    const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword });

    if (updateErr) {
      setPasswordMsg({ type: 'error', text: updateErr.message });
      toast.error('Erro ao alterar senha');
    } else {
      setPasswordMsg({ type: 'success', text: 'Senha alterada com sucesso!' });
      toast.success('Senha alterada com sucesso');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }

    setPasswordSaving(false);
  };

  const initial = (profile.full_name || profile.email)?.[0]?.toUpperCase() || '?';

  return (
    <div className="h-full overflow-auto">
      <div className="p-6 lg:p-8 max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <User className="w-5 h-5 text-primary-500" />
            Meu Perfil
          </h1>
        </div>

        <div className="space-y-6">
          {/* Card: Informações */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-500/10 flex items-center justify-center text-2xl font-bold text-primary-600 dark:text-primary-400">
                {initial}
              </div>
              <div>
                <p className="text-base font-semibold text-gray-900 dark:text-white">{profile.full_name || profile.email}</p>
                <p className="text-sm text-gray-500">{profile.email}</p>
                <span className={cn(
                  "inline-block mt-1 text-[11px] font-medium px-2 py-0.5 rounded-full ring-1",
                  profile.role === 'admin' && "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 ring-red-200 dark:ring-red-500/20",
                  profile.role === 'manager' && "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-200 dark:ring-amber-500/20",
                  profile.role === 'viewer' && "bg-gray-100 dark:bg-gray-500/10 text-gray-600 dark:text-gray-400 ring-gray-200 dark:ring-gray-500/20",
                )}>
                  {ROLE_LABELS[profile.role] || profile.role}
                </span>
              </div>
            </div>

            {/* Nome */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Nome completo</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Email</label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2.5 text-sm text-gray-500 cursor-not-allowed"
                />
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={saving || fullName.trim() === (profile.full_name || '')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar'}
              </button>
            </div>
          </div>

          {/* Card: Alterar senha */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <KeyRound className="w-4 h-4 text-gray-400" />
              Alterar senha
            </h2>

            {passwordMsg && (
              <div className={cn(
                "mb-4 px-3 py-2.5 rounded-lg text-sm",
                passwordMsg.type === 'success'
                  ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"
                  : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20"
              )}>
                {passwordMsg.text}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Senha atual</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Nova senha</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Confirmar nova senha</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <button
                onClick={handleChangePassword}
                disabled={passwordSaving || !currentPassword || !newPassword || !confirmPassword}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {passwordSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                {passwordSaving ? 'Alterando...' : 'Alterar senha'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
