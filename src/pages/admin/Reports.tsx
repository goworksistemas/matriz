import { useState, useEffect, useCallback } from 'react';
import { FileBarChart, Globe, Lock, Link2, Copy, RefreshCw, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/ToastContext';

interface Report {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string;
  category: string;
  active: boolean;
  standalone_public: boolean;
  share_token: string | null;
}

export function AdminReports() {
  const toast = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('reports').select('*').order('name');
    setReports((data || []) as Report[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const togglePublic = async (reportId: string, isPublic: boolean) => {
    setSaving(reportId);
    await supabase.from('reports').update({ standalone_public: isPublic }).eq('id', reportId);
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, standalone_public: isPublic } : r));
    setSaving(null);
    toast.success(isPublic ? 'Relatório tornado público' : 'Relatório tornado privado');
  };

  const regenerateToken = async (reportId: string) => {
    if (!confirm('Gerar novo token? O link anterior deixará de funcionar.')) return;
    setSaving(reportId);
    // Gerar novo token via SQL (gen_random_bytes no Supabase)
    const { data } = await supabase
      .rpc('regenerate_share_token' as never, { p_report_id: reportId })
      .single();

    // Fallback: se a RPC não existe, atualiza com token gerado no frontend
    if (!data) {
      const newToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0')).join('');
      await supabase.from('reports').update({ share_token: newToken }).eq('id', reportId);
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, share_token: newToken } : r));
    } else {
      await fetchReports();
    }
    setSaving(null);
  };

  const getShareUrl = (report: Report) => {
    const base = window.location.origin;
    return `${base}/standalone/${report.slug}?token=${report.share_token}`;
  };

  const copyLink = (report: Report) => {
    navigator.clipboard.writeText(getShareUrl(report));
    setCopied(report.id);
    setTimeout(() => setCopied(null), 2000);
    toast.success('Link copiado!');
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
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileBarChart className="w-5 h-5 text-primary-500" />
            Relatórios
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Gerencie links de compartilhamento</p>
        </div>

        {/* Lista */}
        <div className="space-y-3">
          {reports.map(report => {
            const isSaving = saving === report.id;
            const isCopied = copied === report.id;

            return (
              <div
                key={report.id}
                className={cn(
                  "rounded-xl border p-5 transition-all",
                  "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900",
                  isSaving && "opacity-60"
                )}
              >
                {/* Info */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{report.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{report.description || '—'}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[11px] px-2 py-0.5 rounded-full ring-1 bg-gray-50 dark:bg-gray-800 text-gray-500 ring-gray-200 dark:ring-gray-700">
                        /{report.slug}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full ring-1 bg-gray-50 dark:bg-gray-800 text-gray-500 ring-gray-200 dark:ring-gray-700">
                        {report.category}
                      </span>
                    </div>
                  </div>

                  {/* Toggle público */}
                  <button
                    onClick={() => togglePublic(report.id, !report.standalone_public)}
                    disabled={isSaving}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ring-1",
                      report.standalone_public
                        ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-200 dark:ring-emerald-500/20"
                        : "bg-gray-50 dark:bg-gray-800 text-gray-500 ring-gray-200 dark:ring-gray-700 hover:ring-gray-300 dark:hover:ring-gray-600"
                    )}
                  >
                    {report.standalone_public
                      ? <><Globe className="w-3.5 h-3.5" /> Público</>
                      : <><Lock className="w-3.5 h-3.5" /> Privado</>
                    }
                  </button>
                </div>

                {/* Link de compartilhamento */}
                {report.standalone_public && report.share_token && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                    <Link2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <code className="flex-1 text-xs text-gray-600 dark:text-gray-400 truncate font-mono">
                      {getShareUrl(report)}
                    </code>
                    <button
                      onClick={() => copyLink(report)}
                      className={cn(
                        "p-1.5 rounded-md transition-colors flex-shrink-0",
                        isCopied
                          ? "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10"
                          : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      )}
                      title="Copiar link"
                    >
                      {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => regenerateToken(report.id)}
                      disabled={isSaving}
                      className="p-1.5 rounded-md text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors flex-shrink-0"
                      title="Gerar novo token (invalida o anterior)"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {!report.standalone_public && (
                  <p className="text-xs text-gray-400 mt-1">
                    Ative o modo público para gerar um link de compartilhamento.
                  </p>
                )}
              </div>
            );
          })}

          {reports.length === 0 && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
              <FileBarChart className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Nenhum relatório cadastrado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
