# Documentação de Dados — Dashboard GoWork

## 1. Conexão Supabase

```
URL: https://xggqzueehfvautkmaojy.supabase.co
SERVICE ROLE KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZ3F6dWVlaGZ2YXV0a21hb2p5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTE5ODI0NSwiZXhwIjoyMDg0Nzc0MjQ1fQ.VfB3yazurvRfPNyfRZK3vYijUu3pPUebixpwAsni-ho
```

- A key fornecida é **service_role** (bypassa RLS). Use como `ANON_KEY` no client do Supabase para simplificar.
- Não há autenticação de usuário implementada. O dashboard consome direto as tabelas.

---

## 2. Schema do Banco (Tabelas Relevantes)

O banco já existe e já contém dados. As tabelas a seguir são as que alimentam o dashboard.

### 2.1. `hubspot_owners` (Vendedores/Responsáveis)

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid (PK) | ID interno Supabase |
| `hubspot_id` | text (UNIQUE) | ID do owner no HubSpot. **Usado como FK nas demais tabelas.** |
| `email` | text | Email do vendedor (ex: `bpm2@gowork.com.br`) |
| `first_name` | text | Nome |
| `last_name` | text | Sobrenome |
| `archived` | boolean | Se foi arquivado (filtrar `= false`) |

**Volume:** ~44 registros.

**Exemplo de registro:**
```json
{
  "hubspot_id": "79118262",
  "email": "bpm2@gowork.com.br",
  "first_name": "Gabriel",
  "last_name": "Galdino da Silva",
  "archived": false
}
```

---

### 2.2. `hubspot_deals` (Negócios/Vendas)

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid (PK) | ID interno Supabase |
| `hubspot_id` | text (UNIQUE) | ID do deal no HubSpot |
| `deal_name` | text | Nome do negócio |
| `amount` | numeric | Valor do deal. **ATENÇÃO: frequentemente é `null`.** |
| `currency` | text | Sempre `"BRL"` |
| `close_date` | date | Data de fechamento (formato `YYYY-MM-DD`) |
| `create_date` | timestamptz | Data de criação |
| `pipeline_id` | text (FK) | Referencia `hubspot_pipelines.hubspot_id` |
| `pipeline_stage_id` | text (FK) | Referencia `hubspot_pipeline_stages.stage_id` |
| `owner_id` | text (FK) | Referencia `hubspot_owners.hubspot_id` |
| `contact_id` | text (FK) | Referencia `hubspot_contacts.hubspot_id` |
| `archived` | boolean | Filtrar `= false` |
| `raw_data` | jsonb | **Contém o campo crítico `hs_is_closed_won`.** Ver seção 4. |

**Volume:** 100+ registros no export, potencialmente milhares no banco real.

**Exemplo de registro:**
```json
{
  "hubspot_id": "18820095018",
  "deal_name": "CRISTIANE BERNARDI ELIAS CORRETORA DE SEGUROS LTDA",
  "amount": "225.00",
  "close_date": "2024-05-06",
  "pipeline_id": "22135358",
  "pipeline_stage_id": "78824249",
  "owner_id": "305092879",
  "archived": false,
  "raw_data": "{\"amount\": \"225\", \"hs_is_closed_won\": \"true\", ...}"
}
```

---

### 2.3. `hubspot_line_items` (Itens de Linha / Produtos do Deal)

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid (PK) | ID interno |
| `hubspot_id` | text (UNIQUE) | ID do item no HubSpot |
| `deal_id` | text (FK) | Referencia `hubspot_deals.hubspot_id` |
| `product_id` | text | ID do produto |
| `name` | text | Nome do produto (ex: `"Sala Privativa - Seats"`, `"Endereço fiscal"`, `"Homeflex"`) |
| `quantity` | numeric | Quantidade |
| `unit_price` | numeric | Preço unitário |
| `amount` | numeric | Valor total do item (`quantity * unit_price`). **Mais confiável que `deals.amount`.** |
| `currency` | text | Sempre `"BRL"` |
| `archived` | boolean | Filtrar `= false` |

**Volume:** 100+ registros no export.

**Relação com deals:** `line_items.deal_id = deals.hubspot_id`. Um deal pode ter vários line items.

