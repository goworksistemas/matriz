// ============================================
// CONFIGURAÇÕES DE AMBIENTE
// ============================================
// As credenciais são lidas das variáveis de ambiente (.env)
// NUNCA commite credenciais diretamente neste arquivo!

export const ENV = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
  SUPABASE_KEY: import.meta.env.VITE_SUPABASE_KEY || '',
} as const;

// Validação para garantir que as variáveis foram configuradas
if (!ENV.SUPABASE_URL || !ENV.SUPABASE_KEY) {
  console.warn('⚠️ Variáveis de ambiente do Supabase não configuradas. Verifique o arquivo .env');
}
