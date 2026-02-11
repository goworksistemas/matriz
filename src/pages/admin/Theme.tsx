import { useState, useEffect } from 'react';
import { Palette, Save, Loader2, CheckCircle, RotateCcw } from 'lucide-react';
import { useCompanyTheme } from '@/hooks/useCompanyTheme';
import { useToast } from '@/hooks/ToastContext';
import { cn } from '@/lib/utils';

const PRESET_COLORS = [
  { name: 'Azul (padrão)', value: '#0ea5e9' },
  { name: 'Índigo', value: '#6366f1' },
  { name: 'Violeta', value: '#8b5cf6' },
  { name: 'Rosa', value: '#ec4899' },
  { name: 'Vermelho', value: '#ef4444' },
  { name: 'Laranja', value: '#f97316' },
  { name: 'Âmbar', value: '#f59e0b' },
  { name: 'Esmeralda', value: '#10b981' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Ciano', value: '#06b6d4' },
];

export function AdminTheme() {
  const { theme, loading, updateTheme } = useCompanyTheme();
  const toast = useToast();
  const [companyName, setCompanyName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#0ea5e9');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (theme) {
      setCompanyName(theme.company_name || '');
      setLogoUrl(theme.logo_url || '');
      setPrimaryColor(theme.primary_color || '#0ea5e9');
    }
  }, [theme]);

  const handleSave = async () => {
    setSaving(true);
    await updateTheme({
      company_name: companyName.trim(),
      logo_url: logoUrl.trim() || null,
      primary_color: primaryColor,
    });
    setSaving(false);
    setSaved(true);
    toast.success('Tema atualizado');
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setPrimaryColor('#0ea5e9');
    setCompanyName('NetworkGo');
    setLogoUrl('');
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
      <div className="p-6 lg:p-8 max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary-500" />
            Personalização
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Configure a identidade visual do sistema</p>
        </div>

        <div className="space-y-6">
          {/* Empresa */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Empresa</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Nome da empresa</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">URL do Logo (opcional)</label>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={e => setLogoUrl(e.target.value)}
                  placeholder="https://exemplo.com/logo.png"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              {logoUrl && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <img src={logoUrl} alt="Logo preview" className="h-10 w-auto object-contain" onError={e => (e.currentTarget.style.display = 'none')} />
                  <span className="text-xs text-gray-500">Preview do logo</span>
                </div>
              )}
            </div>
          </div>

          {/* Cor primária */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Cor Primária</h2>

            {/* Color picker */}
            <div className="flex items-center gap-4 mb-4">
              <input
                type="color"
                value={primaryColor}
                onChange={e => setPrimaryColor(e.target.value)}
                className="w-12 h-12 rounded-lg border-2 border-gray-200 dark:border-gray-700 cursor-pointer"
              />
              <div>
                <input
                  type="text"
                  value={primaryColor}
                  onChange={e => setPrimaryColor(e.target.value)}
                  className="w-28 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-mono text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-[10px] text-gray-400 mt-1">Hex code</p>
              </div>
              {/* Preview */}
              <div className="flex-1 h-12 rounded-lg" style={{ backgroundColor: primaryColor }} />
            </div>

            {/* Presets */}
            <p className="text-xs text-gray-500 mb-2">Cores predefinidas</p>
            <div className="grid grid-cols-5 gap-2">
              {PRESET_COLORS.map(c => (
                <button
                  key={c.value}
                  onClick={() => setPrimaryColor(c.value)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-all",
                    primaryColor === c.value
                      ? "border-gray-900 dark:border-white ring-1 ring-gray-900 dark:ring-white"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  )}
                >
                  <div className="w-8 h-8 rounded-full" style={{ backgroundColor: c.value }} />
                  <span className="text-[10px] text-gray-500 text-center leading-tight">{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar alterações'}
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Restaurar padrão
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
