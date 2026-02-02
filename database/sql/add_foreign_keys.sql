-- ==============================================================================
-- ADICIONAR FOREIGN KEYS - HubSpot Data Warehouse
-- ==============================================================================
-- PASSO 1: Limpar dados órfãos (owner_id, contact_id, etc. que não existem)
-- PASSO 2: Adicionar Foreign Keys
-- ==============================================================================

-- ==============================================================================
-- PASSO 1: LIMPAR DADOS ÓRFÃOS
-- ==============================================================================

-- 1.1 Contatos com owner_id inválido → setar para NULL
UPDATE hubspot_contacts
SET owner_id = NULL
WHERE owner_id IS NOT NULL 
  AND owner_id NOT IN (SELECT hubspot_id FROM hubspot_owners);

-- 1.2 Deals com owner_id inválido → setar para NULL
UPDATE hubspot_deals
SET owner_id = NULL
WHERE owner_id IS NOT NULL 
  AND owner_id NOT IN (SELECT hubspot_id FROM hubspot_owners);

-- 1.3 Deals com contact_id inválido → setar para NULL
UPDATE hubspot_deals
SET contact_id = NULL
WHERE contact_id IS NOT NULL 
  AND contact_id NOT IN (SELECT hubspot_id FROM hubspot_contacts);

-- 1.4 Deals com pipeline_id inválido → setar para NULL
UPDATE hubspot_deals
SET pipeline_id = NULL
WHERE pipeline_id IS NOT NULL 
  AND pipeline_id NOT IN (SELECT hubspot_id FROM hubspot_pipelines);

-- 1.5 Deals com pipeline_stage_id inválido → setar para NULL
UPDATE hubspot_deals
SET pipeline_stage_id = NULL
WHERE pipeline_stage_id IS NOT NULL 
  AND pipeline_stage_id NOT IN (SELECT stage_id FROM hubspot_pipeline_stages);

-- 1.6 Line Items com deal_id inválido → setar para NULL
UPDATE hubspot_line_items
SET deal_id = NULL
WHERE deal_id IS NOT NULL 
  AND deal_id NOT IN (SELECT hubspot_id FROM hubspot_deals);

-- 1.7 Pipeline Stages com pipeline_id inválido → setar para NULL
UPDATE hubspot_pipeline_stages
SET pipeline_id = NULL
WHERE pipeline_id IS NOT NULL 
  AND pipeline_id NOT IN (SELECT hubspot_id FROM hubspot_pipelines);

-- 1.8 Commissions com owner_id inválido → setar para NULL
UPDATE hubspot_commissions_obj
SET owner_id = NULL
WHERE owner_id IS NOT NULL 
  AND owner_id NOT IN (SELECT hubspot_id FROM hubspot_owners);

-- ==============================================================================
-- PASSO 2: ADICIONAR FOREIGN KEYS
-- ==============================================================================

-- 2.1 CONTACTS → OWNERS (owner_id)
ALTER TABLE hubspot_contacts
ADD CONSTRAINT fk_contacts_owner
FOREIGN KEY (owner_id) REFERENCES hubspot_owners(hubspot_id)
ON DELETE SET NULL;

-- 2.2 DEALS → OWNERS (owner_id)
ALTER TABLE hubspot_deals
ADD CONSTRAINT fk_deals_owner
FOREIGN KEY (owner_id) REFERENCES hubspot_owners(hubspot_id)
ON DELETE SET NULL;

-- 2.3 DEALS → CONTACTS (contact_id)
ALTER TABLE hubspot_deals
ADD CONSTRAINT fk_deals_contact
FOREIGN KEY (contact_id) REFERENCES hubspot_contacts(hubspot_id)
ON DELETE SET NULL;

-- 2.4 DEALS → PIPELINES (pipeline_id)
ALTER TABLE hubspot_deals
ADD CONSTRAINT fk_deals_pipeline
FOREIGN KEY (pipeline_id) REFERENCES hubspot_pipelines(hubspot_id)
ON DELETE SET NULL;

-- 2.5 DEALS → PIPELINE_STAGES (pipeline_stage_id)
ALTER TABLE hubspot_deals
ADD CONSTRAINT fk_deals_stage
FOREIGN KEY (pipeline_stage_id) REFERENCES hubspot_pipeline_stages(stage_id)
ON DELETE SET NULL;

-- 2.6 LINE_ITEMS → DEALS (deal_id)
ALTER TABLE hubspot_line_items
ADD CONSTRAINT fk_lineitems_deal
FOREIGN KEY (deal_id) REFERENCES hubspot_deals(hubspot_id)
ON DELETE SET NULL;

-- 2.7 PIPELINE_STAGES → PIPELINES (pipeline_id)
ALTER TABLE hubspot_pipeline_stages
ADD CONSTRAINT fk_stages_pipeline
FOREIGN KEY (pipeline_id) REFERENCES hubspot_pipelines(hubspot_id)
ON DELETE SET NULL;

-- 2.8 COMMISSIONS → OWNERS (owner_id)
ALTER TABLE hubspot_commissions_obj
ADD CONSTRAINT fk_commissions_owner
FOREIGN KEY (owner_id) REFERENCES hubspot_owners(hubspot_id)
ON DELETE SET NULL;

-- ==============================================================================
-- VERIFICAÇÃO: Listar todas as Foreign Keys criadas
-- ==============================================================================
SELECT 
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table,
    ccu.column_name AS foreign_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name LIKE 'hubspot_%'
ORDER BY tc.table_name;
