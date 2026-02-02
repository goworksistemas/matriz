-- =====================================================
-- DATA WAREHOUSE - MÓDULO HUBSPOT
-- Supabase DDL Script (COM UUID + SEM Foreign Keys)
-- Autor: Data Engineering Team
-- Data: 2026-01-26
-- Versão: 3.0 - UUID por linha + Sem FKs
-- =====================================================

-- ⚠️ IMPORTANTE: Este script DROP as tabelas existentes!
-- Execute com cuidado em ambiente de produção.

-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- DROP TABELAS EXISTENTES (ordem inversa de dependência)
-- =====================================================
DROP TABLE IF EXISTS hubspot_commissions_obj CASCADE;
DROP TABLE IF EXISTS hubspot_line_items CASCADE;
DROP TABLE IF EXISTS hubspot_deals CASCADE;
DROP TABLE IF EXISTS hubspot_contacts CASCADE;
DROP TABLE IF EXISTS hubspot_companies CASCADE;
DROP TABLE IF EXISTS hubspot_pipeline_stages CASCADE;
DROP TABLE IF EXISTS hubspot_pipelines CASCADE;
DROP TABLE IF EXISTS hubspot_owners CASCADE;
DROP VIEW IF EXISTS vw_hubspot_extraction_status CASCADE;

-- =====================================================
-- 1. TABELA: hubspot_owners (Proprietários/Usuários)
-- =====================================================
CREATE TABLE hubspot_owners (
    id                  UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    hubspot_id          TEXT            NOT NULL UNIQUE,
    email               TEXT,
    first_name          TEXT,
    last_name           TEXT,
    user_id             TEXT,
    team_id             TEXT,
    created_at          TIMESTAMPTZ,
    updated_at          TIMESTAMPTZ,
    archived            BOOLEAN         DEFAULT FALSE,
    
    -- Colunas de Auditoria
    _extracted_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    _source_system      TEXT            NOT NULL DEFAULT 'HubSpot'
);

COMMENT ON TABLE hubspot_owners IS 'Proprietários e usuários do HubSpot';

-- Índices
CREATE INDEX idx_hubspot_owners_hubspot_id ON hubspot_owners(hubspot_id);
CREATE INDEX idx_hubspot_owners_email ON hubspot_owners(email);
CREATE INDEX idx_hubspot_owners_extracted_at ON hubspot_owners(_extracted_at);


-- =====================================================
-- 2. TABELA: hubspot_pipelines (Definições de Pipelines)
-- =====================================================
CREATE TABLE hubspot_pipelines (
    id                  UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    hubspot_id          TEXT            NOT NULL UNIQUE,
    label               TEXT,
    display_order       INTEGER,
    object_type         TEXT,
    created_at          TIMESTAMPTZ,
    updated_at          TIMESTAMPTZ,
    archived            BOOLEAN         DEFAULT FALSE,
    
    -- Colunas de Auditoria
    _extracted_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    _source_system      TEXT            NOT NULL DEFAULT 'HubSpot'
);

COMMENT ON TABLE hubspot_pipelines IS 'Pipelines de vendas/tickets do HubSpot';

-- Índices
CREATE INDEX idx_hubspot_pipelines_hubspot_id ON hubspot_pipelines(hubspot_id);
CREATE INDEX idx_hubspot_pipelines_object_type ON hubspot_pipelines(object_type);
CREATE INDEX idx_hubspot_pipelines_extracted_at ON hubspot_pipelines(_extracted_at);


-- =====================================================
-- 3. TABELA: hubspot_pipeline_stages (Etapas dos Pipelines)
-- =====================================================
CREATE TABLE hubspot_pipeline_stages (
    id                  UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    stage_id            TEXT            NOT NULL UNIQUE,
    pipeline_id         TEXT,
    label               TEXT,
    display_order       INTEGER,
    probability         DECIMAL(5,4),
    is_closed           BOOLEAN         DEFAULT FALSE,
    is_won              BOOLEAN         DEFAULT FALSE,
    created_at          TIMESTAMPTZ,
    updated_at          TIMESTAMPTZ,
    archived            BOOLEAN         DEFAULT FALSE,
    
    -- Colunas de Auditoria
    _extracted_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    _source_system      TEXT            NOT NULL DEFAULT 'HubSpot'
);

