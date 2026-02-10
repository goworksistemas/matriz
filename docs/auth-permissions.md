# 🔐 Arquitetura de Autenticação e Permissões — NetworkGo Matriz

## 📋 Visão Geral

Sistema de autenticação com controle granular de acesso, permitindo:
- Vincular acesso **individual** (usuário → relatório)
- Criar **grupos de acesso** (grupo → conjunto de relatórios → vários usuários)
- Combinar ambos (acesso direto + acesso via grupo)

---

## 🗄️ Modelo de Dados

### Diagrama de Relacionamento

```
auth.users (Supabase nativo)
    │
    │ trigger on signup
    ▼
profiles
    │
    ├──── user_report_access ────── (acesso individual)
    │           │
    │           ▼
    │       reports ◄──── group_report_access ────── (acesso via grupo)
    │                           │
    └──── user_groups ──────────┘
              │
              ▼
          access_groups
```

### Tabelas

#### 1. `profiles` — Perfil do usuário

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid PK | Mesmo ID do `auth.users` |
| `email` | text | Email (espelhado do auth) |
| `full_name` | text | Nome completo |
| `avatar_url` | text | URL do avatar (opcional) |
| `role` | text | `admin`, `manager`, `viewer` |
| `active` | boolean | Se o usuário está ativo |
| `created_at` | timestamptz | Data de criação |
| `updated_at` | timestamptz | Data de atualização |

**Roles globais:**

| Role | Descrição |
|------|-----------|
| `admin` | Acesso total. Gerencia usuários, grupos, relatórios. Ignora permissões granulares. |
| `manager` | Acessa relatórios conforme permissões (individuais + grupo). Pode sincronizar dados. |
| `viewer` | Acessa relatórios conforme permissões (individuais + grupo). Somente leitura. |

#### 2. `reports` — Registro dos relatórios disponíveis

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid PK | ID único |
| `slug` | text UNIQUE | Identificador na URL (ex: `comissoes`) |
| `name` | text | Nome de exibição |
| `description` | text | Descrição |
| `icon` | text | Ícone (lucide) |
| `category` | text | `vendas`, `financeiro`, `operacional`, `rh` |
| `active` | boolean | Se está ativo no sistema |
| `standalone_public` | boolean | Se o standalone pode ser acessado sem login |
| `created_at` | timestamptz | Data de criação |

> **Nota:** Esta tabela substitui o array `RELATORIOS` hardcoded em `config/relatorios.ts`. Os relatórios passam a ser gerenciados pelo banco.

#### 3. `access_groups` — Grupos de acesso

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid PK | ID único |
| `name` | text | Nome do grupo (ex: "Equipe Comercial") |
| `description` | text | Descrição |
| `created_at` | timestamptz | Data de criação |

#### 4. `user_groups` — Vínculo usuário ↔ grupo (N:N)

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid PK | ID único |
| `user_id` | uuid FK → profiles.id | Usuário |
| `group_id` | uuid FK → access_groups.id | Grupo |
| `created_at` | timestamptz | Data de criação |

**Constraint:** UNIQUE(user_id, group_id)

#### 5. `user_report_access` — Acesso individual: usuário → relatório

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid PK | ID único |
| `user_id` | uuid FK → profiles.id | Usuário |
| `report_id` | uuid FK → reports.id | Relatório |
| `granted_by` | uuid FK → profiles.id | Quem concedeu o acesso |
| `created_at` | timestamptz | Data de criação |

**Constraint:** UNIQUE(user_id, report_id)

#### 6. `group_report_access` — Acesso de grupo: grupo → relatório

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid PK | ID único |
| `group_id` | uuid FK → access_groups.id | Grupo |
| `report_id` | uuid FK → reports.id | Relatório |
| `created_at` | timestamptz | Data de criação |

**Constraint:** UNIQUE(group_id, report_id)

---

## 🔄 Fluxo de Verificação de Acesso

