-- ==============================================================================
-- FIX: Function RPC para buscar relatórios acessíveis do usuário logado
-- Resolve problema de RLS na view
-- ==============================================================================

-- Dropar a view (não funciona bem com RLS)
DROP VIEW IF EXISTS public.vw_user_accessible_reports;

-- Criar function RPC que roda com SECURITY DEFINER (bypassa RLS)
CREATE OR REPLACE FUNCTION public.get_my_accessible_reports()
RETURNS TABLE (
    report_id UUID,
    slug TEXT,
    name TEXT,
    description TEXT,
    icon TEXT,
    category TEXT,
    standalone_public BOOLEAN,
    share_token TEXT,
    access_type TEXT
) AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_role TEXT;
BEGIN
    -- Buscar role do usuário
    SELECT p.role INTO v_role FROM public.profiles p WHERE p.id = v_user_id AND p.active = true;
    
    -- Se não encontrou ou inativo, retorna vazio
    IF v_role IS NULL THEN
        RETURN;
    END IF;
    
    -- Admin vê tudo
    IF v_role = 'admin' THEN
        RETURN QUERY
        SELECT r.id, r.slug, r.name, r.description, r.icon, r.category, r.standalone_public, r.share_token, 'admin'::TEXT
        FROM public.reports r
        WHERE r.active = true
        ORDER BY r.name;
        RETURN;
    END IF;
    
    -- Outros: acesso direto + via grupo
    RETURN QUERY
    SELECT DISTINCT r.id, r.slug, r.name, r.description, r.icon, r.category, r.standalone_public, r.share_token,
        CASE
            WHEN ura.id IS NOT NULL THEN 'direct'
            ELSE 'group'
        END::TEXT
    FROM public.reports r
    LEFT JOIN public.user_report_access ura ON ura.report_id = r.id AND ura.user_id = v_user_id
    LEFT JOIN public.user_groups ug ON ug.user_id = v_user_id
    LEFT JOIN public.group_report_access gra ON gra.group_id = ug.group_id AND gra.report_id = r.id
    WHERE r.active = true
      AND (ura.id IS NOT NULL OR gra.id IS NOT NULL)
    ORDER BY r.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificar que o relatório de comissões existe
SELECT * FROM public.reports;

-- Verificar que o profile admin existe
SELECT id, email, role, active FROM public.profiles WHERE email = 'bpm@gowork.com.br';
