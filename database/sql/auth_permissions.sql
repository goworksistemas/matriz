-- ==============================================================================
-- AUTH + PERMISSÕES - NetworkGo Matriz
-- ==============================================================================
-- Execute este script no SQL Editor do Supabase
-- Ordem: tabelas → trigger → view → RLS → seed
-- ==============================================================================

-- Habilitar extensão UUID (caso não esteja)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. TABELA: profiles
-- ==============================================================================

CREATE TABLE public.profiles (
    id              UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email           TEXT        NOT NULL,
    full_name       TEXT,
    avatar_url      TEXT,
    role            TEXT        NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'manager', 'viewer')),
    active          BOOLEAN     NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'Perfis de usuários vinculados ao auth.users';

CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- ==============================================================================
-- 2. TABELA: reports
-- ==============================================================================

CREATE TABLE public.reports (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug                TEXT        NOT NULL UNIQUE,
    name                TEXT        NOT NULL,
    description         TEXT,
    icon                TEXT        DEFAULT 'bar-chart',
    category            TEXT        NOT NULL DEFAULT 'operacional' CHECK (category IN ('vendas', 'financeiro', 'operacional', 'rh')),
    active              BOOLEAN     NOT NULL DEFAULT true,
    standalone_public   BOOLEAN     NOT NULL DEFAULT false,
    share_token         TEXT        UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.reports IS 'Registro dos relatórios disponíveis no sistema';
COMMENT ON COLUMN public.reports.standalone_public IS 'Se true, o link standalone pode ser acessado sem login';
COMMENT ON COLUMN public.reports.share_token IS 'Token único para links de compartilhamento público';

CREATE INDEX idx_reports_slug ON public.reports(slug);
CREATE INDEX idx_reports_share_token ON public.reports(share_token);

-- ==============================================================================
-- 3. TABELA: access_groups
-- ==============================================================================

CREATE TABLE public.access_groups (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT        NOT NULL,
    description     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.access_groups IS 'Grupos de acesso para vincular conjuntos de relatórios a conjuntos de usuários';

-- ==============================================================================
-- 4. TABELA: user_groups (N:N usuário ↔ grupo)
-- ==============================================================================

CREATE TABLE public.user_groups (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    group_id        UUID        NOT NULL REFERENCES public.access_groups(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, group_id)
);

COMMENT ON TABLE public.user_groups IS 'Vínculo entre usuários e grupos de acesso';

CREATE INDEX idx_user_groups_user_id ON public.user_groups(user_id);
CREATE INDEX idx_user_groups_group_id ON public.user_groups(group_id);

-- ==============================================================================
-- 5. TABELA: user_report_access (acesso individual)
-- ==============================================================================

CREATE TABLE public.user_report_access (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    report_id       UUID        NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    granted_by      UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, report_id)
);

COMMENT ON TABLE public.user_report_access IS 'Acesso individual: usuário → relatório';

CREATE INDEX idx_user_report_access_user_id ON public.user_report_access(user_id);
CREATE INDEX idx_user_report_access_report_id ON public.user_report_access(report_id);

-- ==============================================================================
-- 6. TABELA: group_report_access (acesso de grupo)
-- ==============================================================================

CREATE TABLE public.group_report_access (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id        UUID        NOT NULL REFERENCES public.access_groups(id) ON DELETE CASCADE,
    report_id       UUID        NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(group_id, report_id)
);

COMMENT ON TABLE public.group_report_access IS 'Acesso de grupo: grupo → relatório';

CREATE INDEX idx_group_report_access_group_id ON public.group_report_access(group_id);
CREATE INDEX idx_group_report_access_report_id ON public.group_report_access(report_id);

-- ==============================================================================
-- 7. TRIGGER: criar profile automaticamente no signup
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 8. TRIGGER: atualizar updated_at no profiles
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 9. FUNCTION: verificar se usuário tem acesso a um relatório
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.user_has_report_access(p_user_id UUID, p_report_slug TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_role TEXT;
    v_has_access BOOLEAN;
BEGIN
    -- Buscar role do usuário
    SELECT role INTO v_role FROM public.profiles WHERE id = p_user_id AND active = true;
    
    -- Admin tem acesso total
    IF v_role = 'admin' THEN
        RETURN true;
    END IF;
    
    -- Verificar acesso direto ou via grupo
    SELECT EXISTS(
        SELECT 1 FROM public.reports r
        WHERE r.slug = p_report_slug AND r.active = true
        AND (
            -- Acesso direto
            EXISTS (
                SELECT 1 FROM public.user_report_access ura
                WHERE ura.user_id = p_user_id AND ura.report_id = r.id
            )
            OR
            -- Acesso via grupo
            EXISTS (
                SELECT 1 FROM public.user_groups ug
                JOIN public.group_report_access gra ON gra.group_id = ug.group_id
                WHERE ug.user_id = p_user_id AND gra.report_id = r.id
            )
        )
    ) INTO v_has_access;
    
    RETURN COALESCE(v_has_access, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 10. VIEW: relatórios acessíveis por usuário
-- ==============================================================================

CREATE OR REPLACE VIEW public.vw_user_accessible_reports AS
SELECT DISTINCT
    p.id AS user_id,
    r.id AS report_id,
    r.slug,
    r.name,
    r.description,
    r.icon,
    r.category,
    r.standalone_public,
    r.share_token,
    CASE
        WHEN p.role = 'admin' THEN 'admin'
        WHEN ura.id IS NOT NULL THEN 'direct'
        WHEN gra.id IS NOT NULL THEN 'group'
    END AS access_type
FROM public.profiles p
CROSS JOIN public.reports r
LEFT JOIN public.user_report_access ura 
    ON ura.user_id = p.id AND ura.report_id = r.id
LEFT JOIN public.user_groups ug 
    ON ug.user_id = p.id
LEFT JOIN public.group_report_access gra 
    ON gra.group_id = ug.group_id AND gra.report_id = r.id
WHERE r.active = true
  AND p.active = true
  AND (
    p.role = 'admin'
    OR ura.id IS NOT NULL
    OR gra.id IS NOT NULL
  );

-- ==============================================================================
-- 11. RLS - PROFILES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Usuário vê seu próprio perfil, admin vê todos
CREATE POLICY "profiles_select" ON public.profiles
    FOR SELECT USING (
        auth.uid() = id
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Usuário atualiza seu próprio perfil (nome, avatar)
CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Admin pode tudo
CREATE POLICY "profiles_admin_all" ON public.profiles
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Service role pode tudo (para o trigger)
CREATE POLICY "profiles_service_role" ON public.profiles
    FOR ALL USING (auth.role() = 'service_role');

-- ==============================================================================
-- 12. RLS - REPORTS
-- ==============================================================================

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Qualquer autenticado pode ler relatórios ativos
CREATE POLICY "reports_select" ON public.reports
    FOR SELECT USING (auth.role() = 'authenticated');

-- Admin gerencia
CREATE POLICY "reports_admin_all" ON public.reports
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "reports_service_role" ON public.reports
    FOR ALL USING (auth.role() = 'service_role');

-- ==============================================================================
-- 13. RLS - ACCESS_GROUPS
-- ==============================================================================

ALTER TABLE public.access_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "access_groups_select" ON public.access_groups
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "access_groups_admin_all" ON public.access_groups
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "access_groups_service_role" ON public.access_groups
    FOR ALL USING (auth.role() = 'service_role');

-- ==============================================================================
-- 14. RLS - USER_GROUPS
-- ==============================================================================

ALTER TABLE public.user_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_groups_select" ON public.user_groups
    FOR SELECT USING (
        user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "user_groups_admin_all" ON public.user_groups
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "user_groups_service_role" ON public.user_groups
    FOR ALL USING (auth.role() = 'service_role');

-- ==============================================================================
-- 15. RLS - USER_REPORT_ACCESS
-- ==============================================================================

ALTER TABLE public.user_report_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_report_access_select" ON public.user_report_access
    FOR SELECT USING (
        user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "user_report_access_admin_all" ON public.user_report_access
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "user_report_access_service_role" ON public.user_report_access
    FOR ALL USING (auth.role() = 'service_role');

-- ==============================================================================
-- 16. RLS - GROUP_REPORT_ACCESS
-- ==============================================================================

ALTER TABLE public.group_report_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "group_report_access_select" ON public.group_report_access
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "group_report_access_admin_all" ON public.group_report_access
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "group_report_access_service_role" ON public.group_report_access
    FOR ALL USING (auth.role() = 'service_role');

-- ==============================================================================
-- 17. SEED: Relatório de Comissões
-- ==============================================================================

INSERT INTO public.reports (slug, name, description, icon, category, active, standalone_public)
VALUES (
    'comissoes',
    'Dashboard de Comissões',
    'Análise e gestão de comissões de vendedores e SDRs',
    'coins',
    'vendas',
    true,
    false
);

-- ==============================================================================
-- 18. SEED: Tornar bpm@gowork.com.br admin
-- (Execute APÓS criar o usuário no Supabase Dashboard → Authentication → Invite User)
-- ==============================================================================

-- UPDATE public.profiles SET role = 'admin' WHERE email = 'bpm@gowork.com.br';

-- ==============================================================================
-- VERIFICAÇÃO
-- ==============================================================================

SELECT 'profiles' AS tabela, COUNT(*) FROM public.profiles
UNION ALL SELECT 'reports', COUNT(*) FROM public.reports
UNION ALL SELECT 'access_groups', COUNT(*) FROM public.access_groups
UNION ALL SELECT 'user_groups', COUNT(*) FROM public.user_groups
UNION ALL SELECT 'user_report_access', COUNT(*) FROM public.user_report_access
UNION ALL SELECT 'group_report_access', COUNT(*) FROM public.group_report_access;
