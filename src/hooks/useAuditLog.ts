import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/AuthContext';

export function useAuditLog() {
  const { user } = useAuth();

  const log = useCallback(async (
    action: string,
    resourceType?: string,
    resourceId?: string,
    details?: Record<string, unknown>
  ) => {
    if (!user) return;

    try {
      await supabase.rpc('log_action', {
        p_action: action,
        p_resource_type: resourceType || null,
        p_resource_id: resourceId || null,
        p_details: details || null,
      });
    } catch {
      // Fallback: inserção direta
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action,
        resource_type: resourceType || null,
        resource_id: resourceId || null,
        details: details || null,
      });
    }
  }, [user]);

  return { log };
}