COMMENT ON TABLE hubspot_pipeline_stages IS 'Etapas/Stages dos pipelines do HubSpot';

-- Índices
CREATE INDEX idx_hubspot_stages_stage_id ON hubspot_pipeline_stages(stage_id);
CREATE INDEX idx_hubspot_stages_pipeline_id ON hubspot_pipeline_stages(pipeline_id);
CREATE INDEX idx_hubspot_stages_is_closed ON hubspot_pipeline_stages(is_closed);
CREATE INDEX idx_hubspot_stages_extracted_at ON hubspot_pipeline_stages(_extracted_at);


-- =====================================================
-- 4. TABELA: hubspot_companies (Empresas)
-- =====================================================
CREATE TABLE hubspot_companies (
    id                  UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    hubspot_id          TEXT            NOT NULL UNIQUE,
    name                TEXT,
    domain              TEXT,
    industry            TEXT,
    website             TEXT,
    phone               TEXT,
    city                TEXT,
    state               TEXT,
    country             TEXT,
    postal_code         TEXT,
    address             TEXT,
    description         TEXT,
    number_of_employees INTEGER,
    annual_revenue      DECIMAL(18,2),
    lifecycle_stage     TEXT,
    owner_id            TEXT,
    created_at          TIMESTAMPTZ,
    updated_at          TIMESTAMPTZ,
    archived            BOOLEAN         DEFAULT FALSE,
    
    -- Colunas de Auditoria
    _extracted_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    _source_system      TEXT            NOT NULL DEFAULT 'HubSpot'
);

COMMENT ON TABLE hubspot_companies IS 'Empresas (Companies) do HubSpot';

-- Índices
CREATE INDEX idx_hubspot_companies_hubspot_id ON hubspot_companies(hubspot_id);
CREATE INDEX idx_hubspot_companies_domain ON hubspot_companies(domain);
CREATE INDEX idx_hubspot_companies_name ON hubspot_companies(name);
CREATE INDEX idx_hubspot_companies_owner_id ON hubspot_companies(owner_id);
CREATE INDEX idx_hubspot_companies_lifecycle_stage ON hubspot_companies(lifecycle_stage);
CREATE INDEX idx_hubspot_companies_extracted_at ON hubspot_companies(_extracted_at);


-- =====================================================
-- 5. TABELA: hubspot_contacts (Contatos)
-- =====================================================
CREATE TABLE hubspot_contacts (
    id                  UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    hubspot_id          TEXT            NOT NULL UNIQUE,
    email               TEXT,
    first_name          TEXT,
    last_name           TEXT,
    phone               TEXT,
    mobile_phone        TEXT,
    job_title           TEXT,
    company_id          TEXT,
    lifecycle_stage     TEXT,
    lead_status         TEXT,
    owner_id            TEXT,
    city                TEXT,
    state               TEXT,
    country             TEXT,
    postal_code         TEXT,
    created_at          TIMESTAMPTZ,
    updated_at          TIMESTAMPTZ,
    archived            BOOLEAN         DEFAULT FALSE,
    
    -- Colunas de Auditoria
    _extracted_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    _source_system      TEXT            NOT NULL DEFAULT 'HubSpot'
);

COMMENT ON TABLE hubspot_contacts IS 'Contatos do HubSpot';

-- Índices
CREATE INDEX idx_hubspot_contacts_hubspot_id ON hubspot_contacts(hubspot_id);
CREATE INDEX idx_hubspot_contacts_email ON hubspot_contacts(email);
CREATE INDEX idx_hubspot_contacts_company_id ON hubspot_contacts(company_id);
CREATE INDEX idx_hubspot_contacts_owner_id ON hubspot_contacts(owner_id);
CREATE INDEX idx_hubspot_contacts_lifecycle_stage ON hubspot_contacts(lifecycle_stage);
CREATE INDEX idx_hubspot_contacts_lead_status ON hubspot_contacts(lead_status);
CREATE INDEX idx_hubspot_contacts_extracted_at ON hubspot_contacts(_extracted_at);


