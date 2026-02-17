# Central de Relatorios NetworkGO

Central unificada de relatorios, dashboards e ferramentas de gestao da NetworkGO.

---

## Indice

1. [Estrutura do Projeto](#estrutura-do-projeto)
2. [Como Executar](#como-executar)
3. [Arquitetura](#arquitetura)
4. [Banco de Dados (Supabase)](#banco-de-dados-supabase)
5. [ETL HubSpot -> Supabase](#etl-hubspot--supabase)
6. [Automacao N8N](#automacao-n8n)
7. [Deploy (Netlify)](#deploy-netlify)
8. [Guia de Temas](#guia-de-temas)
9. [Autenticacao e Permissoes](#autenticacao-e-permissoes)

---

## Estrutura do Projeto

```
matriz/
├── src/
│   ├── App.tsx                       # Rotas (login, standalone, protected layout)
│   ├── main.tsx                      # Entry point + providers
│   ├── index.css                     # Design system (dark/light mode)
│   ├── components/
│   │   ├── layout/                   # Header, Sidebar, Breadcrumb
│   │   ├── ui/                       # Button, Card, Input, Select, Tabs, Badge, DatePicker, Checkbox
│   │   ├── charts/                   # BarChart, PieChart, StatusChart
│   │   └── KPICard.tsx               # Card de indicadores
│   ├── config/
│   │   ├── env.ts                    # Variaveis de ambiente (Supabase)
│   │   └── relatorios.ts             # Tipos/categorias de relatorios
│   ├── hooks/
│   │   ├── AuthContext.tsx            # Context + Provider + useAuth
│   │   ├── useAuthState.ts           # Logica de auth (separado para HMR)
│   │   ├── ThemeContext.tsx           # Dark/light mode
│   │   ├── ToastContext.tsx           # Notificacoes toast
│   │   ├── useCompanyTheme.ts        # Tema personalizado por empresa
│   │   └── useAuditLog.ts            # Registro de acoes nos logs
│   ├── lib/
│   │   ├── supabase.ts               # Cliente Supabase compartilhado
│   │   └── utils.ts                  # Formatacao, cn(), cores
│   ├── pages/
│   │   ├── Login.tsx                  # Login, cadastro, esqueci a senha
│   │   ├── Home.tsx                   # Pagina inicial (grid de relatorios)
│   │   ├── Profile.tsx                # Perfil do usuario
│   │   ├── AccessDenied.tsx           # Acesso negado
│   │   ├── NotFound.tsx               # Pagina 404
│   │   ├── admin/                     # Painel administrativo
│   │   │   ├── Dashboard.tsx          # Metricas de uso
│   │   │   ├── Users.tsx              # Gestao de usuarios
│   │   │   ├── Groups.tsx             # Grupos de acesso
│   │   │   ├── Reports.tsx            # Gestao de relatorios
│   │   │   ├── AuditLogs.tsx          # Logs de auditoria
│   │   │   └── Theme.tsx              # Tema da empresa
│   │   ├── comissoes/                 # Dashboard de Comissoes
│   │   │   ├── ComissoesPage.tsx
│   │   │   ├── pages/                 # VisaoGeral, ComissoesVendedores, ComissoesSDR
│   │   │   ├── hooks/                 # useFilters, useSupabaseData, useComissoesCalculations
│   │   │   └── services/              # API e Supabase
│   │   └── ranking/                   # Dashboard de Ranking/Competicao
│   │       ├── RankingPage.tsx
│   │       ├── pages/                 # DashboardCompeticao, DashboardMetaGlobal
│   │       ├── hooks/                 # useRankingFilters, useRankingData
│   │       └── services/              # API e Supabase
│   └── types/
│       ├── index.ts                   # Tipos da aplicacao
│       └── database.ts                # Tipos do banco Supabase
│
├── database/
│   └── sql/                           # DDL, Foreign Keys, RLS, seeds
│
├── docs/                              # Documentacao detalhada
│   ├── auth-permissions.md            # Arquitetura de auth e permissoes
│   ├── checklist-auth.md              # Checklist de configuracao auth
│   ├── checklist-pendencias.md        # Status de pendencias
│   └── novo-relatorio.md              # Guia para criar novos relatorios
│
├── public/                            # Assets estaticos e PWA
│   ├── manifest.json
│   ├── sw.js
│   └── icon-192.svg
│
├── netlify.toml                       # Configuracao do deploy
├── package.json                       # Dependencias e scripts
├── tsconfig.json                      # Configuracao TypeScript
├── vite.config.ts                     # Configuracao Vite
├── tailwind.config.js                 # Configuracao TailwindCSS
└── postcss.config.js                  # Configuracao PostCSS
```

---

## Como Executar

### Pre-requisitos
- Node.js 20+
- npm

### Desenvolvimento
```bash
npm install
npm run dev
# Acesse: http://localhost:5173
```

### Build de producao
```bash
npm run build
# Gera pasta dist/
```

### Preview do build
```bash
npm run preview
```

---

## Arquitetura

```
┌──────────────────────────────────────────────────────┐
│              FRONTEND (React SPA)                     │
│          React 18 + TypeScript + Vite                 │
│   ┌────────────┐ ┌──────────┐ ┌────────────────┐     │
│   │ Comissoes  │ │ Ranking  │ │ Painel Admin   │     │
│   └────────────┘ └──────────┘ └────────────────┘     │
│   Auth + Permissoes Granulares (grupos + individual) │
└──────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────┐
│                    SUPABASE                           │
│                  (PostgreSQL)                         │
│  Tabelas HubSpot + Auth + Permissoes + RLS           │
└──────────────────────────────────────────────────────┘
                         ▲
                         │ ETL (Python / Jupyter)
┌──────────────────────────────────────────────────────┐
│                   HUBSPOT API                         │
└──────────────────────────────────────────────────────┘
```

### Fluxo de Atualizacao de Dados
```
Botao "Sincronizar" -> Webhook N8N -> SSH JupyterHub -> ETL Python -> Supabase
```

### Fluxo de Autenticacao
```
Usuario abre rota -> Logado? -> Tem profile ativo? -> Tem acesso ao relatorio? -> Renderiza
```

---

## Banco de Dados (Supabase)

### Tabelas HubSpot

| Tabela | Descricao | Volume* |
|--------|-----------|---------|
| `hubspot_owners` | Vendedores/Proprietarios | ~50 |
| `hubspot_pipelines` | Pipelines de vendas | ~16 |
| `hubspot_pipeline_stages` | Etapas dos pipelines | ~163 |
| `hubspot_contacts` | Contatos/Leads | ~98.000 |
| `hubspot_deals` | Negocios/Oportunidades | ~72.000 |
| `hubspot_line_items` | Produtos nos deals | ~4.000 |
| `hubspot_commissions_obj` | Comissoes (objeto custom) | Variavel |
| `sales_goals` | Metas de vendas (receita, seats, deals) | Variavel |

*Volume aproximado

### Tabelas de Auth e Permissoes

| Tabela | Descricao |
|--------|-----------|
| `profiles` | Perfis de usuario (vinculado ao auth.users) |
| `reports` | Relatorios disponiveis no sistema |
| `access_groups` | Grupos de acesso |
| `user_groups` | Vinculo usuario <-> grupo (N:N) |
| `user_report_access` | Acesso individual: usuario -> relatorio |
| `group_report_access` | Acesso de grupo: grupo -> relatorio |
| `audit_logs` | Logs de auditoria |
| `theme_settings` | Configuracoes de tema por empresa |

### Scripts SQL

| Arquivo | Descricao |
|---------|-----------|
| `database/sql/hubspot_ddl.sql` | Criacao das tabelas HubSpot |
| `database/sql/add_foreign_keys.sql` | Relacionamentos entre tabelas |
| `database/sql/enable_rls.sql` | Row Level Security |
| `database/sql/auth_permissions.sql` | Tabelas de auth e permissoes |
| `database/sql/fix_reports_access.sql` | Function RPC get_my_accessible_reports |
| `database/sql/seed_admin.sql` | Seed do usuario admin |
| `database/sql/theme_settings.sql` | Tabela de tema |
| `database/sql/audit_logs.sql` | Tabela de logs |
| `database/sql/alter_sales_goals.sql` | Metas de vendas (receita, seats, deals) |
| `database/sql/limpar_tabelas.sql` | Limpar dados (TRUNCATE) |

### Queries Uteis

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

## ETL HubSpot -> Supabase

### Localizacao
O notebook ETL esta no JupyterHub:
```
/home/jupyter-luiscuba/Central/etl_hubspot_supabase.ipynb
```

### Modo de Operacao
- **Primeira execucao**: Full Sync (busca tudo)
- **Execucoes seguintes**: Incremental (apenas modificados)

### Caracteristicas
- **Idempotente**: UPSERT evita duplicatas
- **Incremental**: Busca apenas registros modificados
- **Low Memory**: Streaming + batches de 200 registros
- **Validacao FK**: Verifica chaves estrangeiras antes de inserir

### Executar Manualmente
```bash
cd /home/jupyter-luiscuba/Central
/opt/tljh/user/bin/jupyter nbconvert --execute --to notebook --inplace etl_hubspot_supabase.ipynb
```

---

## Automacao N8N

### Webhook
```
POST https://flux.gowork.com.br/webhook/atualizar_comissoes
```

### Fluxo do Workflow
```
Webhook -> Definir Notebook -> SSH Execute -> Verificar Sucesso -> Resposta
```

### Testar via cURL
```bash
curl -X POST https://flux.gowork.com.br/webhook/atualizar_comissoes \
  -H "Content-Type: application/json" \
  -d '{"source": "teste-manual"}'
```

### Troubleshooting

| Erro | Causa | Solucao |
|------|-------|---------|
| 401 Unauthorized | API Key HubSpot expirada | Gerar nova key no HubSpot |
| Connection refused | SSH bloqueado | Verificar firewall/porta 22 |
| Permission denied | Usuario sem permissao | Verificar credenciais SSH |
| Notebook timeout | ETL muito demorado | Aumentar timeout no N8N |

---

## Deploy (Netlify)

### Configuracao Atual

- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- **Node Version**: 20
- **SPA Redirect**: `/* -> /index.html` (status 200)

### Variaveis de Ambiente (Netlify)

| Variavel | Descricao |
|----------|-----------|
| `VITE_SUPABASE_URL` | URL do Supabase |
| `VITE_SUPABASE_KEY` | Chave publica (anon) do Supabase |
| `NODE_VERSION` | `20` |

### Headers de Seguranca (netlify.toml)
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`

---

## Guia de Temas

### Sistema de Cores
O projeto usa **TailwindCSS** com tema escuro como padrao.

### Cores Principais (tailwind.config.js)

| Token | Hex | Uso |
|-------|-----|-----|
| `primary-500` | `#0ea5e9` | Botoes, links, destaques |
| `primary-600` | `#0284c7` | Hover |
| `gray-950` | `#09090b` | Background base (dark) |
| `gray-900` | `#18181b` | Cards/surfaces (dark) |
| `gray-100` | `#f4f4f5` | Texto principal (dark) |
| `gray-50` | `#fafafa` | Background base (light) |

### Hierarquia de Cores (Dark Mode)
```
Backgrounds:
- Base:  bg-white / dark:bg-gray-950
- Cards: bg-gray-50 / dark:bg-[#0c0c0e]
- Hover: bg-gray-100 / dark:bg-white/[0.03]

Textos:
- Principal:  text-gray-900 / dark:text-gray-100
- Secundario: text-gray-500 / dark:text-gray-400
- Muted:      text-gray-400 / dark:text-gray-600

Bordas:
- Normal: border-gray-200 / dark:border-white/[0.06]
- Sutil:  border-gray-100 / dark:border-white/[0.04]
```

### Tema Personalizado por Empresa
O sistema suporta personalizar cores via tabela `theme_settings` no Supabase. O hook `useCompanyTheme` aplica as cores como CSS custom properties.

---

## Autenticacao e Permissoes

### Roles

| Role | Descricao |
|------|-----------|
| `admin` | Acesso total. Gerencia usuarios, grupos, relatorios. |
| `manager` | Acessa relatorios conforme permissoes. Pode sincronizar dados. |
| `viewer` | Acessa relatorios conforme permissoes. Somente leitura. |

### Modelo de Acesso
- **Acesso individual**: usuario -> relatorio (tabela `user_report_access`)
- **Acesso via grupo**: grupo -> relatorios, usuario -> grupo (tabelas `access_groups`, `user_groups`, `group_report_access`)
- **Admin**: acesso automatico a tudo

### Documentacao Detalhada
- Arquitetura completa: `docs/auth-permissions.md`
- Checklist de configuracao: `docs/checklist-auth.md`
- Guia para novos relatorios: `docs/novo-relatorio.md`

---

## Relatorios Disponiveis

| Relatorio | Rota | Standalone | Status |
|-----------|------|------------|--------|
| Dashboard de Comissoes | `/comissoes` | `/standalone/comissoes` | Ativo |
| Dashboard de Ranking | `/ranking` | - | Ativo |

---

## Stack Tecnologica

| Camada | Tecnologia |
|--------|------------|
| **Frontend** | React 18 + TypeScript + Vite |
| **Estilizacao** | TailwindCSS |
| **Graficos** | Recharts |
| **Backend/DB** | Supabase (PostgreSQL) |
| **ETL** | Python + Jupyter |
| **Automacao** | N8N |
| **Deploy** | Netlify |
| **PWA** | Service Worker + Manifest |

---

## Equipe

Desenvolvido por **GoWork Sistemas**

---

**Ultima atualizacao:** Fevereiro 2026
