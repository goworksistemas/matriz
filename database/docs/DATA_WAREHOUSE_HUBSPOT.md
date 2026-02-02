# 📊 Data Warehouse HubSpot - Documentação Completa

**Projeto:** Central Dashboards  
**Banco de Dados:** Supabase (PostgreSQL)  
**Fonte de Dados:** HubSpot CRM  
**Data de Criação:** Janeiro 2026  
**Última Atualização:** 26/01/2026

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Tabelas Disponíveis](#tabelas-disponíveis)
4. [Dicionário de Dados](#dicionário-de-dados)
5. [Relacionamentos (Foreign Keys)](#relacionamentos-foreign-keys)
6. [Volume de Dados](#volume-de-dados)
7. [Campos Especiais](#campos-especiais)
8. [Queries Úteis para Dashboards](#queries-úteis-para-dashboards)
9. [Conexão com o Banco](#conexão-com-o-banco)

---

## 🎯 Visão Geral

Este Data Warehouse centraliza dados do **HubSpot CRM** em um banco PostgreSQL (Supabase). Os dados são extraídos via API do HubSpot e carregados através de um processo ETL em Python (Jupyter Notebook).

### Regra de Ouro: Segregação por Fonte
Todas as tabelas possuem o prefixo `hubspot_` para identificar a origem dos dados.

### Características Principais
- **Idempotência**: Upsert baseado no `hubspot_id` evita duplicatas
- **UUID**: Cada registro possui um `id` UUID único gerado automaticamente
- **Auditoria**: Todas as tabelas possuem `_extracted_at` e `_source_system`
- **JSONB**: Tabelas de deals e comissões possuem colunas para payload completo

---

## 🏗️ Arquitetura

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   HubSpot API   │────▶│   ETL Python    │────▶│    Supabase     │
│                 │     │   (Notebook)    │     │   PostgreSQL    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                                                ┌─────────────────┐
                                                │   Power BI /    │
                                                │   Dashboards    │
                                                └─────────────────┘
```

---

## 📦 Tabelas Disponíveis

| # | Tabela | Descrição | Registros* |
|---|--------|-----------|------------|
| 1 | `hubspot_owners` | Proprietários/Vendedores do HubSpot | 47 |
| 2 | `hubspot_pipelines` | Definições de Pipelines | 16 |
| 3 | `hubspot_pipeline_stages` | Etapas/Stages dos Pipelines | 163 |
| 4 | `hubspot_contacts` | Contatos (Leads/Clientes) | 97.415 |
| 5 | `hubspot_deals` | Negócios/Oportunidades | 71.488 |
| 6 | `hubspot_line_items` | Itens de linha (Produtos nos deals) | 4.148 |
| 7 | `hubspot_commissions_obj` | Objeto personalizado de Comissões | ~variável |
| 8 | `hubspot_companies` | Empresas (não populada - opcional) | 0 |

*Volume aproximado da última extração (26/01/2026)

---

## 📖 Dicionário de Dados

### 1. `hubspot_owners` (Proprietários/Vendedores)

Contém os usuários/vendedores do HubSpot que podem ser donos de deals, contacts, etc.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | Chave primária (gerada automaticamente) |
| `hubspot_id` | TEXT | ID único do HubSpot (chave de negócio) |
| `email` | TEXT | E-mail do proprietário |
| `first_name` | TEXT | Primeiro nome |
| `last_name` | TEXT | Sobrenome |
| `user_id` | TEXT | ID do usuário no HubSpot |
| `team_id` | TEXT | ID do time |
| `created_at` | TIMESTAMPTZ | Data de criação no HubSpot |
| `updated_at` | TIMESTAMPTZ | Data de última atualização |
| `archived` | BOOLEAN | Se está arquivado |
| `_extracted_at` | TIMESTAMPTZ | Timestamp da extração ETL |
| `_source_system` | TEXT | Sempre 'HubSpot' |

**Índices:** `hubspot_id`, `email`

---

### 2. `hubspot_pipelines` (Pipelines)

Definições dos pipelines de vendas/tickets.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | Chave primária |
| `hubspot_id` | TEXT | ID único do pipeline no HubSpot |
| `label` | TEXT | Nome do pipeline |
| `display_order` | INTEGER | Ordem de exibição |
| `object_type` | TEXT | Tipo de objeto (deals, tickets, etc.) |
| `created_at` | TIMESTAMPTZ | Data de criação |
| `updated_at` | TIMESTAMPTZ | Data de atualização |
| `archived` | BOOLEAN | Se está arquivado |
| `_extracted_at` | TIMESTAMPTZ | Timestamp da extração |
| `_source_system` | TEXT | Sempre 'HubSpot' |

**Índices:** `hubspot_id`, `object_type`

---

### 3. `hubspot_pipeline_stages` (Etapas dos Pipelines)

Stages/etapas dentro de cada pipeline.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | Chave primária |
| `stage_id` | TEXT | ID único do stage no HubSpot |
| `pipeline_id` | TEXT | ID do pipeline pai (FK) |
| `label` | TEXT | Nome da etapa |
| `display_order` | INTEGER | Ordem de exibição |
| `probability` | DECIMAL(5,4) | Probabilidade de fechamento |
| `is_closed` | BOOLEAN | Se é uma etapa fechada |
| `is_won` | BOOLEAN | Se é uma etapa de ganho |
| `created_at` | TIMESTAMPTZ | Data de criação |
| `updated_at` | TIMESTAMPTZ | Data de atualização |
| `archived` | BOOLEAN | Se está arquivado |
| `_extracted_at` | TIMESTAMPTZ | Timestamp da extração |
| `_source_system` | TEXT | Sempre 'HubSpot' |

**Índices:** `stage_id`, `pipeline_id`, `is_closed`

---

### 4. `hubspot_contacts` (Contatos)

Contatos/leads do CRM.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | Chave primária |
| `hubspot_id` | TEXT | ID único do contato no HubSpot |
| `email` | TEXT | E-mail do contato |
| `first_name` | TEXT | Primeiro nome |
| `last_name` | TEXT | Sobrenome |
| `phone` | TEXT | Telefone fixo |
| `mobile_phone` | TEXT | Celular |
| `job_title` | TEXT | Cargo |
| `company_id` | TEXT | ID da empresa associada |
| `lifecycle_stage` | TEXT | Estágio do ciclo de vida |
| `lead_status` | TEXT | Status do lead |
| `owner_id` | TEXT | ID do proprietário (FK → owners) |
| `city` | TEXT | Cidade |
| `state` | TEXT | Estado |
| `country` | TEXT | País |
| `postal_code` | TEXT | CEP |
| `created_at` | TIMESTAMPTZ | Data de criação |
| `updated_at` | TIMESTAMPTZ | Data de atualização |
| `archived` | BOOLEAN | Se está arquivado |
| `_extracted_at` | TIMESTAMPTZ | Timestamp da extração |
| `_source_system` | TEXT | Sempre 'HubSpot' |

**Índices:** `hubspot_id`, `email`, `company_id`, `owner_id`, `lifecycle_stage`, `lead_status`

---

### 5. `hubspot_deals` (Negócios) ⭐ TABELA PRINCIPAL

Negócios/oportunidades de venda. **Tabela mais importante para dashboards de comissão.**

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | Chave primária |
| `hubspot_id` | TEXT | ID único do deal no HubSpot |
| `deal_name` | TEXT | Nome do negócio |
| `amount` | DECIMAL(18,2) | **Valor do negócio (R$)** |
| `currency` | TEXT | Moeda (default: BRL) |
| `close_date` | DATE | **Data de fechamento** |
| `create_date` | TIMESTAMPTZ | Data de criação do deal |
| `pipeline_id` | TEXT | ID do pipeline (FK) |
| `pipeline_stage_id` | TEXT | ID do stage atual (FK) |
| `deal_stage` | TEXT | Nome/código do stage |
| `deal_type` | TEXT | Tipo do negócio |
| `owner_id` | TEXT | **ID do vendedor responsável (FK)** |
| `contact_id` | TEXT | ID do contato principal (FK) |
| `company_id` | TEXT | ID da empresa |
| `probability` | DECIMAL(5,4) | Probabilidade de fechamento |
| `forecast_category` | TEXT | Categoria de forecast |
| `next_step` | TEXT | Próximo passo |
| `description` | TEXT | Descrição |
| `created_at` | TIMESTAMPTZ | Data de criação |
| `updated_at` | TIMESTAMPTZ | Data de atualização |
| `archived` | BOOLEAN | Se está arquivado |
| `raw_data` | JSONB | **Payload completo com todas as properties** |
| `_extracted_at` | TIMESTAMPTZ | Timestamp da extração |
| `_source_system` | TEXT | Sempre 'HubSpot' |

**Índices:** `hubspot_id`, `deal_stage`, `pipeline_stage_id`, `pipeline_id`, `owner_id`, `contact_id`, `company_id`, `close_date`, `amount`, `raw_data` (GIN)

**⚠️ IMPORTANTE - Coluna `raw_data`:**
Contém o JSON completo do HubSpot com TODAS as properties, incluindo campos customizados. Use para extrair propriedades que não estão nas colunas fixas:

```sql
-- Exemplo: extrair campo customizado do raw_data
SELECT 
    deal_name,
    amount,
    raw_data->>'produto' as produto,
    raw_data->>'segmento' as segmento,
    raw_data->>'unidade' as unidade
FROM hubspot_deals;
```

---

### 6. `hubspot_line_items` (Itens de Linha)

Produtos/itens associados aos deals.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | Chave primária |
| `hubspot_id` | TEXT | ID único do line item |
| `deal_id` | TEXT | ID do deal associado (FK) |
| `product_id` | TEXT | ID do produto |
| `name` | TEXT | Nome do produto/item |
| `sku` | TEXT | SKU do produto |
| `quantity` | DECIMAL(18,4) | Quantidade |
| `unit_price` | DECIMAL(18,2) | Preço unitário |
| `amount` | DECIMAL(18,2) | Valor total do item |
| `discount` | DECIMAL(18,2) | Desconto em valor |
| `discount_percentage` | DECIMAL(5,2) | Desconto em % |
| `currency` | TEXT | Moeda |
| `description` | TEXT | Descrição |
| `created_at` | TIMESTAMPTZ | Data de criação |
| `updated_at` | TIMESTAMPTZ | Data de atualização |
| `archived` | BOOLEAN | Se está arquivado |
| `_extracted_at` | TIMESTAMPTZ | Timestamp da extração |
| `_source_system` | TEXT | Sempre 'HubSpot' |

**Índices:** `hubspot_id`, `deal_id`, `product_id`, `sku`

---

### 7. `hubspot_commissions_obj` (Comissões) ⭐ OBJETO CUSTOMIZADO

Objeto personalizado de comissões do HubSpot (ID: `2-45314755`).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | Chave primária |
| `hubspot_id` | TEXT | ID único da comissão |
| `object_type_id` | TEXT | Sempre '2-45314755' |
| `name` | TEXT | Nome/descrição da comissão |
| `deal_id` | TEXT | ID do deal relacionado |
| `owner_id` | TEXT | ID do proprietário (FK) |
| `commission_amount` | DECIMAL(18,2) | Valor da comissão |
| `commission_percentage` | DECIMAL(5,4) | Percentual de comissão |
| `commission_type` | TEXT | Tipo de comissão |
| `payment_status` | TEXT | Status do pagamento |
| `payment_date` | DATE | Data do pagamento |
| `associated_deal_id` | TEXT | ID do deal associado |
| `associated_contact_id` | TEXT | ID do contato associado |
| `created_at` | TIMESTAMPTZ | Data de criação |
| `updated_at` | TIMESTAMPTZ | Data de atualização |
| `archived` | BOOLEAN | Se está arquivado |
| `raw_properties` | JSONB | **Payload completo das properties** |
| `_extracted_at` | TIMESTAMPTZ | Timestamp da extração |
| `_source_system` | TEXT | Sempre 'HubSpot' |

**Índices:** `hubspot_id`, `associated_deal_id`, `owner_id`, `payment_status`, `payment_date`, `raw_properties` (GIN)

---

## 🔗 Relacionamentos (Foreign Keys)

```
hubspot_owners
     │
     ├──────────────────────────────────────┐
     │                                      │
     ▼                                      ▼
hubspot_contacts ─────────────────▶ hubspot_deals
  (owner_id)                         (owner_id, contact_id)
                                           │
                                           │
     ┌─────────────────────────────────────┤
     │                                     │
     ▼                                     ▼
hubspot_pipelines ──────▶ hubspot_pipeline_stages
     │                         │
     │                         │
     └─────────────────────────┴──────▶ hubspot_deals
                                         (pipeline_id, pipeline_stage_id)
                                               │
                                               ▼
                                    hubspot_line_items
                                         (deal_id)

hubspot_commissions_obj
     (owner_id → hubspot_owners)
```

### Lista de Foreign Keys

| Tabela Origem | Coluna | Tabela Destino | Coluna Destino |
|---------------|--------|----------------|----------------|
| `hubspot_contacts` | `owner_id` | `hubspot_owners` | `hubspot_id` |
| `hubspot_deals` | `owner_id` | `hubspot_owners` | `hubspot_id` |
| `hubspot_deals` | `contact_id` | `hubspot_contacts` | `hubspot_id` |
| `hubspot_deals` | `pipeline_id` | `hubspot_pipelines` | `hubspot_id` |
| `hubspot_deals` | `pipeline_stage_id` | `hubspot_pipeline_stages` | `stage_id` |
| `hubspot_line_items` | `deal_id` | `hubspot_deals` | `hubspot_id` |
| `hubspot_pipeline_stages` | `pipeline_id` | `hubspot_pipelines` | `hubspot_id` |
| `hubspot_commissions_obj` | `owner_id` | `hubspot_owners` | `hubspot_id` |

**Comportamento:** Todas as FKs usam `ON DELETE SET NULL` - se o registro pai for deletado, a FK fica NULL.

---

## 📊 Volume de Dados

Última extração: **26/01/2026**

| Tabela | Registros |
|--------|-----------|
| `hubspot_owners` | 47 |
| `hubspot_pipelines` | 16 |
| `hubspot_pipeline_stages` | 163 |
| `hubspot_contacts` | 97.415 |
| `hubspot_deals` | 71.488 |
| `hubspot_line_items` | 4.148 |
| `hubspot_commissions_obj` | Variável |
| **TOTAL** | **~173.277** |

---

## 🔧 Campos Especiais

### Colunas de Auditoria (presentes em TODAS as tabelas)

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `_extracted_at` | TIMESTAMPTZ | Quando o registro foi extraído/atualizado pelo ETL |
| `_source_system` | TEXT | Sempre 'HubSpot' - identifica a origem |

### Colunas JSONB (payload completo)

| Tabela | Coluna | Uso |
|--------|--------|-----|
| `hubspot_deals` | `raw_data` | Todas as properties do deal (campos customizados) |
| `hubspot_commissions_obj` | `raw_properties` | Todas as properties da comissão |

**Como acessar campos no JSONB:**
```sql
-- Operador ->> retorna TEXT
SELECT raw_data->>'campo_customizado' FROM hubspot_deals;

-- Operador -> retorna JSON (para campos aninhados)
SELECT raw_data->'objeto'->'subcampo' FROM hubspot_deals;
```

---

## 📈 Queries Úteis para Dashboards

### 1. Total de Vendas por Vendedor
```sql
SELECT 
    o.first_name || ' ' || o.last_name AS vendedor,
    o.email,
    COUNT(d.id) AS total_deals,
    SUM(d.amount) AS valor_total,
    AVG(d.amount) AS ticket_medio
FROM hubspot_deals d
LEFT JOIN hubspot_owners o ON d.owner_id = o.hubspot_id
WHERE d.archived = false
GROUP BY o.hubspot_id, o.first_name, o.last_name, o.email
ORDER BY valor_total DESC;
```

### 2. Deals por Pipeline e Stage
```sql
SELECT 
    p.label AS pipeline,
    ps.label AS stage,
    ps.is_closed,
    ps.is_won,
    COUNT(d.id) AS qtd_deals,
    SUM(d.amount) AS valor_total
FROM hubspot_deals d
LEFT JOIN hubspot_pipelines p ON d.pipeline_id = p.hubspot_id
LEFT JOIN hubspot_pipeline_stages ps ON d.pipeline_stage_id = ps.stage_id
WHERE d.archived = false
GROUP BY p.label, ps.label, ps.is_closed, ps.is_won, ps.display_order
ORDER BY p.label, ps.display_order;
```

### 3. Vendas por Período
```sql
SELECT 
    DATE_TRUNC('month', d.close_date) AS mes,
    COUNT(d.id) AS qtd_deals,
    SUM(d.amount) AS valor_total
FROM hubspot_deals d
WHERE d.close_date IS NOT NULL
  AND d.archived = false
GROUP BY DATE_TRUNC('month', d.close_date)
ORDER BY mes DESC;
```

### 4. Deals Ganhos vs Perdidos
```sql
SELECT 
    CASE 
        WHEN ps.is_won = true THEN 'Ganho'
        WHEN ps.is_closed = true AND ps.is_won = false THEN 'Perdido'
        ELSE 'Em Andamento'
    END AS status,
    COUNT(d.id) AS qtd,
    SUM(d.amount) AS valor
FROM hubspot_deals d
LEFT JOIN hubspot_pipeline_stages ps ON d.pipeline_stage_id = ps.stage_id
WHERE d.archived = false
GROUP BY status;
```

### 5. Comissões por Vendedor
```sql
SELECT 
    o.first_name || ' ' || o.last_name AS vendedor,
    c.payment_status,
    COUNT(c.id) AS qtd_comissoes,
    SUM(c.commission_amount) AS total_comissao
FROM hubspot_commissions_obj c
LEFT JOIN hubspot_owners o ON c.owner_id = o.hubspot_id
WHERE c.archived = false
GROUP BY o.hubspot_id, o.first_name, o.last_name, c.payment_status
ORDER BY total_comissao DESC;
```

### 6. Extrair Campos Customizados do raw_data
```sql
SELECT 
    deal_name,
    amount,
    close_date,
    raw_data->>'produto' AS produto,
    raw_data->>'segmento' AS segmento,
    raw_data->>'unidade' AS unidade,
    raw_data->>'urgencia' AS urgencia,
    raw_data->>'e_venda_de_impacto_' AS venda_impacto
FROM hubspot_deals
WHERE raw_data IS NOT NULL
LIMIT 100;
```

### 7. Line Items por Deal
```sql
SELECT 
    d.deal_name,
    d.amount AS valor_deal,
    li.name AS produto,
    li.quantity,
    li.unit_price,
    li.amount AS valor_item
FROM hubspot_deals d
JOIN hubspot_line_items li ON li.deal_id = d.hubspot_id
WHERE d.archived = false
ORDER BY d.deal_name;
```

---

## 🔌 Conexão com o Banco

### Credenciais Supabase

| Parâmetro | Valor |
|-----------|-------|
| **URL** | `https://xggqzueehfvautkmaojy.supabase.co` |
| **Host** | `db.xggqzueehfvautkmaojy.supabase.co` |
| **Porta** | `5432` |
| **Database** | `postgres` |

### Connection String (Power BI / BI Tools)
```
Host: db.xggqzueehfvautkmaojy.supabase.co
Port: 5432
Database: postgres
SSL Mode: require
```

### Python (supabase-py)
```python
from supabase import create_client

url = "https://xggqzueehfvautkmaojy.supabase.co"
key = "SUA_SERVICE_ROLE_KEY"
supabase = create_client(url, key)

# Consulta
data = supabase.table("hubspot_deals").select("*").limit(100).execute()
```

---

## 📂 Arquivos do Projeto

| Arquivo | Descrição |
|---------|-----------|
| `sql/hubspot_ddl.sql` | DDL completo para criar as tabelas |
| `sql/add_foreign_keys.sql` | Script para adicionar Foreign Keys |
| `sql/enable_rls.sql` | Script para habilitar Row Level Security |
| `sql/limpar_tabelas.sql` | Script para limpar (TRUNCATE) todas as tabelas |
| `códigos/etl_hubspot_supabase.ipynb` | Notebook Python para ETL HubSpot → Supabase |

---

## ✅ Resumo para a IA de Power BI

**Tabelas principais para Dashboard de Comissões:**

1. **`hubspot_deals`** - Negócios com valores, datas e vendedor responsável
2. **`hubspot_owners`** - Vendedores (JOIN via `owner_id`)
3. **`hubspot_pipeline_stages`** - Status do deal (ganho/perdido/andamento)
4. **`hubspot_commissions_obj`** - Comissões do objeto customizado
5. **`hubspot_line_items`** - Produtos vendidos em cada deal

**Campos-chave para comissões:**
- `hubspot_deals.amount` - Valor do negócio
- `hubspot_deals.close_date` - Data de fechamento
- `hubspot_deals.owner_id` → `hubspot_owners` - Quem vendeu
- `hubspot_pipeline_stages.is_won` - Se o deal foi ganho
- `hubspot_commissions_obj.commission_amount` - Valor da comissão
- `hubspot_deals.raw_data` - Campos customizados em JSON

---

**Documentação criada em:** 27/01/2026  
**Autor:** Data Engineering Team
