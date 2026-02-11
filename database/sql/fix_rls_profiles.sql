-- ==============================================================================
-- FIX: Recriar TODAS as policies do profiles de forma limpa
-- O problema é que policies conflitantes podem estar bloqueando o SELECT
-- ==============================================================================

-- 1. Remover TODAS as policies existentes do profiles
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_service_role" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;

-- 2. Garantir que RLS está habilitado
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Criar policies limpas e simples

-- SELECT: usuário vê seu próprio profile, admin vê todos
CREATE POLICY "profiles_select" ON public.profiles
    FOR SELECT TO authenticated
    USING (true);
    -- Todos autenticados podem ler profiles (necessário para resolver nomes)

-- INSERT: usuário pode criar seu próprio profile (fallback do trigger)
CREATE POLICY "profiles_insert" ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id);

-- UPDATE: usuário atualiza o próprio, admin atualiza qualquer um
CREATE POLICY "profiles_update" ON public.profiles
    FOR UPDATE TO authenticated
    USING (
        auth.uid() = id
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- DELETE: apenas admin
CREATE POLICY "profiles_delete" ON public.profiles
    FOR DELETE TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Service role (ETL, triggers)
CREATE POLICY "profiles_service" ON public.profiles
    FOR ALL TO service_role
    USING (true);

-- 4. Verificar policies criadas
SELECT policyname, cmd, roles, qual
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 5. Verificar que o profile existe
SELECT id, email, role, active FROM public.profiles WHERE email = 'bpm@gowork.com.br';
