-- ==============================================================================
-- AUDIT LOGS — Registra acessos e ações no sistema
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
    action          TEXT        NOT NULL,
    resource_type   TEXT,
    resource_id     TEXT,
    details         JSONB,
    ip_address      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.audit_logs IS 'Logs de auditoria — quem fez o quê e quando';

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);

-- RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Admin pode ler
CREATE POLICY "audit_logs_admin_select" ON public.audit_logs
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Qualquer autenticado pode inserir (para registrar seus próprios acessos)
CREATE POLICY "audit_logs_insert" ON public.audit_logs
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Service role pode tudo
CREATE POLICY "audit_logs_service" ON public.audit_logs
    FOR ALL TO service_role
    USING (true);

-- RPC para inserir log (SECURITY DEFINER para garantir que funciona)
CREATE OR REPLACE FUNCTION public.log_action(
    p_action TEXT,
    p_resource_type TEXT DEFAULT NULL,
    p_resource_id TEXT DEFAULT NULL,
    p_details JSONB DEFAULT NULL
) RETURNS void AS $$
BEGIN
    INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, details)
    VALUES (auth.uid(), p_action, p_resource_type, p_resource_id, p_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
