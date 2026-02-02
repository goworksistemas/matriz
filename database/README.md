# 🗄️ Database - Scripts e ETL

Este diretório contém todos os scripts de banco de dados e notebooks de ETL para integração HubSpot → Supabase.

---

## 📁 Estrutura

```
database/
├── sql/                    # Scripts SQL
│   ├── hubspot_ddl.sql     # DDL - Criação das tabelas
│   ├── add_foreign_keys.sql # Foreign keys entre tabelas
│   ├── enable_rls.sql      # Row Level Security
│   └── limpar_tabelas.sql  # Limpar dados das tabelas
│
├── notebooks/              # Jupyter Notebooks (ETL)
│   ├── etl_hubspot_supabase.ipynb  # ETL principal
│   ├── comissoes.ipynb             # ETL comissões
│   ├── contatos_hubspot.ipynb      # ETL contatos
│   ├── negocios_hubspot.ipynb      # ETL negócios
│   ├── pipelines_hubspot.ipynb     # ETL pipelines
│   ├── proprietario_hubspot.ipynb  # ETL proprietários
│   └── itens_de_linha_hubspot.ipynb # ETL line items
│
├── docs/                   # Documentação
│   └── DATA_WAREHOUSE_HUBSPOT.md
│
├── json/                   # Amostras de dados JSON
│
└── contexto/               # Contexto e regras de negócio
    └── contexto.text
```

---

## 🔧 Configuração

### Dependências Python
```bash
pip install -r requirements.txt
```

### Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto:
```env
HUBSPOT_ACCESS_TOKEN=seu_token_aqui
SUPABASE_URL=sua_url_aqui
SUPABASE_KEY=sua_key_aqui
```

---

## 📊 Tabelas do Data Warehouse

| Tabela | Descrição |
|--------|-----------|
| `hubspot_owners` | Proprietários/Vendedores |
| `hubspot_pipelines` | Pipelines de vendas |
| `hubspot_pipeline_stages` | Etapas dos pipelines |
| `hubspot_contacts` | Contatos/Clientes |
| `hubspot_deals` | Negócios/Oportunidades |
| `hubspot_line_items` | Itens de linha |
| `hubspot_commissions_obj` | Comissões (objeto customizado) |

---

## 🚀 Como Usar

1. Execute os scripts SQL na ordem:
   - `hubspot_ddl.sql` (criar tabelas)
   - `add_foreign_keys.sql` (relacionamentos)
   - `enable_rls.sql` (segurança)

2. Execute os notebooks de ETL para popular as tabelas

3. Use `limpar_tabelas.sql` para resetar dados quando necessário
