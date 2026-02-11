import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile, AccessibleReport, AuthContextType } from './AuthContext';

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (!error && data) return data as Profile;

  // Profile não existe — criar automaticamente
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) return null;

  const { data: created } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      email: authData.user.email || '',
      full_name: authData.user.user_metadata?.full_name || authData.user.email?.split('@')[0] || '',
      role: 'viewer',
      active: true,
    }, { onConflict: 'id' })
    .select()
    .single();

  return created as Profile | null;
}

async function fetchReports(role: string): Promise<AccessibleReport[]> {
  const { data, error } = await supabase.rpc('get_my_accessible_reports');
  if (!error && data) return data as AccessibleReport[];

  // Fallback: admin vê tudo
  if (role === 'admin') {
    const { data: all } = await supabase
      .from('reports')
      .select('id, slug, name, description, icon, category, standalone_public, share_token')
      .eq('active', true)
      .order('name');

    return (all || []).map(r => ({
      report_id: r.id, slug: r.slug, name: r.name, description: r.description,
      icon: r.icon, category: r.category, standalone_public: r.standalone_public,
      share_token: r.share_token, access_type: 'admin',
    }));
  }
  return [];
}

export function useAuthState(): AuthContextType {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reports, setReports] = useState<AccessibleReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const initialized = useRef(false);

  const loadUserData = useCallback(async (authUser: User) => {
    const p = await fetchProfile(authUser.id);
    setProfile(p);
    if (p) {
      const r = await fetchReports(p.role);
      setReports(r);
    } else {
      setReports([]);
    }
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Init: buscar sessão existente
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (s?.user) {
        setSession(s);
        setUser(s.user);
        await loadUserData(s.user);
      }
      setIsLoading(false);
    });

    // Listener: mudanças de auth (login, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
      if (event === 'SIGNED_IN' && s?.user) {
        // CRITICAL: setar loading ANTES de setar user
        // Evita que o App veja user!=null e profile=null ao mesmo tempo
        setIsLoading(true);
        setSession(s);
        setUser(s.user);
        await loadUserData(s.user);
        setIsLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setProfile(null);
        setReports([]);
        setIsLoading(false);
      } else if (event === 'TOKEN_REFRESHED' && s) {
        setSession(s);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadUserData]);

  // Safety: nunca ficar em loading mais de 10s
  useEffect(() => {
    if (!isLoading) return;
    const t = setTimeout(() => {
      console.warn('Auth loading timeout — forçando fim');
      setIsLoading(false);
    }, 10000);
    return () => clearTimeout(t);
  }, [isLoading]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email, password, options: { data: { full_name: fullName } },
    });
    return { error: error?.message ?? null };
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    // O onAuthStateChange SIGNED_OUT vai limpar o estado
  }, []);

  const hasReportAccess = useCallback((slug: string) => {
    if (!profile) return false;
    if (profile.role === 'admin') return true;
    return reports.some(r => r.slug === slug);
  }, [profile, reports]);

  const refreshData = useCallback(async () => {
    if (user) await loadUserData(user);
  }, [user, loadUserData]);

  return {
    user, session, profile, reports, isLoading,
    isAdmin: profile?.role === 'admin',
    isManager: profile?.role === 'manager',
    signIn, signOut, signUp, resetPassword, hasReportAccess, refreshData,
  };
}