**Exemplo:**
```json
{
  "deal_id": "41581576547",
  "name": "Sala Privativa - Seats",
  "quantity": "6.0000",
  "unit_price": "900.00",
  "amount": "5400.00"
}
```

---

### 2.4. `hubspot_contacts` (Contatos/Leads)

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid (PK) | ID interno |
| `hubspot_id` | text (UNIQUE) | ID no HubSpot |
| `email` | text | Email (pode ser `null`) |
| `first_name` | text | Nome (pode ser vazio `""`) |
| `last_name` | text | Sobrenome |
| `phone` | text | Telefone |
| `lifecycle_stage` | text | **Estágio do lead no funil.** Ver valores possíveis abaixo. |
| `lead_status` | text | Status do lead (geralmente `null`) |
| `owner_id` | text (FK) | Referencia `hubspot_owners.hubspot_id` |
| `created_at` | timestamptz | Data de criação do contato |
| `archived` | boolean | Filtrar `= false` |

**Volume:** 100+ no export, potencialmente milhares no banco.

**Valores de `lifecycle_stage` encontrados nos dados:**

| Valor | Significado |
|---|---|
| `"lead"` | Lead bruto (maioria dos registros) |
| `"opportunity"` | Oportunidade de venda |
| `"customer"` | Cliente convertido |
| `"165518199"` | **ID customizado no HubSpot** (estágio personalizado — tratar como "outro/qualificado") |
| `null` | Sem estágio definido |

**Regra de negócio para "Leads Válidos":** Considerar como leads qualificados aqueles com `lifecycle_stage` diferente de `"lead"` e diferente de `null`. Ou seja: `"opportunity"`, `"customer"`, `"165518199"`, `"marketingqualifiedlead"`, `"salesqualifiedlead"` (estes dois últimos são padrões do HubSpot que podem aparecer).

---

### 2.5. `hubspot_commissions_obj` (Comissões dos Vendedores)

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid (PK) | ID interno |
| `hubspot_id` | text (UNIQUE) | ID no HubSpot |
| `name` | text | Nome do cliente na comissão (ex: `"CI-244 STEFANO CHINAGLIA LETA"`) |
| `owner_id` | text (FK) | **Vendedor dono da comissão.** Referencia `hubspot_owners.hubspot_id` |
| `commission_amount` | numeric | **Valor da comissão em R$.** (ex: `1600.00`, `150.00`) |
| `commission_percentage` | numeric | Percentual de comissão (ex: `0.1000` = 10%) |
| `commission_type` | text | Tipo do produto vendido. Ver valores abaixo. |
| `payment_status` | text | Status do pagamento. Ver valores abaixo. |
| `payment_date` | date | Data de pagamento (geralmente `null`) |
| `created_at` | timestamptz | Data de criação |
| `archived` | boolean | Filtrar `= false` |
| `raw_properties` | jsonb | JSON com dados extras (double-stringified). Contém `valor_do_negocio`, `posicoes`, `status_financeiro`, `status_comercial`, `status_juridico`, `sdr_responsavel`, `venda_de_impacto_`, etc. |

**Volume:** 100+ no export, potencialmente milhares no banco.

**Valores de `commission_type` encontrados:**
- `"Sala Privativa"`
- `"Open Space"`
- `"Plano - Virtual Office Pro - Startup"`
- (outros tipos de produto)

**Valores de `payment_status`:**
- `"Aprovado"` — comissão aprovada
- `"Aguardando"` — aguardando aprovação

**Exemplo:**
```json
{
  "hubspot_id": "30224532375",
  "name": "CI-244 STEFANO CHINAGLIA LETA",
  "owner_id": "305092886",
  "commission_amount": "1600.00",
  "commission_percentage": "0.1000",
  "commission_type": "Sala Privativa",
  "payment_status": "Aprovado"
}
```

---

### 2.6. `hubspot_pipelines` (Funis de Venda)

| Coluna | Tipo | Descrição |
|---|---|---|
| `hubspot_id` | text (UNIQUE) | ID do pipeline |
| `label` | text | Nome do funil |
| `object_type` | text | Sempre `"deals"` |
| `archived` | boolean | Filtrar `= false` |

