import { useState, useEffect, useCallback } from 'react';
import { Users as UsersIcon, ShieldCheck, ToggleLeft, ToggleRight, Loader2, Search, FileBarChart, Check, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth, type Profile } from '@/hooks/AuthContext';
import { useToast } from '@/hooks/ToastContext';
import { cn } from '@/lib/utils';

type Role = 'admin' | 'manager' | 'viewer';

interface Report {
  id: string;
  slug: string;
  name: string;
}

interface UserAccess {
  user_id: string;
  report_id: string;
}

export function AdminUsers() {
  const { profile: myProfile } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState<Profile[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [userAccess, setUserAccess] = useState<UserAccess[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: u }, { data: r }] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: true }),
      supabase.from('reports').select('id, slug, name').eq('active', true).order('name'),
    ]);
    setUsers((u || []) as Profile[]);
    setReports((r || []) as Report[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const selectUser = async (user: Profile) => {
    setSelectedUser(user);
    const { data } = await supabase
      .from('user_report_access')
      .select('user_id, report_id')
      .eq('user_id', user.id);
    setUserAccess((data || []) as UserAccess[]);
  };

  const updateRole = async (userId: string, newRole: Role) => {
    if (userId === myProfile?.id && newRole !== 'admin') {
      if (!confirm('Você está removendo seu próprio acesso admin. Tem certeza?')) return;
    }
    setSaving(userId);
    await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    if (selectedUser?.id === userId) setSelectedUser(prev => prev ? { ...prev, role: newRole } : null);
    setSaving(null);
    toast.success(`Role alterado para ${newRole}`);
  };

  const toggleActive = async (userId: string, active: boolean) => {
    if (userId === myProfile?.id) { alert('Você não pode desativar sua própria conta.'); return; }
    setSaving(userId);
    await supabase.from('profiles').update({ active }).eq('id', userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, active } : u));
    setSaving(null);
    toast.success(active ? 'Usuário ativado' : 'Usuário desativado');
  };

  const toggleReportAccess = async (reportId: string) => {
    if (!selectedUser) return;
    const exists = userAccess.some(a => a.report_id === reportId);
    if (exists) {
      await supabase.from('user_report_access').delete().eq('user_id', selectedUser.id).eq('report_id', reportId);
      setUserAccess(prev => prev.filter(a => a.report_id !== reportId));
      toast.info('Acesso removido');
    } else {
      await supabase.from('user_report_access').insert({
        user_id: selectedUser.id,
        report_id: reportId,
        granted_by: myProfile?.id,
      });
      setUserAccess(prev => [...prev, { user_id: selectedUser.id, report_id: reportId }]);
      toast.success('Acesso concedido');
    }
  };

  const filtered = users.filter(u => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (u.email?.toLowerCase().includes(s)) || (u.full_name?.toLowerCase().includes(s));
  });

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="p-6 lg:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
              <UsersIcon className="w-5 h-5 text-primary-500" />
              Usuários
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">{users.length} cadastrados</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna esquerda: lista de usuários */}
          <div className="lg:col-span-2">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por nome ou email..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Table */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuário</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filtered.map(user => {
                    const isSaving = saving === user.id;
                    const isMe = user.id === myProfile?.id;
                    const isSelected = selectedUser?.id === user.id;

                    return (
                      <tr
                        key={user.id}
                        onClick={() => selectUser(user)}
                        className={cn(
                          "transition-colors cursor-pointer",
                          isSaving && "opacity-60",
                          !user.active && "opacity-50",
                          isSelected ? "bg-primary-50 dark:bg-primary-500/5" : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        )}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-500/10 flex items-center justify-center text-xs font-bold text-primary-600 dark:text-primary-400">
                              {(user.full_name || user.email)?.[0]?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white text-sm">
                                {user.full_name || '—'}
                                {isMe && <span className="ml-1.5 text-[10px] text-primary-500">(você)</span>}
                              </p>
                              <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <select
                            value={user.role}
                            onChange={e => { e.stopPropagation(); updateRole(user.id, e.target.value as Role); }}
                            onClick={e => e.stopPropagation()}
                            disabled={isSaving}
                            className="text-xs font-medium rounded-md border-0 bg-transparent text-gray-700 dark:text-gray-300 cursor-pointer focus:ring-2 focus:ring-primary-500 py-1"
                          >
                            <option value="admin">Admin</option>
                            <option value="manager">Manager</option>
                            <option value="viewer">Viewer</option>
                          </select>
                        </td>

                        <td className="px-4 py-3 text-center">
                          <span className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ring-1",
                            user.active
                              ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-200 dark:ring-emerald-500/20"
                              : "bg-gray-100 dark:bg-gray-500/10 text-gray-500 ring-gray-200 dark:ring-gray-500/20"
                          )}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", user.active ? "bg-emerald-500" : "bg-gray-400")} />
                            {user.active ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleActive(user.id, !user.active); }}
                            disabled={isSaving || isMe}
                            title={user.active ? 'Desativar' : 'Ativar'}
                            className={cn(
                              "p-1.5 rounded-lg transition-colors",
                              isMe ? "text-gray-300 dark:text-gray-700 cursor-not-allowed"
                                : user.active ? "text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                                : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                            )}
                          >
                            {user.active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                        Nenhum usuário encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Coluna direita: acesso individual a relatórios */}
          <div>
            {selectedUser ? (
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-6">
                {/* User header */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-500/10 flex items-center justify-center text-sm font-bold text-primary-600 dark:text-primary-400">
                      {(selectedUser.full_name || selectedUser.email)?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedUser.full_name || selectedUser.email}</p>
                      <p className="text-[11px] text-gray-500">{selectedUser.role}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedUser(null)} className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Admin info */}
                {selectedUser.role === 'admin' && (
                  <div className="px-4 py-3 bg-amber-50 dark:bg-amber-500/5 border-b border-amber-100 dark:border-amber-500/10">
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      <ShieldCheck className="w-3.5 h-3.5 inline mr-1" />
                      Admins têm acesso a todos os relatórios automaticamente.
                    </p>
                  </div>
                )}

                {/* Reports list */}
                <div className="p-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <FileBarChart className="w-3.5 h-3.5" />
                    Acesso individual ({userAccess.length})
                  </h3>
                  <div className="space-y-1">
                    {reports.map(report => {
                      const hasAccess = userAccess.some(a => a.report_id === report.id);
                      return (
                        <button
                          key={report.id}
                          onClick={() => toggleReportAccess(report.id)}
                          disabled={selectedUser.role === 'admin'}
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors",
                            selectedUser.role === 'admin'
                              ? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                              : hasAccess
                                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                          )}
                        >
                          <span>{report.name}</span>
                          {(hasAccess || selectedUser.role === 'admin') && <Check className="w-4 h-4 flex-shrink-0" />}
                        </button>
                      );
                    })}
                    {reports.length === 0 && (
                      <p className="text-xs text-gray-500 text-center py-4">Nenhum relatório cadastrado.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-800 p-8 flex items-center justify-center sticky top-6">
                <p className="text-sm text-gray-400 text-center">
                  Clique em um usuário para gerenciar o acesso individual aos relatórios.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
