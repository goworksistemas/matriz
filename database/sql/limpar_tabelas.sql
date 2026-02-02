-- =====================================================
-- LIMPAR TODAS AS TABELAS HUBSPOT
-- Execute este script para apagar todos os dados
-- =====================================================

-- Desabilita verificação de FK temporariamente (se houver)
SET session_replication_role = 'replica';

-- Limpa todas as tabelas (TRUNCATE é mais rápido que DELETE)
TRUNCATE TABLE hubspot_line_items RESTART IDENTITY CASCADE;
TRUNCATE TABLE hubspot_deals RESTART IDENTITY CASCADE;
TRUNCATE TABLE hubspot_contacts RESTART IDENTITY CASCADE;
TRUNCATE TABLE hubspot_companies RESTART IDENTITY CASCADE;
TRUNCATE TABLE hubspot_pipeline_stages RESTART IDENTITY CASCADE;
TRUNCATE TABLE hubspot_pipelines RESTART IDENTITY CASCADE;
TRUNCATE TABLE hubspot_owners RESTART IDENTITY CASCADE;
TRUNCATE TABLE hubspot_commissions_obj RESTART IDENTITY CASCADE;

-- Reabilita verificação de FK
SET session_replication_role = 'origin';

-- Confirma limpeza
SELECT 'hubspot_owners' AS tabela, COUNT(*) AS registros FROM hubspot_owners
UNION ALL SELECT 'hubspot_pipelines', COUNT(*) FROM hubspot_pipelines
UNION ALL SELECT 'hubspot_pipeline_stages', COUNT(*) FROM hubspot_pipeline_stages
UNION ALL SELECT 'hubspot_companies', COUNT(*) FROM hubspot_companies
UNION ALL SELECT 'hubspot_contacts', COUNT(*) FROM hubspot_contacts
UNION ALL SELECT 'hubspot_deals', COUNT(*) FROM hubspot_deals
UNION ALL SELECT 'hubspot_line_items', COUNT(*) FROM hubspot_line_items
UNION ALL SELECT 'hubspot_commissions_obj', COUNT(*) FROM hubspot_commissions_obj;
