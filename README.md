# 🏢 Matriz - Central de Relatórios NetworkGO

Central unificada de relatórios e ferramentas de gestão da NetworkGO.

---

## 📁 Estrutura do Projeto

```
matriz/
├── hub/                    # Aplicação principal (Portal de Relatórios)
│   ├── src/
│   ├── public/
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
│
├── relatorios/             # Relatórios individuais
│   └── comissoes/          # Dashboard de Comissões
│       ├── src/
│       ├── supabase/
│       ├── package.json
│       └── ...
│
├── database/               # Scripts e documentação do banco de dados
│   ├── sql/                # Scripts SQL (DDL, RLS, etc.)
│   ├── notebooks/          # Notebooks Python (ETL HubSpot → Supabase)
│   ├── docs/               # Documentação do Data Warehouse
│   ├── json/               # Amostras de dados JSON
│   └── contexto/           # Contexto e regras de negócio
│
├── .gitignore
├── package.json            # Workspace root
└── README.md
```

---

## 🚀 Como Executar

### Hub Principal (Portal)
```bash
cd hub
npm install
npm run dev
# Acesse: http://localhost:5174
```

### Relatório de Comissões
```bash
cd relatorios/comissoes
npm install
npm run dev
# Acesse: http://localhost:5173
```

---

## 📊 Relatórios Disponíveis

| Relatório | Descrição | Porta |
|-----------|-----------|-------|
| **Comissões** | Dashboard de comissões de vendedores e SDRs | 5173 |

---

## 🗄️ Banco de Dados

O diretório `database/` contém:

- **sql/**: Scripts DDL para criação de tabelas no Supabase
- **notebooks/**: Jupyter notebooks para ETL do HubSpot
- **docs/**: Documentação do Data Warehouse

### Principais Tabelas (Supabase)
- `hubspot_owners` - Proprietários/Vendedores
- `hubspot_deals` - Negócios
- `hubspot_contacts` - Contatos
- `hubspot_pipelines` - Pipelines de vendas
- `hubspot_commissions_obj` - Comissões (objeto customizado)

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| **Frontend** | React 18 + TypeScript + Vite |
| **Estilização** | TailwindCSS |
| **Componentes** | Radix UI |
| **Gráficos** | Recharts |
| **Backend/DB** | Supabase (PostgreSQL) |
| **ETL** | Python + HubSpot API Client |

---

## 👥 Equipe

Desenvolvido por **GoWork Sistemas**

---

## 📝 Notas

- Cada relatório roda de forma independente
- O Hub carrega os relatórios via iframe
- Variáveis de ambiente (`.env`) não são commitadas