**Volume:** 16 registros.

**Lista completa de pipelines:**

| hubspot_id | label |
|---|---|
| `58380811` | Sala de Reunião |
| `104051883` | Customer Success |
| `690758678` | GoWork - Virtual |
| `691247722` | GoWork - GoCorporate |
| `22099637` | Sala Privativa |
| `29266727` | Parcerias |
| `22800792` | Pipe provisório SDR's |
| `687501986` | GoWork - Vendas |
| `75e28846-ad0d-4be2-a027-5e1da6590b98` | Ecommerce Pipeline |
| `27489448` | Outbound |
| `22135358` | Coworking Open |
| `22465693` | Virtual |
| `58039868` | GoWork - Pós Venda |
| `default` | Pipe BTG |
| `58305027` | Eventos Internos |
| `96781394` | Funil de Vendas |

---

### 2.7. `hubspot_pipeline_stages` (Estágios dos Funis)

| Coluna | Tipo | Descrição |
|---|---|---|
| `stage_id` | text (UNIQUE) | ID do estágio. **Referenciado por `deals.pipeline_stage_id`.** |
| `pipeline_id` | text (FK) | Referencia `hubspot_pipelines.hubspot_id` |
| `label` | text | Nome do estágio (ex: `"Negociação Quente"`, `"Proposta enviada"`) |
| `is_closed` | boolean | Se é um estágio "fechado" |
| `is_won` | boolean | Se é um estágio "ganho" |
| `archived` | boolean | Filtrar `= false` |

**Volume:** 100+ estágios distribuídos entre os 16 pipelines.

---

## 3. Tabela Adicional (Precisa Criar)

### `sales_goals` (Metas de Vendas)

Esta tabela **NÃO existe** no banco e precisa ser criada manualmente. Execute o SQL abaixo no **Supabase SQL Editor**:

```sql
CREATE TABLE IF NOT EXISTS public.sales_goals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  year integer NOT NULL CHECK (year >= 2020),
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  monthly_goal numeric NOT NULL DEFAULT 0,
  annual_goal numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT sales_goals_pkey PRIMARY KEY (id),
  CONSTRAINT sales_goals_year_month_unique UNIQUE (year, month)
);

CREATE INDEX IF NOT EXISTS idx_sales_goals_year_month ON public.sales_goals (year, month);

ALTER TABLE public.sales_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to sales_goals" ON public.sales_goals
  FOR ALL USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION update_sales_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sales_goals_updated_at
  BEFORE UPDATE ON public.sales_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_sales_goals_updated_at();
```

**Uso:** O dashboard faz `upsert` nesta tabela usando `onConflict: 'year,month'`. O usuário edita a meta mensal e anual em inputs numéricos, e o valor é salvo automaticamente.

---

## 4. Regras de Negócio Críticas e Armadilhas dos Dados

### 4.1. Como identificar um Deal "Ganho" (CRÍTICO)

A tabela `hubspot_pipeline_stages` tem os campos `is_won` e `is_closed`, porém **TODOS os registros estão com `is_won = false` e `is_closed = false`**. Esses campos não foram populados corretamente na extração.

A informação real de "deal ganho" está **dentro do campo `raw_data` (jsonb)** da tabela `hubspot_deals`, no atributo `hs_is_closed_won`.

**Como acessar:**

O `raw_data` é um campo JSONB que armazena uma **string JSON** (double-stringified). Ou seja, o valor no banco é:

```
"{\"amount\": \"225\", \"hs_is_closed_won\": \"true\", ...}"
```

Quando o Supabase Client retorna isso em JavaScript, o valor é uma string:

```javascript
deal.raw_data = '{"amount": "225", "hs_is_closed_won": "true", ...}'
```

**Lógica para verificar se é ganho:**

```javascript
function isDealWon(rawData) {
  try {
    let str = String(rawData || '')
    // Trata caso de double-stringify
    if (str.startsWith('"')) {
      str = JSON.parse(str)
    }
    const obj = JSON.parse(str)
    return obj.hs_is_closed_won === 'true'  // string "true", não booleano
  } catch {
    return false
  }
}
```