```
Usuário quer acessar /comissoes
         │
         ▼
    É admin? ──── SIM ──→ ✅ Acesso total
         │
        NÃO
         │
         ▼
    Tem acesso individual? ──── SIM ──→ ✅ Acesso permitido
    (user_report_access)
         │
        NÃO
         │
         ▼
    Pertence a algum grupo ──── SIM ──→ ✅ Acesso permitido
    que tem acesso?
    (user_groups + group_report_access)
         │
        NÃO
         │
         ▼
    ❌ Acesso negado (redireciona para Home)
```

### View auxiliar: `vw_user_accessible_reports`

Para simplificar as consultas, uma view que consolida **todos** os relatórios que um usuário pode acessar (direto + via grupo):

```sql
-- Retorna todos os reports que o usuário pode acessar
SELECT DISTINCT
    p.id AS user_id,
    r.id AS report_id,
    r.slug,
    r.name,
    CASE
        WHEN ura.id IS NOT NULL THEN 'direct'
        WHEN gra.id IS NOT NULL THEN 'group'
    END AS access_type
FROM profiles p
CROSS JOIN reports r
LEFT JOIN user_report_access ura 
    ON ura.user_id = p.id AND ura.report_id = r.id
LEFT JOIN user_groups ug 
    ON ug.user_id = p.id
LEFT JOIN group_report_access gra 
    ON gra.group_id = ug.group_id AND gra.report_id = r.id
WHERE r.active = true
  AND (
    p.role = 'admin'                    -- Admin vê tudo
    OR ura.id IS NOT NULL               -- Acesso direto
    OR gra.id IS NOT NULL               -- Acesso via grupo
  );
```

---

## 🔒 Row Level Security (RLS)

### profiles

```sql
-- Usuário vê apenas seu próprio perfil
-- Admin vê todos
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (
    auth.uid() = id 
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Apenas admin pode inserir/atualizar/deletar
CREATE POLICY "profiles_admin_all" ON profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
```

### reports

```sql
-- Qualquer autenticado pode ver relatórios ativos
CREATE POLICY "reports_select" ON reports FOR SELECT USING (
    active = true AND auth.role() = 'authenticated'
);

-- Apenas admin pode gerenciar
CREATE POLICY "reports_admin_all" ON reports FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
```

### access_groups / user_groups / user_report_access / group_report_access

```sql
-- Leitura: autenticado (para o frontend montar a sidebar)
-- Escrita: apenas admin
```

### Tabelas HubSpot (atualização)

As políticas atuais usam `auth.role() = 'authenticated'` para leitura. Isso continua funcionando — qualquer usuário logado pode ler os dados. O **controle granular** acontece na camada de **rotas/relatórios**, não na camada de dados brutos.

Se no futuro quiser restringir dados por vendedor (ex: vendedor só vê suas próprias comissões), basta ajustar a policy:

```sql
-- Exemplo futuro: vendedor vê apenas seus dados
CREATE POLICY "commissions_by_owner" ON hubspot_commissions_obj 
    FOR SELECT USING (
        owner_id IN (
            SELECT hubspot_id FROM hubspot_owners 
            WHERE email = auth.jwt()->>'email'
        )
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
    );
```

---

## 🖥️ Frontend — Implementação

### Estrutura de arquivos

```
src/
├── hooks/
│   └── AuthContext.tsx          # Provider de autenticação
├── pages/
│   ├── Login.tsx                # Tela de login
│   └── AccessDenied.tsx         # Tela de acesso negado
├── components/
│   └── layout/
│       └── ProtectedRoute.tsx   # Wrapper que verifica auth + permissão
```

### Fluxo de navegação

