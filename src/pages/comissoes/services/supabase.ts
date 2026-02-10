// ============================================
// CLIENTE SUPABASE
// ============================================

import { createClient } from '@supabase/supabase-js';
import { ENV } from '@/config/env';
import type { Database } from '@/types/database';

// Criar cliente Supabase tipado
export const supabase = createClient<Database>(
  ENV.SUPABASE_URL,
  ENV.SUPABASE_KEY
);