**Valores possíveis de `hs_is_closed_won`:**
- `"true"` — deal ganho/fechado com sucesso
- `"false"` — deal não ganho (em aberto ou perdido)

**NÃO** confie em `pipeline_stages.is_won`. Use **sempre** o `raw_data.hs_is_closed_won`.

---

### 4.2. Valor do Deal (`amount`)

Muitos deals têm `amount = null`. Para obter o valor real de um deal, use a seguinte prioridade:

1. Se `deals.amount` não é null e > 0, use esse valor.
2. Senão, **some os `amount` de `hubspot_line_items`** onde `line_items.deal_id = deals.hubspot_id`.

```
Valor do Deal = deals.amount ?? SUM(line_items.amount WHERE deal_id = deal.hubspot_id)
```

---

### 4.3. Relacionamentos entre Tabelas (FKs)

```
hubspot_owners.hubspot_id
  ├── hubspot_deals.owner_id
  ├── hubspot_contacts.owner_id
  └── hubspot_commissions_obj.owner_id

hubspot_deals.hubspot_id
  ├── hubspot_line_items.deal_id
  └── hubspot_deals.contact_id → hubspot_contacts.hubspot_id

hubspot_pipelines.hubspot_id
  └── hubspot_pipeline_stages.pipeline_id

hubspot_pipeline_stages.stage_id
  └── hubspot_deals.pipeline_stage_id
```

**Todas as FKs usam o campo `hubspot_id` (text)**, não o `id` (uuid).

---

### 4.4. Campo `raw_properties` da tabela `hubspot_commissions_obj`

Também é **double-stringified** (JSONB armazenando string JSON). Contém:

| Campo interno | Descrição |
|---|---|
| `valor_do_negocio` | Valor total do negócio (string numérica) |
| `item` | Tipo do produto |
| `posicoes` | Número de posições vendidas |
| `porcentagem` | Percentual de comissão (ex: `"0.1"`) |
| `status_financeiro` | `"Aprovado"` ou `"Aguardando"` |
| `status_comercial` | `"Aprovado"` ou `"Aguardando"` |
| `status_juridico` | `"Aprovado"` ou `"Aguardando"` |
| `nome_do_cliente` | Nome do cliente |
| `sdr_responsavel` | Email do SDR responsável |
| `venda_de_impacto_` | `"SIM"` ou `"NÃO"` |
| `data_de_fechamento` | Timestamp ISO da data de fechamento |

---

### 4.5. Lifecycle Stage customizado

O HubSpot da GoWork tem um lifecycle_stage customizado com ID `"165518199"`. Esse valor aparece como string numérica no campo `lifecycle_stage` de `hubspot_contacts`. Trate-o como um estágio qualificado (equivalente a MQL/SQL).

---

## 5. Paginação do Supabase (IMPORTANTE)

O Supabase retorna **no máximo 1000 linhas por query** (configuração padrão do PostgREST). As tabelas maiores excedem esse limite.

**Solução:** Usar `.range(from, to)` em um loop:

```javascript
async function fetchAllPaginated(tableName, select, filters) {
  const allRows = []
  const pageSize = 1000
  let from = 0

  while (true) {
    let query = supabase.from(tableName).select(select).range(from, from + pageSize - 1)
    if (filters) query = filters(query)
    const { data, error } = await query
    if (error) throw error
    if (!data || data.length === 0) break
    allRows.push(...data)
    if (data.length < pageSize) break
    from += pageSize
  }

  return allRows
}
```

**Tabelas que precisam de paginação:**
- `hubspot_contacts` — potencialmente milhares de registros
- `hubspot_commissions_obj` — potencialmente milhares
- `hubspot_deals` — potencialmente milhares
- `hubspot_line_items` — potencialmente milhares

**Tabelas que NÃO precisam (< 1000 registros):**
- `hubspot_owners` (~44 registros)
- `hubspot_pipelines` (16 registros)
- `hubspot_pipeline_stages` (~100+ registros)
- `sales_goals` (máximo 12 por ano)

---

## 6. Real-time (Supabase Channels)

Para escutar mudanças em tempo real em uma tabela:

