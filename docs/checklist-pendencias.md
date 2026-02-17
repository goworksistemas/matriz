# 📋 Checklist — NetworkGo Matriz

## ✅ Supabase — Tudo configurado

Verificado via export completo do schema:

- [x] 7 tabelas HubSpot (owners, contacts, deals, pipelines, stages, line_items, commissions)
- [x] 6 tabelas de auth/permissões (profiles, reports, access_groups, user_groups, user_report_access, group_report_access)
- [x] Todas as Foreign Keys configuradas
- [x] Todos os indexes criados
- [x] RLS habilitado em TODAS as 13 tabelas
- [x] Policies corretas (profiles_select com `true`, profiles_insert com `auth.uid() = id`)
- [x] Trigger `on_auth_user_created` → cria profile automaticamente
- [x] Trigger `profiles_updated_at` → atualiza timestamp
- [x] Function RPC `get_my_accessible_reports()` → retorna relatórios do usuário
- [x] Function `user_has_report_access()` → verifica acesso
- [x] Relatório "comissoes" inserido na tabela `reports`
- [x] Usuário `bpm@gowork.com.br` confirmado e com último login
- [x] Profile admin com role = 'admin'

## ✅ Frontend — Base concluída

- [x] Projeto reestruturado (app única com React Router)
- [x] Sidebar dinâmica (mostra relatórios do usuário)
- [x] Header com toggle tema, fullscreen, abrir standalone
- [x] Modo escuro / claro
- [x] Página de Login (login, cadastro, esqueci a senha)
- [x] AuthContext + useAuthState separados (evita HMR loop)
- [x] Auto-criação de profile se trigger falhou
- [x] Fallback se RPC não funciona (admin vê tudo via tabela reports)
- [x] Safety timeout de 10s contra loading infinito
- [x] Race condition corrigida (setIsLoading antes de setUser)
- [x] Relatório de Comissões (3 abas)
- [x] URL standalone (/standalone/comissoes)
- [x] Standalone com token público
- [x] Gráficos com tooltips funcionais em ambos os modos
- [x] Exportação Excel
- [x] Sincronização via N8N

## 🚧 Pendências — Próximos passos

### Prioridade Alta
- [x] Painel Admin: tela de gestão de usuários (listar, editar role, ativar/desativar)
- [x] Painel Admin: gestão de grupos de acesso (CRUD + membros + relatórios)
- [x] Painel Admin: vincular relatórios a grupos (dentro da tela de grupos)
- [x] Painel Admin: vincular relatórios a usuários individuais (na tela de usuários)
- [x] Painel Admin: gerar/revogar link standalone público por relatório

### Prioridade Média
- [x] Tela de perfil do usuário (editar nome, alterar senha)
- [x] Responsividade mobile (sidebar como drawer)
- [x] Notificações toast globais
- [x] Página 404 customizada
- [x] Breadcrumb de navegação

### Prioridade Baixa
- [x] Logs de auditoria (quem acessou o quê)
- [x] Dashboard admin com métricas de uso
- [x] PWA (manifest, service worker)
- [x] Temas personalizados por empresa

## 📁 Estrutura de arquivos

```
src/
├── App.tsx                         # Rotas (login, standalone, protected layout)
├── main.tsx                        # Entry + providers
├── index.css                       # Design system
├── hooks/
│   ├── AuthContext.tsx              # Context + Provider + useAuth
│   ├── useAuthState.ts             # Lógica de auth (separado para HMR)
│   ├── ThemeContext.tsx             # Dark/light mode
│   ├── ToastContext.tsx             # Notificações toast globais
│   ├── useCompanyTheme.ts          # Tema personalizado por empresa
│   └── useAuditLog.ts              # Registro de ações nos logs
├── lib/
│   ├── supabase.ts                 # Cliente Supabase compartilhado
│   └── utils.ts                    # Formatação, cn(), cores
├── config/
│   ├── env.ts                      # VITE_SUPABASE_URL, KEY
│   └── relatorios.ts               # Tipos/categorias de relatórios
├── components/
│   ├── layout/ (Header, Sidebar, Breadcrumb)
│   ├── ui/ (Button, Card, Select, Input, Tabs, Badge, DatePicker, Checkbox)
│   ├── charts/ (BarChart, PieChart, StatusChart)
│   └── KPICard.tsx
├── pages/
│   ├── Login.tsx
│   ├── Home.tsx
│   ├── Profile.tsx
│   ├── AccessDenied.tsx
│   ├── NotFound.tsx
│   ├── admin/ (Dashboard, Users, Groups, Reports, AuditLogs, Theme)
│   ├── comissoes/ (ComissoesPage, pages/, hooks/, services/)
│   └── ranking/ (RankingPage, pages/, hooks/, services/)
└── types/ (index.ts, database.ts)
```
