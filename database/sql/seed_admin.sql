-- ==============================================================================
-- SEED: Configurar admin + alterar senha
-- ==============================================================================

-- 1. Alterar senha para 123123123
UPDATE auth.users 
SET encrypted_password = crypt('123123123', gen_salt('bf'))
WHERE email = 'bpm@gowork.com.br';

-- 2. Tornar admin
UPDATE public.profiles 
SET role = 'admin', full_name = 'Admin BPM' 
WHERE email = 'bpm@gowork.com.br';

-- 3. Vincular acesso ao relatório de comissões
INSERT INTO public.user_report_access (user_id, report_id, granted_by)
SELECT p.id, r.id, p.id
FROM public.profiles p, public.reports r
WHERE p.email = 'bpm@gowork.com.br' AND r.slug = 'comissoes'
ON CONFLICT (user_id, report_id) DO NOTHING;

-- Verificação
SELECT p.email, p.role, p.full_name, p.active 
FROM public.profiles p 
WHERE p.email = 'bpm@gowork.com.br';