```
Usuário abre qualquer rota
         │
         ▼
    Está logado? ──── NÃO ──→ Redireciona para /login
         │
        SIM
         │
         ▼
    Carrega profile + relatórios acessíveis
         │
         ▼
    Rota é um relatório? ──── NÃO ──→ Renderiza normalmente (Home)
         │
        SIM
         │
         ▼
    Tem acesso? ──── NÃO ──→ Redireciona para /acesso-negado
         │
        SIM
         │
         ▼
    ✅ Renderiza relatório
```

### Sidebar dinâmica

A sidebar passa a mostrar **apenas os relatórios que o usuário pode acessar**:

```typescript
// Antes: lista hardcoded
const RELATORIOS = [{ id: 'comissoes', ... }]

// Depois: vem do banco, filtrado por permissão
const { relatoriosAcessiveis } = useAuth()
// Retorna apenas os relatórios que o usuário tem acesso (direto ou via grupo)
```

---

## 👤 Gestão de Usuários (Admin)

### Funcionalidades do painel admin (futuro)

| Funcionalidade | Descrição |
|----------------|-----------|
| Listar usuários | Ver todos os profiles com role e status |
| Editar role | Mudar role de um usuário (admin/manager/viewer) |
| Ativar/desativar | Toggle de `active` no profile |
| Acesso individual | Vincular/desvincular relatórios a um usuário |
| Gerenciar grupos | CRUD de grupos de acesso |
| Membros do grupo | Adicionar/remover usuários de um grupo |
| Relatórios do grupo | Vincular/desvincular relatórios a um grupo |

### Criação de usuários

Os usuários são criados pelo **admin** via:
1. **Supabase Dashboard** → Authentication → Invite User (envia email com link)
2. **Painel admin futuro** → Formulário de convite

O trigger `on_auth_user_created` cria automaticamente o profile com role `viewer` (padrão).

---

## 📊 Exemplos Práticos

### Cenário 1: Equipe Comercial

```
Grupo: "Equipe Comercial"
├── Relatórios vinculados:
│   ├── Dashboard de Comissões
│   ├── Pipeline de Vendas (futuro)
│   └── Metas Mensais (futuro)
│
└── Membros:
    ├── João Silva (manager)
    ├── Maria Santos (viewer)
    └── Pedro Costa (viewer)
```

Resultado: João, Maria e Pedro veem os 3 relatórios na sidebar.

### Cenário 2: Acesso individual extra

```
Ana Oliveira (viewer)
├── Via grupo "Financeiro":
│   └── Dashboard Financeiro (futuro)
│
└── Acesso individual:
    └── Dashboard de Comissões (concedido pelo admin)
```

Resultado: Ana vê Dashboard Financeiro (via grupo) + Dashboard de Comissões (direto).

### Cenário 3: Admin

```
Luis Cuba (admin)
└── Vê TUDO, gerencia TUDO
```

---

## 🚀 Ordem de Implementação

### Fase 1 — Auth básico (imediato)
1. Criar tabelas `profiles` e `reports` no Supabase
2. Criar trigger de auto-criação de profile
3. Implementar `AuthContext` no frontend
4. Criar página de login
5. Proteger rotas (redirecionar para login)
6. Migrar `config/relatorios.ts` para tabela `reports`

### Fase 2 — Permissões granulares
7. Criar tabelas `access_groups`, `user_groups`, `user_report_access`, `group_report_access`
8. Criar view `vw_user_accessible_reports`
9. Sidebar dinâmica (mostra só relatórios permitidos)
10. Proteção de rota por relatório

### Fase 3 — Painel admin
11. Tela de gestão de usuários
12. Tela de gestão de grupos
13. Tela de vinculação de acessos

---

## ⚠️ Decisões Pendentes

Antes de implementar, confirme:

1. **Login:** email/senha? Ou quer Google/Microsoft também?
2. **Standalone:** relatórios standalone exigem login, ou podem ser públicos (campo `standalone_public`)?
3. **Primeiro admin:** você cria o primeiro usuário manualmente no Supabase Dashboard?

---

*Última atualização: Fevereiro 2026*
