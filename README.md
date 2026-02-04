# 🏢 Central de Relatórios NetworkGO

Central unificada de relatórios, dashboards e ferramentas de gestão da NetworkGO.

---

## 📋 Índice

1. [Estrutura do Projeto](#-estrutura-do-projeto)
2. [Como Executar](#-como-executar)
3. [Arquitetura](#-arquitetura)
4. [Banco de Dados (Supabase)](#-banco-de-dados-supabase)
5. [ETL HubSpot → Supabase](#-etl-hubspot--supabase)
6. [Automação N8N](#-automação-n8n)
7. [Deploy (Netlify)](#-deploy-netlify)
8. [Guia de Temas](#-guia-de-temas)

---

## 📁 Estrutura do Projeto

```
matriz/
├── hub/                        # Portal principal (Central de Relatórios)
│   ├── src/
│   │   ├── components/         # Header, Sidebar, ReportViewer
│   │   ├── config/             # Configuração dos relatórios
│   │   └── types/
│   ├── paleta/                 # Arquivos de tema/estilo
│   └── package.json
│
├── relatorios/                 # Relatórios individuais
│   └── comissoes/              # Dashboard de Comissões
│       ├── src/
│       │   ├── components/     # KPIs, Charts, UI
│       │   ├── hooks/          # useSupabaseData, useFilters
│       │   ├── pages/          # VisaoGeral, ComissoesVendedores, SDR
│       │   └── services/       # Supabase client
│       └── package.json
│
├── database/                   # Scripts e documentação do banco
│   ├── sql/                    # DDL, Foreign Keys, RLS
│   ├── n8n/                    # Workflow de automação
│   └── Json/                   # Amostras de dados (ignorados no git)
│
├── scripts/                    # Scripts de build
│   └── combine-builds.js
│
├── netlify.toml                # Configuração do deploy
└── package.json                # Workspace root
```

---

## 🚀 Como Executar

### Pré-requisitos
- Node.js 20+
- npm ou yarn

### Hub Principal (Portal)
```bash
npm install
npm run dev:hub
# Acesse: http://localhost:5174
```

### Relatório de Comissões
```bash
npm run dev:comissoes
# Acesse: http://localhost:5173
```

### Build Completo
```bash
npm run build
# Gera pasta dist/ com hub + relatórios combinados
```

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    HUB (Portal)                         │
│              https://seu-dominio.com                    │
│                                                         │
│   ┌─────────────────────────────────────────────────┐   │
│   │                   IFRAME                         │   │
│   │     Carrega: /comissoes/                        │   │
│   └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                     SUPABASE                            │
│                   (PostgreSQL)                          │
└─────────────────────────────────────────────────────────┘
                          ▲
                          │ ETL
┌─────────────────────────────────────────────────────────┐
│                    HUBSPOT API                          │
└─────────────────────────────────────────────────────────┘
```

### Fluxo de Atualização
```
Botão "Sincronizar" → Webhook N8N → SSH JupyterHub → ETL Python → Supabase
```

---

## 🗄️ Banco de Dados (Supabase)

### Credenciais
| Parâmetro | Valor |
|-----------|-------|
| **URL** | `https://xggqzueehfvautkmaojy.supabase.co` |
| **Host** | `db.xggqzueehfvautkmaojy.supabase.co` |
| **Porta** | `5432` |
| **Database** | `postgres` |

### Tabelas Principais

| Tabela | Descrição | Volume* |
|--------|-----------|---------|
| `hubspot_owners` | Vendedores/Proprietários | ~50 |
| `hubspot_pipelines` | Pipelines de vendas | ~16 |
| `hubspot_pipeline_stages` | Etapas dos pipelines | ~163 |
| `hubspot_contacts` | Contatos/Leads | ~98.000 |
| `hubspot_deals` | Negócios/Oportunidades | ~72.000 |
| `hubspot_line_items` | Produtos nos deals | ~4.000 |
| `hubspot_commissions_obj` | Comissões (objeto custom) | Variável |

*Volume aproximado

### Scripts SQL

| Arquivo | Descrição |
|---------|-----------|
| `database/sql/hubspot_ddl.sql` | Criação das tabelas |
| `database/sql/add_foreign_keys.sql` | Relacionamentos entre tabelas |
| `database/sql/enable_rls.sql` | Row Level Security |
| `database/sql/limpar_tabelas.sql` | Limpar dados (TRUNCATE) |

### Queries Úteis

```sql
-- Vendas por Vendedor
SELECT 
    o.first_name || ' ' || o.last_name AS vendedor,
    COUNT(d.id) AS total_deals,
    SUM(d.amount) AS valor_total
FROM hubspot_deals d
LEFT JOIN hubspot_owners o ON d.owner_id = o.hubspot_id
WHERE d.archived = false
GROUP BY o.hubspot_id, o.first_name, o.last_name
ORDER BY valor_total DESC;

-- Extrair campos do raw_data (JSONB)
SELECT 
    deal_name,
    amount,
    raw_data->>'produto' AS produto,
    raw_data->>'segmento' AS segmento
FROM hubspot_deals
WHERE raw_data IS NOT NULL;
```

---

## 🔄 ETL HubSpot → Supabase

### Localização
O notebook ETL está no JupyterHub:
```
/home/jupyter-luiscuba/Central/etl_hubspot_supabase.ipynb
```

### Modo de Operação
- **Primeira execução**: Full Sync (busca tudo)
- **Execuções seguintes**: Incremental (apenas modificados)

### Características
- ✅ **Idempotente**: UPSERT evita duplicatas
- ✅ **Incremental**: Busca apenas registros modificados
- ✅ **Low Memory**: Streaming + batches de 200 registros
- ✅ **Validação FK**: Verifica chaves estrangeiras antes de inserir

### Executar Manualmente
```bash
cd /home/jupyter-luiscuba/Central
/opt/tljh/user/bin/jupyter nbconvert --execute --to notebook --inplace etl_hubspot_supabase.ipynb
```

---

## ⚡ Automação N8N

### Webhook
```
POST https://flux.gowork.com.br/webhook/atualizar_comissoes
```

### Fluxo do Workflow
```
Webhook → Definir Notebook → SSH Execute → Verificar Sucesso → Resposta
```

### Testar via cURL
```bash
curl -X POST https://flux.gowork.com.br/webhook/atualizar_comissoes \
  -H "Content-Type: application/json" \
  -d '{"source": "teste-manual"}'
```

### Resposta de Sucesso
```json
{
  "status": "success",
  "message": "Dados atualizados com sucesso!"
}
```

### Troubleshooting

| Erro | Causa | Solução |
|------|-------|---------|
| 401 Unauthorized | API Key HubSpot expirada | Gerar nova key no HubSpot |
| Connection refused | SSH bloqueado | Verificar firewall/porta 22 |
| Permission denied | Usuário sem permissão | Verificar credenciais SSH |
| Notebook timeout | ETL muito demorado | Aumentar timeout no N8N |

---

## 🚀 Deploy (Netlify)

### Configuração Atual
O projeto está configurado para deploy único no Netlify com:

- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- **Node Version**: 20

### Variáveis de Ambiente (Netlify)
| Variável | Descrição |
|----------|-----------|
| `VITE_SUPABASE_URL` | URL do Supabase |
| `VITE_SUPABASE_KEY` | Chave pública do Supabase |
| `NODE_VERSION` | `20` |

### URLs de Produção
| Aplicação | Caminho |
|-----------|---------|
| Hub (Portal) | `/` |
| Comissões | `/comissoes/` |

### Redirects (netlify.toml)
```toml
[[redirects]]
  from = "/comissoes/*"
  to = "/comissoes/index.html"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## 🎨 Guia de Temas

### Sistema de Cores
O projeto usa **TailwindCSS** com tema escuro como padrão.

### Cores Principais

| Token | Hex | Uso |
|-------|-----|-----|
| `primary-500` | `#0ea5e9` | Botões, links |
| `primary-600` | `#0284c7` | Hover |
| `gray-900` | `#111827` | Background (dark) |
| `gray-800` | `#1f2937` | Cards (dark) |
| `gray-100` | `#f3f4f6` | Texto principal (dark) |

### Classes Tailwind (Dark Mode)
```html
<div class="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
```

### Hierarquia de Cores
```
Backgrounds:
- Base: bg-gray-50 / dark:bg-gray-900
- Cards: bg-white / dark:bg-gray-800
- Hover: bg-gray-100 / dark:bg-gray-700

Textos:
- Principal: text-gray-900 / dark:text-gray-100
- Secundário: text-gray-600 / dark:text-gray-400
- Muted: text-gray-400 / dark:text-gray-500
```

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| **Frontend** | React 18 + TypeScript + Vite |
| **Estilização** | TailwindCSS |
| **Gráficos** | Recharts |
| **Backend/DB** | Supabase (PostgreSQL) |
| **ETL** | Python + Jupyter |
| **Automação** | N8N |
| **Deploy** | Netlify |

---

## 📊 Relatórios Disponíveis

| Relatório | Descrição | Status |
|-----------|-----------|--------|
| **Comissões** | Dashboard de comissões de vendedores e SDRs | ✅ Ativo |

---

## 👥 Equipe

Desenvolvido por **GoWork Sistemas**

---

**Última atualização:** Fevereiro 2026
