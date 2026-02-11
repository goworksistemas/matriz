-- ==============================================================================
-- THEME SETTINGS — Configuração visual personalizada
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.theme_settings (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name    TEXT        NOT NULL DEFAULT 'NetworkGo',
    logo_url        TEXT,
    primary_color   TEXT        NOT NULL DEFAULT '#0ea5e9',
    sidebar_color   TEXT,
    accent_color    TEXT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by      UUID        REFERENCES public.profiles(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.theme_settings IS 'Configuração visual da empresa — singleton (1 linha)';

-- RLS
ALTER TABLE public.theme_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "theme_select" ON public.theme_settings
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "theme_admin" ON public.theme_settings
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "theme_service" ON public.theme_settings
    FOR ALL TO service_role USING (true);

-- Seed com valores padrão
INSERT INTO public.theme_settings (company_name, primary_color)
VALUES ('NetworkGo', '#0ea5e9')
ON CONFLICT DO NOTHING;
