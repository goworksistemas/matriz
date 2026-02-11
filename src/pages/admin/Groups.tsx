import { useState, useEffect, useCallback } from 'react';
import { FolderOpen, Plus, Trash2, Loader2, Users, FileBarChart, X, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/ToastContext';
import type { Profile } from '@/hooks/AuthContext';

interface Group {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

interface Report {
  id: string;
  slug: string;
  name: string;
}

interface GroupMember {
  user_id: string;
  group_id: string;
}

interface GroupReport {
  report_id: string;
  group_id: string;
}

export function AdminGroups() {
  const toast = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [groupReports, setGroupReports] = useState<GroupReport[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [{ data: g }, { data: u }, { data: r }] = await Promise.all([
      supabase.from('access_groups').select('*').order('name'),
      supabase.from('profiles').select('*').eq('active', true).order('full_name'),
      supabase.from('reports').select('id, slug, name').eq('active', true).order('name'),
    ]);
    setGroups((g || []) as Group[]);
    setUsers((u || []) as Profile[]);
    setReports((r || []) as Report[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const loadGroupDetails = useCallback(async (group: Group) => {
    setSelectedGroup(group);
    const [{ data: members }, { data: gReports }] = await Promise.all([
      supabase.from('user_groups').select('user_id, group_id').eq('group_id', group.id),
      supabase.from('group_report_access').select('report_id, group_id').eq('group_id', group.id),
    ]);
    setGroupMembers((members || []) as GroupMember[]);
    setGroupReports((gReports || []) as GroupReport[]);
  }, []);

  const createGroup = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    const { data } = await supabase
      .from('access_groups')
      .insert({ name: newName.trim(), description: newDesc.trim() || null })
      .select()
      .single();
    if (data) {
      setGroups(prev => [...prev, data as Group]);
      setNewName('');
      setNewDesc('');
      setShowCreate(false);
      toast.success('Grupo criado');
    }
    setSaving(false);
  };

  const deleteGroup = async (groupId: string) => {
    if (!confirm('Excluir este grupo? Os vínculos serão removidos.')) return;
    await supabase.from('access_groups').delete().eq('id', groupId);
    setGroups(prev => prev.filter(g => g.id !== groupId));
    toast.success('Grupo excluído');
    if (selectedGroup?.id === groupId) {
      setSelectedGroup(null);
      setGroupMembers([]);
      setGroupReports([]);
    }
  };

  const toggleMember = async (userId: string) => {
    if (!selectedGroup) return;
    const exists = groupMembers.some(m => m.user_id === userId);
    if (exists) {
      await supabase.from('user_groups').delete().eq('group_id', selectedGroup.id).eq('user_id', userId);
      setGroupMembers(prev => prev.filter(m => m.user_id !== userId));
    } else {
      await supabase.from('user_groups').insert({ group_id: selectedGroup.id, user_id: userId });
      setGroupMembers(prev => [...prev, { group_id: selectedGroup.id, user_id: userId }]);
    }
  };

  const toggleReport = async (reportId: string) => {
    if (!selectedGroup) return;
    const exists = groupReports.some(r => r.report_id === reportId);
    if (exists) {
      await supabase.from('group_report_access').delete().eq('group_id', selectedGroup.id).eq('report_id', reportId);
      setGroupReports(prev => prev.filter(r => r.report_id !== reportId));
    } else {
      await supabase.from('group_report_access').insert({ group_id: selectedGroup.id, report_id: reportId });
      setGroupReports(prev => [...prev, { group_id: selectedGroup.id, report_id: reportId }]);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-primary-500" />
              Grupos de Acesso
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">{groups.length} grupos</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary-500 text-white text-xs font-medium hover:bg-primary-600 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Novo grupo
          </button>
        </div>

        {/* Criar grupo */}
        {showCreate && (
          <div className="mb-4 p-4 rounded-xl border border-primary-200 dark:border-primary-500/20 bg-primary-50 dark:bg-primary-500/5">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Nome do grupo"
                autoFocus
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="text"
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="Descrição (opcional)"
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                onClick={createGroup}
                disabled={saving || !newName.trim()}
                className="px-3 py-2 rounded-lg bg-primary-500 text-white text-xs font-medium hover:bg-primary-600 disabled:opacity-50 transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              </button>
              <button
                onClick={() => { setShowCreate(false); setNewName(''); setNewDesc(''); }}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Lista de grupos */}
          <div className="space-y-2">
            {groups.length === 0 ? (
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-8 text-center">
                <FolderOpen className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Nenhum grupo criado.</p>
              </div>
            ) : (
              groups.map(group => (
                <button
                  key={group.id}
                  onClick={() => loadGroupDetails(group)}
                  className={cn(
                    "w-full text-left p-3 rounded-xl border transition-all duration-200",
                    selectedGroup?.id === group.id
                      ? "border-primary-300 dark:border-primary-500/30 bg-primary-50 dark:bg-primary-500/5"
                      : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{group.name}</p>
                      {group.description && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{group.description}</p>
                      )}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteGroup(group.id); }}
                      className="p-1 rounded text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Detalhes do grupo selecionado */}
          {selectedGroup ? (
            <div className="lg:col-span-2 space-y-4">
              {/* Membros */}
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-primary-500" />
                  Membros ({groupMembers.length})
                </h3>
                <div className="space-y-1 max-h-60 overflow-auto">
                  {users.map(user => {
                    const isMember = groupMembers.some(m => m.user_id === user.id);
                    return (
                      <button
                        key={user.id}
                        onClick={() => toggleMember(user.id)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                          isMember
                            ? "bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300"
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                        )}
                      >
                        <span className="truncate">{user.full_name || user.email}</span>
                        {isMember && <Check className="w-4 h-4 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Relatórios */}
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                  <FileBarChart className="w-4 h-4 text-primary-500" />
                  Relatórios ({groupReports.length})
                </h3>
                <div className="space-y-1">
                  {reports.map(report => {
                    const hasAccess = groupReports.some(r => r.report_id === report.id);
                    return (
                      <button
                        key={report.id}
                        onClick={() => toggleReport(report.id)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                          hasAccess
                            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                        )}
                      >
                        <span>{report.name}</span>
                        {hasAccess && <Check className="w-4 h-4 flex-shrink-0" />}
                      </button>
                    );
                  })}
                  {reports.length === 0 && (
                    <p className="text-xs text-gray-500 text-center py-2">Nenhum relatório cadastrado.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-2 flex items-center justify-center rounded-xl border border-dashed border-gray-200 dark:border-gray-800 p-12">
              <p className="text-sm text-gray-400">Selecione um grupo para gerenciar membros e relatórios.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
