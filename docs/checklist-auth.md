# ✅ Checklist — Auth + Permissões funcionando

## Status atual: 🔴 Não funciona

O sistema de auth foi implementado no frontend mas depende de configurações no Supabase que precisam ser feitas na ordem correta.

---

## Passo a passo (NESTA ORDEM)

### 1. Supabase Dashboard — Configurar Auth

- [ ] Ir em **Authentication → Providers → Email** e verificar:
  - `Enable Email Signup` = **ON**
  - `Confirm Email` = **OFF** (desligar por enquanto, senão o signup não funciona sem servidor de email configurado)
  - `Enable Email Login` = **ON**

### 2. SQL — Criar tabelas de permissões

- [ ] Executar `database/sql/auth_permissions.sql` no **SQL Editor do Supabase**
  - Cria: `profiles`, `reports`, `access_groups`, `user_groups`, `user_report_access`, `group_report_access`
  - Cria: trigger `on_auth_user_created` (auto-cria profile no signup)
  - Cria: RLS em todas as tabelas
  - Cria: seed do relatório "comissoes"

### 3. SQL — Criar function RPC

- [ ] Executar `database/sql/fix_reports_access.sql` no **SQL Editor do Supabase**
  - Cria: function `get_my_accessible_reports()` que retorna relatórios do usuário logado
  - Remove a view `vw_user_accessible_reports` (não funciona com RLS)

### 4. Supabase Dashboard — Criar usuário admin

- [ ] Ir em **Authentication → Users → Add User**
  - Email: `bpm@gowork.com.br`
  - Password: `123123123`
  - Marcar **Auto Confirm User** = ON (ou desligar Confirm Email no passo 1)

### 5. SQL — Configurar admin

- [ ] Executar `database/sql/seed_admin.sql` no **SQL Editor do Supabase**
  - Altera senha para `123123123`
  - Seta role = `admin`
  - Vincula acesso ao relatório de comissões

### 6. Verificação — Confirmar que tudo existe

- [ ] Executar no SQL Editor:
```sql
-- Deve retornar 1 relatório
SELECT * FROM public.reports;

-- Deve retornar 1 profile com role = admin
SELECT id, email, role, active FROM public.profiles;

-- Deve retornar resultado (testar a RPC)
-- Nota: isso só funciona quando logado, não no SQL Editor
-- Testar via frontend
```

### 7. Variáveis de ambiente (.env)

- [ ] Verificar que o arquivo `.env` na raiz do projeto tem:
```
VITE_SUPABASE_URL=https://xggqzueehfvautkmaojy.supabase.co
VITE_SUPABASE_KEY=eyJ... (chave anon/public)
```

### 8. Frontend — Testar

- [ ] `npm run dev`
- [ ] Acessar `http://localhost:5173`
- [ ] Deve redirecionar para `/login`
- [ ] Logar com `bpm@gowork.com.br` / `123123123`
- [ ] Deve redirecionar para `/` (Home)
- [ ] Deve aparecer o relatório "Dashboard de Comissões"
- [ ] Clicar no relatório → deve abrir `/comissoes`

---

## Problemas conhecidos e soluções

### "Tela fica carregando infinitamente"
**Causa:** A RPC `get_my_accessible_reports` não existe no Supabase, ou o profile não foi criado.
**Solução:** Executar os SQLs dos passos 2 e 3.

### "Login dá erro"
**Causa:** Usuário não existe no auth.users, ou Confirm Email está ligado.
**Solução:** Passo 1 (desligar Confirm Email) e Passo 4 (criar usuário).

### "Logou mas nenhum relatório aparece"
**Causa:** O profile existe mas role não é admin, OU a function RPC não existe.
**Solução:** Executar passo 3 (RPC) e passo 5 (seed admin).

### "Erro 404 na RPC"
**Causa:** A function `get_my_accessible_reports` não foi criada.
**Solução:** Executar `database/sql/fix_reports_access.sql`.

### "Profile não foi criado automaticamente"
**Causa:** O trigger `on_auth_user_created` não foi criado, ou o usuário foi criado ANTES do trigger existir.
**Solução:** Executar o auth_permissions.sql primeiro, depois criar o usuário. Se o usuário já existe, criar o profile manualmente:
```sql
INSERT INTO public.profiles (id, email, full_name, role)
SELECT id, email, 'Admin BPM', 'admin'
FROM auth.users
WHERE email = 'bpm@gowork.com.br'
ON CONFLICT (id) DO UPDATE SET role = 'admin';
```

---

## Ordem de execução resumida

```
1. Supabase Dashboard → Auth → Desligar Confirm Email
2. SQL Editor → auth_permissions.sql
3. SQL Editor → fix_reports_access.sql
4. Supabase Dashboard → Add User (bpm@gowork.com.br / 123123123)
5. SQL Editor → seed_admin.sql
6. Frontend → npm run dev → testar login
```

Se o usuário já foi criado ANTES dos SQLs, usar o SQL de "Profile não foi criado automaticamente" acima.