-- =====================================================
-- 6. TABELA: hubspot_deals (Negócios)
-- =====================================================
CREATE TABLE hubspot_deals (
    id                  UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    hubspot_id          TEXT            NOT NULL UNIQUE,
    deal_name           TEXT,
    amount              DECIMAL(18,2),
    currency            TEXT            DEFAULT 'BRL',
    close_date          DATE,
    create_date         TIMESTAMPTZ,
    pipeline_id         TEXT,
    pipeline_stage_id   TEXT,
    deal_stage          TEXT,
    deal_type           TEXT,
    owner_id            TEXT,
    contact_id          TEXT,
    company_id          TEXT,
    probability         DECIMAL(5,4),
    forecast_category   TEXT,
    next_step           TEXT,
    description         TEXT,
    created_at          TIMESTAMPTZ,
    updated_at          TIMESTAMPTZ,
    archived            BOOLEAN         DEFAULT FALSE,
    
    -- Coluna JSONB para payload completo
    raw_data            JSONB,
    
    -- Colunas de Auditoria
    _extracted_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    _source_system      TEXT            NOT NULL DEFAULT 'HubSpot'
);

COMMENT ON TABLE hubspot_deals IS 'Negócios (Deals) do HubSpot com payload completo em raw_data';

-- Índices
CREATE INDEX idx_hubspot_deals_hubspot_id ON hubspot_deals(hubspot_id);
CREATE INDEX idx_hubspot_deals_deal_stage ON hubspot_deals(deal_stage);
CREATE INDEX idx_hubspot_deals_pipeline_stage_id ON hubspot_deals(pipeline_stage_id);
CREATE INDEX idx_hubspot_deals_pipeline_id ON hubspot_deals(pipeline_id);
CREATE INDEX idx_hubspot_deals_owner_id ON hubspot_deals(owner_id);
CREATE INDEX idx_hubspot_deals_contact_id ON hubspot_deals(contact_id);
CREATE INDEX idx_hubspot_deals_company_id ON hubspot_deals(company_id);
CREATE INDEX idx_hubspot_deals_close_date ON hubspot_deals(close_date);
CREATE INDEX idx_hubspot_deals_amount ON hubspot_deals(amount);
CREATE INDEX idx_hubspot_deals_extracted_at ON hubspot_deals(_extracted_at);
CREATE INDEX idx_hubspot_deals_raw_data ON hubspot_deals USING GIN (raw_data);


-- =====================================================
-- 7. TABELA: hubspot_line_items (Itens de Linha/Produtos)
-- =====================================================
CREATE TABLE hubspot_line_items (
    id                  UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    hubspot_id          TEXT            NOT NULL UNIQUE,
    deal_id             TEXT,
    product_id          TEXT,
    name                TEXT,
    sku                 TEXT,
    quantity            DECIMAL(18,4),
    unit_price          DECIMAL(18,2),
    amount              DECIMAL(18,2),
    discount            DECIMAL(18,2),
    discount_percentage DECIMAL(5,2),
    currency            TEXT            DEFAULT 'BRL',
    description         TEXT,
    created_at          TIMESTAMPTZ,
    updated_at          TIMESTAMPTZ,
    archived            BOOLEAN         DEFAULT FALSE,
    
    -- Colunas de Auditoria
    _extracted_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    _source_system      TEXT            NOT NULL DEFAULT 'HubSpot'
);

COMMENT ON TABLE hubspot_line_items IS 'Itens de linha (produtos) associados aos deals do HubSpot';

-- Índices
CREATE INDEX idx_hubspot_line_items_hubspot_id ON hubspot_line_items(hubspot_id);
CREATE INDEX idx_hubspot_line_items_deal_id ON hubspot_line_items(deal_id);
CREATE INDEX idx_hubspot_line_items_product_id ON hubspot_line_items(product_id);
CREATE INDEX idx_hubspot_line_items_sku ON hubspot_line_items(sku);
CREATE INDEX idx_hubspot_line_items_extracted_at ON hubspot_line_items(_extracted_at);