```javascript
const channel = supabase
  .channel('nome-do-canal')
  .on(
    'postgres_changes',
    {
      event: '*',         // INSERT, UPDATE, DELETE, ou * para todos
      schema: 'public',
      table: 'hubspot_commissions_obj',
    },
    (payload) => {
      // Recarregar dados quando houver mudança
    },
  )
  .subscribe()

// Para limpar:
supabase.removeChannel(channel)
```

**Tabela recomendada para real-time:** `hubspot_commissions_obj` (para o ranking de comissões se atualizar automaticamente quando uma nova comissão é inserida).

---

## 7. Métricas do Dashboard (Regras de Cálculo)

### 7.1. Dashboard de Vendas

| Métrica | Cálculo |
|---|---|
| **Total Vendido (Mês)** | `SUM(valor)` dos deals ganhos (`hs_is_closed_won = "true"` no raw_data) com `close_date` no mês atual |
| **Total Vendido (Ano)** | `SUM(valor)` dos deals ganhos com `close_date` no ano atual |
| **Valor do Deal** | `deal.amount` se não nulo, senão `SUM(line_items.amount)` do deal |
| **Meta Mensal** | Campo `monthly_goal` da tabela `sales_goals` (ano + mês atuais) |
| **Meta Anual** | Campo `annual_goal` da tabela `sales_goals` (ano atual, qualquer mês) |
| **% Atingimento Mensal** | `(Total Vendido Mês / Meta Mensal) * 100` |
| **% Atingimento Anual** | `(Total Vendido Ano / Meta Anual) * 100` |
| **Gráfico Mensal** | 12 barras (Jan-Dez) comparando Meta vs Realizado por mês |

**Filtros aplicados nos deals:**
- `archived = false`
- `close_date` dentro do ano selecionado
- `hs_is_closed_won = "true"` (extraído do `raw_data`)

---

### 7.2. Dashboard de Marketing

| Métrica | Cálculo |
|---|---|
| **Leads Gerados** | `COUNT(*)` de `hubspot_contacts` onde `archived = false` |
| **Leads Válidos** | `COUNT(*)` de `hubspot_contacts` onde `lifecycle_stage` IN (`"opportunity"`, `"customer"`, `"165518199"`, `"salesqualifiedlead"`, `"marketingqualifiedlead"`) |
| **Taxa de Conversão** | `(Leads Válidos / Leads Gerados) * 100` |
| **Evolução mensal** | Agrupar contatos por `created_at` (mês/ano), últimos 12 meses |

**Auto-refresh:** Polling a cada 5 minutos (modo TV) ou 10 minutos (modo padrão).

---

### 7.3. Ranking de Comissões (Gamificação)

| Métrica | Cálculo |
|---|---|
| **Ranking** | Agrupar `hubspot_commissions_obj` por `owner_id`, somar `commission_amount`, ordenar DESC |
| **Nome do vendedor** | JOIN com `hubspot_owners` via `commissions.owner_id = owners.hubspot_id` |
| **Total individual** | `SUM(commission_amount)` WHERE `owner_id = X` AND `archived = false` |
| **Total geral** | `SUM(commission_amount)` de todas as comissões |
| **Contagem** | `COUNT(*)` por `owner_id` |

**Real-time:** Usar `supabase.channel` para escutar `postgres_changes` na tabela `hubspot_commissions_obj`. Ao receber evento, recarregar os dados.

---

## 8. Observações sobre Qualidade dos Dados

1. **`deals.amount` é frequentemente `null`** — sempre ter fallback para `line_items`.
2. **`pipeline_stages.is_won` e `is_closed` são sempre `false`** — NÃO usar para filtrar deals ganhos.
3. **`raw_data` e `raw_properties` são double-stringified** — o JSONB armazena uma string JSON dentro de aspas. Precisa parsear duas vezes.
4. **`contacts.first_name` pode ser string vazia `""`** — tratar na exibição.
5. **`contacts.lifecycle_stage` usa IDs numéricos para estágios customizados** (`"165518199"`).
6. **Todos os valores monetários estão em BRL** (`currency = "BRL"`).
7. **Valores numéricos em comissões e line items vêm como string** (ex: `"1600.00"`). Converter com `Number()`.
8. **Filtrar sempre por `archived = false`** em todas as queries.
