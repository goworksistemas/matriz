import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface CompanyTheme {
  id: string;
  company_name: string;
  logo_url: string | null;
  primary_color: string;
  sidebar_color: string | null;
  accent_color: string | null;
}

const DEFAULT_THEME: CompanyTheme = {
  id: '',
  company_name: 'NetworkGo',
  logo_url: null,
  primary_color: '#0ea5e9',
  sidebar_color: null,
  accent_color: null,
};

// Gerar tonalidades a partir de uma cor hex
function hexToHSL(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function applyThemeColors(primary: string) {
  const { h, s } = hexToHSL(primary);
  const root = document.documentElement;
  // Aplicar como CSS custom properties
  root.style.setProperty('--theme-primary', primary);
  root.style.setProperty('--theme-primary-50', `hsl(${h}, ${s}%, 97%)`);
  root.style.setProperty('--theme-primary-100', `hsl(${h}, ${s}%, 93%)`);
  root.style.setProperty('--theme-primary-200', `hsl(${h}, ${s}%, 85%)`);
  root.style.setProperty('--theme-primary-300', `hsl(${h}, ${s}%, 72%)`);
  root.style.setProperty('--theme-primary-400', `hsl(${h}, ${s}%, 58%)`);
  root.style.setProperty('--theme-primary-500', primary);
  root.style.setProperty('--theme-primary-600', `hsl(${h}, ${s}%, 40%)`);
  root.style.setProperty('--theme-primary-700', `hsl(${h}, ${s}%, 33%)`);
}

export function useCompanyTheme() {
  const [theme, setTheme] = useState<CompanyTheme>(DEFAULT_THEME);
  const [loading, setLoading] = useState(true);

  const fetchTheme = useCallback(async () => {
    const { data } = await supabase.from('theme_settings').select('*').limit(1).single();
    if (data) {
      const t = data as CompanyTheme;
      setTheme(t);
      applyThemeColors(t.primary_color);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchTheme(); }, [fetchTheme]);

  const updateTheme = useCallback(async (updates: Partial<CompanyTheme>) => {
    if (!theme.id) return;
    await supabase.from('theme_settings').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', theme.id);
    const newTheme = { ...theme, ...updates };
    setTheme(newTheme);
    if (updates.primary_color) applyThemeColors(updates.primary_color);
  }, [theme]);

  return { theme, loading, updateTheme, refetch: fetchTheme };
}