-- =====================================================
-- 8. TABELA: hubspot_commissions_obj (Objeto Personalizado de Comissões)
-- =====================================================
CREATE TABLE hubspot_commissions_obj (
    id                      UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    hubspot_id              TEXT            NOT NULL UNIQUE,
    object_type_id          TEXT            DEFAULT '2-45314755',
    name                    TEXT,
    deal_id                 TEXT,
    owner_id                TEXT,
    commission_amount       DECIMAL(18,2),
    commission_percentage   DECIMAL(5,4),
    commission_type         TEXT,
    payment_status          TEXT,
    payment_date            DATE,
    associated_deal_id      TEXT,
    associated_contact_id   TEXT,
    created_at              TIMESTAMPTZ,
    updated_at              TIMESTAMPTZ,
    archived                BOOLEAN         DEFAULT FALSE,
    
    -- Coluna JSONB para propriedades extras
    raw_properties          JSONB,
    
    -- Colunas de Auditoria
    _extracted_at           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    _source_system          TEXT            NOT NULL DEFAULT 'HubSpot'
);

COMMENT ON TABLE hubspot_commissions_obj IS 'Objeto personalizado de Comissões do HubSpot (ID: 2-45314755)';

-- Índices
CREATE INDEX idx_hubspot_commissions_hubspot_id ON hubspot_commissions_obj(hubspot_id);
CREATE INDEX idx_hubspot_commissions_deal_id ON hubspot_commissions_obj(associated_deal_id);
CREATE INDEX idx_hubspot_commissions_owner_id ON hubspot_commissions_obj(owner_id);
CREATE INDEX idx_hubspot_commissions_payment_status ON hubspot_commissions_obj(payment_status);
CREATE INDEX idx_hubspot_commissions_payment_date ON hubspot_commissions_obj(payment_date);
CREATE INDEX idx_hubspot_commissions_extracted_at ON hubspot_commissions_obj(_extracted_at);
CREATE INDEX idx_hubspot_commissions_raw_properties ON hubspot_commissions_obj USING GIN (raw_properties);


-- =====================================================
-- VIEW DE CONTROLE DE EXTRAÇÃO
-- =====================================================
CREATE OR REPLACE VIEW vw_hubspot_extraction_status AS
SELECT 
    'hubspot_owners' AS table_name,
    COUNT(*) AS total_records,
    MAX(_extracted_at) AS last_extraction,
    MIN(_extracted_at) AS first_extraction
FROM hubspot_owners
UNION ALL
SELECT 'hubspot_pipelines', COUNT(*), MAX(_extracted_at), MIN(_extracted_at) FROM hubspot_pipelines
UNION ALL
SELECT 'hubspot_pipeline_stages', COUNT(*), MAX(_extracted_at), MIN(_extracted_at) FROM hubspot_pipeline_stages
UNION ALL
SELECT 'hubspot_companies', COUNT(*), MAX(_extracted_at), MIN(_extracted_at) FROM hubspot_companies
UNION ALL
SELECT 'hubspot_contacts', COUNT(*), MAX(_extracted_at), MIN(_extracted_at) FROM hubspot_contacts
UNION ALL
SELECT 'hubspot_deals', COUNT(*), MAX(_extracted_at), MIN(_extracted_at) FROM hubspot_deals
UNION ALL
SELECT 'hubspot_line_items', COUNT(*), MAX(_extracted_at), MIN(_extracted_at) FROM hubspot_line_items
UNION ALL
SELECT 'hubspot_commissions_obj', COUNT(*), MAX(_extracted_at), MIN(_extracted_at) FROM hubspot_commissions_obj
ORDER BY table_name;

COMMENT ON VIEW vw_hubspot_extraction_status IS 'View de monitoramento do status de extração das tabelas HubSpot';


-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
