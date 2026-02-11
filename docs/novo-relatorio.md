# 📊 Como Criar e Adicionar um Novo Relatório

Guia passo a passo para adicionar um novo relatório ao sistema NetworkGo Matriz.

---

## Visão Geral do Processo

```
1. Registrar no banco (tabela reports)
2. Criar a página no frontend
3. Registrar a rota no App.tsx
4. Configurar permissões (admin, grupos ou individual)
```

---

## Passo 1 — Registrar o relatório no banco

Execute no **SQL Editor do Supabase**:

```sql
INSERT INTO public.reports (slug, name, description, icon, category, active, standalone_public)
VALUES (
    'meu-relatorio',                           -- slug (usado na URL)
    'Nome do Relatório',                       -- nome exibido na sidebar e home
    'Descrição breve do que o relatório faz',  -- descrição
    'trending-up',                             -- ícone (lucide-react)
    'vendas',                                  -- categoria: vendas | financeiro | operacional | rh
    true,                                      -- ativo
    false                                      -- standalone público (false = precisa login)
);
```

### Ícones disponíveis

Os ícones são do [Lucide React](https://lucide.dev/icons). Os mapeados na Sidebar são:

| Valor | Ícone |
|-------|-------|
| `coins` | Moedas |
| `trending-up` | Gráfico subindo |
| `wallet` | Carteira |
| `settings` | Engrenagem |
| `users` | Pessoas |
| `bar-chart` | Gráfico de barras |

Para usar um ícone diferente, adicione o mapeamento em `src/components/layout/Sidebar.tsx` no objeto `iconMap`.

### Categorias

| Categoria | Cor na Home |
|-----------|-------------|
| `vendas` | Verde (emerald) |
| `financeiro` | Amarelo (amber) |
| `operacional` | Azul (blue) |
| `rh` | Violeta (violet) |

---

## Passo 2 — Criar a página do relatório

Crie a pasta do relatório seguindo a estrutura padrão:

```
src/pages/meu-relatorio/
├── MeuRelatorioPage.tsx       # Página principal
├── hooks/                     # Hooks específicos (dados, filtros, cálculos)
│   ├── useMeuRelatorioData.ts
│   └── index.ts
├── pages/                     # Sub-páginas/abas
│   ├── AbaUm.tsx
│   ├── AbaDois.tsx
│   └── index.ts
├── services/                  # Chamadas ao Supabase
│   ├── api.ts
│   └── index.ts
└── components/                # Componentes exclusivos deste relatório (se houver)
```

### Template da página principal

```tsx
// src/pages/meu-relatorio/MeuRelatorioPage.tsx

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { useAuditLog } from '@/hooks/useAuditLog';

export function MeuRelatorioPage() {
  const { log } = useAuditLog();
  const [loading, setLoading] = useState(true);

  // Log de acesso
  useEffect(() => { log('view_report', 'report', 'meu-relatorio'); }, [log]);

  // Carregar dados
  useEffect(() => {
    // Buscar dados do Supabase...
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Conteúdo do relatório */}
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Meu Relatório
        </h2>
        {/* ... */}
      </div>
    </div>
  );
}
```

### Componentes reutilizáveis disponíveis

| Componente | Import | Uso |
|------------|--------|-----|
| `KPICard` | `@/components/KPICard` | Cards de indicadores |
| `Card` | `@/components/ui/Card` | Container com borda |
| `Button` | `@/components/ui/Button` | Botões (primary, secondary, ghost) |
| `Select` | `@/components/ui/Select` | Dropdown de filtros |
| `Input` | `@/components/ui/Input` | Campo de texto |
| `DatePicker` | `@/components/ui/DatePicker` | Seletor de data |
| `Badge` | `@/components/ui/Badge` | Labels coloridos |
| `Tabs` | `@/components/ui/Tabs` | Abas |
| `BarChartComponent` | `@/components/charts/BarChartComponent` | Gráfico de barras |
| `PieChartComponent` | `@/components/charts/PieChartComponent` | Gráfico de pizza |
| `StatusChart` | `@/components/charts/StatusChart` | Gráfico de status empilhado |

### Hooks reutilizáveis

| Hook | Import | Uso |
|------|--------|-----|
| `useAuth` | `@/hooks/AuthContext` | Dados do usuário logado |
| `useToast` | `@/hooks/ToastContext` | Notificações toast |
| `useAuditLog` | `@/hooks/useAuditLog` | Registrar ações nos logs |
| `useTheme` | `@/hooks/ThemeContext` | Verificar dark/light |

### Utilitários

| Função | Import | Uso |
|--------|--------|-----|
| `formatCurrency(valor)` | `@/lib/utils` | Formata para R$ |
| `formatNumber(valor, decimais)` | `@/lib/utils` | Formata com separador de milhar |
| `formatDate(string)` | `@/lib/utils` | Formata dd/MM/yyyy |
| `formatPercent(valor)` | `@/lib/utils` | Formata % |
| `cn(...classes)` | `@/lib/utils` | Merge de classes Tailwind |

---

## Passo 3 — Registrar a rota

Abra `src/App.tsx` e adicione:

### 3.1 Import

```tsx
import { MeuRelatorioPage } from '@/pages/meu-relatorio/MeuRelatorioPage'
```

### 3.2 Rota protegida (dentro do `ProtectedLayout`)

```tsx
<Route path="/meu-relatorio" element={
  hasReportAccess('meu-relatorio') ? <MeuRelatorioPage /> : <AccessDenied />
} />
```

### 3.3 Rota standalone (opcional, se quiser compartilhamento)

Se o relatório precisa de link standalone, adicione um componente similar ao `StandaloneComissoes` no App.tsx:

```tsx
<Route path="/standalone/meu-relatorio" element={<StandaloneMeuRelatorio />} />
```

---

## Passo 4 — Configurar permissões

### Opção A: Via painel admin (recomendado)

1. Acesse `/admin/usuarios`
2. Clique no usuário
3. Marque o relatório na lista da direita

### Opção B: Via grupo de acesso

1. Acesse `/admin/grupos`
2. Crie ou selecione um grupo
3. Marque o relatório na seção "Relatórios"
4. Adicione os usuários na seção "Membros"

### Opção C: Via SQL direto

```sql
-- Acesso individual
INSERT INTO public.user_report_access (user_id, report_id)
SELECT p.id, r.id
FROM public.profiles p, public.reports r
WHERE p.email = 'usuario@email.com' AND r.slug = 'meu-relatorio';

-- Acesso via grupo
INSERT INTO public.group_report_access (group_id, report_id)
SELECT g.id, r.id
FROM public.access_groups g, public.reports r
WHERE g.name = 'Equipe Comercial' AND r.slug = 'meu-relatorio';
```

> **Nota:** Admins sempre têm acesso a todos os relatórios automaticamente.

---

## Passo 5 — Ícone personalizado (opcional)

Se o ícone do Lucide que você quer não está no `iconMap`, adicione em dois arquivos:

### `src/components/layout/Sidebar.tsx`

```tsx
import { NomeDoIcone } from 'lucide-react'

const iconMap: Record<string, React.ElementType> = {
  // ... existentes
  'nome-do-icone': NomeDoIcone,
}
```

### `src/pages/Home.tsx`

```tsx
import { NomeDoIcone } from 'lucide-react'

const iconMap: Record<string, React.ElementType> = {
  // ... existentes
  'nome-do-icone': NomeDoIcone,
}
```

---

## Checklist rápido

- [ ] SQL: relatório inserido na tabela `reports`
- [ ] Frontend: pasta criada em `src/pages/meu-relatorio/`
- [ ] Frontend: página principal exportada
- [ ] Frontend: import adicionado no `App.tsx`
- [ ] Frontend: rota adicionada no `ProtectedLayout`
- [ ] Permissões: acesso configurado (admin, grupo ou individual)
- [ ] Ícone: mapeado no `iconMap` (se for novo)
- [ ] Audit: `useAuditLog` integrado na página
- [ ] Teste: login → home mostra o relatório → clique abre → sidebar destaca

---

## Exemplo real: Dashboard de Comissões

```
Slug:       comissoes
Rota:       /comissoes
Standalone: /standalone/comissoes
Pasta:      src/pages/comissoes/
Página:     ComissoesPage.tsx
Hooks:      useSupabaseData, useFilters, useComissoesCalculations
Sub-páginas: VisaoGeral, ComissoesVendedores, ComissoesSDR
```

Use este como referência ao criar novos relatórios.
