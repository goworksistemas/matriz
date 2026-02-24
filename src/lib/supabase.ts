import { createClient } from '@supabase/supabase-js';
import { ENV } from '@/config/env';

const FALLBACK_SUPABASE_URL = 'https://placeholder.supabase.co';
const FALLBACK_SUPABASE_KEY = 'public-anon-key-placeholder';

export const isSupabaseConfigured = Boolean(ENV.SUPABASE_URL && ENV.SUPABASE_KEY);
export const supabaseConfigErrorMessage =
  'Variaveis de ambiente do Supabase nao configuradas. Defina VITE_SUPABASE_URL e VITE_SUPABASE_KEY.';

export const supabase = createClient(
  isSupabaseConfigured ? ENV.SUPABASE_URL : FALLBACK_SUPABASE_URL,
  isSupabaseConfigured ? ENV.SUPABASE_KEY : FALLBACK_SUPABASE_KEY
);
