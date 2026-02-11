-- ==============================================================================
-- FIX: Permitir que o próprio usuário crie/atualize seu profile
-- Necessário porque o trigger pode ter falhado se o usuário foi criado
-- antes das tabelas existirem
-- ==============================================================================

-- Permitir INSERT do próprio profile
CREATE POLICY "profiles_insert_own" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Garantir que o profile do bpm@gowork.com.br existe e é admin
INSERT INTO public.profiles (id, email, full_name, role, active)
SELECT id, email, 'Admin BPM', 'admin', true
FROM auth.users
WHERE email = 'bpm@gowork.com.br'
ON CONFLICT (id) DO UPDATE SET role = 'admin', full_name = 'Admin BPM', active = true;

-- Verificar
SELECT id, email, role, active, full_name FROM public.profiles;
