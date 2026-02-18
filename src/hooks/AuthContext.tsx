import { createContext, useContext, type ReactNode } from 'react';
import { useAuthState } from './useAuthState';
import type { User, Session } from '@supabase/supabase-js';

// ============================================
// TIPOS
// ============================================

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'admin' | 'manager' | 'viewer';
  active: boolean;
}

export interface AccessibleReport {
  report_id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string;
  category: string;
  standalone_public: boolean;
  share_token: string | null;
  access_type: string;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  reports: AccessibleReport[];
  isLoading: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isRecovery: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
  clearRecovery: () => void;
  hasReportAccess: (slug: string) => boolean;
  refreshData: () => Promise<void>;
}

// ============================================
// CONTEXT
// ============================================

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const state = useAuthState();
  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
