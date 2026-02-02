-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) - HubSpot Data Warehouse
-- ==============================================================================
-- Políticas de segurança para proteger os dados
-- ==============================================================================

-- ==============================================================================
-- PASSO 1: HABILITAR RLS EM TODAS AS TABELAS
-- ==============================================================================

ALTER TABLE hubspot_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE hubspot_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE hubspot_pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE hubspot_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hubspot_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE hubspot_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE hubspot_commissions_obj ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- PASSO 2: POLÍTICAS PARA SERVICE_ROLE (Acesso Total - ETL/Backend)
-- ==============================================================================

-- Owners
CREATE POLICY "service_role_all_owners" ON hubspot_owners
    FOR ALL USING (auth.role() = 'service_role');

-- Pipelines
CREATE POLICY "service_role_all_pipelines" ON hubspot_pipelines
    FOR ALL USING (auth.role() = 'service_role');

-- Pipeline Stages
CREATE POLICY "service_role_all_stages" ON hubspot_pipeline_stages
    FOR ALL USING (auth.role() = 'service_role');

-- Contacts
CREATE POLICY "service_role_all_contacts" ON hubspot_contacts
    FOR ALL USING (auth.role() = 'service_role');

-- Deals
CREATE POLICY "service_role_all_deals" ON hubspot_deals
    FOR ALL USING (auth.role() = 'service_role');

-- Line Items
CREATE POLICY "service_role_all_lineitems" ON hubspot_line_items
    FOR ALL USING (auth.role() = 'service_role');

-- Commissions
CREATE POLICY "service_role_all_commissions" ON hubspot_commissions_obj
    FOR ALL USING (auth.role() = 'service_role');

-- ==============================================================================
-- PASSO 3: POLÍTICAS PARA AUTHENTICATED (Leitura - Dashboard/Frontend)
-- ==============================================================================

-- Owners (leitura)
CREATE POLICY "authenticated_read_owners" ON hubspot_owners
    FOR SELECT USING (auth.role() = 'authenticated');

-- Pipelines (leitura)
CREATE POLICY "authenticated_read_pipelines" ON hubspot_pipelines
    FOR SELECT USING (auth.role() = 'authenticated');

-- Pipeline Stages (leitura)
CREATE POLICY "authenticated_read_stages" ON hubspot_pipeline_stages
    FOR SELECT USING (auth.role() = 'authenticated');

-- Contacts (leitura)
CREATE POLICY "authenticated_read_contacts" ON hubspot_contacts
    FOR SELECT USING (auth.role() = 'authenticated');

-- Deals (leitura)
CREATE POLICY "authenticated_read_deals" ON hubspot_deals
    FOR SELECT USING (auth.role() = 'authenticated');

-- Line Items (leitura)
CREATE POLICY "authenticated_read_lineitems" ON hubspot_line_items
    FOR SELECT USING (auth.role() = 'authenticated');

-- Commissions (leitura)
CREATE POLICY "authenticated_read_commissions" ON hubspot_commissions_obj
    FOR SELECT USING (auth.role() = 'authenticated');

-- ==============================================================================
-- VERIFICAÇÃO: Listar todas as políticas criadas
-- ==============================================================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename LIKE 'hubspot_%'
ORDER BY tablename, policyname;
